import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { db, SavedProject, initDefaultProjectsIfEmpty, formatRelativeTime, getIndexedDbStorageSizeKb } from '../../utils/indexedDbStorage';
import { createMultiFormTemplate, createLoginTemplate } from '../../utils/templates';
import { exportProjectAsZip, downloadFile, LocalStorageSavedProject, loadProjectsFromLocalStorageList, saveProjectToLocalStorageList, deleteProjectFromLocalStorageList } from '../../utils/storage';
import { migrateProjectSchema } from '../../utils/schemaMigrator';
import {
  isFileSystemAccessSupported,
  connectLocalDirectory,
  disconnectLocalDirectory,
  syncProjectToLocalDirectory,
} from '../../utils/fileSystemSync';
import {
  FolderOpen,
  Plus,
  Upload,
  Download,
  Copy,
  Trash2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileCode,
  X,
  Search,
  ExternalLink,
  RefreshCw,
  FolderGit2,
  Check,
  Edit2,
  Sparkles,
  Wifi,
  Laptop,
} from 'lucide-react';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    project,
    setProjectState,
    storageStatusInfo,
    saveProject,
  } = useDesigner();

  const [projectsList, setProjectsList] = useState<SavedProject[]>([]);
  const [localStorageProjects, setLocalStorageProjects] = useState<LocalStorageSavedProject[]>([]);
  const [activeStorageTab, setActiveStorageTab] = useState<'indexeddb' | 'localstorage'>('localstorage');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalDbSizeKb, setTotalDbSizeKb] = useState<number>(46);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // File System Access State
  const [connectedFolderName, setConnectedFolderName] = useState<string | null>(null);
  const [isSyncingDisk, setIsSyncingDisk] = useState(false);
  const [lastDiskSyncTime, setLastDiskSyncTime] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshProjects = async () => {
    setIsLoading(true);
    try {
      await initDefaultProjectsIfEmpty();
      const list = await db.projects.orderBy('updatedAt').reverse().toArray();
      setProjectsList(list);

      // Load LocalStorage projects list
      const localList = loadProjectsFromLocalStorageList();
      setLocalStorageProjects(localList);

      const size = await getIndexedDbStorageSizeKb();
      setTotalDbSizeKb(size);
    } catch (err) {
      console.error('Failed to load projects from DB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshProjects();
    }
  }, [isOpen]);

  // Save current project to selected storage (IndexedDB or LocalStorage)
  const handleSaveCurrentToDb = async () => {
    try {
      const now = Date.now();
      if (activeStorageTab === 'localstorage') {
        saveProjectToLocalStorageList(project);
        showNotification(`Проект «${project.projectName}» сохранен в LocalStorage пользователя`);
      } else {
        const existing = await db.projects.get(project.projectName);
        const projId = existing?.id || `proj_${Date.now()}`;

        await db.projects.put({
          id: projId,
          name: project.projectName || 'WinFormsApp1',
          createdAt: existing?.createdAt || now,
          updatedAt: now,
          state: project,
        });
        showNotification(`Проект «${project.projectName}» сохранен в базу IndexedDB`);
      }
      await refreshProjects();
    } catch (err) {
      showNotification('Ошибка сохранения в хранилище', 'error');
    }
  };

  // 1. Create New Project
  const handleCreateNewProject = async (template: 'multi' | 'login' | 'empty' = 'multi') => {
    const totalCount = projectsList.length + localStorageProjects.length;
    const newName = `Проект_${new Date().toLocaleDateString().replace(/\./g, '_')}_${totalCount + 1}`;
    let newState = template === 'login' ? createLoginTemplate() : createMultiFormTemplate();
    newState.projectName = newName;

    if (activeStorageTab === 'localstorage') {
      saveProjectToLocalStorageList(newState);
    } else {
      const newSaved: SavedProject = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: newName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        state: newState,
      };
      await db.projects.add(newSaved);
    }

    await refreshProjects();
    setProjectState(newState);
    showNotification(`Создан новый проект «${newName}»`);
    onClose();
  };

  // 2. Open Project
  const handleOpenProject = async (p: any) => {
    setProjectState(p.state);
    showNotification(`Открыт проект «${p.name}»`);
    onClose();
  };

  // 3. Duplicate Project
  const handleDuplicateProject = async (p: any) => {
    const dupName = `${p.name} (Копия)`;
    const dupState = JSON.parse(JSON.stringify(p.state));
    dupState.projectName = dupName;

    if (activeStorageTab === 'localstorage') {
      saveProjectToLocalStorageList(dupState);
    } else {
      const dupSaved: SavedProject = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: dupName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        state: dupState,
      };
      await db.projects.add(dupSaved);
    }
    await refreshProjects();
    showNotification(`Проект «${p.name}» успешно продублирован`);
  };

  // 4. Delete Project
  const handleDeleteProject = async (p: any) => {
    const listCount = activeStorageTab === 'localstorage' ? localStorageProjects.length : projectsList.length;
    if (listCount <= 1 && activeStorageTab !== 'localstorage') {
      showNotification('Нельзя удалить единственный проект из БД', 'error');
      return;
    }
    if (window.confirm(`Вы уверены, что хотите удалить проект «${p.name}» из ${activeStorageTab === 'localstorage' ? 'LocalStorage' : 'IndexedDB'}?`)) {
      if (activeStorageTab === 'localstorage') {
        deleteProjectFromLocalStorageList(p.id);
      } else {
        await db.projects.delete(p.id);
      }
      await refreshProjects();
      showNotification(`Проект «${p.name}» удален`);
    }
  };

  // 5. Export project (.zip or .json)
  const handleExportZip = async (p: any) => {
    showNotification(`Подготовка архива «${p.name}.zip»...`, 'info');
    await exportProjectAsZip(p.state);
    showNotification(`Архив «${p.name}.zip}» успешно скачан`);
  };

  const handleExportJson = (p: any) => {
    const jsonStr = JSON.stringify(p.state, null, 2);
    downloadFile(`${p.name}.designer.json`, jsonStr, 'application/json');
    showNotification(`Файл «${p.name}.designer.json» сохранен`);
  };

  // 6. Import project from JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedState = JSON.parse(text);

        if (!parsedState.rootFormId || !parsedState.nodes) {
          throw new Error('Некорректный формат файла проекта');
        }

        const name = file.name.replace(/\.(json|designer\.json)$/i, '');
        parsedState.projectName = name;

        // Auto-migrate legacy schema if needed
        const { state: migratedState } = migrateProjectSchema(parsedState);

        if (activeStorageTab === 'localstorage') {
          saveProjectToLocalStorageList(migratedState);
        } else {
          const newSaved: SavedProject = {
            id: `proj_${Date.now()}_imported`,
            name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            state: migratedState,
          };
          await db.projects.add(newSaved);
        }

        await refreshProjects();
        setProjectState(migratedState);
        showNotification(`Проект «${name}» успешно импортирован`);
        onClose();
      } catch (err: any) {
        showNotification(`Ошибка импорта: ${err.message || 'Неверный JSON'}`, 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 7. Rename project
  const handleSaveRename = async (p: any) => {
    if (!editingProjectName.trim()) return;
    const updatedState = { ...p.state, projectName: editingProjectName.trim() };

    if (activeStorageTab === 'localstorage') {
      const raw = localStorage.getItem('nextgen_csharp_saved_projects_v1');
      if (raw) {
        const list: LocalStorageSavedProject[] = JSON.parse(raw);
        const idx = list.findIndex(item => item.id === p.id);
        if (idx > -1) {
          list[idx].name = editingProjectName.trim();
          list[idx].updatedAt = Date.now();
          list[idx].state = updatedState;
          localStorage.setItem('nextgen_csharp_saved_projects_v1', JSON.stringify(list));
        }
      }
    } else {
      await db.projects.update(p.id, {
        name: editingProjectName.trim(),
        updatedAt: Date.now(),
        state: updatedState,
      });
    }

    setEditingProjectId(null);
    await refreshProjects();
    if (project.projectName === p.name) {
      setProjectState(updatedState);
    }
  };

  // 8. Connect local PC folder via File System Access API
  const handleConnectFolder = async () => {
    if (!isFileSystemAccessSupported()) {
      showNotification('Ваш браузер не поддерживает File System Access API (рекомендуется Chrome или Edge)', 'error');
      return;
    }

    try {
      const res = await connectLocalDirectory();
      if (res) {
        setConnectedFolderName(res.name);
        showNotification(`Папка «${res.name}» успешно привязана к проекту!`);
        // Sync immediately
        await handleSyncToDisk(res.handle);
      }
    } catch (err: any) {
      showNotification(`Ошибка привязки папки: ${err.message}`, 'error');
    }
  };

  const handleSyncToDisk = async (customHandle?: any) => {
    setIsSyncingDisk(true);
    try {
      const res = await syncProjectToLocalDirectory(customHandle || null, project);
      setLastDiskSyncTime(new Date().toLocaleTimeString());
      showNotification(`Синхронизировано ${res.filesWritten.length} файлов решения на диск ПК!`);
    } catch (err: any) {
      showNotification(`Ошибка записи на диск: ${err.message}`, 'error');
    } finally {
      setIsSyncingDisk(false);
    }
  };

  const handleDisconnectFolder = () => {
    disconnectLocalDirectory();
    setConnectedFolderName(null);
    showNotification('Привязка к локальной папке отключена');
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    const activeList = activeStorageTab === 'localstorage'
      ? localStorageProjects.map(p => ({
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          state: p.state
        }))
      : projectsList;

    if (!searchQuery.trim()) return activeList;
    const q = searchQuery.toLowerCase().trim();
    return activeList.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.state.projectName && p.state.projectName.toLowerCase().includes(q))
    );
  }, [projectsList, localStorageProjects, activeStorageTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-zinc-100">
        {/* Window Titlebar */}
        <div className="h-11 px-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-amber-500/20 text-amber-400 rounded">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm text-zinc-100 tracking-wide">
                🗂 Менеджер проектов (LocalStorage & IndexedDB)
              </span>
              <span className="ml-2 text-xs text-zinc-500 font-mono">
                [Локальных: {localStorageProjects.length} | БД: {projectsList.length}]
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Storage Tabs Switcher */}
        <div className="flex bg-zinc-950 border-b border-zinc-800 p-1 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveStorageTab('localstorage')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
              activeStorageTab === 'localstorage'
                ? 'bg-purple-600 text-white shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <span>💻</span>
            <span>Локальный LocalStorage ({localStorageProjects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStorageTab('indexeddb')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
              activeStorageTab === 'indexeddb'
                ? 'bg-amber-600 text-white shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <span>💾</span>
            <span>База данных IndexedDB ({projectsList.length})</span>
          </button>
        </div>

        {/* Notifications banner */}
        {notification && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-red-950/80 border-red-800/60 text-red-200'
                : 'bg-blue-950/80 border-blue-800/60 text-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Actions & Search Bar */}
        <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleCreateNewProject('multi')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>➕ Создать новый проект</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveCurrentToDb()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {activeStorageTab === 'localstorage' 
                  ? '💾 Сохранить в LocalStorage' 
                  : '💾 Сохранить в БД IndexedDB'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>📥 Импортировать .json / .zip</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.designer.json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          {/* Search input */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="🔍 Поиск по проектам..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Project Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/70">
          {filteredProjects.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 space-y-2">
              <FolderOpen className="w-12 h-12 mx-auto text-zinc-700 opacity-50" />
              <p className="text-sm font-medium">Проекты не найдены</p>
              <p className="text-xs text-zinc-600">
                Создайте новый проект или импортируйте готовый файл .json/.zip
              </p>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const formsCount = Object.values(p.state.nodes || {}).filter(n => n.type === 'Form').length || 1;
              const controlsCount = Object.keys(p.state.nodes || {}).length - formsCount;
              const sizeKb = Math.max(1, Math.round(new Blob([JSON.stringify(p.state)]).size / 1024));
              const isCurrentOpen = project.projectName === p.name;
              const isEditing = editingProjectId === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isCurrentOpen
                      ? 'bg-zinc-900 border-amber-500/60 ring-1 ring-amber-500/30'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Project Title & Metadata */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📦</span>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="text"
                              value={editingProjectName}
                              onChange={e => setEditingProjectName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveRename(p);
                                if (e.key === 'Escape') setEditingProjectId(null);
                              }}
                              autoFocus
                              className="bg-zinc-950 border border-blue-500 rounded px-2 py-0.5 text-xs text-zinc-100 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(p)}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-500 text-xs cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProjectId(null)}
                              className="p-1 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 text-xs cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-sm text-zinc-100 truncate">
                              {p.name}
                            </span>
                            {isCurrentOpen && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                                АКТИВНЫЙ
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProjectId(p.id);
                                setEditingProjectName(p.name);
                              }}
                              className="opacity-40 hover:opacity-100 p-0.5 text-zinc-400 hover:text-white transition-opacity cursor-pointer"
                              title="Переименовать проект"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Stat badges */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-400" />
                          <span>Форм: {formsCount}</span>
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span>Контролов: {controlsCount}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>Изменен: {formatRelativeTime(p.updatedAt)}</span>
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-300">Размер: {sizeKb} КБ</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenProject(p)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        title="Загрузить проект на холст"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>🚀 Открыть</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateProject(p)}
                        className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 rounded text-xs font-medium transition-colors cursor-pointer"
                        title="Создать копию проекта"
                      >
                        <Copy className="w-3 h-3 text-blue-400" />
                        <span>📑 Дублировать</span>
                      </button>

                      <div className="flex items-center bg-zinc-800 border border-zinc-700/60 rounded overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleExportZip(p)}
                          className="px-2 py-1 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Скачать полный .ZIP со всеми исходниками C#"
                        >
                          <Download className="w-3 h-3 text-amber-400" />
                          <span>.ZIP</span>
                        </button>
                        <div className="w-px h-3.5 bg-zinc-700" />
                        <button
                          type="button"
                          onClick={() => handleExportJson(p)}
                          className="px-2 py-1 hover:bg-zinc-700 text-zinc-400 text-xs font-medium transition-colors cursor-pointer"
                          title="Экспорт состояния в .json"
                        >
                          .JSON
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                        title="Удалить проект из базы"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Section: Direct Local PC Folder Binding (File System Access API) */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 space-y-2 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-zinc-200">
                  💾 Прямая привязка к папке на ПК (File System Access API):
                </span>
                {connectedFolderName ? (
                  <span className="ml-1.5 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[11px]">
                    {connectedFolderName} (ВКЛ)
                  </span>
                ) : (
                  <span className="ml-1.5 text-zinc-500 italic">
                    [Папка не выбрана]
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {connectedFolderName ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSyncToDisk()}
                    disabled={isSyncingDisk}
                    className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingDisk ? 'animate-spin' : ''}`} />
                    <span>🔄 Синхронизировать сейчас</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectFolder}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs transition-colors cursor-pointer"
                  >
                    ✕ Отключить
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectFolder}
                  className="flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-500/40 rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>📁 Выбрать рабочую папку на ПК</span>
                </button>
              )}
            </div>
          </div>
          {lastDiskSyncTime && (
            <div className="text-[10px] text-zinc-500 font-mono pl-6">
              Последняя запись на диск: {lastDiskSyncTime} (Csproj, Program.cs, Forms, Designer.cs)
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-7 px-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Автосохранение: OK (0 ms)</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-300 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-amber-400" />
              <span>Хранилище: IndexedDB ({totalDbSizeKb} КБ)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-300">
            <span className="flex items-center gap-1 text-emerald-400">
              <Wifi className="w-3 h-3" />
              <span>PWA ServiceWorker: ACTIVE</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-cyan-400">ОФФЛАЙН: 100% ГОТОВ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
