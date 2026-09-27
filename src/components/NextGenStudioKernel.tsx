// components/NextGenStudioKernel.tsx
import React, { useEffect } from 'react';
import { useMasterEngineStore, ProjectEntity } from '../store/useMasterEngineStore';

import { DevOSWindow } from './devos/DevOSWindow';
import { DesignSurface } from './canvas/DesignSurface';
import { RightSidebar } from './inspector/RightSidebar';
import { LeftSidebar } from './sidebar/LeftSidebar';
import { CodePreviewPanel } from './code/CodePreviewPanel';
import { InteractiveSandboxModal } from './modals/InteractiveSandboxModal';
import { BuildPublishWizardModal } from './modals/BuildPublishWizardModal';

interface KernelProps {
  project: ProjectEntity;
  onExitToHub: () => void;
}

export const NextGenStudioKernel: React.FC<KernelProps> = ({ project, onExitToHub }) => {
  const {
    initProject,
    windows,
    openWindow,
    closeWindow,
  } = useMasterEngineStore();

  useEffect(() => {
    if (project) {
      initProject(project);
    }
  }, [project, initProject]);

  const activeProject = useMasterEngineStore((s) => s.project) || project;

  return (
    <div className="w-screen h-screen bg-[#0d0d11] text-zinc-300 flex flex-col overflow-hidden select-none font-sans relative">
      
      {/* 1. Header (42px) */}
      <header className="h-[42px] bg-[#18181f] border-b border-zinc-800 px-3 flex justify-between items-center z-50 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onExitToHub}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>🏠</span> <span className="font-bold">Хаб</span>
          </button>
          <div className="h-4 w-[1px] bg-zinc-700 mx-1" />
          <span className="text-white font-bold text-xs">{activeProject.name}</span>
          <span className="text-[10px] text-blue-400 font-mono">({activeProject.targetStack || 'C# WinForms'})</span>
        </div>

        {/* Tools Quick Bar */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
          <button
            onClick={() => openWindow('designer')}
            className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded shadow cursor-pointer"
          >
            🛠 Дизайнер
          </button>
          <button
            onClick={() => openWindow('codeStudio')}
            className="px-3 py-1 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            📝 C# Код
          </button>
          <button
            onClick={() => openWindow('sandbox')}
            className="px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 rounded transition flex items-center gap-1 cursor-pointer"
          >
            <span>▶</span> <span>Запуск (F5)</span>
          </button>
        </div>

        {/* Build Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openWindow('builder')}
            className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white text-xs font-bold rounded-md shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🚀</span> <span>Собрать .EXE</span>
          </button>
        </div>
      </header>

      {/* 2. DevOS Desktop Workspace */}
      <main className="flex-1 relative overflow-hidden bg-[#09090d]">
        
        {/* WINDOW 1: FORM DESIGNER */}
        <DevOSWindow app={windows.designer}>
          <div className="w-full h-full flex overflow-hidden">
            {/* Left: Component Toolbox */}
            <LeftSidebar />

            {/* Center: Canvas Viewport */}
            <div className="flex-1 relative overflow-hidden bg-[#0a0a0e]">
              <DesignSurface />
            </div>

            {/* Right: Property Inspector */}
            <RightSidebar />
          </div>
        </DevOSWindow>

        {/* WINDOW 2: MONACO CODE STUDIO */}
        <DevOSWindow app={windows.codeStudio}>
          <CodePreviewPanel />
        </DevOSWindow>

        {/* WINDOW 3: LIVE OMNI-RUNTIME SANDBOX */}
        {windows.sandbox.isOpen && (
          <InteractiveSandboxModal onClose={() => closeWindow('sandbox')} />
        )}

        {/* WINDOW 4: .EXE BUILD & PUBLISH WIZARD */}
        {windows.builder.isOpen && (
          <BuildPublishWizardModal
            isOpen={true}
            onClose={() => closeWindow('builder')}
          />
        )}

      </main>

      {/* 3. Taskbar */}
      <footer className="h-10 bg-[#121217] border-t border-zinc-800 px-4 flex justify-between items-center text-xs z-50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-mono text-[11px] text-zinc-400">
            DevOS Kernel v25.0 Pro · 120 FPS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openWindow('designer')}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[11px] cursor-pointer"
          >
            🛠 Дизайнер
          </button>
          <button
            onClick={() => openWindow('codeStudio')}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[11px] cursor-pointer"
          >
            📝 C# Код
          </button>
          <button
            onClick={() => openWindow('sandbox')}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded text-[11px] cursor-pointer"
          >
            ▶ Песочница
          </button>
          <button
            onClick={() => openWindow('builder')}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded text-[11px] cursor-pointer"
          >
            🚀 EXE Сборка
          </button>
        </div>
        <div className="text-[11px] text-zinc-500 font-mono">
          F5 Safe · IndexedDB Auto-Sync
        </div>
      </footer>

    </div>
  );
};
