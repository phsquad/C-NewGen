import React, { useState } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  MousePointer,
  Grid,
  Magnet,
  Monitor,
  ChevronDown,
  Plus,
  Layers,
  AppWindow,
  Check,
  Zap,
} from 'lucide-react';
import { OSFrameTheme, GridStep, DesignerNode } from '../../types/ast';
import { DpiMode, DPI_PROFILES } from '../../utils/dpiNormalizer';

interface ViewportHudProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (val: number) => void;
  onFitToScreen: () => void;
  onResetOneToOne: () => void;
  isPanMode: boolean;
  onTogglePanMode: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  gridStep: GridStep;
  onGridStepChange: (step: GridStep) => void;
  globalTheme: OSFrameTheme;
  onThemeChange: (theme: OSFrameTheme) => void;
  activeDpiMode: DpiMode;
  onDpiChange: (mode: DpiMode) => void;
  allForms: DesignerNode[];
  activeForm: DesignerNode | null;
  onSelectForm: (id: string) => void;
  onAddForm: () => void;
}

export const ViewportHud: React.FC<ViewportHudProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onFitToScreen,
  onResetOneToOne,
  isPanMode,
  onTogglePanMode,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  gridStep,
  onGridStepChange,
  globalTheme,
  onThemeChange,
  activeDpiMode,
  onDpiChange,
  allForms,
  activeForm,
  onSelectForm,
  onAddForm,
}) => {
  const percentage = Math.round(scale * 100);
  const [gridMenuOpen, setGridMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);

  const {
    showWiring,
    toggleShowWiring,
    xrayMode,
    toggleXrayMode,
    morphicMode,
    toggleMorphicMode,
  } = useDesigner();

  const themeLabels: Record<OSFrameTheme, { label: string; icon: string }> = {
    Win11Mica: { label: 'Win11', icon: '🪟' },
    Win32Classic: { label: 'Win32', icon: '🖥️' },
    LinuxGTK: { label: 'Linux', icon: '🐧' },
  };

  return (
    <div className="canvas-floating-hud text-zinc-300">
      {/* 1. Pointer vs Pan Mode Switch */}
      <div className="flex items-center bg-zinc-900/60 border border-zinc-800/80 rounded-full p-0.5">
        <button
          type="button"
          onClick={() => isPanMode && onTogglePanMode()}
          title="Режим выделения (V)"
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            !isPanMode ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => !isPanMode && onTogglePanMode()}
          title="Режим панорамы (H / Пробел)"
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            isPanMode ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-zinc-700/60" />

      {/* 2. Grid Steps selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setGridMenuOpen(!gridMenuOpen)}
          className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 rounded-lg cursor-pointer transition"
          title="Выбор шага сетки"
        >
          <Grid className="w-3 h-3 text-blue-400" />
          <span>{gridStep}px</span>
          <ChevronDown className="w-2.5 h-2.5 text-zinc-500" />
        </button>

        {gridMenuOpen && (
          <div className="absolute top-full left-0 mt-2 w-36 bg-zinc-950 border border-zinc-850 rounded-xl shadow-2xl py-1 z-50 text-[11px] font-mono">
            {([4, 8, 16] as GridStep[]).map(step => (
              <button
                key={step}
                type="button"
                onClick={() => {
                  onGridStepChange(step);
                  setGridMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 hover:bg-zinc-800/60 flex items-center justify-between ${
                  gridStep === step ? 'text-blue-400 font-bold' : 'text-zinc-300'
                }`}
              >
                <span>{step}×{step} px</span>
                {gridStep === step && <Check className="w-3 h-3 text-blue-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Snap Toggle: [ 🧲 Прилипание ] */}
      <button
        type="button"
        onClick={onToggleSnap}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition ${
          snapToGrid
            ? 'bg-blue-600/15 border-blue-500/30 text-blue-400'
            : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:text-zinc-300'
        }`}
        title="Включение привязки к сетке"
      >
        <Magnet className="w-3 h-3" />
        <span>Прилипание</span>
      </button>

      <div className="h-4 w-px bg-zinc-700/60" />

      {/* 4. OS Skin Switcher */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setThemeMenuOpen(!themeMenuOpen)}
          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 rounded-lg cursor-pointer transition"
          title="Скин операционной системы"
        >
          <span>{themeLabels[globalTheme]?.icon || '🪟'}</span>
          <span>{themeLabels[globalTheme]?.label}</span>
          <ChevronDown className="w-2.5 h-2.5 text-zinc-500" />
        </button>

        {themeMenuOpen && (
          <div className="absolute top-full left-0 mt-2 w-32 bg-zinc-950 border border-zinc-850 rounded-xl shadow-2xl py-1 z-50 text-[11px]">
            {(['Win11Mica', 'Win32Classic', 'LinuxGTK'] as OSFrameTheme[]).map(key => {
              const th = themeLabels[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onThemeChange(key);
                    setThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 hover:bg-zinc-800/60 flex items-center gap-1.5 ${
                    globalTheme === key ? 'text-blue-400 font-bold' : 'text-zinc-300'
                  }`}
                >
                  <span>{th.icon}</span>
                  <span>{th.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-zinc-700/60" />

      {/* 5. 🌟 5 Next-Gen Mechanics Quick Toggles */}
      <div className="flex items-center gap-1">
        {/* ⚡️ Нити данных */}
        <button
          type="button"
          onClick={toggleShowWiring}
          className={`p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition flex items-center gap-1 ${
            showWiring
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
              : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:text-zinc-300'
          }`}
          title="⚡️ Интерактивные нити данных (Visual Signal-Wiring)"
        >
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">Нити</span>
        </button>

        {/* 🩻 2.5D X-Ray */}
        <button
          type="button"
          onClick={toggleXrayMode}
          className={`px-2 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition flex items-center gap-1 ${
            xrayMode
              ? 'bg-cyan-600/25 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/30 animate-pulse'
              : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:text-zinc-300'
          }`}
          title="🩻 2.5D X-Ray Изометрический просмотр скрытых слоев и вкладок"
        >
          <span>🩻</span>
          <span className="hidden sm:inline">2.5D</span>
        </button>

        {/* 🧬 Morphic Layout */}
        <button
          type="button"
          onClick={toggleMorphicMode}
          className={`px-2 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition flex items-center gap-1 ${
            morphicMode === 'adaptive'
              ? 'bg-emerald-600/20 border-emerald-400/50 text-emerald-300'
              : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:text-zinc-300'
          }`}
          title="🧬 Морфинг: Пиксели WinForms ⟷ Адаптивная Сетка (Flex/Grid)"
        >
          <span>🧬</span>
          <span className="hidden sm:inline">{morphicMode === 'adaptive' ? 'Сетка' : 'Пикс'}</span>
        </button>
      </div>

      <div className="h-4 w-px bg-zinc-700/60" />

      {/* 6. Zoom & Fit Screen */}
      <div className="flex items-center gap-1 font-mono text-[11px]">
        <button
          type="button"
          onClick={onZoomOut}
          className="p-1 hover:text-white text-zinc-400 transition cursor-pointer"
          title="Уменьшить масштаб"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => setZoomMenuOpen(!zoomMenuOpen)}
          className="w-10 text-center font-bold hover:text-white transition cursor-pointer"
          title="Управление масштабом"
        >
          {percentage}%
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          className="p-1 hover:text-white text-zinc-400 transition cursor-pointer"
          title="Увеличить масштаб"
        >
          <ZoomIn className="w-3 h-3" />
        </button>

        {zoomMenuOpen && (
          <div className="absolute top-full right-10 mt-2 w-24 bg-zinc-950 border border-zinc-850 rounded-xl shadow-2xl py-1 z-50 text-[11px]">
            {[50, 75, 100, 150, 200].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  onZoomChange(val / 100);
                  setZoomMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 hover:bg-zinc-800/60 ${
                  percentage === val ? 'text-blue-400 font-bold' : 'text-zinc-300'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fit / Center Viewport Button */}
      <button
        type="button"
        onClick={onFitToScreen}
        className="flex items-center justify-center p-1.5 bg-zinc-900/60 hover:bg-zinc-800/80 text-blue-400 border border-zinc-800/60 rounded-full cursor-pointer transition ml-1"
        title="Вписать / Центрировать холст"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      {/* ➕ Form quick button */}
      <button
        type="button"
        onClick={onAddForm}
        className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 hover:scale-102 text-white font-bold text-[10px] rounded-full cursor-pointer transition ml-1 shadow-md shadow-blue-600/10"
        title="Добавить форму"
      >
        <Plus className="w-3 h-3" />
        <span>Форма</span>
      </button>
    </div>
  );
};
