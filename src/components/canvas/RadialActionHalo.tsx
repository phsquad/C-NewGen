import React, { useState, useRef, useEffect } from 'react';
import { DesignerNode } from '../../types/ast';
import { useDesigner } from '../../context/DesignerContext';
import { SignalWireEngine } from '../../utils/SignalWireEngine';
import {
  Type,
  Palette,
  Zap,
  Maximize2,
  Copy,
  Trash2,
  Anchor,
  X,
  Check,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface RadialActionHaloProps {
  node: DesignerNode;
}

export const RadialActionHalo: React.FC<RadialActionHaloProps> = ({ node }) => {
  const {
    updateNodeProperties,
    duplicateSelectedNodes,
    deleteSelectedNodes,
    setPendingWireStart,
    showWiring,
    setShowWiring,
    morphicMode,
  } = useDesigner();

  const [isEditingText, setIsEditingText] = useState(false);
  const [textValue, setTextValue] = useState(node.properties.text || '');
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [dockMenuOpen, setDockMenuOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingText && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingText]);

  // Quick 8 palette colors
  const palette = [
    '#2563eb', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#18181b', // Dark
    '#ffffff', // White
  ];

  const handleTextSubmit = () => {
    updateNodeProperties(node.id, { text: textValue });
    setIsEditingText(false);
  };

  const handleStartWire = () => {
    const { outPorts } = SignalWireEngine.getDefaultPorts(node);
    if (outPorts.length > 0) {
      setShowWiring(true);
      setPendingWireStart(outPorts[0]);
    }
  };

  return (
    <div
      onClick={e => e.stopPropagation()}
      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-zinc-900/95 border border-blue-500/80 rounded-full px-2 py-1 shadow-2xl backdrop-blur-md text-zinc-300 animate-in fade-in zoom-in-95 duration-100 select-none pointer-events-auto"
    >
      {/* 1. Fast Inline Text Edit Button */}
      <button
        type="button"
        onClick={() => {
          setTextValue(node.properties.text || '');
          setIsEditingText(true);
        }}
        title="Быстрое редактирование текста на холсте (как в Figma)"
        className="p-1 hover:bg-zinc-800 text-blue-400 hover:text-white rounded-full transition cursor-pointer"
      >
        <Type className="w-3.5 h-3.5" />
      </button>

      {/* 2. Color Palette Quick Ring */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setColorMenuOpen(!colorMenuOpen)}
          title="Быстрый выбор цвета фона"
          className="p-1 hover:bg-zinc-800 text-amber-400 hover:text-white rounded-full transition cursor-pointer"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        {colorMenuOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex items-center gap-1.5 z-50">
            {palette.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  updateNodeProperties(node.id, { backColor: c });
                  setColorMenuOpen(false);
                }}
                style={{ backgroundColor: c }}
                className="w-4 h-4 rounded-full border border-zinc-600 hover:scale-125 transition-transform cursor-pointer"
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Pull Signal Wire Button */}
      <button
        type="button"
        onClick={handleStartWire}
        title="⚡️ Вытянуть нить данных (Signal-Wiring)"
        className="p-1 hover:bg-blue-600 text-cyan-400 hover:text-white rounded-full transition cursor-pointer"
      >
        <Zap className="w-3.5 h-3.5 fill-current" />
      </button>

      {/* 4. Dock Layout Quick Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDockMenuOpen(!dockMenuOpen)}
          title="Стыковка в родительском контейнере (Dock)"
          className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full transition cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {dockMenuOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl flex flex-col text-[10px] z-50 font-mono">
            {['None', 'Fill', 'Top', 'Bottom', 'Left', 'Right'].map(d => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  updateNodeProperties(node.id, { dock: d as any });
                  setDockMenuOpen(false);
                }}
                className={`px-2 py-0.5 rounded text-left hover:bg-blue-600 hover:text-white cursor-pointer ${
                  node.properties.dock === d ? 'text-blue-400 font-bold' : 'text-zinc-300'
                }`}
              >
                Dock: {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Duplicate */}
      <button
        type="button"
        onClick={duplicateSelectedNodes}
        title="Дублировать контрол (Ctrl+D)"
        className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full transition cursor-pointer"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* 6. Delete */}
      <button
        type="button"
        onClick={deleteSelectedNodes}
        title="Удалить контрол (Del)"
        className="p-1 hover:bg-red-600 text-red-400 hover:text-white rounded-full transition cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Inline Text Edit Overlay on Canvas */}
      {isEditingText && (
        <div className="fixed inset-0 bg-transparent z-[100] flex items-center justify-center pointer-events-auto">
          <div className="bg-zinc-900 border border-blue-500 rounded-lg shadow-2xl p-2 flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTextSubmit();
                if (e.key === 'Escape') setIsEditingText(false);
              }}
              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-400 font-mono w-48"
            />
            <button
              type="button"
              onClick={handleTextSubmit}
              className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
