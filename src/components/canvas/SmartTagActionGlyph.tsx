import React, { useState, useRef, useEffect } from 'react';
import { DesignerNode, ControlType, NodeProperties } from '../../types/ast';
import { useDesigner } from '../../context/DesignerContext';
import {
  Play,
  Settings,
  Plus,
  Trash2,
  Database,
  Layers,
  LayoutGrid,
  Check,
  Maximize2,
  X,
  FileCode,
  Square,
  ArrowDownToLine,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface SmartTagActionGlyphProps {
  node: DesignerNode;
  isSelected: boolean;
}

export const SmartTagActionGlyph: React.FC<SmartTagActionGlyphProps> = ({ node, isSelected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    updateNodeProperties,
    updateNodeBounds,
    sendNodeToBack,
    bringNodeToFront,
    setActiveRightTab,
    addConsoleLog,
  } = useDesigner();

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const props: NodeProperties = (node.properties || {}) as NodeProperties;

  // Support smart tags for common & complex controls
  const supportsSmartTag = [
    'DataGridView',
    'TabControl',
    'Panel',
    'GroupBox',
    'MenuStrip',
    'ToolStrip',
    'StatusStrip',
    'TextBox',
    'Button',
    'ComboBox',
    'ListBox',
  ].includes(node.type);

  if (!supportsSmartTag) return null;

  // Render specific quick actions by control type
  const renderQuickTasks = () => {
    switch (node.type) {
      case 'DataGridView':
        return (
          <div className="space-y-2 text-xs">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
              Задачи DataGridView
            </div>

            {/* DataSource selection */}
            <button
              type="button"
              onClick={() => {
                const sampleCols = ['Id', 'Название', 'Категория', 'Цена', 'Остаток'];
                updateNodeProperties(node.id, {
                  columns: sampleCols,
                });
                addConsoleLog('System', `К ${node.properties.name} подключена демонстрационная таблица данных (SQLite DataSource)`);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Выбрать источник данных (DataSource)...</span>
            </button>

            {/* Add Column */}
            <button
              type="button"
              onClick={() => {
                const currentCols = props.columns || ['Column1', 'Column2', 'Column3'];
                const nextColName = `Колонка_${currentCols.length + 1}`;
                updateNodeProperties(node.id, {
                  columns: [...currentCols, nextColName],
                });
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Добавить колонку (Add Column)...</span>
            </button>

            {/* Dock in Parent Container */}
            <button
              type="button"
              onClick={() => {
                updateNodeProperties(node.id, {
                  dock: props.dock === 'Fill' ? 'None' : 'Fill',
                });
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Стыковать в родительском контейнере (Dock)</span>
              </div>
              {props.dock === 'Fill' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Checkbox Options */}
            <div className="pt-1 border-t border-zinc-800 space-y-1.5">
              <label className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={props.allowUserToAddRows !== false}
                  onChange={e => updateNodeProperties(node.id, { allowUserToAddRows: e.target.checked })}
                  className="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Разрешить добавление строк</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={props.autoSize !== false}
                  onChange={e => updateNodeProperties(node.id, { autoSize: e.target.checked })}
                  className="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Авторазмер столбцов (AutoSize)</span>
              </label>
            </div>
          </div>
        );

      case 'TabControl':
        return (
          <div className="space-y-2 text-xs">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
              Задачи TabControl
            </div>

            {/* Add TabPage */}
            <button
              type="button"
              onClick={() => {
                const currentPages = props.tabTitles || ['Вкладка 1', 'Вкладка 2'];
                const newTitle = `Вкладка ${currentPages.length + 1}`;
                updateNodeProperties(node.id, {
                  tabTitles: [...currentPages, newTitle],
                  activeTabIndex: currentPages.length,
                });
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Добавить вкладку (Add TabPage)</span>
            </button>

            {/* Remove TabPage */}
            <button
              type="button"
              onClick={() => {
                const currentPages = props.tabTitles || ['Вкладка 1', 'Вкладка 2'];
                if (currentPages.length > 1) {
                  const nextPages = currentPages.slice(0, -1);
                  updateNodeProperties(node.id, {
                    tabTitles: nextPages,
                    activeTabIndex: Math.min((props.activeTabIndex || 0), nextPages.length - 1),
                  });
                }
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-red-400 text-left transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Удалить последнюю вкладку</span>
            </button>

            {/* Dock Fill */}
            <button
              type="button"
              onClick={() => {
                updateNodeProperties(node.id, {
                  dock: props.dock === 'Fill' ? 'None' : 'Fill',
                });
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Стыковать в родителе (Dock: Fill)</span>
              </div>
              {props.dock === 'Fill' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        );

      case 'Panel':
      case 'GroupBox':
        return (
          <div className="space-y-2 text-xs">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
              Задачи {node.type}
            </div>

            {/* Clear Border */}
            <button
              type="button"
              onClick={() => {
                updateNodeProperties(node.id, { borderStyle: 'None' });
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <span>Очистить границы (BorderStyle: None)</span>
              {props.borderStyle === 'None' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* FixedSingle Border */}
            <button
              type="button"
              onClick={() => {
                updateNodeProperties(node.id, { borderStyle: 'FixedSingle' });
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <span>Сделать рамку (BorderStyle: FixedSingle)</span>
              {props.borderStyle === 'FixedSingle' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Send to Back */}
            <button
              type="button"
              onClick={() => {
                sendNodeToBack(node.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Сделать фоновой (Send to Back)</span>
            </button>

            {/* Dock Fill */}
            <button
              type="button"
              onClick={() => {
                updateNodeProperties(node.id, {
                  dock: props.dock === 'Fill' ? 'None' : 'Fill',
                });
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Стыковать в родителе (Dock: Fill)</span>
              </div>
              {props.dock === 'Fill' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        );

      case 'MenuStrip':
      case 'ToolStrip':
        return (
          <div className="space-y-2 text-xs">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
              Задачи {node.type}
            </div>

            {/* Insert Standard Items */}
            <button
              type="button"
              onClick={() => {
                updateNodeProperties(node.id, {
                  dock: 'Top',
                  menuItems: [
                    { id: 'm_file', text: '&Файл' },
                    { id: 'm_edit', text: '&Правка' },
                    { id: 'm_view', text: '&Вид' },
                    { id: 'm_help', text: '&Справка' },
                  ],
                });
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Вставить стандартные пункты (Файл, Правка, Справка)</span>
            </button>

            {/* Dock Top */}
            <button
              type="button"
              onClick={() => {
                updateNodeProperties(node.id, { dock: 'Top' });
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <span>Стыковать сверху (Dock: Top)</span>
              {props.dock === 'Top' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        );

      default:
        // Generic controls (Button, TextBox, etc.)
        return (
          <div className="space-y-2 text-xs">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
              Задачи {node.type}
            </div>

            {/* Dock Toggle */}
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  updateNodeProperties(node.id, { dock: 'Fill' });
                  setIsOpen(false);
                }}
                className={`px-2 py-1 rounded text-left border ${
                  props.dock === 'Fill' ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                Dock: Fill
              </button>
              <button
                type="button"
                onClick={() => {
                  updateNodeProperties(node.id, { dock: 'None' });
                  setIsOpen(false);
                }}
                className={`px-2 py-1 rounded text-left border ${
                  !props.dock || props.dock === 'None' ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                Dock: None
              </button>
            </div>

            {node.type === 'TextBox' && (
              <label className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={props.autoSize !== false}
                  onChange={e => updateNodeProperties(node.id, { autoSize: e.target.checked })}
                  className="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Многострочный режим (Multiline)</span>
              </label>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveRightTab('properties');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Открыть свойства в инспекторе...</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="absolute top-1 right-1 z-50">
      {/* Smart Tag Action Glyph Trigger: [ ► ] */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        title="Быстрые действия (Smart Tag Tasks)"
        className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer shadow-md ${
          isOpen
            ? 'bg-blue-500 text-white ring-2 ring-blue-300 scale-110'
            : isSelected
            ? 'bg-blue-600 hover:bg-blue-500 text-white opacity-100'
            : 'bg-zinc-800/80 hover:bg-blue-600 text-zinc-300 hover:text-white opacity-40 hover:opacity-100'
        }`}
      >
        <Play className="w-2.5 h-2.5 fill-current rotate-0 translate-x-0.2" />
      </button>

      {/* Floating Smart Tag Tasks Panel (Visual Studio Classic Style) */}
      {isOpen && (
        <div
          ref={panelRef}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          className="absolute right-0 top-5 w-64 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl overflow-hidden z-[100] animate-in fade-in duration-100 text-zinc-200"
        >
          {/* Header */}
          <div className="px-3 py-1.5 bg-blue-600 text-white font-semibold text-xs flex items-center justify-between">
            <span className="truncate">{node.properties.name} Задачи</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-0.5 hover:bg-blue-700 rounded text-blue-100 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick tasks body */}
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 space-y-2">
            {renderQuickTasks()}
          </div>
        </div>
      )}
    </div>
  );
};
