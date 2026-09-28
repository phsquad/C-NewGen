import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  TemplateDefinition,
  TEMPLATES_DEFINITIONS,
  CATEGORY_METADATA_LIST,
  TemplateCategory,
  filterTemplateDefinitions,
} from '../../types/TemplateDefinitions';
import { createProjectFromTemplate, TemplateCustomizationOptions } from '../../utils/templateEngine';
import { db } from '../../utils/indexedDbStorage';
import { setActiveProjectId } from '../../utils/storage';
import { useDesignerStore } from '../../store/designerStore';
import {
  Search,
  Sparkles,
  Database,
  Code2,
  X,
  Check,
  Rocket,
  Layers,
  Box,
  Play,
  Copy,
  FolderOpen,
  Filter,
  Grid,
  Columns,
  Shuffle,
  Terminal,
  Cpu,
  FileCode,
  CheckCircle2,
  ArrowRight,
  Eye,
  Settings2,
  Flame,
  ChevronRight,
  ExternalLink,
  Laptop,
  Maximize2,
  SlidersHorizontal,
  Bookmark,
  Share2,
} from 'lucide-react';

export interface TemplateGalleryEngineProps {
  onLaunchProject?: () => void;
  onClose?: () => void;
  initialCategory?: TemplateCategory;
  initialTemplateId?: string;
  mode?: 'full' | 'embedded' | 'modal';
}

type PreviewTab = 'visual' | 'csharp' | 'sql' | 'controls';

export const TemplateGalleryEngine: React.FC<TemplateGalleryEngineProps> = ({
  onLaunchProject,
  onClose,
  initialCategory = 'all',
  initialTemplateId,
  mode = 'full',
}) => {
  const store = useDesignerStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>(initialCategory);
  const [hasDbFilter, setHasDbFilter] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'split' | 'grid'>('split');

  // Selected Template & Preview Tab
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || TEMPLATES_DEFINITIONS[0].id
  );
  const [activePreviewTab, setActivePreviewTab] = useState<PreviewTab>('visual');

  // Interactive Mini-Preview State
  const [interactiveGridState, setInteractiveGridState] = useState<string[]>([
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '
  ]);
  const [interactiveScore, setInteractiveScore] = useState<{ x: number; o: number }>({ x: 0, o: 0 });
  const [interactiveCsgoMode, setInteractiveCsgoMode] = useState(false);
  const [interactiveCsgoFrags, setInteractiveCsgoFrags] = useState(0);

  // Customization Drawer State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customProjName, setCustomProjName] = useState('');
  const [customNamespace, setCustomNamespace] = useState('University.Projects');
  const [customAuthor, setCustomAuthor] = useState('Студент / Разработчик');
  const [customTheme, setCustomTheme] = useState<'dark' | 'light' | 'blue' | 'purple' | 'emerald'>('dark');
  const [includeDbSeed, setIncludeDbSeed] = useState(true);
  const [seedRecordCount, setSeedRecordCount] = useState(5);

  // Instantiation Loading State
  const [isInstantiating, setIsInstantiating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active Template
  const activeTemplate = useMemo(() => {
    return (
      TEMPLATES_DEFINITIONS.find((t) => t.id === selectedTemplateId) ||
      TEMPLATES_DEFINITIONS[0]
    );
  }, [selectedTemplateId]);

  // Sync customization fields when template selection changes
  useEffect(() => {
    const slugName = activeTemplate.title.replace(/[^a-zA-Z0-9\u0400-\u04FF_]/g, '_') || `App_${activeTemplate.num}`;
    setCustomProjName(slugName);
    setIncludeDbSeed(activeTemplate.hasDatabase);
    // Reset mini-preview states
    setInteractiveGridState([' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']);
    setInteractiveCsgoMode(false);
  }, [activeTemplate]);

  // Filtered Templates List
  const filteredTemplates = useMemo(() => {
    return filterTemplateDefinitions({
      category: activeCategory,
      searchQuery,
      hasDatabaseOnly: hasDbFilter,
      difficulty: difficultyFilter,
    });
  }, [activeCategory, searchQuery, hasDbFilter, difficultyFilter]);

  // Generated C# & SQL code for active template
  const generatedCode = useMemo(() => {
    try {
      const result = createProjectFromTemplate(activeTemplate.id, false, {
        projectName: customProjName || activeTemplate.title,
        namespaceName: customNamespace,
        authorName: customAuthor,
        theme: customTheme,
        enableDatabase: includeDbSeed,
        seedRecordCount,
      });
      return {
        csharp: result.codeBehindCs || '// C# code generator ready',
        designer: result.designerCs || '// Designer.cs code ready',
        sql: result.sqlSchema || '-- SQLite DDL schema ready',
      };
    } catch (e) {
      return {
        csharp: `// Ошибка генерации предпросмотра: ${e}`,
        designer: '// Designer preview unavailable',
        sql: '-- SQLite schema preview unavailable',
      };
    }
  }, [activeTemplate, customProjName, customNamespace, customAuthor, customTheme, includeDbSeed, seedRecordCount]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ONE-CLICK INSTANTIATION LOGIC
  const handleInstantLaunch = async (tpl: TemplateDefinition, useCustomConfig: boolean = false) => {
    if (isInstantiating) return;
    setIsInstantiating(true);
    showToast(`⚡️ Развертывание «${tpl.title}» в рабочей области...`);

    try {
      const config: TemplateCustomizationOptions = useCustomConfig
        ? {
            projectName: customProjName || tpl.title,
            namespaceName: customNamespace,
            authorName: customAuthor,
            customTitle: tpl.title,
            theme: customTheme,
            enableDatabase: tpl.hasDatabase ? includeDbSeed : false,
            seedRecordCount: includeDbSeed ? seedRecordCount : 3,
          }
        : {
            projectName: tpl.title.replace(/[^a-zA-Z0-9\u0400-\u04FF_]/g, '_') || `App_${tpl.num}`,
            customTitle: tpl.title,
            theme: 'dark',
            enableDatabase: tpl.hasDatabase,
            seedRecordCount: 5,
          };

      // 1. Create full AST Project state and push to Zustand Store
      const result = createProjectFromTemplate(tpl.id, true, config);
      const proj = result.project;

      // 2. Persist in IndexedDB projects table for persistence and "Recent Projects" list
      const projectId = `proj_${Date.now()}_${tpl.id}`;
      proj.projectName = config.projectName || tpl.title;

      await db.projects.put({
        id: projectId,
        name: proj.projectName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
        isDemo: false,
        tags: [tpl.categoryTitle, tpl.hasDatabase ? 'SQLite' : 'WinForms', ...tpl.tags],
        framework: '.NET 9 WinForms',
        description: tpl.description,
        state: proj,
      });

      setActiveProjectId(proj.projectName);
      store.addConsoleLog('System', `🚀 Проект «${proj.projectName}» успешно развернут из шаблона #${tpl.num}`);

      // 3. Callback to switch into the workspace canvas
      if (onLaunchProject) {
        onLaunchProject();
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to instantiate template project:', err);
      showToast('❌ Ошибка при развертывании проекта');
    } finally {
      setIsInstantiating(false);
    }
  };

  // Quick Random Template Selector
  const handlePickRandom = () => {
    const randomIndex = Math.floor(Math.random() * TEMPLATES_DEFINITIONS.length);
    const chosen = TEMPLATES_DEFINITIONS[randomIndex];
    setSelectedTemplateId(chosen.id);
    showToast(`🎲 Выбран случайный шаблон #${chosen.num}: «${chosen.title}»`);
  };

  // Copy code to clipboard
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('📋 Код скопирован в буфер обмена');
  };

  // Handle mini-preview interactive click (Tic-Tac-Toe / CS:GO)
  const handleMiniCellClick = (idx: number) => {
    if (interactiveCsgoMode) {
      setInteractiveCsgoFrags((f) => f + 1);
      return;
    }
    if (interactiveGridState[idx] !== ' ') return;
    const next = [...interactiveGridState];
    next[idx] = 'X';
    // AI makes immediate random counter-move
    const freeIndices = next.map((v, i) => (v === ' ' ? i : -1)).filter((i) => i !== -1);
    if (freeIndices.length > 0) {
      const aiIdx = freeIndices[Math.floor(Math.random() * freeIndices.length)];
      next[aiIdx] = 'O';
    }
    setInteractiveGridState(next);
  };

  return (
    <div className={`flex flex-col bg-[#09090b] text-zinc-100 select-none overflow-hidden ${
      mode === 'modal' ? 'fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-6' : 'w-full h-full'
    }`}>
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[99999] bg-zinc-900 border border-blue-500/60 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-mono animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* INNER WRAPPER (FOR MODAL OR FULL SCREEN) */}
      <div className={`flex-1 flex flex-col bg-[#0c0d12] border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl ${
        mode === 'modal' ? 'max-w-7xl w-full mx-auto h-[94vh]' : 'w-full h-full'
      }`}>
        {/* 1. TOP HEADER & METRICS BAR */}
        <header className="px-5 py-3.5 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm tracking-tight text-white font-mono flex items-center gap-2">
                  <span>DEV-OS TEMPLATE GALLERY ENGINE</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-bold border border-blue-500/20">
                    100 Архитектур
                  </span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/20 hidden sm:inline-block">
                  .NET 9 + SQLite WASM
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Каталог готовых решений: динамический рендеринг формы WinForms, C# генератор и развертывание в 1 клик
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Pick Random Template */}
            <button
              onClick={handlePickRandom}
              title="Выбрать случайный шаблон для вдохновения"
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Случайный</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-zinc-400">
              <button
                onClick={() => setViewMode('split')}
                title="Режим предпросмотра (Сплит)"
                className={`p-1.5 rounded ${viewMode === 'split' ? 'bg-zinc-800 text-white shadow' : 'hover:text-zinc-200'}`}
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Режим сетки (Каталог)"
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow' : 'hover:text-zinc-200'}`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Close Button (if in modal mode or has onClose) */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* 2. CATEGORY FILTER TABS & SEARCH BAR */}
        <div className="px-5 py-3 bg-zinc-950/60 border-b border-zinc-800/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Scrollable Categories List */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 md:pb-0">
            {CATEGORY_METADATA_LIST.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/80'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.shortTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Quick Filters */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, тегам или #номерам..."
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/80 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* SQLite Only Filter Toggle */}
            <button
              onClick={() => setHasDbFilter(!hasDbFilter)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border ${
                hasDbFilter
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 font-semibold'
                  : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 border-zinc-800'
              }`}
              title="Фильтр: только шаблоны со встроенной базой SQLite"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SQLite</span>
            </button>
          </div>
        </div>

        {/* 3. MAIN WORKSPACE AREA: SPLIT VIEW OR GRID VIEW */}
        <div className="flex-1 flex overflow-hidden">
          {/* === LEFT COLUMN: TEMPLATE CARDS LIST === */}
          <div
            className={`border-r border-zinc-800/80 bg-zinc-950/40 flex flex-col shrink-0 overflow-y-auto p-4 space-y-2.5 transition-all ${
              viewMode === 'split' ? 'w-full md:w-[420px] lg:w-[480px]' : 'w-full'
            }`}
          >
            {/* Header info in list */}
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1 pb-1">
              <span>Найдено шаблонов: <strong className="text-white">{filteredTemplates.length}</strong></span>
              <span className="font-mono text-[10px] text-zinc-500">Нажмите для предпросмотра</span>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 space-y-3 flex flex-col items-center justify-center">
                <Box className="w-10 h-10 text-zinc-600" />
                <p className="text-sm font-medium">Ничего не найдено по вашему запросу</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                    setHasDbFilter(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500/80 shadow-lg shadow-blue-500/10'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{tpl.icon}</span>
                          <span className="font-mono text-[11px] font-bold text-zinc-400">
                            #{tpl.num.toString().padStart(2, '0')}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 font-medium">
                            {tpl.categoryTitle.split(' ')[1] || tpl.categoryTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {tpl.hasDatabase && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-semibold border border-emerald-500/30 flex items-center gap-1">
                              <Database className="w-2.5 h-2.5" />
                              <span>SQLite</span>
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                            {tpl.controlsCount} элем.
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className={`font-bold text-sm tracking-tight transition ${
                          isSelected ? 'text-blue-400' : 'text-zinc-100 group-hover:text-blue-300'
                        }`}>
                          {tpl.title}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {tpl.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800/60 text-zinc-400 font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Bar on Card */}
                    <div className="pt-3 mt-2 border-t border-zinc-800/60 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {tpl.difficulty} · .NET 9
                      </span>

                      {/* ⚡️ Instant 1-Click Launch Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInstantLaunch(tpl, false);
                        }}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition cursor-pointer"
                        title="Мгновенно открыть проект в Студии"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Открыть</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* === RIGHT COLUMN: HIGH-FIDELITY DYNAMIC PREVIEW & CUSTOMIZATION === */}
          {viewMode === 'split' && (
            <div className="flex-1 flex flex-col bg-[#0b0c10] overflow-y-auto">
              {/* Preview Header & Tab Selector */}
              <div className="p-4 bg-zinc-950/80 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activeTemplate.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-400">
                        #{activeTemplate.num.toString().padStart(2, '0')}
                      </span>
                      <h2 className="text-base font-bold text-white tracking-tight">
                        {activeTemplate.title}
                      </h2>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {activeTemplate.csharpSummary}
                    </p>
                  </div>
                </div>

                {/* Mode Tabs */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setActivePreviewTab('visual')}
                    className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                      activePreviewTab === 'visual'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Окно WinForms</span>
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('csharp')}
                    className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                      activePreviewTab === 'csharp'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>C# .NET 9</span>
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('sql')}
                    className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                      activePreviewTab === 'sql'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>SQLite DDL</span>
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('controls')}
                    className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                      activePreviewTab === 'controls'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Контролы AST</span>
                  </button>
                </div>
              </div>

              {/* Preview Content Body */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
                {/* 1. VISUAL WINFORMS HIGH-FIDELITY PREVIEW */}
                {activePreviewTab === 'visual' && (
                  <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans select-none animate-in zoom-in-95 duration-150">
                    {/* Realistic WinForms Window Title Bar */}
                    <div className="h-8 bg-zinc-950 border-b border-zinc-800 px-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{activeTemplate.icon}</span>
                        <span className="text-xs font-semibold text-zinc-300 font-mono">
                          {activeTemplate.title} - Form1.cs [Дизайн]
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                        <span className="hover:text-white cursor-default">_</span>
                        <span className="hover:text-white cursor-default">□</span>
                        <span className="hover:text-rose-400 cursor-default">✕</span>
                      </div>
                    </div>

                    {/* Window Inner Form Body */}
                    <div className="p-4 bg-[#18181b] space-y-3 min-h-[340px] flex flex-col justify-between">
                      {/* Top Header Banner Panel */}
                      <div className="p-3 bg-[#27272a] border border-zinc-700 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                            <span>{activeTemplate.icon}</span>
                            <span>{activeTemplate.title}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {activeTemplate.description}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                          .NET 9
                        </span>
                      </div>

                      {/* DYNAMIC CONTENT AREA BASED ON TEMPLATE CHARACTERISTICS */}
                      <div className="flex-1 flex gap-3">
                        {/* If Template #61: Interactive 3x3 TicTacToe & CS:GO */}
                        {activeTemplate.id === 'tpl_61' ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2">
                            <div className="text-[11px] font-mono text-zinc-300 font-bold">
                              {interactiveCsgoMode ? (
                                <span className="text-amber-400">
                                  🔫 CS:GO AIM TRAINER | Фраги: {interactiveCsgoFrags} | One-Tap AK-47
                                </span>
                              ) : (
                                <span className="text-blue-400">
                                  ❌ Крестики-Нолики с ИИ (Minimax) | Ход: Игрок (X)
                                </span>
                              )}
                            </div>

                            {/* 3x3 Grid Buttons */}
                            <div className="grid grid-cols-3 gap-1.5">
                              {interactiveGridState.map((val, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleMiniCellClick(idx)}
                                  className="w-16 h-14 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded flex items-center justify-center font-bold text-lg text-blue-400 active:scale-95 transition cursor-pointer shadow"
                                >
                                  {interactiveCsgoMode ? (idx === 4 ? '🎯 T' : '·') : val}
                                </button>
                              ))}
                            </div>

                            {/* Quick interactive easter egg switcher */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => setInteractiveGridState([' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '])}
                                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono"
                              >
                                🔄 Сброс поля
                              </button>
                              <button
                                onClick={() => setInteractiveCsgoMode(!interactiveCsgoMode)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-mono font-bold"
                              >
                                🔫 «нет блин ксго»
                              </button>
                            </div>
                          </div>
                        ) : activeTemplate.hasDatabase || activeTemplate.category === 'business' ? (
                          /* High-Fidelity DataGridView Mockup */
                          <div className="flex-1 flex flex-col bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden text-[11px]">
                            {/* Grid Headers */}
                            <div className="bg-zinc-800/80 text-zinc-300 font-bold px-3 py-1.5 grid grid-cols-5 border-b border-zinc-700 font-mono text-[10px]">
                              <span>ID</span>
                              <span className="col-span-2">Наименование</span>
                              <span>Кол-во</span>
                              <span>Статус</span>
                            </div>
                            {/* Grid Rows */}
                            <div className="divide-y divide-zinc-900 text-zinc-300 font-mono text-[10px]">
                              {[
                                { id: '001', name: `${activeTemplate.title} Позиция #1`, qty: '124 шт.', status: 'Активен' },
                                { id: '002', name: `${activeTemplate.title} Позиция #2`, qty: '56 шт.', status: 'В обработке' },
                                { id: '003', name: `${activeTemplate.title} Позиция #3`, qty: '890 шт.', status: 'Отгружен' },
                                { id: '004', name: `${activeTemplate.title} Позиция #4`, qty: '12 шт.', status: 'Резерв' },
                              ].map((row, rIdx) => (
                                <div
                                  key={row.id}
                                  className={`px-3 py-1.5 grid grid-cols-5 items-center ${
                                    rIdx === 0 ? 'bg-blue-600/20 text-white' : 'hover:bg-zinc-900'
                                  }`}
                                >
                                  <span className="text-zinc-500">{row.id}</span>
                                  <span className="col-span-2 truncate">{row.name}</span>
                                  <span>{row.qty}</span>
                                  <span className="text-emerald-400">● {row.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* Default Form Inputs & Controls Mockup */
                          <div className="flex-1 bg-zinc-950 rounded-lg border border-zinc-800 p-4 space-y-2.5 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Параметр A (Вход):</label>
                                <input
                                  type="text"
                                  readOnly
                                  value="100.0"
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-mono text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Параметр B (Шаг):</label>
                                <input
                                  type="text"
                                  readOnly
                                  value="0.5"
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-mono text-xs"
                                />
                              </div>
                            </div>

                            <button className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs shadow">
                              ⚡️ Выполнить расчет алгоритма
                            </button>

                            <div className="p-2.5 bg-zinc-900/80 border border-zinc-700/60 rounded text-[11px] font-mono text-emerald-400">
                              [OutputLog]: Расчет завершен успешно. Обработано записей: 120. Время: 4 мс.
                            </div>
                          </div>
                        )}

                        {/* Right Quick Controls Side Panel */}
                        <div className="w-36 bg-[#27272a] border border-zinc-700 rounded-lg p-2.5 space-y-2 flex flex-col justify-between shrink-0">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                              ⚙️ Действия
                            </span>
                            <button className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-[10px]">
                              ➕ Добавить
                            </button>
                            <button className="w-full py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded text-[10px]">
                              💾 Экспорт
                            </button>
                            <button className="w-full py-1 bg-rose-600/80 hover:bg-rose-500 text-white rounded text-[10px]">
                              🗑 Удалить
                            </button>
                          </div>

                          <div className="text-[9px] font-mono text-zinc-500 pt-2 border-t border-zinc-700">
                            Элементов: {activeTemplate.controlsCount}
                          </div>
                        </div>
                      </div>

                      {/* WinForms StatusStrip */}
                      <div className="h-5 bg-zinc-950 border-t border-zinc-800 px-2 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>● Готово к работе</span>
                        <span>SQLite: {activeTemplate.hasDatabase ? 'ON' : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. C# CODE PREVIEW */}
                {activePreviewTab === 'csharp' && (
                  <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[380px]">
                    <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-mono text-zinc-300">
                        <FileCode className="w-4 h-4 text-blue-400" />
                        <span>Form1.cs (.NET 9 WinForms)</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(generatedCode.csharp)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center gap-1 font-mono text-[11px]"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Скопировано!' : 'Копировать'}</span>
                      </button>
                    </div>
                    <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-zinc-300 bg-zinc-950 leading-relaxed scrollbar-thin">
                      <code>{generatedCode.csharp}</code>
                    </pre>
                  </div>
                )}

                {/* 3. SQLITE DDL SCHEMA PREVIEW */}
                {activePreviewTab === 'sql' && (
                  <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[380px]">
                    <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-mono text-zinc-300">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <span>Schema.sql (SQLite WASM DDL & Seed)</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(generatedCode.sql)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center gap-1 font-mono text-[11px]"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Копировать</span>
                      </button>
                    </div>
                    <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-emerald-300 bg-zinc-950 leading-relaxed scrollbar-thin">
                      <code>{generatedCode.sql}</code>
                    </pre>
                  </div>
                )}

                {/* 4. CONTROLS AST INSPECTOR */}
                {activePreviewTab === 'controls' && (
                  <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[380px]">
                    <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-mono text-zinc-300">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span>Дерево элементов интерфейса AST ({activeTemplate.controlsList.length} шт.)</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Form1.Designer.cs</span>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-2">
                      {activeTemplate.controlsList.map((ctl, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">#{idx + 1}</span>
                            <span className="font-bold text-blue-400">{ctl}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            WinForms Control
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* BOTTOM LAUNCH BAR & CUSTOMIZER ACCORDION */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-3 shrink-0">
                {/* Customizer Drawer Toggle */}
                {isCustomizing && (
                  <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-3 animate-in fade-in slide-in-from-bottom-2 text-xs">
                    <div className="font-bold text-white flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-blue-400" />
                      <span>Параметры генерации проекта</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-zinc-400 block mb-1">Имя проекта</label>
                        <input
                          type="text"
                          value={customProjName}
                          onChange={(e) => setCustomProjName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 block mb-1">Namespace</label>
                        <input
                          type="text"
                          value={customNamespace}
                          onChange={(e) => setCustomNamespace(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 block mb-1">Автор</label>
                        <input
                          type="text"
                          value={customAuthor}
                          onChange={(e) => setCustomAuthor(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeDbSeed}
                          onChange={(e) => setIncludeDbSeed(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span>Включить SQLite демо-записи ({seedRecordCount} строк)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Instant Launch Action Row */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setIsCustomizing(!isCustomizing)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <Settings2 className="w-4 h-4 text-zinc-400" />
                    <span>{isCustomizing ? 'Скрыть настройки' : 'Настроить перед созданием'}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    {/* Primary Instant 1-Click Launch Button */}
                    <button
                      onClick={() => handleInstantLaunch(activeTemplate, isCustomizing)}
                      disabled={isInstantiating}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-blue-600/30 flex items-center gap-2.5 active:scale-95 transition cursor-pointer disabled:opacity-50"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>⚡️ Мгновенно открыть проект в Студии</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
