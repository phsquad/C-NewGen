import React from 'react';
import { DesignerNode, OSFrameTheme } from '../../types/ast';
import {
  AppWindow,
  Minus,
  Square,
  X,
  Crosshair,
  Maximize2,
  Terminal,
} from 'lucide-react';

interface FormWindowShellProps {
  form: DesignerNode;
  isActive: boolean;
  isEmulatorMode: boolean;
  theme: OSFrameTheme;
  zIndex?: number;
  onSelectForm: () => void;
  onStartMove: (e: React.MouseEvent) => void;
  onStartResize: (e: React.MouseEvent) => void;
  onCloseForm?: () => void;
  renderChildren: () => React.ReactNode;
}

export const FormWindowShell: React.FC<FormWindowShellProps> = ({
  form,
  isActive,
  isEmulatorMode,
  theme,
  zIndex,
  onSelectForm,
  onStartMove,
  onStartResize,
  onCloseForm,
  renderChildren,
}) => {
  const isMainWindow = form.properties.customProps?.isMainWindow !== false;

  // Render Theme Styles with Zero-Overhead CSS (Pravka 2.5) & Form Focus Arbiter (Pravka 2.6)
  return (
    <div
      data-node-id={form.id}
      onClick={e => {
        e.stopPropagation();
        onSelectForm();
      }}
      style={{
        position: 'absolute',
        left: `${form.bounds.x}px`,
        top: `${form.bounds.y}px`,
        width: `${form.bounds.width}px`,
        minHeight: `${form.bounds.height}px`,
        zIndex: zIndex ?? (isActive ? 40 : 15),
        transition: 'box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), ring-color 0.2s ease',
      }}
      className={`select-none ${
        theme === 'Win11Mica'
          ? `rounded-lg ${
              isActive
                ? 'ring-2 ring-blue-500 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(59,130,246,0.25)]'
                : 'border border-zinc-700/60 shadow-xl opacity-90 hover:opacity-100'
            }`
          : theme === 'Win32Classic'
          ? `rounded-none border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#000000] border-b-[#000000] shadow-2xl ${
              isActive ? 'ring-2 ring-blue-600/80 shadow-[0_15px_30px_rgba(0,0,0,0.5)]' : 'opacity-90 hover:opacity-100'
            }`
          : `rounded-md border border-[#1e1e1e] ${
              isActive
                ? 'ring-2 ring-orange-500 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_20px_rgba(233,84,32,0.25)]'
                : 'shadow-xl opacity-90 hover:opacity-100'
            }`
      }`}
    >
      {/* 1. TITLEBAR DEPENDING ON OS THEME */}
      {theme === 'Win11Mica' && (
        <div
          onMouseDown={e => {
            if (isEmulatorMode) return;
            e.stopPropagation();
            onSelectForm();
            onStartMove(e);
          }}
          className={`h-9 px-3 rounded-t-lg flex items-center justify-between transition-colors border-b select-none ${
            isEmulatorMode
              ? 'bg-zinc-800 border-emerald-500/50 cursor-default'
              : isActive
              ? 'bg-zinc-800 border-zinc-700 cursor-move'
              : 'bg-zinc-850/90 border-zinc-800 text-zinc-400 cursor-move'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-100 truncate">
            <AppWindow className={`w-3.5 h-3.5 shrink-0 ${isEmulatorMode ? 'text-emerald-400' : 'text-blue-400'}`} />
            <span className="truncate max-w-[220px]">
              {form.properties.text || form.properties.name}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 font-normal">
              ({form.properties.name})
            </span>
            {isEmulatorMode && isActive && (
              <span className="ml-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-zinc-400">
            <div className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer">
              <Minus className="w-3 h-3" />
            </div>
            <div className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer">
              <Square className="w-2.5 h-2.5" />
            </div>
            <div
              onClick={e => {
                e.stopPropagation();
                if (onCloseForm) onCloseForm();
              }}
              title="Закрыть окно"
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}

      {theme === 'Win32Classic' && (
        <div
          onMouseDown={e => {
            if (isEmulatorMode) return;
            e.stopPropagation();
            onSelectForm();
            onStartMove(e);
          }}
          className={`h-7 px-2 flex items-center justify-between select-none ${
            isEmulatorMode
              ? 'bg-gradient-to-r from-emerald-800 to-emerald-600 text-white cursor-default'
              : isActive
              ? 'bg-gradient-to-r from-[#0a246a] to-[#a6caf0] text-white cursor-move'
              : 'bg-gradient-to-r from-[#808080] to-[#c0c0c0] text-[#dfdfdf] cursor-move'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold font-sans truncate">
            <div className="w-3 h-3 bg-white/20 border border-white/40 flex items-center justify-center text-[8px]">
              🗔
            </div>
            <span className="truncate">{form.properties.text || form.properties.name}</span>
            <span className="text-[10px] opacity-75 font-normal">[{form.properties.name}]</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-[#c0c0c0] border border-t-[#ffffff] border-l-[#ffffff] border-r-[#000000] border-b-[#000000] text-black text-[9px] flex items-center justify-center font-bold cursor-pointer">
              _
            </div>
            <div className="w-4 h-4 bg-[#c0c0c0] border border-t-[#ffffff] border-l-[#ffffff] border-r-[#000000] border-b-[#000000] text-black text-[9px] flex items-center justify-center font-bold cursor-pointer">
              □
            </div>
            <div
              onClick={e => {
                e.stopPropagation();
                if (onCloseForm) onCloseForm();
              }}
              className="w-4 h-4 bg-[#c0c0c0] border border-t-[#ffffff] border-l-[#ffffff] border-r-[#000000] border-b-[#000000] text-black text-[9px] flex items-center justify-center font-bold cursor-pointer"
            >
              ✕
            </div>
          </div>
        </div>
      )}

      {theme === 'LinuxGTK' && (
        <div
          onMouseDown={e => {
            if (isEmulatorMode) return;
            e.stopPropagation();
            onSelectForm();
            onStartMove(e);
          }}
          className={`h-9 px-3 rounded-t-md flex items-center justify-between border-b select-none ${
            isEmulatorMode
              ? 'bg-[#1e1e1e] border-emerald-500/50 cursor-default'
              : isActive
              ? 'bg-[#242424] border-[#181818] cursor-move'
              : 'bg-[#2b2b2b] border-[#181818] text-zinc-400 cursor-move'
          }`}
        >
          {/* Ubuntu Yaru Left Window Dots */}
          <div className="flex items-center gap-2">
            <div
              onClick={e => {
                e.stopPropagation();
                if (onCloseForm) onCloseForm();
              }}
              title="Закрыть"
              className="w-3 h-3 rounded-full bg-[#E95420] hover:brightness-110 flex items-center justify-center text-[7px] text-white opacity-90 cursor-pointer"
            >
              ✕
            </div>
            <div title="Свернуть" className="w-3 h-3 rounded-full bg-[#5E2750] hover:brightness-110 cursor-pointer" />
            <div title="Развернуть" className="w-3 h-3 rounded-full bg-[#77216F] hover:brightness-110 cursor-pointer" />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200 truncate">
            <span className="truncate">{form.properties.text || form.properties.name}</span>
            <span className="text-[10px] font-mono text-orange-400">({form.properties.name})</span>
          </div>

          <div className="w-12 text-right text-[10px] font-mono text-zinc-500">
            GTK
          </div>
        </div>
      )}

      {/* 2. FORM CLIENT RECTANGLE SURFACE */}
      <div
        style={{
          width: `${form.bounds.width}px`,
          height: `${form.bounds.height}px`,
          backgroundColor: form.properties.backColor || (theme === 'Win32Classic' ? '#c0c0c0' : '#F8FAFC'),
        }}
        className={`relative overflow-hidden ${
          theme === 'Win11Mica' ? 'rounded-b-lg' : theme === 'LinuxGTK' ? 'rounded-b-md' : 'rounded-none'
        }`}
      >
        {/* (0, 0) Internal Zero Coordinate Marker (Pravka 2.4: Local Form Coordinate Scoping) */}
        {!isEmulatorMode && (
          <div
            className="absolute top-1 left-1 flex items-center gap-1 text-[9px] font-mono text-zinc-500 select-none pointer-events-none opacity-70 hover:opacity-100 transition-opacity z-30 bg-white/80 dark:bg-zinc-900/85 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700/80 shadow-xs"
            title="Локальная нулевая точка клиентской области (Local Space X=0, Y=0). Координаты контролов внутри формы изолированы и рассчитываются строго от этого угла."
          >
            <Crosshair className="w-2.5 h-2.5 text-blue-500" />
            <span>(0, 0) Local: {form.properties.name}</span>
          </div>
        )}

        {/* Children Controls */}
        {renderChildren()}

        {/* ClientRectangle Readout in Bottom-Right */}
        {!isEmulatorMode && (
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-zinc-400 select-none pointer-events-none opacity-60 bg-white/70 dark:bg-zinc-900/70 px-1.5 py-0.5 rounded-xs z-30">
            ({form.bounds.width} × {form.bounds.height} px)
          </div>
        )}
      </div>

      {/* 3. RESIZE GRIP IN BOTTOM-RIGHT CORNER */}
      {!isEmulatorMode && isActive && (
        <div
          onMouseDown={e => {
            e.stopPropagation();
            onStartResize(e);
          }}
          className={`absolute -bottom-2 -right-2 w-4 h-4 rounded-xs cursor-nwse-resize flex items-center justify-center text-white shadow-sm z-50 transition-colors ${
            theme === 'Win32Classic'
              ? 'bg-[#808080] hover:bg-[#0a246a]'
              : theme === 'LinuxGTK'
              ? 'bg-[#E95420] hover:bg-orange-600'
              : 'bg-zinc-700 hover:bg-blue-600'
          }`}
          title="Изменить размер окна (ClientSize)"
        >
          <Maximize2 className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
};
