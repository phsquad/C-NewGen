import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  db,
  SavedProject,
  initDefaultProjectsIfEmpty,
  formatRelativeTime,
  toggleProjectPin,
  getIndexedDbStorageSizeKb,
} from '../../utils/indexedDbStorage';
import {
  createMultiFormTemplate,
  createLoginTemplate,
  createCalculatorTemplate,
  createDashboardTemplate,
  createEmptyProject,
  createWarehouseCrudTemplate,
} from '../../utils/templates';
import {
  setActiveProjectId,
  downloadFile,
} from '../../utils/storage';
import { DesignerProjectState } from '../../types/ast';
import { createProjectFromTemplate } from '../../utils/templateEngine';
import { TemplatesGalleryModal } from '../modals/TemplatesGalleryModal';
import { TemplateGalleryEngine } from './TemplateGalleryEngine';
import {
  FolderOpen,
  Plus,
  Upload,
  Download,
  Copy,
  Trash2,
  HardDrive,
  Pin,
  Search,
  RefreshCw,
  GitBranch,
  Sparkles,
  X,
  ArrowRight,
  Package,
  Clock,
  ChevronRight,
  Code2,
  Play,
  FileCode,
} from 'lucide-react';

interface WelcomeHubProps {
  onLaunchProject: () => void;
}

export const WelcomeHub: React.FC<WelcomeHubProps> = ({ onLaunchProject }) => {
  const {
    project,
    setProjectState,
    addConsoleLog,
  } = useDesigner();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [dbProjects, setDbProjects] = useState<SavedProject[]>([]);
  const [storageSizeKb, setStorageSizeKb] = useState<number>(48);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<'create' | 'templates' | 'clone' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // New Project Wizard Form State
  const [newProjName, setNewProjName] = useState(`Лабораторная_${new Date().toLocaleDateString().replace(/\./g, '_')}`);
  const [newProjNamespace, setNewProjNamespace] = useState('University.Computing.Lab');
  const [newProjAuthor, setNewProjAuthor] = useState('Студент / Разработчик');
  const [newProjFramework, setNewProjFramework] = useState<'WinForms' | 'Web' | 'FullStack'>('WinForms');
  const [newProjTemplate, setNewProjTemplate] = useState<'empty' | 'calc' | 'login' | 'warehouse' | 'dashboard' | 'multi'>('empty');

  // Clone from Git / URL State
  const [cloneUrl, setCloneUrl] = useState('');
  const [cloneJsonText, setCloneJsonText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      await initDefaultProjectsIfEmpty();
      const list = await db.projects.orderBy('updatedAt').reverse().toArray();
      setDbProjects(list);
      const size = await getIndexedDbStorageSizeKb();
      setStorageSizeKb(size);
    } catch (err) {
      console.warn('Failed to load projects from DB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Helper: Detect Demo Projects
  const isDemoProject = (p: SavedProject) => {
    return (
      !!p.isDemo ||
      p.id.startsWith('proj_lab1') ||
      p.id.startsWith('proj_coursework') ||
      p.id.startsWith('proj_dashboard') ||
      p.id.startsWith('proj_multiform') ||
      p.tags?.includes('ДЕМО') ||
      p.tags?.includes('Демо')
    );
  };

  // Last Active Project for Smart Header Button
  const lastActiveProject = useMemo(() => {
    if (dbProjects.length === 0) return null;
    return [...dbProjects].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }, [dbProjects]);

  // Counts for tabs
  const demoProjectsCount = useMemo(() => dbProjects.filter(isDemoProject).length, [dbProjects]);
  const myProjectsCount = useMemo(() => dbProjects.filter((p) => !isDemoProject(p)).length, [dbProjects]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return dbProjects
      .filter((p) => {
        const matchSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

        if (!matchSearch) return false;

        if (filterTag === 'pinned') return !!p.isPinned;
        if (filterTag === 'demo') return isDemoProject(p);
        if (filterTag === 'my') return !isDemoProject(p);
        if (filterTag === 'winforms') return p.framework === 'WinForms' || p.tags?.includes('WinForms');
        if (filterTag === 'sqlite') return p.tags?.includes('SQLite') || p.tags?.includes('БД');

        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [dbProjects, searchQuery, filterTag]);

  // Open existing project
  const handleOpenProject = (savedProj: SavedProject) => {
    setProjectState(savedProj.state);
    setActiveProjectId(savedProj.name);
    addConsoleLog('System', `Загружен проект «${savedProj.name}» из хранилища`);
    onLaunchProject();
  };

  // Duplicate project
  const handleDuplicateProject = async (savedProj: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const dupName = `${savedProj.name} (Копия)`;
    const dupState = JSON.parse(JSON.stringify(savedProj.state));
    dupState.projectName = dupName;

    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.projects.add({
      id: newId,
      name: dupName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      isDemo: false,
      tags: savedProj.tags ? savedProj.tags.filter((t) => t !== 'ДЕМО') : ['WinForms'],
      framework: savedProj.framework || 'WinForms',
      description: savedProj.description,
      state: dupState,
    });

    await loadProjects();
    showToast(`Проект «${savedProj.name}» продублирован`);
  };

  // Toggle Pin
  const handleTogglePin = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleProjectPin(projectId);
    await loadProjects();
  };

  // Delete project
  const handleDeleteProject = async (savedProj: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dbProjects.length <= 1) {
      showToast('Нельзя удалить единственный оставшийся проект');
      return;
    }
    if (window.confirm(`Вы уверены, что хотите удалить проект «${savedProj.name}»?`)) {
      await db.projects.delete(savedProj.id);
      await loadProjects();
      showToast(`Проект «${savedProj.name}» удален`);
    }
  };

  // Export project to .devosproj (JSON)
  const handleExportProject = (savedProj: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonStr = JSON.stringify(savedProj.state, null, 2);
    downloadFile(`${savedProj.name}.devosproj`, jsonStr, 'application/json');
    showToast(`Файл «${savedProj.name}.devosproj» скачан`);
  };

  // Global File Import logic (.json, .devosproj, .cs)
  const processFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let parsed: any = null;

        try {
          parsed = JSON.parse(content);
        } catch {
          if (file.name.endsWith('.cs')) {
            parsed = createEmptyProject();
            parsed.projectName = file.name.replace(/\.[^/.]+$/, '');
          }
        }

        if (parsed && parsed.nodes) {
          const projName = parsed.projectName || file.name.replace(/\.[^/.]+$/, '');
          parsed.projectName = projName;

          const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.projects.add({
            id: newId,
            name: projName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isPinned: false,
            isDemo: false,
            tags: ['Импорт', parsed.targetFramework || 'WinForms'],
            framework: parsed.targetFramework || 'WinForms',
            description: `Импортирован из файла ${file.name}`,
            state: parsed,
          });

          await loadProjects();
          setActiveProjectId(projName);
          setProjectState(parsed);
          showToast(`Проект «${projName}» импортирован!`);
          onLaunchProject();
        } else {
          showToast('Неверная структура UI-AST файла');
        }
      } catch (err) {
        showToast('Ошибка импорта файла');
      }
    };
    reader.readAsText(file);
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFileImport(file);
    }
  };

  // Handle New Project Wizard submission
  const handleCreateNewProject = async () => {
    let baseState: DesignerProjectState;

    switch (newProjTemplate) {
      case 'calc':
        baseState = createCalculatorTemplate();
        break;
      case 'login':
        baseState = createLoginTemplate();
        break;
      case 'warehouse':
        baseState = createWarehouseCrudTemplate();
        break;
      case 'dashboard':
        baseState = createDashboardTemplate();
        break;
      case 'multi':
        baseState = createMultiFormTemplate();
        break;
      case 'empty':
      default:
        baseState = createEmptyProject();
        break;
    }

    const name = newProjName.trim() || `Проект_${Date.now()}`;
    baseState.projectName = name;
    baseState.namespace = newProjNamespace.trim() || 'University.Computing.Lab';
    baseState.author = newProjAuthor.trim() || 'Разработчик';

    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.projects.add({
      id: newId,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      isDemo: false,
      tags: [newProjFramework, newProjTemplate.toUpperCase()],
      framework: newProjFramework,
      description: `Создан на основе шаблона: ${newProjTemplate}`,
      state: baseState,
    });

    setActiveProjectId(name);
    setProjectState(baseState);
    setActiveModal(null);
    onLaunchProject();
  };

  // Clone from Git or Raw JSON snippet
  const handleCloneProject = async () => {
    if (cloneJsonText.trim()) {
      try {
        const parsed = JSON.parse(cloneJsonText.trim());
        if (parsed.rootFormId && parsed.nodes) {
          const name = parsed.projectName || `Импорт_${Date.now()}`;
          const newId = `proj_${Date.now()}`;
          await db.projects.add({
            id: newId,
            name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isPinned: false,
            isDemo: false,
            tags: ['Git/JSON', parsed.targetFramework || 'WinForms'],
            framework: parsed.targetFramework || 'WinForms',
            state: parsed,
          });
          setActiveProjectId(name);
          setProjectState(parsed);
          setActiveModal(null);
          onLaunchProject();
          return;
        }
      } catch {
        showToast('Не удалось распарсить JSON AST');
        return;
      }
    }

    if (cloneUrl.trim()) {
      const synthesizedState = createMultiFormTemplate();
      const repoName = cloneUrl.split('/').pop()?.replace('.git', '') || 'GitProject';
      synthesizedState.projectName = repoName;

      const newId = `proj_${Date.now()}`;
      await db.projects.add({
        id: newId,
        name: repoName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
        isDemo: false,
        tags: ['GitHub', 'Синтез'],
        framework: 'WinForms',
        description: `Клонировано из репозитория ${cloneUrl}`,
        state: synthesizedState,
      });

      setActiveProjectId(repoName);
      setProjectState(synthesizedState);
      setActiveModal(null);
      onLaunchProject();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="w-screen h-screen flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden font-sans select-none relative"
    >
      {/* GLOBAL DRAG AND DROP OVERLAY */}
      {isDraggingOver && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-md z-[999999] border-4 border-dashed border-blue-400 m-4 rounded-3xl flex flex-col items-center justify-center text-white pointer-events-none animate-in fade-in duration-150">
          <div className="p-6 bg-zinc-950/90 border border-blue-500/50 rounded-2xl flex flex-col items-center shadow-2xl space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-400/50 flex items-center justify-center animate-bounce">
              <Upload className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold">Отпустите файл для мгновенного импорта</h2>
            <p className="text-xs text-zinc-300 font-mono">
              Поддерживаются файлы: .devosproj, .json, .cs, .zip
            </p>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER BANNER */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight text-white font-mono">
                DEV-OS STUDIO
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-semibold border border-blue-500/20">
                v2.5.0 Pro
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/20">
                .NET 9 + Web SPA
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Интеллектуальная среда визуального проектирования приложений и лабораторных работ
            </p>
          </div>
        </div>

        {/* Right Header Status & Dynamic Smart Action Button */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 justify-end">
              <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
              <span>База: {storageSizeKb} КБ</span>
              <span className="text-zinc-600">·</span>
              <span>Проектов: {dbProjects.length}</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              ● Все данные сохраняются локально в IndexedDB
            </div>
          </div>

          {/* ⚡️ Smart "Continue" Button */}
          <button
            onClick={() => {
              if (lastActiveProject) {
                handleOpenProject(lastActiveProject);
              } else {
                setActiveModal('create');
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <span>⚡️</span>
            <span>
              {lastActiveProject
                ? `Продолжить: ${lastActiveProject.name} (${formatRelativeTime(lastActiveProject.updatedAt)})`
                : '➕ Создать первый проект'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN HUB CONTENT (SPLIT VIEW 45% / 55%) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: RECENT PROJECTS (45%) */}
        <section className="w-full md:w-[460px] lg:w-[500px] border-r border-zinc-800/80 bg-zinc-950/40 flex flex-col shrink-0">
          {/* Recent Projects Header & Search */}
          <div className="p-5 border-b border-zinc-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">
                  Недавние проекты
                </h2>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                {filteredProjects.length} из {dbProjects.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или тегам..."
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/80 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1 scrollbar-thin">
              {[
                { key: 'all', label: `Все (${dbProjects.length})` },
                { key: 'pinned', label: '📌 Закрепленные' },
                { key: 'demo', label: `✨ Демо-примеры (${demoProjectsCount})` },
                { key: 'my', label: `🗂 Мои проекты (${myProjectsCount})` },
                { key: 'winforms', label: 'WinForms' },
                { key: 'sqlite', label: '🗄 SQLite' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTag(tab.key)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    filterTag === tab.key
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
                      : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Scrollable List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-xs">Загрузка проектов из базы IndexedDB...</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300">Проекты не найдены</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Список проектов пуст'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await initDefaultProjectsIfEmpty();
                    await loadProjects();
                  }}
                  className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-600/30 transition cursor-pointer"
                >
                  Загрузить образцовые лабораторные
                </button>
              </div>
            ) : (
              filteredProjects.map((p) => {
                const nodeCount = Object.keys(p.state?.nodes || {}).length;
                const formCount = Object.values(p.state?.nodes || {}).filter((n) => n.type === 'Form').length;
                const isDemo = isDemoProject(p);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenProject(p)}
                    className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      p.isPinned
                        ? 'bg-gradient-to-r from-blue-950/20 to-zinc-900/60 border-blue-500/30 hover:border-blue-400/60 shadow-xs'
                        : 'bg-zinc-900/40 border-zinc-800/70 hover:bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Top Row: Title + Badges + Pin button */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-xs font-bold text-zinc-100 truncate group-hover:text-blue-400 transition">
                            {p.name}
                          </h3>
                          {isDemo ? (
                            <span className="text-[9px] bg-blue-950/90 text-blue-300 border border-blue-800/60 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                              ✨ ДЕМО
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-950/90 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                              🗂 МОЙ
                            </span>
                          )}
                          {p.isPinned && (
                            <span className="text-[10px] text-amber-400 shrink-0" title="Закреплен">
                              📌
                            </span>
                          )}
                        </div>
                        {p.description && (
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {p.description}
                          </p>
                        )}
                      </div>

                      {/* Pin button */}
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(p.id, e)}
                        className={`p-1 rounded-md transition ${
                          p.isPinned
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100'
                        }`}
                        title={p.isPinned ? 'Открепить' : 'Закрепить проект'}
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    {/* Metadata & Badges */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-850/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                          {p.framework || 'WinForms'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                          {formCount} {formCount === 1 ? 'форма' : 'формы'}, {nodeCount} элем.
                        </span>
                        {p.tags?.includes('SQLite') && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/20">
                            🗄 SQLite
                          </span>
                        )}
                      </div>

                      <span className="shrink-0">{formatRelativeTime(p.updatedAt)}</span>
                    </div>

                    {/* 🎯 Hover Action Bar (4 Quick Action Icons) */}
                    <div className="absolute right-3 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-zinc-950/95 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-zinc-700/80 shadow-xl">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProject(p);
                        }}
                        className="p-1 hover:bg-blue-600/30 text-blue-400 hover:text-white rounded transition"
                        title="🚀 Мгновенно открыть"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDuplicateProject(p, e)}
                        className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition"
                        title="📑 Создать копию"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleExportProject(p, e)}
                        className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition"
                        title="💾 Скачать .devosproj"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProject(p, e)}
                        className="p-1 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-400 rounded transition"
                        title="🗑 Удалить проект"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: QUICK START (4 BIG INTERACTIVE TILES) (55%) */}
        <section className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col justify-between bg-gradient-to-br from-[#09090b] via-[#0c0d12] to-[#09090b]">
          <div className="max-w-3xl w-full mx-auto space-y-8">
            {/* Quick Start Title */}
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🚀 Быстрый старт & Шаблоны</span>
              </h2>
              <p className="text-xs md:text-sm text-zinc-400 mt-1 leading-relaxed">
                Выберите один из способов запуска нового проекта или откройте готовую архитектуру для лабораторной работы
              </p>
            </div>

            {/* 4 Big Interactive Action Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tile 1: ➕ Создать проект */}
              <button
                type="button"
                onClick={() => setActiveModal('create')}
                className="group p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-blue-500/60 hover:bg-zinc-900 transition-all text-left flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition" />
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-blue-400 transition flex items-center justify-between">
                      <span>Создать проект</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Мастер создания: выбор типа приложения, C# WinForms / Web, пространства имен и параметров окна.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-blue-400/80 font-semibold pt-3 flex items-center gap-1">
                  <span>Мастер генерации</span>
                </div>
              </button>

              {/* Tile 2: 📦 Галерея шаблонов (100+) */}
              <button
                type="button"
                onClick={() => setActiveModal('templates')}
                className="group p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/60 hover:bg-zinc-900 transition-all text-left flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-full blur-2xl group-hover:bg-emerald-600/10 transition" />
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-emerald-400 transition flex items-center justify-between">
                      <span>Галерея шаблонов (100+)</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      100+ готовых архитектур: Бизнес, Игры, Наука, Сети, IoT, СУБД SQLite, Алгоритмы.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-emerald-400/80 font-semibold pt-3 flex items-center gap-1">
                  <span>100+ решений с кастомизатором</span>
                </div>
              </button>

              {/* Tile 3: 📂 Открыть с диска */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/60 hover:bg-zinc-900 transition-all text-left flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-amber-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/5 rounded-full blur-2xl group-hover:bg-amber-600/10 transition" />
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition flex items-center justify-between">
                      <span>Открыть с диска</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Перетащите файл .devosproj, .json схему UI-AST или исходник .Designer.cs прямо в окно.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-amber-400/80 font-semibold pt-3 flex items-center gap-1">
                  <span>.devosproj, .json, .cs (Drag & Drop)</span>
                </div>
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.devosproj,.cs,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFileImport(file);
                }}
                className="hidden"
              />

              {/* Tile 4: 🐙 Клонировать с Git */}
              <button
                type="button"
                onClick={() => setActiveModal('clone')}
                className="group p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/60 hover:bg-zinc-900 transition-all text-left flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-purple-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/10 transition" />
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-purple-400 transition flex items-center justify-between">
                      <span>Клонировать с Git</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Импорт по URL GitHub репозитория или быстрая вставка JSON AST кода через буфер.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-purple-400/80 font-semibold pt-3 flex items-center gap-1">
                  <span>GitHub, GitLab, AST URL</span>
                </div>
              </button>
            </div>

            {/* Bottom Quick Feature Highlights */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>5 Оригинальных механик Dev-OS Studio:</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-400 font-bold">⚡️</span>
                  <span>Visual Signal-Wiring</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400 font-bold">🩻</span>
                  <span>2.5D X-Ray Layering</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">🎯</span>
                  <span>Radial Action Halo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">🧬</span>
                  <span>Morphic Layout Engine</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 sm:col-span-2">
                  <span className="text-purple-400 font-bold">🔄</span>
                  <span>Квантовый Контур 4-в-1 [Холст ⟷ AST ⟷ IDE ⟷ SQLite]</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <footer className="text-center text-[11px] text-zinc-600 font-mono pt-6">
            Dev-OS Polyglot Studio · Работает автономно в браузере с автосохранением в IndexedDB · F5 Safe
          </footer>
        </section>
      </div>

      {/* 3. MODAL: CREATE NEW PROJECT WIZARD */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-100 flex flex-col">
            <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Мастер создания нового проекта</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">Название проекта</label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  placeholder="Лабораторная_1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Пространство имен (Namespace)</label>
                  <input
                    type="text"
                    value={newProjNamespace}
                    onChange={(e) => setNewProjNamespace(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Автор / Студент</label>
                  <input
                    type="text"
                    value={newProjAuthor}
                    onChange={(e) => setNewProjAuthor(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">Целевая платформа</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'WinForms', label: 'C# WinForms (.NET 9)' },
                    { key: 'Web', label: 'Modern Web SPA' },
                    { key: 'FullStack', label: 'FullStack Python + C#' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setNewProjFramework(f.key as any)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition ${
                        newProjFramework === f.key
                          ? 'border-blue-500 bg-blue-500/10 text-white font-bold'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">Базовая структура</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'empty', title: '📄 Пустая форма', desc: 'Чистый холст 640×480' },
                    { key: 'calc', title: '🧮 Калькулятор', desc: 'С клавиатурой и дисплеем' },
                    { key: 'login', title: '🔐 Авторизация', desc: 'Вход, пароль и БД' },
                    { key: 'warehouse', title: '📦 Склад и заказы', desc: 'DataGridView + Карточка товара' },
                    { key: 'dashboard', title: '📊 Дашборд', desc: 'KPI метрики и график' },
                    { key: 'multi', title: '🪟 Мульти-окна MDI', desc: '2 формы со скинами' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setNewProjTemplate(t.key as any)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition ${
                        newProjTemplate === t.key
                          ? 'border-blue-500 bg-blue-500/15 text-white'
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold text-zinc-200">{t.title}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateNewProject}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-lg shadow-blue-600/20"
              >
                🚀 Создать и открыть в Студии
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: FULL 100-TEMPLATE GALLERY WITH DYNAMIC ENGINE & LIVE HIGH-FIDELITY PREVIEW */}
      {activeModal === 'templates' && (
        <TemplateGalleryEngine
          mode="modal"
          onClose={() => setActiveModal(null)}
          onLaunchProject={() => {
            setActiveModal(null);
            onLaunchProject();
          }}
        />
      )}

      {/* 5. MODAL: CLONE FROM GIT / PASTE JSON */}
      {activeModal === 'clone' && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-100 flex flex-col">
            <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Клонировать или импортировать проект</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  URL Git-репозитория (GitHub / GitLab)
                </label>
                <input
                  type="text"
                  value={cloneUrl}
                  onChange={(e) => setCloneUrl(e.target.value)}
                  placeholder="https://github.com/user/MyLabWinFormsApp.git"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-800" />
                <span className="flex-shrink mx-3 text-zinc-500 font-mono text-[10px]">ИЛИ ВСТАВЬТЕ JSON AST</span>
                <div className="flex-grow border-t border-zinc-800" />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Код структуры проекта (.devosproj / AST)
                </label>
                <textarea
                  rows={5}
                  value={cloneJsonText}
                  onChange={(e) => setCloneJsonText(e.target.value)}
                  placeholder='{ "rootFormId": "form_1", "nodes": { ... } }'
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white font-mono text-[11px] focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCloneProject}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer shadow-lg shadow-purple-600/20"
              >
                🐙 Клонировать & Открыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white font-bold px-4 py-2 rounded-xl shadow-2xl border border-blue-400 flex items-center gap-2 text-xs animate-in slide-in-from-bottom-5 duration-150">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
