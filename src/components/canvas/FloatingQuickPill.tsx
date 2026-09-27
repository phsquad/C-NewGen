import React, { useState, useRef, useEffect } from 'react';
import { DesignerNode, LayoutBounds } from '../../types/ast';
import {
  Palette,
  Type,
  Zap,
  Copy,
  Trash2,
  Edit3,
  Bold,
  Plus,
  Minus,
  Check,
  Sparkles,
  ChevronDown,
  Layers,
  Maximize2,
} from 'lucide-react';

interface FloatingQuickPillProps {
  node: DesignerNode;
  selectedNodes: DesignerNode[];
  formOrigin: { x: number; y: number };
  zoom: number;
  onStartInlineEdit: (nodeId: string) => void;
  onOpenColorPicker?: (color: string) => void;
  onUpdateProperty: (nodeId: string, propKey: string, value: any) => void;
  onUpdateMultipleProperties: (nodeIds: string[], props: Record<string, any>) => void;
  onOpenNoCodeActions: (nodeId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const POPULAR_COLORS = [
  { name: 'Orange Accent', hex: '#F97316' },
  { name: 'Fluent Blue', hex: '#2563EB' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Ruby Danger', hex: '#EF4444' },
  { name: 'Dark Slate', hex: '#1E293B' },
  { name: 'Cyber Blue', hex: '#0EA5E9' },
  { name: 'Purple Neon', hex: '#8B5CF6' },
  { name: 'Amber Gold', hex: '#F59E0B' },
  { name: 'Pink Rose', hex: '#F43F5E' },
  { name: 'Teal Cyan', hex: '#14B8A6' },
  { name: 'Console Black', hex: '#09090B' },
  { name: 'Clean White', hex: '#FFFFFF' },
  { name: 'Soft Gray', hex: '#E2E8F0' },
  { name: 'Transparent', hex: 'transparent' },
];

export const FloatingQuickPill: React.FC<FloatingQuickPillProps> = ({
  node,
  selectedNodes,
  formOrigin,
  zoom,
  onStartInlineEdit,
  onUpdateProperty,
  onUpdateMultipleProperties,
  onOpenNoCodeActions,
  onDuplicate,
  onDelete,
}) => {
  const isMulti = selectedNodes.length > 1;
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [showFontPopover, setShowFontPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowColorPopover(false);
        setShowFontPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute bounding box for single or multiple selection
  const minX = isMulti ? Math.min(...selectedNodes.map((n) => n.bounds.x)) : node.bounds.x;
  const minY = isMulti ? Math.min(...selectedNodes.map((n) => n.bounds.y)) : node.bounds.y;
  const maxX = isMulti
    ? Math.max(...selectedNodes.map((n) => n.bounds.x + n.bounds.width))
    : node.bounds.x + node.bounds.width;

  const centerX = (minX + maxX) / 2;

  // Calculate screen position on canvas
  const pillLeft = formOrigin.x + centerX;
  const pillTop = formOrigin.y + minY - 44 / zoom;

  const currentBackColor = node.properties.backColor || '#2563EB';
  const currentForeColor = node.properties.foreColor || '#FFFFFF';
  const currentFontSize = node.properties.fontSize || 9;
  const currentFontBold = !!node.properties.fontBold;

  const handleApplyColor = (hex: string, isFore = false) => {
    if (isMulti) {
      const ids = selectedNodes.map((n) => n.id);
      onUpdateMultipleProperties(ids, isFore ? { foreColor: hex } : { backColor: hex });
    } else {
      onUpdateProperty(node.id, isFore ? 'foreColor' : 'backColor', hex);
    }
  };

  const handleToggleBold = () => {
    const newBold = !currentFontBold;
    if (isMulti) {
      const ids = selectedNodes.map((n) => n.id);
      onUpdateMultipleProperties(ids, { fontBold: newBold });
    } else {
      onUpdateProperty(node.id, 'fontBold', newBold);
    }
  };

  const handleChangeFontSize = (delta: number) => {
    const newSize = Math.max(6, Math.min(72, currentFontSize + delta));
    if (isMulti) {
      const ids = selectedNodes.map((n) => n.id);
      onUpdateMultipleProperties(ids, { fontSize: newSize });
    } else {
      onUpdateProperty(node.id, 'fontSize', newSize);
    }
  };

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        left: `${pillLeft}px`,
        top: `${Math.max(formOrigin.y - 48 / zoom, pillTop)}px`,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
      className="flex items-center gap-1 bg-[#18181f]/95 backdrop-blur-xl border border-zinc-700/80 rounded-full px-2.5 py-1 shadow-2xl text-xs text-white select-none animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/10"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* 1. Node Name Badge / Multi-selection counter */}
      <div className="flex items-center gap-1.5 pr-1.5 border-r border-zinc-700/80">
        {isMulti ? (
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-400 font-mono">
            <Layers className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>{selectedNodes.length} эл.</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 truncate max-w-[130px]">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            <span className="text-[11px] font-bold text-blue-300 font-mono truncate">
              {node.properties.name}
            </span>
          </div>
        )}
      </div>

      {/* 2. Inline Text Edit Button (if single item with text capability) */}
      {!isMulti && (
        <button
          type="button"
          onClick={() => onStartInlineEdit(node.id)}
          title="Редактировать текст на холсте (Двойной клик или Enter)"
          className="p-1 hover:bg-zinc-700/80 rounded-full transition-colors text-zinc-300 hover:text-white cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      )}

      {/* 3. Quick Color Palette Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowColorPopover((prev) => !prev);
            setShowFontPopover(false);
          }}
          title="Быстрый цвет фона и текста"
          className="p-1 hover:bg-zinc-700/80 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-xs"
            style={{ backgroundColor: currentBackColor }}
          />
          <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
        </button>

        {showColorPopover && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-700 rounded-xl p-2.5 shadow-2xl z-[10000] space-y-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Цвет фона (BackColor)</span>
              <span className="font-mono text-zinc-300">{currentBackColor}</span>
            </div>

            {/* Popular Color Swatches */}
            <div className="grid grid-cols-7 gap-1.5">
              {POPULAR_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleApplyColor(c.hex, false)}
                  title={c.name}
                  className={`w-5 h-5 rounded-md border transition-transform hover:scale-115 cursor-pointer flex items-center justify-center ${
                    currentBackColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'border-white ring-2 ring-blue-500 scale-105'
                      : 'border-zinc-700 hover:border-zinc-400'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {currentBackColor.toLowerCase() === c.hex.toLowerCase() && (
                    <Check className="w-3 h-3 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Hex Picker */}
            <div className="pt-1 border-t border-zinc-800 flex items-center justify-between gap-1.5">
              <span className="text-[10px] text-zinc-400">Свой:</span>
              <input
                type="color"
                value={currentBackColor.startsWith('#') ? currentBackColor : '#2563EB'}
                onChange={(e) => handleApplyColor(e.target.value, false)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <button
                type="button"
                onClick={() => handleApplyColor('#FFFFFF', true)}
                title="Белый текст (ForeColor)"
                className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] text-white border border-zinc-700 font-mono"
              >
                Текст #FFF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Font / Size Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowFontPopover((prev) => !prev);
            setShowColorPopover(false);
          }}
          title="Шрифт и размер"
          className="p-1 hover:bg-zinc-700/80 rounded-full transition-colors text-zinc-300 hover:text-white cursor-pointer flex items-center gap-0.5"
        >
          <Type className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-mono text-zinc-400">{currentFontSize}pt</span>
        </button>

        {showFontPopover && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-700 rounded-xl p-2.5 shadow-2xl z-[10000] space-y-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Шрифт и начертание
            </div>

            <div className="flex items-center justify-between gap-2">
              {/* Bold toggle */}
              <button
                type="button"
                onClick={handleToggleBold}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  currentFontBold
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
                <span>Жирный</span>
              </button>

              {/* Font Size controls */}
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleChangeFontSize(-1)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-300 cursor-pointer"
                  title="Уменьшить шрифт (-1pt)"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-1 font-mono text-xs font-bold text-white min-w-[28px] text-center">
                  {currentFontSize}
                </span>
                <button
                  type="button"
                  onClick={() => handleChangeFontSize(1)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-300 cursor-pointer"
                  title="Увеличить шрифт (+1pt)"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. 1-Click No-Code Action Trigger */}
      <button
        type="button"
        onClick={() => onOpenNoCodeActions(node.id)}
        title="Привязать No-Code действие или открыть C# редактор событий (F7)"
        className="p-1 hover:bg-indigo-600/40 text-amber-300 hover:text-amber-200 rounded-full transition-colors cursor-pointer flex items-center gap-0.5"
      >
        <Zap className="w-3.5 h-3.5 text-amber-400" />
      </button>

      {/* 6. Duplicate (Ctrl+D) */}
      <button
        type="button"
        onClick={onDuplicate}
        title="Дублировать (Ctrl+D)"
        className="p-1 hover:bg-zinc-700/80 rounded-full transition-colors text-zinc-300 hover:text-white cursor-pointer"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* 7. Delete (Del) */}
      <button
        type="button"
        onClick={onDelete}
        title="Удалить (Delete)"
        className="p-1 hover:bg-red-600/30 text-zinc-400 hover:text-red-400 rounded-full transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
