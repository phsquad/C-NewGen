import React, { useState } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowLeftRight,
  ArrowUpDown,
  Maximize2,
  Lock,
  Unlock,
  Hash,
  Sparkles,
  Code2,
  Layers,
  ChevronRight,
  AppWindow,
  FolderTree,
  Check,
  BringToFront,
  SendToBack,
  Search,
} from 'lucide-react';

interface DesignerFormatToolbarProps {
  onOpenCommandPalette?: () => void;
}

export const DesignerFormatToolbar: React.FC<DesignerFormatToolbarProps> = ({
  onOpenCommandPalette,
}) => {
  const {
    project,
    nodes,
    selectedNodes,
    selectedNode,
    selectNode,
    activeFormId,
    setActiveFormId,
    getAllForms,
    alignSelectedNodes,
    updateMultipleNodeBounds,
    updateMultipleNodesProperties,
    codeDockOpen,
    setCodeDockOpen,
    isTabOrderMode,
    setTabOrderMode,
    gridStep,
    undo,
    redo,
    bringNodeToFront,
    sendNodeToBack,
  } = useDesigner();

  const [formDropdownOpen, setFormDropdownOpen] = useState(false);
  const [controlDropdownOpen, setControlDropdownOpen] = useState(false);

  const allForms = getAllForms();
  const currentForm =
    (activeFormId && nodes[activeFormId]) ||
    nodes[project.rootFormId] ||
    allForms[0];

  const currentFormChildren = (currentForm?.childrenIds || [])
    .map(id => nodes[id])
    .filter(Boolean);

  const nonFormSelected = selectedNodes.filter(n => n.type !== 'Form');
  const hasSelection = nonFormSelected.length > 0;
  const isMultiSelection = nonFormSelected.length >= 2;

  // Check if all selected controls are locked
  const allLocked =
    hasSelection && nonFormSelected.every(n => n.properties.locked);

  const toggleLockSelected = () => {
    if (!hasSelection) return;
    const newLocked = !allLocked;
    const ids = nonFormSelected.map(n => n.id);
    updateMultipleNodesProperties(ids, { locked: newLocked }, true);
  };

  const handleBeautify = () => {
    if (!currentForm || !currentForm.childrenIds) return;
    const step = gridStep || 8;
    const updates: Record<string, any> = {};
    currentFormChildren.forEach(child => {
      if (child.properties.locked) return;
      const nx = Math.round(child.bounds.x / step) * step;
      const ny = Math.round(child.bounds.y / step) * step;
      const nw = Math.max(step * 2, Math.round(child.bounds.width / step) * step);
      const nh = Math.max(step * 2, Math.round(child.bounds.height / step) * step);
      updates[child.id] = { x: nx, y: ny, width: nw, height: nh };
    });
    updateMultipleNodeBounds(updates, true);
  };

  return (
    <div className="h-9 bg-zinc-900/95 border-b border-zinc-800 px-3 flex items-center justify-between text-xs select-none z-30 shrink-0 shadow-xs backdrop-blur-md">
      {/* Left: Visual Studio Standard Breadcrumb Trail */}
      <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px] overflow-hidden truncate">
        {/* Solution Breadcrumb */}
        <span className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition cursor-default">
          <FolderTree className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">{project.projectName || 'WinFormsApp1'}</span>
        </span>

        <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />

        {/* Form Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFormDropdownOpen(!formDropdownOpen)}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold px-1.5 py-0.5 rounded hover:bg-zinc-800 transition cursor-pointer"
            title="Выбрать активную форму"
          >
            <AppWindow className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate max-w-[120px]">{currentForm?.properties.name || 'Form1'}.cs</span>
            <span className="text-[10px] text-zinc-500 font-sans">[Design]</span>
          </button>

          {formDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl py-1 z-50 text-[11px]">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-850">
                Формы в решении ({allForms.length})
              </div>
              {allForms.map(form => (
                <button
                  key={form.id}
                  type="button"
                  onClick={() => {
                    setActiveFormId(form.id);
                    selectNode(form.id);
                    setFormDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 flex items-center justify-between transition cursor-pointer ${
                    currentForm?.id === form.id ? 'text-blue-400 font-bold bg-blue-950/30' : 'text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <AppWindow className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>{form.properties.name}</span>
                  </span>
                  {currentForm?.id === form.id && <Check className="w-3 h-3 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Control Breadcrumb */}
        {selectedNode && selectedNode.type !== 'Form' && (
          <>
            <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setControlDropdownOpen(!controlDropdownOpen)}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium px-1.5 py-0.5 rounded hover:bg-zinc-800 transition cursor-pointer truncate max-w-[150px]"
                title="Перейти к контролу в форме"
              >
                <span>{selectedNode.properties.name}</span>
                <span className="text-[10px] text-zinc-500 font-normal">({selectedNode.type})</span>
              </button>

              {controlDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 max-h-64 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl py-1 z-50 text-[11px]">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-850">
                    Элементы на {currentForm?.properties.name} ({currentFormChildren.length})
                  </div>
                  {currentFormChildren.map(ctrl => (
                    <button
                      key={ctrl.id}
                      type="button"
                      onClick={() => {
                        selectNode(ctrl.id);
                        setControlDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 flex items-center justify-between transition cursor-pointer ${
                        selectedNode?.id === ctrl.id ? 'text-emerald-400 font-bold bg-emerald-950/30' : 'text-zinc-300'
                      }`}
                    >
                      <span className="truncate">
                        {ctrl.properties.name} <span className="text-zinc-500 font-normal text-[10px]">[{ctrl.type}]</span>
                      </span>
                      {selectedNode?.id === ctrl.id && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Center: Visual Studio Windows Forms Format & Layout Toolbar */}
      <div className="flex items-center gap-1 shrink-0">
        {/* View Code (F7) / View Designer (Shift+F7) segmented switch */}
        <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-md p-0.5 mr-2">
          <button
            type="button"
            onClick={() => setCodeDockOpen(false)}
            className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded transition cursor-pointer ${
              !codeDockOpen
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Перейти к конструктору форм (Shift+F7)"
          >
            <span>🖼️</span>
            <span className="hidden sm:inline">Дизайнер</span>
            <span className="text-[9px] opacity-75 font-mono ml-0.5">⇧F7</span>
          </button>
          <button
            type="button"
            onClick={() => setCodeDockOpen(true)}
            className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded transition cursor-pointer ${
              codeDockOpen
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Перейти к коду формы (F7)"
          >
            <Code2 className="w-3 h-3" />
            <span className="hidden sm:inline">Код</span>
            <span className="text-[9px] opacity-75 font-mono ml-0.5">F7</span>
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-0.5 hidden lg:block" />

        {/* Alignment Actions (Microsoft Visual Studio Windows Forms Designer Standard) */}
        <div className="hidden lg:flex items-center gap-0.5 bg-zinc-950/60 border border-zinc-850 rounded-md p-0.5">
          {/* Align Left */}
          <button
            type="button"
            onClick={() => alignSelectedNodes('left')}
            disabled={!hasSelection}
            className={`p-1 rounded transition cursor-pointer ${
              hasSelection ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Выровнять по левому краю (Align Left)"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          {/* Align Center Horizontal */}
          <button
            type="button"
            onClick={() => alignSelectedNodes('center')}
            disabled={!hasSelection}
            className={`p-1 rounded transition cursor-pointer ${
              hasSelection ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Выровнять по центру по горизонтали (Align Centers)"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          {/* Align Right */}
          <button
            type="button"
            onClick={() => alignSelectedNodes('right')}
            disabled={!hasSelection}
            className={`p-1 rounded transition cursor-pointer ${
              hasSelection ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Выровнять по правому краю (Align Right)"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-zinc-800 mx-0.5" />

          {/* Align Top */}
          <button
            type="button"
            onClick={() => alignSelectedNodes('top')}
            disabled={!hasSelection}
            className={`p-1 rounded transition cursor-pointer ${
              hasSelection ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Выровнять по верхнему краю (Align Tops)"
          >
            <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
          </button>

          {/* Align Middle Vertical */}
          <button
            type="button"
            onClick={() => alignSelectedNodes('middle')}
            disabled={!hasSelection}
            className={`p-1 rounded transition cursor-pointer ${
              hasSelection ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Выровнять по центру по вертикали (Align Middles)"
          >
            <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
          </button>

          {/* Align Bottom */}
          <button
            type="button"
            onClick={() => alignSelectedNodes('bottom')}
            disabled={!hasSelection}
            className={`p-1 rounded transition cursor-pointer ${
              hasSelection ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Выровнять по нижнему краю (Align Bottoms)"
          >
            <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-zinc-800 mx-0.5" />

          {/* Same Width */}
          <button
            type="button"
            onClick={() => alignSelectedNodes('sameWidth')}
            disabled={!isMultiSelection}
            className={`p-1 rounded transition cursor-pointer ${
              isMultiSelection ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Сделать одинаковую ширину (Make Same Width)"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>

          {/* Same Height */}
          <button
            type="button"
            onClick={() => alignSelectedNodes('sameHeight')}
            disabled={!isMultiSelection}
            className={`p-1 rounded transition cursor-pointer ${
              isMultiSelection ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Сделать одинаковую высоту (Make Same Height)"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-0.5 hidden sm:block" />

        {/* Lock Controls (Visual Studio Format -> Lock Controls) */}
        <button
          type="button"
          onClick={toggleLockSelected}
          disabled={!hasSelection}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
            !hasSelection
              ? 'opacity-40 cursor-not-allowed border-transparent text-zinc-600'
              : allLocked
              ? 'bg-amber-950/40 border-amber-600/60 text-amber-300 hover:bg-amber-900/40'
              : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
          title={
            allLocked
              ? 'Разблокировать выбранные элементы (Format -> Lock Controls)'
              : 'Заблокировать выбранные элементы от случайного перемещения (Format -> Lock Controls)'
          }
        >
          {allLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-zinc-400" />}
          <span className="hidden md:inline">{allLocked ? 'Заблокировано' : 'Заблокировать'}</span>
        </button>

        {/* Tab Order Mode Toggle (Visual Studio View -> Tab Order) */}
        <button
          type="button"
          onClick={() => setTabOrderMode(!isTabOrderMode)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
            isTabOrderMode
              ? 'bg-blue-600 border-blue-500 text-white font-semibold shadow-xs animate-pulse'
              : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
          title="Режим нумерации очередности Tab (View -> Tab Order)"
        >
          <Hash className="w-3 h-3 text-blue-400" />
          <span className="hidden md:inline">Tab Order</span>
        </button>

        {/* Beautify on Grid */}
        <button
          type="button"
          onClick={handleBeautify}
          className="flex items-center gap-1 px-2 py-1 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded text-[11px] text-zinc-300 hover:text-white transition cursor-pointer"
          title="Автоматически привязать все элементы формы к шагу сетки"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="hidden md:inline">Сетка</span>
        </button>

        {/* Quick Launch / Command Palette Button */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1 px-2 py-1 bg-blue-950/30 hover:bg-blue-900/50 border border-blue-800/60 hover:border-blue-700 rounded text-[11px] text-blue-300 transition cursor-pointer"
            title="Быстрый поиск команд (Ctrl+Q / Ctrl+Shift+P)"
          >
            <Search className="w-3 h-3 text-blue-400" />
            <span className="hidden xl:inline">Команды</span>
            <span className="text-[9px] text-blue-400 font-mono">Ctrl+Q</span>
          </button>
        )}
      </div>
    </div>
  );
};
