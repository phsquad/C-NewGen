import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { WindowDragController, WindowPosition, WindowSize } from '../../utils/WindowDragController';
import { StorageManager } from '../../utils/StorageManager';
import { DevOSTerminal } from './DevOSTerminal';
import { LeftSidebar } from '../sidebar/LeftSidebar';
import { DesignSurface } from '../canvas/DesignSurface';
import { RightSidebar } from '../inspector/RightSidebar';
import { CodePreviewPanel } from '../code/CodePreviewPanel';
import { GenesisWizardModal } from '../modals/GenesisWizardModal';
import { FormSynthesizerModal } from '../modals/FormSynthesizerModal';
import { ShareProjectModal } from '../modals/ShareProjectModal';
import { StorageManagerModal } from '../modals/StorageManagerModal';
import { getStorageUsageInfo } from '../../utils/storage';

import {
  Folder,
  Layout,
  Code2,
  FileCode,
  Terminal as TerminalIcon,
  Trash2,
  Settings,
  Sparkles,
  Share2,
  Minus,
  Square,
  X,
  Monitor,
  Maximize2,
  Smartphone,
  Cpu,
  Activity,
  Search,
  Power,
  RefreshCw,
  Palette,
  Check,
  Globe,
  Database,
  Package,
  Compass,
  FolderGit2,
  Rocket,
} from 'lucide-react';

import { DevOSDatabaseStudio } from './DevOSDatabaseStudio';
import { DevOSNuGetStudio } from './DevOSNuGetStudio';
import { DevOSUMLStudio } from './DevOSUMLStudio';
import { DevOSGitStudio } from './DevOSGitStudio';
import { DevOSNetworkHub } from './DevOSNetworkHub';
import { BuildPublishWizardModal } from '../modals/BuildPublishWizardModal';
import { WindowErrorBoundary } from './WindowErrorBoundary';
import { ResxLocalizationEngine, SUPPORTED_LOCALES, ResxResourceEntry } from '../../utils/ResxLocalizationEngine';
import { RegexPatternStudioEngine, REGEX_PRESETS } from '../../utils/RegexPatternStudioEngine';
import { RoslynCodeMetrics } from '../../utils/RoslynCodeMetrics';
import { generateCodeBehindCs } from '../../utils/codeGenerators';

export type WallpaperTheme = 'win11' | 'cyberpunk' | 'ubuntu' | 'vs_code' | 'retro';

export interface DevOSWindow {
  id: string;
  title: string;
  icon: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  type: 'designer' | 'csharp' | 'python' | 'terminal' | 'projects' | 'settings' | 'database' | 'nuget' | 'uml' | 'git' | 'network' | 'resx' | 'regex' | 'metrics' | 'refactor';
}

interface DevOSDesktopProps {
  onExitDevOS?: () => void;
}

export const DevOSDesktop: React.FC<DevOSDesktopProps> = ({ onExitDevOS }) => {
  const { project, setLiveRunOpen, fps } = useDesigner();
  const { sizeKb } = getStorageUsageInfo(project);

  // Wallpaper state
  const [wallpaper, setWallpaper] = useState<WallpaperTheme>('win11');

  // Start menu open
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  // Context Menu state
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Modals inside OS
  const [genesisModalOpen, setGenesisModalOpen] = useState(true);
  const [synthesizerModalOpen, setSynthesizerModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [buildWizardOpen, setBuildWizardOpen] = useState(false);

  // Clock state
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Top zIndex counter
  const [topZIndex, setTopZIndex] = useState(100);

  // Active windows state
  const [windows, setWindows] = useState<DevOSWindow[]>([
    {
      id: 'window_designer',
      title: '🛠 C# Visual Form Designer — "Form1"',
      icon: <Layout className="w-4 h-4 text-blue-400" />,
      x: 60,
      y: 40,
      width: 1100,
      height: 680,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      type: 'designer',
    },
    {
      id: 'window_terminal',
      title: '📟 Interactive CLI Terminal Runtime',
      icon: <TerminalIcon className="w-4 h-4 text-emerald-400" />,
      x: 200,
      y: 120,
      width: 680,
      height: 420,
      isMinimized: false,
      isMaximized: false,
      zIndex: 11,
      type: 'terminal',
    },
  ]);

  const [activeWindowId, setActiveWindowId] = useState<string>('window_designer');

  // Apply Snap Layout Grid
  const applySnapLayout = (preset: 'split-ide' | 'fullscreen-designer' | 'triple-view') => {
    const sw = window.innerWidth;
    const sh = window.innerHeight - 48;

    // Ensure all 3 core windows exist
    let currentWins = [...windows];

    const ensureWin = (type: DevOSWindow['type'], title: string, icon: React.ReactNode) => {
      let found = currentWins.find((w) => w.type === type);
      if (!found) {
        found = {
          id: `window_${type}_${Date.now()}`,
          title,
          icon,
          x: 100,
          y: 60,
          width: 800,
          height: 500,
          isMinimized: false,
          isMaximized: false,
          zIndex: topZIndex + 1,
          type,
        };
        currentWins.push(found);
      }
      return found.id;
    };

    const desId = ensureWin('designer', '🛠 C# Visual Form Designer — "Form1"', <Layout className="w-4 h-4 text-blue-400" />);
    const codeId = ensureWin('csharp', '📝 Form1.cs & Form1.Designer.cs (C# Code)', <Code2 className="w-4 h-4 text-blue-400" />);
    const termId = ensureWin('terminal', '📟 Interactive CLI Terminal Runtime', <TerminalIcon className="w-4 h-4 text-emerald-400" />);

    if (preset === 'split-ide') {
      const halfW = Math.floor(sw * 0.5) - 15;
      const halfH = Math.floor(sh * 0.5) - 15;

      currentWins = currentWins.map((w) => {
        if (w.id === desId) {
          return { ...w, x: 10, y: 10, width: halfW, height: sh - 20, isMinimized: false, isMaximized: false };
        }
        if (w.id === codeId) {
          return { ...w, x: Math.floor(sw * 0.5) + 5, y: 10, width: halfW, height: halfH, isMinimized: false, isMaximized: false };
        }
        if (w.id === termId) {
          return { ...w, x: Math.floor(sw * 0.5) + 5, y: Math.floor(sh * 0.5) + 5, width: halfW, height: halfH, isMinimized: false, isMaximized: false };
        }
        return w;
      });
    } else if (preset === 'triple-view') {
      const colW = Math.floor(sw / 3) - 12;
      currentWins = currentWins.map((w) => {
        if (w.id === desId) {
          return { ...w, x: 10, y: 10, width: colW, height: sh - 20, isMinimized: false, isMaximized: false };
        }
        if (w.id === codeId) {
          return { ...w, x: colW + 20, y: 10, width: colW, height: sh - 20, isMinimized: false, isMaximized: false };
        }
        if (w.id === termId) {
          return { ...w, x: (colW * 2) + 30, y: 10, width: colW, height: sh - 20, isMinimized: false, isMaximized: false };
        }
        return w;
      });
    } else if (preset === 'fullscreen-designer') {
      currentWins = currentWins.map((w) => {
        if (w.id === desId) {
          return { ...w, x: 10, y: 10, width: sw - 20, height: sh - 20, isMinimized: false, isMaximized: false };
        }
        return w;
      });
    }

    setWindows(currentWins);
    setActiveWindowId(desId);
  };

  // Bring window to front
  const bringToFront = (id: string) => {
    setTopZIndex((prev) => {
      const next = prev + 1;
      setWindows((wins) =>
        wins.map((w) => (w.id === id ? { ...w, zIndex: next, isMinimized: false } : w))
      );
      return next;
    });
    setActiveWindowId(id);
  };

  // Open or focus an app window
  const openAppWindow = (type: DevOSWindow['type']) => {
    const existing = windows.find((w) => w.type === type);
    if (existing) {
      bringToFront(existing.id);
      return;
    }

    let title = 'Новое окно';
    let icon = <Monitor className="w-4 h-4 text-blue-400" />;
    let width = 800;
    let height = 500;

    if (type === 'designer') {
      title = '🛠 C# Visual Form Designer — "Form1"';
      icon = <Layout className="w-4 h-4 text-blue-400" />;
      width = 1100;
      height = 680;
    } else if (type === 'csharp') {
      title = '📝 Form1.cs & Form1.Designer.cs (C# Code)';
      icon = <Code2 className="w-4 h-4 text-blue-400" />;
      width = 840;
      height = 540;
    } else if (type === 'python') {
      title = '🐍 main.py (CustomTkinter Python Exporter)';
      icon = <FileCode className="w-4 h-4 text-amber-400" />;
      width = 800;
      height = 500;
    } else if (type === 'terminal') {
      title = '📟 Interactive CLI Terminal Runtime';
      icon = <TerminalIcon className="w-4 h-4 text-emerald-400" />;
      width = 680;
      height = 420;
    } else if (type === 'projects') {
      title = '📁 Мои Проекты & VFS Explorer';
      icon = <Folder className="w-4 h-4 text-amber-400" />;
      width = 720;
      height = 460;
    } else if (type === 'settings') {
      title = '⚙️ Параметры DevOS & Обои Рабочего Стола';
      icon = <Settings className="w-4 h-4 text-purple-400" />;
      width = 600;
      height = 420;
    } else if (type === 'database') {
      title = '🗄 Visual Database Studio — "university_lab.db"';
      icon = <Database className="w-4 h-4 text-amber-400" />;
      width = 920;
      height = 580;
    } else if (type === 'nuget') {
      title = '📦 NuGet Package Manager — "MyLabApp.csproj"';
      icon = <Package className="w-4 h-4 text-blue-400" />;
      width = 880;
      height = 540;
    } else if (type === 'uml') {
      title = '📐 Visual UML Architecture Studio — "MyLabApp.csproj"';
      icon = <Compass className="w-4 h-4 text-purple-400" />;
      width = 920;
      height = 580;
    } else if (type === 'git') {
      title = '🐙 Isomorphic Git Control Center — "MyLabApp.git"';
      icon = <FolderGit2 className="w-4 h-4 text-emerald-400" />;
      width = 940;
      height = 580;
    } else if (type === 'network') {
      title = '🗔 DEV-OS: NETWORK & MULTIPLAYER CONTROL CENTER';
      icon = <Globe className="w-4 h-4 text-sky-400" />;
      width = 760;
      height = 540;
    } else if (type === 'resx') {
      title = '🌍 Roslyn .resx Resource & Localization Studio';
      icon = <Globe className="w-4 h-4 text-blue-400" />;
      width = 960;
      height = 600;
    } else if (type === 'regex') {
      title = '🧪 Roslyn Regex & Pattern Studio (FSM Analyzer)';
      icon = <Sparkles className="w-4 h-4 text-purple-400" />;
      width = 960;
      height = 600;
    } else if (type === 'metrics') {
      title = '📊 Roslyn Cyclomatic Complexity & Code Debt Studio';
      icon = <Activity className="w-4 h-4 text-emerald-400" />;
      width = 960;
      height = 600;
    }

    const newWin: DevOSWindow = {
      id: `window_${type}_${Date.now()}`,
      title,
      icon,
      x: 100 + (windows.length % 5) * 30,
      y: 60 + (windows.length % 5) * 30,
      width,
      height,
      isMinimized: false,
      isMaximized: false,
      zIndex: topZIndex + 1,
      type,
    };

    setTopZIndex((prev) => prev + 1);
    setWindows((prev) => [...prev, newWin]);
    setActiveWindowId(newWin.id);
  };

  // Toggle minimize
  const toggleMinimize = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: !w.isMinimized } : w))
    );
  };

  // Toggle maximize
  const toggleMaximize = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  // Close window (Keep-Alive DOM: minimize to hidden state instead of unmounting Canvas)
  const closeWindow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  };

  // Update window position
  const updateWindowPosition = (id: string, pos: WindowPosition) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x: pos.x, y: pos.y } : w))
    );
  };

  // Update window size
  const updateWindowSize = (id: string, size: WindowSize, pos?: WindowPosition) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            width: size.width,
            height: size.height,
            ...(pos ? { x: pos.x, y: pos.y } : {}),
          };
        }
        return w;
      })
    );
  };

  // Handle Desktop Right Click Context Menu
  const handleContextMenu = (e: React.MouseEvent) => {
    // Only open if target is desktop background
    const target = e.target as HTMLElement;
    if (target.closest('.devos-window') || target.closest('.devos-taskbar')) {
      return;
    }
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setStartMenuOpen(false);
  };

  // Close context menu on click elsewhere
  const handleGlobalClick = () => {
    if (contextMenuPos) setContextMenuPos(null);
    if (startMenuOpen) setStartMenuOpen(false);
  };

  // Wallpaper styles mapping
  const wallpaperClass = {
    win11: 'bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950',
    cyberpunk: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-gray-950 to-black',
    ubuntu: 'bg-gradient-to-br from-amber-950 via-purple-950 to-stone-950',
    vs_code: 'bg-zinc-950',
    retro: 'bg-[#008080]',
  }[wallpaper];

  return (
    <div
      onClick={handleGlobalClick}
      onContextMenu={handleContextMenu}
      className={`relative w-screen h-screen overflow-hidden select-none font-sans text-zinc-100 ${wallpaperClass}`}
    >
      {/* Decorative OS Wallpaper overlay grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      {/* 📁 DESKTOP SHORTCUTS (Ярлыки на рабочем столе) */}
      <div className="absolute top-6 left-6 grid grid-cols-1 gap-6 z-10 w-28">
        {/* Shortcut 1: Form Designer */}
        <div
          onDoubleClick={() => openAppWindow('designer')}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-blue-600/30 border border-blue-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <Layout className="w-7 h-7 text-blue-400 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            Дизайнер Форм
          </span>
        </div>

        {/* Shortcut 2: C# Code */}
        <div
          onDoubleClick={() => openAppWindow('csharp')}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-cyan-600/30 border border-cyan-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <Code2 className="w-7 h-7 text-cyan-400 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            Редактор C#
          </span>
        </div>

        {/* Shortcut 3: Python Studio */}
        <div
          onDoubleClick={() => openAppWindow('python')}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-amber-600/30 border border-amber-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <FileCode className="w-7 h-7 text-amber-400 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            Python Studio
          </span>
        </div>

        {/* Shortcut 4: Visual Database Studio */}
        <div
          onDoubleClick={() => openAppWindow('database')}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-amber-500/30 border border-amber-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <Database className="w-7 h-7 text-amber-400 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            База Данных
          </span>
        </div>

        {/* Shortcut 5: CLI Terminal */}
        <div
          onDoubleClick={() => openAppWindow('terminal')}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-emerald-600/30 border border-emerald-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <TerminalIcon className="w-7 h-7 text-emerald-400 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            Терминал CLI
          </span>
        </div>

        {/* Shortcut 5: My Projects */}
        <div
          onDoubleClick={() => openAppWindow('projects')}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-amber-500/30 border border-amber-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <Folder className="w-7 h-7 text-amber-300 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            Мои Проекты
          </span>
        </div>

        {/* Shortcut 6: NuGet Package Manager */}
        <div
          onDoubleClick={() => openAppWindow('nuget')}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-blue-600/30 border border-blue-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <Package className="w-7 h-7 text-blue-400 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            NuGet Пакеты
          </span>
        </div>

        {/* Shortcut 7: UML Architecture Studio */}
        <div
          onDoubleClick={() => openAppWindow('uml')}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-purple-600/30 border border-purple-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <Compass className="w-7 h-7 text-purple-300 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            UML Студия
          </span>
        </div>

        {/* Shortcut 8: Git Control Center */}
        <div
          onDoubleClick={() => openAppWindow('git')}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-emerald-600/30 border border-emerald-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <FolderGit2 className="w-7 h-7 text-emerald-300 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            Git Управление
          </span>
        </div>

        {/* Shortcut 9: Network Hub */}
        <div
          onDoubleClick={() => openAppWindow('network')}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-blue-500/30 border border-blue-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <Globe className="w-7 h-7 text-blue-400 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            Сеть и Комнаты
          </span>
        </div>

        {/* Shortcut 10: Build & Publish Standalone EXE */}
        <div
          onDoubleClick={() => setBuildWizardOpen(true)}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-amber-500/30 border border-amber-400/50 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform ring-1 ring-amber-400/30">
            <Rocket className="w-7 h-7 text-amber-300 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-amber-200 shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            Собрать .EXE
          </span>
        </div>

        {/* Shortcut 11: Storage Manager / Trash */}
        <div
          onDoubleClick={() => setStorageModalOpen(true)}
          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-center active:scale-95"
        >
          <div className="p-3 bg-red-600/30 border border-red-400/40 rounded-2xl shadow-xl backdrop-blur-md group-hover:scale-105 transition-transform">
            <Trash2 className="w-7 h-7 text-red-400 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white shadow-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] leading-tight">
            Сброс Кэша
          </span>
        </div>
      </div>

      {/* 🗔 MULTI-WINDOW CONTAINER */}
      <div className="absolute inset-0 pb-12 overflow-hidden pointer-events-none">
        {windows.map((win) => {
          if (win.isMinimized) return null;

          return (
            <SingleOSWindow
              key={win.id}
              windowState={win}
              isActive={activeWindowId === win.id}
              onFocus={() => bringToFront(win.id)}
              onMinimize={(e) => toggleMinimize(win.id, e)}
              onMaximize={(e) => toggleMaximize(win.id, e)}
              onClose={(e) => closeWindow(win.id, e)}
              onPositionChange={(pos) => updateWindowPosition(win.id, pos)}
              onSizeChange={(size, pos) => updateWindowSize(win.id, size, pos)}
            />
          );
        })}
      </div>

      {/* 🖱 RIGHT-CLICK DESKTOP CONTEXT MENU */}
      {contextMenuPos && (
        <div
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
          className="fixed z-[999999] bg-zinc-900/95 border border-zinc-700/90 rounded-xl shadow-2xl backdrop-blur-xl p-1.5 w-60 text-xs font-medium space-y-0.5 animate-in fade-in-50 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setGenesisModalOpen(true);
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-zinc-200 hover:bg-blue-600 hover:text-white rounded-lg transition-colors cursor-pointer text-left"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>➕ Создать новый проект</span>
          </button>

          <button
            type="button"
            onClick={() => {
              applySnapLayout('split-ide');
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-zinc-200 hover:bg-cyan-600 hover:text-white rounded-lg transition-colors cursor-pointer text-left"
          >
            <Layout className="w-4 h-4 text-cyan-400" />
            <span>🗔 Сетка Окон: Split IDE (50% | 25% | 25%)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              applySnapLayout('triple-view');
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-zinc-200 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer text-left"
          >
            <Square className="w-4 h-4 text-emerald-400" />
            <span>🗔 Сетка Окон: 3 Колонки (Triple View)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShareModalOpen(true);
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-zinc-200 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer text-left"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>🔗 Поделиться ссылкой (URL Hash)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openAppWindow('network');
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-zinc-200 hover:bg-blue-600 hover:text-white rounded-lg transition-colors cursor-pointer text-left"
          >
            <Globe className="w-4 h-4 text-sky-400" />
            <span>👥 Подключиться: Сеть и Комнаты</span>
          </button>

          <div className="h-px bg-zinc-800 my-1" />

          {/* Wallpaper submenu */}
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-500">
            🎨 Обои Рабочего Стола
          </div>
          <div className="grid grid-cols-2 gap-1 px-1">
            <button
              type="button"
              onClick={() => setWallpaper('win11')}
              className={`px-2 py-1.5 rounded text-[11px] font-semibold text-left transition-colors cursor-pointer ${
                wallpaper === 'win11' ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              Win11 Dark
            </button>
            <button
              type="button"
              onClick={() => setWallpaper('cyberpunk')}
              className={`px-2 py-1.5 rounded text-[11px] font-semibold text-left transition-colors cursor-pointer ${
                wallpaper === 'cyberpunk' ? 'bg-purple-600 text-white' : 'hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              Cyberpunk
            </button>
            <button
              type="button"
              onClick={() => setWallpaper('ubuntu')}
              className={`px-2 py-1.5 rounded text-[11px] font-semibold text-left transition-colors cursor-pointer ${
                wallpaper === 'ubuntu' ? 'bg-amber-600 text-white' : 'hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              Ubuntu
            </button>
            <button
              type="button"
              onClick={() => setWallpaper('retro')}
              className={`px-2 py-1.5 rounded text-[11px] font-semibold text-left transition-colors cursor-pointer ${
                wallpaper === 'retro' ? 'bg-teal-600 text-white' : 'hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              Win95 Retro
            </button>
          </div>

          <div className="h-px bg-zinc-800 my-1" />

          <button
            type="button"
            onClick={() => {
              setStorageModalOpen(true);
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors cursor-pointer text-left"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>🧹 Сбросить LocalStorage и кэш</span>
          </button>
        </div>
      )}

      {/* 🪟 START MENU POPUP */}
      {startMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-14 left-4 z-[99999] bg-zinc-900/95 border border-zinc-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl w-96 p-4 text-xs select-none animate-in slide-in-from-bottom-3 duration-150"
        >
          <div className="flex items-center gap-2 p-2 bg-zinc-950/80 border border-zinc-800 rounded-xl mb-3">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск приложений, файлов C# и настроек..."
              className="bg-transparent border-none text-zinc-200 placeholder-zinc-500 focus:outline-none w-full text-xs"
            />
          </div>

          <div className="text-[10px] uppercase font-bold text-zinc-500 px-1 mb-2">
            Приложения DevOS
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                openAppWindow('designer');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <Layout className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-bold text-white text-xs">Дизайнер</div>
                <div className="text-[10px] text-zinc-400">Визуальный UI C#</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('terminal');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <TerminalIcon className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-white text-xs">Терминал</div>
                <div className="text-[10px] text-zinc-400">dotnet / python CLI</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('csharp');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <Code2 className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-bold text-white text-xs">Редактор C#</div>
                <div className="text-[10px] text-zinc-400">Form1.cs код</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('python');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <FileCode className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-bold text-white text-xs">Python Exporter</div>
                <div className="text-[10px] text-zinc-400">CustomTkinter</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('database');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <Database className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-bold text-white text-xs">База Данных</div>
                <div className="text-[10px] text-zinc-400">SQLite WASM</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('nuget');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <Package className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-bold text-white text-xs">NuGet Менеджер</div>
                <div className="text-[10px] text-zinc-400">nuget.org В ОЗУ</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('uml');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <Compass className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-bold text-white text-xs">UML Студия</div>
                <div className="text-[10px] text-zinc-400">Class Diagram</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('git');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <FolderGit2 className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-white text-xs">Git Управление</div>
                <div className="text-[10px] text-zinc-400">GitHub / Commits</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('network');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <Globe className="w-5 h-5 text-sky-400" />
              <div>
                <div className="font-bold text-white text-xs">Сеть и Комнаты</div>
                <div className="text-[10px] text-zinc-400">P2P / LAN Сигналинг</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('resx');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <Globe className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-bold text-white text-xs">.resx Студия</div>
                <div className="text-[10px] text-zinc-400">Мультиязычность</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('regex');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-bold text-white text-xs">Regex Студия</div>
                <div className="text-[10px] text-zinc-400">FSM & Паттерны C#</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                openAppWindow('metrics');
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 text-left transition-all cursor-pointer"
            >
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-white text-xs">Метрики $V(G)$</div>
                <div className="text-[10px] text-zinc-400">McCabe / Техдолг</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setBuildWizardOpen(true);
                setStartMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-2.5 bg-amber-500/15 hover:bg-amber-500/25 rounded-xl border border-amber-500/40 text-left transition-all cursor-pointer col-span-2 shadow-sm"
            >
              <Rocket className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-bold text-amber-200 text-xs">🚀 Собрать .EXE (Мастер сборщика)</div>
                <div className="text-[10px] text-zinc-400">Single-File Self-Contained .NET 8 / Native AOT</div>
              </div>
            </button>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                DS
              </div>
              <div>
                <div className="font-bold text-white text-xs">{project.author || 'DevOS Student'}</div>
                <div className="text-[10px] text-zinc-400">{project.projectName || 'MyLabApp'}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setStorageModalOpen(true);
                setStartMenuOpen(false);
              }}
              title="Перезагрузка / Сброс"
              className="p-2 bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 rounded-lg transition-colors cursor-pointer"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ───── BOTTOM TASKBAR & SYSTEM TRAY ───── */}
      <footer className="devos-taskbar fixed bottom-0 left-0 right-0 h-11 bg-zinc-950/90 border-t border-zinc-800/80 backdrop-blur-xl z-[999990] px-3 flex items-center justify-between select-none">
        {/* Left: Start Button + Active Tasks */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* 🪟 Start Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setStartMenuOpen((prev) => !prev);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-lg active:scale-95 ${
              startMenuOpen
                ? 'bg-blue-600 text-white shadow-blue-500/20'
                : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
            }`}
          >
            <span className="text-base leading-none">🪟</span>
            <span>ПУСК</span>
          </button>

          {/* 🗔 Snap Layout Grid Preset Button */}
          <button
            type="button"
            onClick={() => applySnapLayout('split-ide')}
            title="Автоматическая раскладка окон: Дизайнер (50%), Код C# (25%), Терминал (25%)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/80 hover:bg-cyan-950/80 hover:text-cyan-300 text-zinc-300 rounded-xl text-xs font-semibold border border-zinc-700/60 hover:border-cyan-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Layout className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">🗔 Сетка Окон</span>
          </button>

          <div className="h-5 w-px bg-zinc-800 mx-1" />

          {/* Active Window Task Buttons */}
          {windows.map((win) => {
            const isFront = activeWindowId === win.id && !win.isMinimized;

            return (
              <button
                key={win.id}
                type="button"
                onClick={() => {
                  if (win.isMinimized) {
                    bringToFront(win.id);
                  } else if (activeWindowId === win.id) {
                    toggleMinimize(win.id);
                  } else {
                    bringToFront(win.id);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border max-w-[180px] truncate ${
                  isFront
                    ? 'bg-zinc-800 border-blue-500/80 text-white shadow-md ring-1 ring-blue-500/30'
                    : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-800 text-zinc-400'
                }`}
              >
                {win.icon}
                <span className="truncate text-[11px]">{win.title.split('—')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Right: System Tray & Clock */}
        <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-zinc-400">
          {/* Return to Standard IDE button if onExitDevOS provided */}
          {onExitDevOS && (
            <button
              type="button"
              onClick={onExitDevOS}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold rounded-lg border border-zinc-700 transition-colors cursor-pointer"
            >
               Exit DevOS
            </button>
          )}

          {/* Live Storage Memory Purge Badge */}
          <button
            type="button"
            onClick={() => setStorageModalOpen(true)}
            title="Кликните для меню очистки и сброса кэша"
            className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-500/50 rounded-lg transition-colors cursor-pointer text-amber-300"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold">{sizeKb} 🧹</span>
          </button>

          {/* FPS Meter */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-bold">{fps} FPS</span>
          </div>

          {/* Service Worker PWA status */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-400 text-[11px]">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>PWA OK</span>
          </div>

          {/* Clock */}
          <div className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 font-bold text-xs">
            {timeStr || '14:30'}
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <BuildPublishWizardModal
        isOpen={buildWizardOpen}
        onClose={() => setBuildWizardOpen(false)}
      />
      <GenesisWizardModal
        isOpen={genesisModalOpen}
        onClose={() => setGenesisModalOpen(false)}
      />
      <FormSynthesizerModal
        isOpen={synthesizerModalOpen}
        onClose={() => setSynthesizerModalOpen(false)}
      />
      <ShareProjectModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
      <StorageManagerModal
        isOpen={storageModalOpen}
        onClose={() => setStorageModalOpen(false)}
      />
    </div>
  );
};

// =========================================================================
// Single OS Window Component with Pointer Capture API Dragging & Resizing
// =========================================================================

interface SingleOSWindowProps {
  windowState: DevOSWindow;
  isActive: boolean;
  onFocus: () => void;
  onMinimize: (e: React.MouseEvent) => void;
  onMaximize: (e: React.MouseEvent) => void;
  onClose: (e: React.MouseEvent) => void;
  onPositionChange: (pos: WindowPosition) => void;
  onSizeChange: (size: WindowSize, pos?: WindowPosition) => void;
}

const SingleOSWindow: React.FC<SingleOSWindowProps> = ({
  windowState,
  isActive,
  onFocus,
  onMinimize,
  onMaximize,
  onClose,
  onPositionChange,
  onSizeChange,
}) => {
  const { setLiveRunOpen } = useDesigner();
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeBrRef = useRef<HTMLDivElement>(null);

  const dragControllerRef = useRef<WindowDragController>(new WindowDragController());

  const stateRef = useRef(windowState);
  stateRef.current = windowState;

  // Attach Pointer Capture to Window Header
  useEffect(() => {
    if (!headerRef.current) return;

    const cleanup = dragControllerRef.current.attachHeaderDrag(
      headerRef.current,
      (pos) => onPositionChange(pos),
      () => onFocus(),
      () => ({ x: stateRef.current.x, y: stateRef.current.y })
    );

    return cleanup;
  }, [onPositionChange, onFocus]);

  // Attach Pointer Capture to Bottom-Right Resize Handle
  useEffect(() => {
    if (!resizeBrRef.current) return;

    const cleanup = dragControllerRef.current.attachResizeHandle(
      resizeBrRef.current,
      'br',
      (size, pos) => onSizeChange(size, pos),
      () => ({ width: stateRef.current.width, height: stateRef.current.height }),
      () => ({ x: stateRef.current.x, y: stateRef.current.y })
    );

    return cleanup;
  }, [onSizeChange]);

  const style: React.CSSProperties = windowState.isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: 'calc(100vh - 48px)',
        zIndex: windowState.zIndex,
        display: windowState.isMinimized ? 'none' : 'flex',
      }
    : {
        position: 'absolute',
        top: windowState.y,
        left: windowState.x,
        width: windowState.width,
        height: windowState.height,
        zIndex: windowState.zIndex,
        display: windowState.isMinimized ? 'none' : 'flex',
      };

  return (
    <div
      onClick={onFocus}
      style={style}
      className={`devos-window pointer-events-auto rounded-2xl overflow-hidden flex flex-col shadow-2xl border transition-shadow duration-150 ${
        isActive
          ? 'border-blue-500/80 ring-2 ring-blue-500/30 bg-zinc-900 shadow-blue-950/50'
          : 'border-zinc-700/80 bg-zinc-900/95 opacity-95'
      }`}
    >
      {/* ── WINDOW TITLE BAR (DRAGGABLE VIA POINTER CAPTURE) ── */}
      <div
        ref={headerRef}
        onPointerDown={(e) => e.stopPropagation()}
        className={`px-3.5 py-2.5 border-b select-none flex items-center justify-between cursor-grab active:cursor-grabbing touch-none ${
          isActive ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-950/80 border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {windowState.icon}
          <span className="text-xs font-bold text-white truncate">{windowState.title}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          {/* Run button shortcut if designer */}
          {windowState.type === 'designer' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLiveRunOpen(true);
              }}
              title="Запустить форму (F5)"
              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] flex items-center gap-1 mr-2 cursor-pointer transition-colors"
            >
              <span>▶ RUN (F5)</span>
            </button>
          )}

          {/* Minimize */}
          <button
            type="button"
            onClick={onMinimize}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize */}
          <button
            type="button"
            onClick={onMaximize}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <Square className="w-3 h-3" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-red-600 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── WINDOW INNER CONTENT BODY WITH CRASH-GUARD ISOLATION ── */}
      <div className="flex-1 overflow-hidden relative bg-zinc-950">
        <WindowErrorBoundary title={windowState.title}>
          {windowState.type === 'designer' && (
            <div className="w-full h-full flex overflow-hidden">
              <LeftSidebar />
              <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">
                <div className="flex-1 relative overflow-hidden">
                  <DesignSurface />
                </div>
              </main>
              <RightSidebar />
            </div>
          )}

          {windowState.type === 'csharp' && (
            <div className="w-full h-full flex flex-col">
              <CodePreviewPanel />
            </div>
          )}

          {windowState.type === 'python' && (
            <div className="w-full h-full flex flex-col p-4 bg-zinc-950 font-mono text-xs overflow-y-auto">
              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl mb-3 text-amber-300">
                🐍 Python Studio (CustomTkinter Auto-Generated Code)
              </div>
              <pre className="text-amber-200/90 leading-relaxed">
{`import customtkinter as ctk

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("${stateRef.current.title}")
        self.geometry("800x600")

        # Visual controls generated automatically from Designer AST
        self.button = ctk.CTkButton(self, text="Нажмите здесь", command=self.on_click)
        self.button.pack(padx=20, pady=20)

    def on_click(self):
        print("Button Clicked!")

if __name__ == "__main__":
    app = App()
    app.mainloop()`}
              </pre>
            </div>
          )}

          {windowState.type === 'terminal' && <DevOSTerminal />}

          {windowState.type === 'database' && <DevOSDatabaseStudio />}

          {windowState.type === 'nuget' && <DevOSNuGetStudio />}

          {windowState.type === 'uml' && <DevOSUMLStudio />}

          {windowState.type === 'git' && <DevOSGitStudio />}

          {windowState.type === 'network' && <DevOSNetworkHub />}

          {windowState.type === 'resx' && (
            <DevOSResxWindowContent />
          )}

          {windowState.type === 'regex' && (
            <DevOSRegexWindowContent />
          )}

          {windowState.type === 'metrics' && (
            <DevOSMetricsWindowContent />
          )}

          {windowState.type === 'projects' && (
            <div className="p-5 text-xs space-y-3">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">📁 Проект: MyLabApp.csproj</div>
                  <div className="text-zinc-400 text-[11px]">Локальное VFS хранилище IndexedDB</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg font-bold">
                  ● ACTIVE
                </span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Все файлы формы (`Form1.cs`, `Form1.Designer.cs`, `Program.cs`) синхронизированы в реальном времени с AST деревом.
              </p>
            </div>
          )}

          {windowState.type === 'settings' && (
            <div className="p-5 text-xs space-y-4">
              <h3 className="font-bold text-sm text-white">⚙️ Параметры DevOS</h3>
              <p className="text-zinc-400">Настройки виртуальной операционной системы и тема оформления.</p>
            </div>
          )}
        </WindowErrorBoundary>
      </div>

      {/* Resize handle (Bottom Right) */}
      {!windowState.isMaximized && (
        <div
          ref={resizeBrRef}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-60 hover:opacity-100 z-50 touch-none"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-zinc-400" />
        </div>
      )}
    </div>
  );
};

// =========================================================================
// DevOS Pro-IDE Embedded Window Components
// =========================================================================

const DevOSResxWindowContent: React.FC = () => {
  const { project, setProjectState, addConsoleLog } = useDesigner();
  const [resources, setResources] = useState<ResxResourceEntry[]>(() =>
    ResxLocalizationEngine.extractFromProject(project)
  );
  const [activeCulture, setActiveCulture] = useState<string>('ru-RU');

  const handleApplyToCanvas = (culture: string) => {
    const updatedNodes = ResxLocalizationEngine.applyLocalizationToNodes(
      project.nodes,
      resources,
      culture
    );
    setProjectState({ ...project, nodes: updatedNodes });
    addConsoleLog('System', `Локаль '${culture}' применена к элементам на холсте.`);
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 p-4 text-xs font-sans text-zinc-200 overflow-y-auto space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-white">Редактор строк .resx ({resources.length} ключей)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-[11px]">Локаль предпросмотра:</span>
          <select
            value={activeCulture}
            onChange={(e) => {
              setActiveCulture(e.target.value);
              handleApplyToCanvas(e.target.value);
            }}
            className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded px-2 py-1"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-800/80 text-zinc-400 uppercase text-[10px]">
            <tr>
              <th className="p-2.5">Ключ ресурса</th>
              <th className="p-2.5">Default (en-US)</th>
              <th className="p-2.5">Русский (ru-RU)</th>
              <th className="p-2.5">Deutsch (de-DE)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {resources.map((res) => (
              <tr key={res.id} className="hover:bg-zinc-800/40">
                <td className="p-2.5 font-mono font-bold text-blue-300">{res.key}</td>
                <td className="p-2 text-zinc-300">{res.values['default'] || ''}</td>
                <td className="p-2 text-emerald-300">{res.values['ru-RU'] || ''}</td>
                <td className="p-2 text-amber-300">{res.values['de-DE'] || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DevOSRegexWindowContent: React.FC = () => {
  const [pattern, setPattern] = useState('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
  const [inputSample, setInputSample] = useState('alice@company.com, invalid-email@, lead@dev.org');
  const analysis = RegexPatternStudioEngine.evaluate(pattern, inputSample, 'g', '[EMAIL]');

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 p-4 text-xs font-sans text-zinc-200 overflow-y-auto space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-white">Visual Regex & Pattern Studio</span>
        </div>
        <span className="text-[11px] font-mono text-purple-300">
          Совпадений: {analysis.matchCount} ({analysis.executionTimeMs}ms)
        </span>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] text-zinc-400 font-semibold">Регулярное выражение (Pattern):</label>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="w-full bg-zinc-900 border border-purple-500/40 rounded px-3 py-1.5 text-xs font-mono text-purple-200 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] text-zinc-400 font-semibold">Тестовый текст:</label>
        <textarea
          value={inputSample}
          onChange={(e) => setInputSample(e.target.value)}
          rows={4}
          className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none"
        />
      </div>

      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-1">
        <span className="text-[11px] font-bold text-indigo-300">Сгенерированный C# Regex:</span>
        <pre className="text-[11px] font-mono text-purple-300 overflow-x-auto">
          {analysis.csharpSnippet}
        </pre>
      </div>
    </div>
  );
};

const DevOSMetricsWindowContent: React.FC = () => {
  const { project } = useDesigner();
  const code = useMemo(() => generateCodeBehindCs(project), [project]);
  const metrics = useMemo(() => RoslynCodeMetrics.analyzeCode(code), [code]);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 p-4 text-xs font-sans text-zinc-200 overflow-y-auto space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white">Roslyn Cyclomatic Metrics & Debt</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
          MI: {metrics.overallMaintainabilityIndex}/100
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block">Avg Cyclomatic V(G)</span>
          <span className="text-lg font-bold font-mono text-indigo-400">{metrics.averageCyclomaticComplexity}</span>
        </div>
        <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block">Lines of Code (LOC)</span>
          <span className="text-lg font-bold font-mono text-cyan-400">{metrics.totalLinesOfCode}</span>
        </div>
        <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
          <span className="text-[10px] text-zinc-400 block">Техдолг (Refactor Time)</span>
          <span className="text-lg font-bold font-mono text-amber-400">{metrics.technicalDebtMinutes} мин</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-zinc-300">Методы решения:</span>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {metrics.methods.map((m) => (
            <div
              key={m.name}
              className="p-2 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-between font-mono"
            >
              <span className="text-white font-bold">{m.name}</span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-indigo-400">$V(G) = {m.cyclomaticComplexity}</span>
                <span className="text-zinc-500">|</span>
                <span className="text-emerald-400">MI: {m.maintainabilityIndex}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
