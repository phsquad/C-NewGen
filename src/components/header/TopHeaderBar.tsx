import React, { useState, useEffect, useRef } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { TargetFramework } from '../../types/ast';
import {
  createMultiFormTemplate,
  createLoginTemplate,
  createDashboardTemplate,
  createSettingsTemplate,
  createEmptyProject,
} from '../../utils/templates';
import {
  exportProjectZip,
  downloadFile,
} from '../../utils/storage';
import { downloadFullProjectZip } from '../../utils/zipExporter';
import {
  generateDesignerCs,
  generateCodeBehindCs,
} from '../../utils/codeGenerators';
import {
  Save,
  FolderOpen,
  Download,
  FileCode,
  Undo2,
  Redo2,
  Play,
  Grid,
  Magnet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  Layers,
  Sparkles,
  Upload,
  Code2,
  Wrench,
  Package,
  Copy,
  Check,
  History,
  HardDrive,
  FolderGit2,
  Wifi,
  Stethoscope,
  Plus,
  Rocket,
  Share2,
  Smartphone,
  Trash2,
  Monitor,
  HelpCircle,
  Menu,
  FolderTree,
  Box,
  AlertCircle,
  Home,
  Zap,
} from 'lucide-react';
import { HistoryJournalPanel } from '../history/HistoryJournalPanel';
import { ProjectManagerModal } from '../projectManager/ProjectManagerModal';
import { FormSynthesizerModal } from '../modals/FormSynthesizerModal';
import { ProjectAuditModal } from '../modals/ProjectAuditModal';
import { GenesisWizardModal } from '../modals/GenesisWizardModal';
import { ShareProjectModal } from '../modals/ShareProjectModal';
import { StorageManagerModal } from '../modals/StorageManagerModal';
import { BuildPublishWizardModal } from '../modals/BuildPublishWizardModal';
import { ProjectASTLinter } from '../../utils/astLinter';
import { OfflineFormSynthesizer } from '../../utils/OfflineFormSynthesizer';
import { db, initDefaultProjectsIfEmpty } from '../../utils/indexedDbStorage';
import { connectLocalDirectory, syncProjectToLocalDirectory } from '../../utils/fileSystemSync';

export const TopHeaderBar: React.FC = () => {
  const {
    project,
    setProjectState,
    saveProject,
    hasUnsavedChanges,
    storageStatusInfo,
    appMode,
    setAppMode,
    canUndo,
    canRedo,
    undo,
    redo,
    zoom,
    setZoom,
    resetView,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    codeDockOpen,
    setCodeDockOpen,
    liveRunOpen,
    setLiveRunOpen,
    setImportModalOpen,
    setTargetFramework,
    historyJournal,
    historyPanelOpen,
    setHistoryPanelOpen,
    nextUndoDescription,
    nextRedoDescription,
    updateMultipleNodeBounds,
    activeFormId,
    gridStep,
    setActiveLeftTab,
    isTabOrderMode,
    setTabOrderMode,
    errorListOpen,
    setErrorListOpen,
    exitToWelcomeHub,
    showWiring,
    toggleShowWiring,
    xrayMode,
    toggleXrayMode,
    morphicMode,
    toggleMorphicMode,
  } = useDesigner();

  // Dropdown menus states
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [frameworkMenuOpen, setFrameworkMenuOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const [synthesizerModalOpen, setSynthesizerModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [genesisModalOpen, setGenesisModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [buildWizardOpen, setBuildWizardOpen] = useState(false);
  const [beautifyNotice, setBeautifyNotice] = useState(false);
  const [projectsCount, setProjectsCount] = useState(2);
  const [diskSyncSuccess, setDiskSyncSuccess] = useState(false);

  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpenBuildWizard = () => {
      setBuildWizardOpen(true);
    };
    window.addEventListener('open-build-wizard', handleOpenBuildWizard);
    return () => window.removeEventListener('open-build-wizard', handleOpenBuildWizard);
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInstallPwa = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      const choice = await pwaPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsPwaInstalled(true);
        setPwaPrompt(null);
      }
    } else {
      alert('NextGen Studio уже готово к автономной работе без интернета!');
    }
  };

  const lintIssues = React.useMemo(() => {
    return ProjectASTLinter.validateProject(project);
  }, [project]);

  const lintErrorCount = lintIssues.filter(i => i.severity === 'error').length;

  const handleBeautifyGrid = () => {
    const currentFormId = activeFormId || project.rootFormId;
    const currentForm = project.nodes[currentFormId];
    if (!currentForm || !currentForm.childrenIds) return;

    const childNodes = currentForm.childrenIds
      .map(cid => project.nodes[cid])
      .filter(Boolean);

    const updates = OfflineFormSynthesizer.beautifyLayout(childNodes, gridStep || 8);
    updateMultipleNodeBounds(updates, true);
    setBeautifyNotice(true);
    setTimeout(() => setBeautifyNotice(false), 2000);
  };

  React.useEffect(() => {
    const checkProjectsCount = async () => {
      try {
        await initDefaultProjectsIfEmpty();
        const count = await db.projects.count();
        setProjectsCount(count);
      } catch (err) {
        console.warn('Could not read project count:', err);
      }
    };
    checkProjectsCount();
  }, [projectManagerOpen]);

  const handleSaveToPcFolder = async () => {
    try {
      const res = await connectLocalDirectory();
      if (res) {
        await syncProjectToLocalDirectory(res.handle, project);
        setDiskSyncSuccess(true);
        setTimeout(() => setDiskSyncSuccess(false), 2500);
      }
    } catch (err: any) {
      setProjectManagerOpen(true);
    }
  };

  const handleSave = () => {
    saveProject();
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  const handleDownloadZip = async () => {
    await downloadFullProjectZip(project);
    setExportMenuOpen(false);
  };

  const handleDownloadDesignerCs = () => {
    const code = generateDesignerCs(project);
    const formName = project.nodes[project.rootFormId]?.properties.name || 'Form1';
    downloadFile(`${formName}.Designer.cs`, code);
    setExportMenuOpen(false);
  };

  const handleDownloadCodeBehind = () => {
    const code = generateCodeBehindCs(project);
    const formName = project.nodes[project.rootFormId]?.properties.name || 'Form1';
    downloadFile(`${formName}.cs`, code);
    setExportMenuOpen(false);
  };

  const handleDownloadAstJson = () => {
    downloadFile('ui-ast.json', JSON.stringify(project, null, 2), 'application/json');
    setExportMenuOpen(false);
  };

  const toggleDropdown = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  return (
    <header className="studio-topbar flex items-center justify-between text-xs text-zinc-300">
      {/* ЛЕВАЯ ЧАСТЬ: Логотип и меню */}
      <div className="flex items-center gap-1" ref={menuRef}>
        <div className="font-bold text-blue-500 mr-1 flex items-center gap-1.5 text-sm cursor-default">
          <span className="text-base select-none">⚡️</span>
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent font-extrabold">NextGen</span>
        </div>

        {/* 🏠 Главная кнопка "Хаб проектов" / "Выйти в хаб" */}
        <button
          type="button"
          onClick={() => exitToWelcomeHub()}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs mr-2 group"
          title="Сохранить текущую работу и открыть Стартовый Хаб проектов (Welcome Launcher)"
        >
          <Home className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition" />
          <span>🏠 Хаб</span>
        </button>

        {/* Файл Menu */}
        <div className="relative">
          <button onClick={() => toggleDropdown('file')} className="menu-dropdown-btn font-semibold text-zinc-200">
            Файл ▾
          </button>
          {activeMenu === 'file' && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 text-[11px] font-mono">
              <button
                onClick={() => { exitToWelcomeHub(); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-blue-300 font-bold"
              >
                <Home className="w-3.5 h-3.5 text-blue-400" />
                <span>🏠 Выйти в Хаб проектов</span>
              </button>
              <div className="my-1 border-t border-zinc-800" />
              <button
                onClick={() => { setGenesisModalOpen(true); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-zinc-300"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Новый проект</span>
              </button>
              <button
                onClick={() => { setProjectManagerOpen(true); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-zinc-300"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Открыть проекты...</span>
              </button>
              <button
                onClick={() => { handleSave(); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-zinc-300"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Сохранить локально</span>
              </button>
              <button
                onClick={() => { handleSaveToPcFolder(); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-zinc-300"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Синхронизировать с папкой ПК</span>
              </button>
              <button
                onClick={() => { setImportModalOpen(true); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-zinc-300"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Импортировать .Designer.cs</span>
              </button>
              <div className="my-1 border-t border-zinc-800" />
              <button
                onClick={() => { setStorageModalOpen(true); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-600 hover:text-white flex items-center gap-2 text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Сброс кэша / Очистить</span>
              </button>
            </div>
          )}
        </div>

        {/* Правка Menu */}
        <div className="relative">
          <button onClick={() => toggleDropdown('edit')} className="menu-dropdown-btn font-semibold text-zinc-200">
            Правка ▾
          </button>
          {activeMenu === 'edit' && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 text-[11px] font-mono">
              <button
                disabled={!canUndo}
                onClick={() => { undo(); setActiveMenu(null); }}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 ${canUndo ? 'hover:bg-blue-600 hover:text-white text-zinc-300' : 'text-zinc-600 cursor-not-allowed'}`}
              >
                <Undo2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Отменить (Ctrl+Z)</span>
              </button>
              <button
                disabled={!canRedo}
                onClick={() => { redo(); setActiveMenu(null); }}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 ${canRedo ? 'hover:bg-blue-600 hover:text-white text-zinc-300' : 'text-zinc-600 cursor-not-allowed'}`}
              >
                <Redo2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Повторить (Ctrl+Y)</span>
              </button>
              <div className="my-1 border-t border-zinc-800" />
              <button
                onClick={() => { handleBeautifyGrid(); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-zinc-300"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Сделать красиво</span>
              </button>
            </div>
          )}
        </div>

        {/* Вид Menu */}
        <div className="relative">
          <button onClick={() => toggleDropdown('view')} className="menu-dropdown-btn font-semibold text-zinc-200">
            Вид ▾
          </button>
          {activeMenu === 'view' && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1.5 z-50 text-[11px] font-mono">
              {/* 1. Solution Explorer */}
              <button
                onClick={() => { setActiveLeftTab('solution'); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                  <span>Обозреватель решений</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-sans">Ctrl+Alt+L</span>
              </button>

              {/* 2. Toolbox */}
              <button
                onClick={() => { setActiveLeftTab('toolbox'); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-blue-400" />
                  <span>Палитра компонентов (Toolbox)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-sans">Ctrl+Alt+X</span>
              </button>

              {/* 3. Document Outline */}
              <button
                onClick={() => { setActiveLeftTab('tree'); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Структура документа (Outline)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-sans">Ctrl+Alt+T</span>
              </button>

              <div className="my-1 border-t border-zinc-800" />

              {/* 4. Tab Order Mode */}
              <button
                onClick={() => { setTabOrderMode(!isTabOrderMode); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🔢</span>
                  <span className="font-semibold text-white">Порядок перехода (Tab Order)</span>
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans ${isTabOrderMode ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>
                  {isTabOrderMode ? 'ВКЛ' : 'ВЫКЛ'}
                </span>
              </button>

              {/* 5. Error List */}
              <button
                onClick={() => { setErrorListOpen(!errorListOpen); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>Список ошибок (Error List)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-sans">Ctrl+\, E</span>
              </button>

              <div className="my-1 border-t border-zinc-800" />

              <button
                onClick={() => { setShowGrid(!showGrid); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5 text-blue-400" />
                  <span>Показать сетку</span>
                </span>
                <span className="text-[9px] text-zinc-500">{showGrid ? 'ВКЛ' : 'ВЫКЛ'}</span>
              </button>
              <button
                onClick={() => { setSnapToGrid(!snapToGrid); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <Magnet className="w-3.5 h-3.5 text-amber-500" />
                  <span>Прилипание</span>
                </span>
                <span className="text-[9px] text-zinc-500">{snapToGrid ? 'ВКЛ' : 'ВЫКЛ'}</span>
              </button>
              <button
                onClick={() => { resetView(); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-zinc-300"
              >
                <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Вписать в экран (1:1)</span>
              </button>
              <button
                onClick={() => { setCodeDockOpen(!codeDockOpen); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Панель кода C#</span>
                </span>
                <span className="text-[9px] text-zinc-500">{codeDockOpen ? 'ОТКР' : 'ЗАКР'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Сборка Menu */}
        <div className="relative">
          <button onClick={() => toggleDropdown('build')} className="menu-dropdown-btn font-semibold text-zinc-200">
            Сборка ▾
          </button>
          {activeMenu === 'build' && (
            <div className="absolute top-full left-0 mt-1 w-60 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 text-[11px] font-mono">
              <button
                onClick={() => { setBuildWizardOpen(true); setActiveMenu(null); }}
                className="w-full text-left px-3 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-amber-300 font-bold bg-amber-500/10 border-b border-zinc-800"
              >
                <Rocket className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="block">🚀 Мастер сборки (.EXE)</span>
                  <span className="text-[9px] text-zinc-400 block font-normal">Single-File Self-Contained AOT</span>
                </div>
              </button>
              <button
                onClick={() => { setLiveRunOpen(true); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-zinc-300"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                <span>Тест формы (F5)</span>
              </button>
              <button
                onClick={() => { setAuditModalOpen(true); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-zinc-300"
              >
                <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                <span>Проверить ошибки (Аудит)</span>
              </button>
              <button
                onClick={() => { setAppMode('emulator'); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-zinc-300"
              >
                <Monitor className="w-3.5 h-3.5 text-purple-400" />
                <span>Запустить эмулятор</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multiplayer Placeholder (Feature in Development) */}
      <button
        type="button"
        onClick={() => {
          alert('🤝 Совместная работа в реальном времени находится на стадии закрытого тестирования и скоро будет доступна в следующем обновлении!');
        }}
        className="px-2.5 py-1 text-[11px] bg-zinc-950/40 hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-400 border border-zinc-900 rounded-xl flex items-center gap-1.5 transition cursor-pointer font-medium hover:scale-102"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse" />
        <span>Совместная работа (В разработке)</span>
      </button>

      {/* ЦЕНТР: Переключатель режимов */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-0.5 shadow-inner">
          <button
            type="button"
            onClick={() => setAppMode('designer')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              appMode === 'designer'
                ? 'bg-blue-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🛠 Дизайнер
          </button>
          <button
            type="button"
            onClick={() => setLiveRunOpen(true)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              liveRunOpen
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ▶ Запуск
          </button>
        </div>

        {/* Селектор целевого стека */}
        <div className="relative">
          <button
            onClick={() => setFrameworkMenuOpen(!frameworkMenuOpen)}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer font-bold text-[10px] text-blue-400"
          >
            <span>🎯 {project.targetFramework === 'WinForms' ? 'C# WinForms' : 'Avalonia XAML'}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {frameworkMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 text-[10px] font-mono">
              <button
                onClick={() => { setTargetFramework('WinForms'); setFrameworkMenuOpen(false); }}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 ${project.targetFramework === 'WinForms' ? 'bg-blue-600/10 text-blue-400 font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
              >
                <span>WinForms</span>
              </button>
              <button
                onClick={() => { setTargetFramework('Avalonia'); setFrameworkMenuOpen(false); }}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 ${project.targetFramework === 'Avalonia' ? 'bg-purple-600/10 text-purple-400 font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
              >
                <span>Avalonia</span>
              </button>
            </div>
          )}
        </div>

        {/* Кнопка Tab Order (Стандарт Microsoft) */}
        <button
          type="button"
          onClick={() => setTabOrderMode(!isTabOrderMode)}
          className={`px-2.5 py-1 border rounded-lg flex items-center gap-1.5 cursor-pointer font-bold text-[11px] transition-all shadow-xs ${
            isTabOrderMode
              ? 'bg-blue-600 border-blue-400 text-white ring-2 ring-blue-400/40 animate-pulse'
              : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-300 hover:text-white'
          }`}
          title="Режим расстановки порядка перехода Tab Order (по клику на контролы)"
        >
          <span>🔢</span>
          <span>Tab Order</span>
        </button>

        {/* Кнопка Error List (Стандарт Microsoft) */}
        <button
          type="button"
          onClick={() => setErrorListOpen(!errorListOpen)}
          className={`px-2.5 py-1 border rounded-lg flex items-center gap-1.5 cursor-pointer font-bold text-[11px] transition-all shadow-xs ${
            errorListOpen
              ? 'bg-zinc-800 border-zinc-700 text-white ring-1 ring-zinc-500/40'
              : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-300 hover:text-white'
          }`}
          title="Список ошибок (Error List & Diagnostic Panel)"
        >
          <AlertCircle className={`w-3.5 h-3.5 ${lintErrorCount > 0 ? 'text-red-400' : 'text-zinc-500'}`} />
          <span>Ошибки</span>
          {lintErrorCount > 0 && (
            <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[9px] font-mono">
              {lintErrorCount}
            </span>
          )}
        </button>

        {/* ⚡️ Нити данных (Signal-Wiring) */}
        <button
          type="button"
          onClick={toggleShowWiring}
          className={`px-2 py-1 border rounded-lg flex items-center gap-1 cursor-pointer font-bold text-[10px] transition-all shadow-xs ${
            showWiring
              ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/30'
              : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title="Интерактивные нити данных прямо по холсту (Visual Signal-Wiring)"
        >
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Нити</span>
        </button>

        {/* 🩻 2.5D X-Ray Layering */}
        <button
          type="button"
          onClick={toggleXrayMode}
          className={`px-2 py-1 border rounded-lg flex items-center gap-1 cursor-pointer font-bold text-[10px] transition-all shadow-xs ${
            xrayMode
              ? 'bg-cyan-600/25 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40 animate-pulse'
              : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title="2.5D X-Ray Изометрический просмотр скрытых слоев и вкладок"
        >
          <span>🩻</span>
          <span>X-Ray 2.5D</span>
        </button>

        {/* 🧬 Morphic Layout Engine */}
        <button
          type="button"
          onClick={toggleMorphicMode}
          className={`px-2 py-1 border rounded-lg flex items-center gap-1 cursor-pointer font-bold text-[10px] transition-all shadow-xs ${
            morphicMode === 'adaptive'
              ? 'bg-emerald-600/20 border-emerald-400 text-emerald-300'
              : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title="Morphic Layout: Пиксели (WinForms) ⟷ Адаптивная Сетка (Flex/Grid)"
        >
          <span>🧬</span>
          <span>{morphicMode === 'adaptive' ? 'Адаптив' : 'Пиксели'}</span>
        </button>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Действия и Экспорт */}
      <div className="flex items-center gap-2">
        {/* Индикатор автосохранения */}
        <div
          onClick={handleSave}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900/60 border border-zinc-800 text-[10px] font-mono text-zinc-400 cursor-pointer hover:border-zinc-700 transition"
          title="Нажмите для немедленного сохранения в LocalStorage & IndexedDB"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${hasUnsavedChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span>{hasUnsavedChanges ? 'Синхронизация...' : 'Сохранено'}</span>
        </div>
        <button
          type="button"
          onClick={handleBeautifyGrid}
          className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
          title="Сделать красиво (Автовыравнивание сетки)"
        >
          🪄
        </button>
        
        <button
          type="button"
          onClick={() => setAuditModalOpen(true)}
          className="px-2 py-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded flex items-center gap-1 cursor-pointer hover:bg-emerald-950/60 transition"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{lintErrorCount} ошибок</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <span>🚀 Экспорт ▾</span>
          </button>

          {exportMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1.5 z-50 font-mono text-[11px]">
              <button
                onClick={() => { setBuildWizardOpen(true); setExportMenuOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-amber-300 flex items-center gap-2 border-b border-zinc-800 bg-amber-500/10"
              >
                <Rocket className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">🚀 Собрать .EXE (Native AOT)</span>
                  <span className="text-[9px] text-amber-300/80 block">Single-File Self-Contained пакет</span>
                </div>
              </button>
              <button
                onClick={handleDownloadZip}
                className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
              >
                <Package className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold text-white block">Скачать .ZIP</span>
                  <span className="text-[9px] text-zinc-500 block">Полное .NET решение</span>
                </div>
              </button>
              <button
                onClick={handleDownloadDesignerCs}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Скачать Designer.cs</span>
              </button>
              <button
                onClick={handleDownloadCodeBehind}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Скачать Code-Behind</span>
              </button>
              <div className="my-1 border-t border-zinc-800" />
              <button
                onClick={() => { setShareModalOpen(true); setExportMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Поделиться ссылкой</span>
              </button>
              <button
                onClick={() => { handleInstallPwa(); setExportMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Установить как PWA</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History Journal Panel */}
      <HistoryJournalPanel />

      {/* Project Modals */}
      <BuildPublishWizardModal
        isOpen={buildWizardOpen}
        onClose={() => setBuildWizardOpen(false)}
      />
      <ProjectManagerModal
        isOpen={projectManagerOpen}
        onClose={() => setProjectManagerOpen(false)}
      />
      <FormSynthesizerModal
        isOpen={synthesizerModalOpen}
        onClose={() => setSynthesizerModalOpen(false)}
      />
      <ProjectAuditModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
      />
      <GenesisWizardModal
        isOpen={genesisModalOpen}
        onClose={() => setGenesisModalOpen(false)}
      />
      <ShareProjectModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
      <StorageManagerModal
        isOpen={storageModalOpen}
        onClose={() => setStorageModalOpen(false)}
      />
    </header>
  );
};
