import React from 'react';
import { AppWindow, useMasterEngineStore } from '../../store/useMasterEngineStore';
import { Minus, X } from 'lucide-react';

interface DevOSWindowProps {
  app: AppWindow;
  children: React.ReactNode;
}

export const DevOSWindow: React.FC<DevOSWindowProps> = ({ app, children }) => {
  const { focusWindow, closeWindow, minimizeWindow } = useMasterEngineStore();

  if (!app || !app.isOpen || app.isMinimized) return null;

  return (
    <div
      onMouseDown={() => focusWindow(app.id)}
      style={{
        position: 'absolute',
        left: `${app.bounds.x}px`,
        top: `${app.bounds.y}px`,
        width: app.isMaximized ? '100%' : `${app.bounds.width}px`,
        height: app.isMaximized ? '100%' : `${app.bounds.height}px`,
        zIndex: app.zIndex,
      }}
      className="bg-[#141419] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-300 font-sans select-none animate-in fade-in duration-100"
    >
      {/* DevOS Window Titlebar */}
      <div className="h-10 bg-[#1c1c24] border-b border-zinc-800 px-4 flex justify-between items-center shrink-0 cursor-move">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>{app.title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(app.id);
            }}
            className="p-1 hover:text-white hover:bg-zinc-800 rounded transition cursor-pointer"
            title="Свернуть"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(app.id);
            }}
            className="p-1 hover:text-white hover:bg-rose-900/60 rounded transition cursor-pointer"
            title="Закрыть"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* DevOS Window Content */}
      <div className="flex-1 overflow-hidden relative">{children}</div>
    </div>
  );
};
