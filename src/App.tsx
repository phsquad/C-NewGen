/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { DesignerProvider, useDesigner } from './context/DesignerContext';
import { TopHeaderBar } from './components/header/TopHeaderBar';
import { LeftSidebar } from './components/sidebar/LeftSidebar';
import { DesignSurface } from './components/canvas/DesignSurface';
import { RightSidebar } from './components/inspector/RightSidebar';
import { CodePreviewPanel } from './components/code/CodePreviewPanel';
import { StatusBar } from './components/footer/StatusBar';
import { LiveRunModal } from './components/modals/LiveRunModal';
import { ImportModal } from './components/modals/ImportModal';
import { MessageBoxModal } from './components/modals/MessageBoxModal';
import { MultiTabSyncBanner } from './components/notifications/MultiTabSyncBanner';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';
import { decodeProjectFromHashUrl, getRoomIdFromUrl } from './utils/urlHashSharing';
import { DevOSDesktop } from './components/devos/DevOSDesktop';
import { StorageManagerModal } from './components/modals/StorageManagerModal';
import { ErrorListPanel } from './components/diagnostics/ErrorListPanel';
import {
  Share2,
  Box,
  Layers,
  FolderTree,
  Database,
  GitFork,
  Terminal as TerminalIcon,
  GitMerge,
  GitBranch,
  Settings,
  X,
  Sparkles
} from 'lucide-react';

// Import named exports of sub-studios
import { DevOSDatabaseStudio } from './components/devos/DevOSDatabaseStudio';
import { DevOSGitStudio } from './components/devos/DevOSGitStudio';
import { DevOSUMLStudio } from './components/devos/DevOSUMLStudio';
import { DevOSTerminal } from './components/devos/DevOSTerminal';

const DesignerApp: React.FC = () => {
  const {
    project,
    setProjectState,
    appMode,
    setAppMode,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelectedNodes,
    duplicateSelectedNodes,
    nudgeSelectedNodes,
    setLiveRunOpen,
    liveRunOpen,
    importModalOpen,
    setImportModalOpen,
    errorListOpen,
    setErrorListOpen,
  } = useDesigner();

  const [shareToast, setShareToast] = useState<string | null>(null);

  // Studio Overlay Panel Mode ('database' | 'git' | 'terminal' | 'uml' | 'settings' | null)
  const [activeOverlay, setActiveOverlay] = useState<'database' | 'git' | 'terminal' | 'uml' | 'settings' | null>(null);

  // Auto-load project state from URL hash on mount
  useEffect(() => {
    const sharedProject = decodeProjectFromHashUrl();
    if (sharedProject) {
      setProjectState(sharedProject);
      setShareToast(`🎉 Проект "${sharedProject.projectName || 'Shared App'}" загружен по ссылке!`);
      setTimeout(() => setShareToast(null), 5000);
    }
  }, [setProjectState]);

  // Dynamic Document Title Sync (Правка 16.1)
  useEffect(() => {
    const pName = project.projectName || 'MyLabApp';
    const author = project.author ? ` | ${project.author}` : '';
    document.title = `${pName}${author} — NextGen Polyglot Studio`;
  }, [project.projectName, project.author]);

  // Register offline ServiceWorker
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'F5') {
        e.preventDefault();
        setLiveRunOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        if (liveRunOpen) {
          setLiveRunOpen(false);
        } else if (activeOverlay) {
          setActiveOverlay(null);
        }
      }

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedNodes();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedNodes();
        return;
      }

      const step = e.shiftKey ? 8 : 1;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeSelectedNodes(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeSelectedNodes(step, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeSelectedNodes(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeSelectedNodes(0, step);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file && (file.name.endsWith('.cs') || file.name.endsWith('.json') || file.name.endsWith('.txt'))) {
        setImportModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelectedNodes,
    duplicateSelectedNodes,
    nudgeSelectedNodes,
    setLiveRunOpen,
    liveRunOpen,
    setImportModalOpen,
    activeOverlay,
  ]);

  if (appMode === 'devos') {
    return <DevOSDesktop onExitDevOS={() => setAppMode('designer')} />;
  }

  // Handle Left Activity click events
  const handleTabClick = (tab: 'solution' | 'toolbox' | 'tree') => {
    window.dispatchEvent(new CustomEvent('set-left-tab', { detail: tab }));
  };

  return (
    <div className="studio-root font-sans">
      {/* 1. Top Header Bar (42px) */}
      <TopHeaderBar />

      {/* 2. Left Activity Bar (48px) */}
      <aside className="studio-activity-bar flex flex-col justify-between py-3 text-zinc-400 select-none bg-zinc-950 border-r border-zinc-900 z-40 shrink-0">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Solution Explorer Pro */}
          <button
            onClick={() => handleTabClick('solution')}
            title="Обозреватель решений (Solution Explorer Pro)"
            className="p-2 hover:bg-zinc-900 rounded-lg hover:text-white transition cursor-pointer"
          >
            <FolderTree className="w-5 h-5 text-amber-400 hover:scale-105 transition" />
          </button>

          {/* Palette / Toolbox */}
          <button
            onClick={() => handleTabClick('toolbox')}
            title="Палитра компонентов (40+ контролов)"
            className="p-2 hover:bg-zinc-900 rounded-lg hover:text-white transition cursor-pointer"
          >
            <Box className="w-5 h-5 text-blue-400 hover:scale-105 transition" />
          </button>

          {/* Component Tree / Document Outline */}
          <button
            onClick={() => handleTabClick('tree')}
            title="Структура документа и Z-Index (Document Outline)"
            className="p-2 hover:bg-zinc-900 rounded-lg hover:text-white transition cursor-pointer"
          >
            <Layers className="w-5 h-5 text-purple-400 hover:scale-105 transition" />
          </button>

          {/* Database SQLite */}
          <button
            onClick={() => setActiveOverlay(activeOverlay === 'database' ? null : 'database')}
            title="Конструктор SQLite таблиц и SQL Студия"
            className={`p-2 rounded-lg transition cursor-pointer ${activeOverlay === 'database' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-900 hover:text-white'}`}
          >
            <Database className="w-5 h-5 text-amber-400 hover:scale-105 transition" />
          </button>

          {/* Git Studio */}
          <button
            onClick={() => setActiveOverlay(activeOverlay === 'git' ? null : 'git')}
            title="Контроль версий Git (коммиты, ветки, граф истории)"
            className={`p-2 rounded-lg transition cursor-pointer ${activeOverlay === 'git' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-900 hover:text-white'}`}
          >
            <GitFork className="w-5 h-5 text-emerald-400 hover:scale-105 transition" />
          </button>

          {/* API Студия & CLI Terminal */}
          <button
            onClick={() => setActiveOverlay(activeOverlay === 'terminal' ? null : 'terminal')}
            title="API Студия: Postman, Mock API и CLI терминал"
            className={`p-2 rounded-lg transition cursor-pointer ${activeOverlay === 'terminal' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-900 hover:text-white'}`}
          >
            <TerminalIcon className="w-5 h-5 text-cyan-400 hover:scale-105 transition" />
          </button>

          {/* UML Studio */}
          <button
            onClick={() => setActiveOverlay(activeOverlay === 'uml' ? null : 'uml')}
            title="UML Студия классов, структур и паттернов"
            className={`p-2 rounded-lg transition cursor-pointer ${activeOverlay === 'uml' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-900 hover:text-white'}`}
          >
            <Sparkles className="w-5 h-5 text-pink-400 hover:scale-105 transition" />
          </button>
        </div>

        {/* Bottom Gear - Settings / Storage */}
        <button
          onClick={() => setActiveOverlay(activeOverlay === 'settings' ? null : 'settings')}
          title="Параметры хранения и сброс"
          className={`p-2 rounded-lg transition cursor-pointer ${activeOverlay === 'settings' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-900 hover:text-white'}`}
        >
          <Settings className="w-5 h-5 text-zinc-400 hover:rotate-45 transition" />
        </button>
      </aside>

      {/* 3. Main Workspace Area */}
      <div className="flex overflow-hidden relative w-full h-full bg-zinc-950">
        {/* Left Side Tab Panels (Toolbox / Layer Tree) */}
        <LeftSidebar />

        {/* Center Design Surface Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950 border-r border-zinc-900">
          <div className="flex-1 relative overflow-hidden">
            <DesignSurface />
          </div>

          {/* Microsoft VS Standard: Error List & Diagnostic Panel */}
          {errorListOpen && <ErrorListPanel onClose={() => setErrorListOpen(false)} />}

          {/* Live C# Codebehind / Designer drawer */}
          <CodePreviewPanel />
        </main>

        {/* Right Dockable Inspector Panel */}
        <RightSidebar />

        {/* Floating Sub-Studio Dialog Overlays (frosted glass) */}
        {activeOverlay && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full h-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Overlay Header */}
              <div className="px-4 py-3.5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeOverlay === 'database' && (
                    <>
                      <Database className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-sm text-zinc-100 font-mono">🗄 SQLite Студия данных</span>
                    </>
                  )}
                  {activeOverlay === 'git' && (
                    <>
                      <GitFork className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-sm text-zinc-100 font-mono">🐙 Git Контроль Версий</span>
                    </>
                  )}
                  {activeOverlay === 'terminal' && (
                    <>
                      <TerminalIcon className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-sm text-zinc-100 font-mono">📟 API Студия & Терминал</span>
                    </>
                  )}
                  {activeOverlay === 'uml' && (
                    <>
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span className="font-bold text-sm text-zinc-100 font-mono">📐 UML Студия архитектуры классов</span>
                    </>
                  )}
                  {activeOverlay === 'settings' && (
                    <>
                      <Settings className="w-4 h-4 text-zinc-400" />
                      <span className="font-bold text-sm text-zinc-100 font-mono">⚙️ Параметры хранения черновиков</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setActiveOverlay(null)}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Overlay Content */}
              <div className="flex-1 overflow-auto bg-zinc-950 p-2">
                {activeOverlay === 'database' && <DevOSDatabaseStudio />}
                {activeOverlay === 'git' && <DevOSGitStudio />}
                {activeOverlay === 'terminal' && <DevOSTerminal />}
                {activeOverlay === 'uml' && <DevOSUMLStudio />}
                {activeOverlay === 'settings' && (
                  <div className="p-4 max-w-xl mx-auto space-y-4">
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Управление локальной базой данных IndexedDB и кэшем шаблонов. Вы можете выполнить полную очистку в случае повреждения данных или импортировать проекты напрямую.
                    </p>
                    <StorageManagerModal isOpen={true} onClose={() => setActiveOverlay(null)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Telemetry & Status Bar (26px) */}
      <StatusBar />

      {/* Modals & Notifications */}
      <MultiTabSyncBanner />

      {/* Share Toast Banner */}
      {shareToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 text-xs animate-in slide-in-from-bottom-5 duration-200">
          <Share2 className="w-4 h-4 text-emerald-200" />
          <span>{shareToast}</span>
        </div>
      )}
      <LiveRunModal />
      <ImportModal />
      <MessageBoxModal />
    </div>
  );
};

export default function App() {
  return (
    <DesignerProvider>
      <DesignerApp />
    </DesignerProvider>
  );
}
