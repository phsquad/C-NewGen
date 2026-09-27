import React, { useState } from 'react';
import { DesignerNode } from '../../types/ast';
import {
  Square,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Layers,
  Image as ImageIcon,
  FolderTree,
  Calendar,
  Table,
} from 'lucide-react';

interface ControlRendererProps {
  node: DesignerNode;
  isInteractive?: boolean; // True when running live test mode
  onEventTrigger?: (eventName: string, handlerName: string, controlName: string, payload?: any) => void;
  onPropertyChange?: (propertyName: string, value: any) => void;
  activeTab?: number;
  onTabChange?: (index: number) => void;
}

export const ControlRenderer: React.FC<ControlRendererProps> = ({
  node,
  isInteractive = false,
  onEventTrigger,
  onPropertyChange,
  activeTab = 0,
  onTabChange,
}) => {
  const { type, properties, events } = node;

  const fontStyle: React.CSSProperties = {
    fontFamily: properties.fontFamily || 'Segoe UI, sans-serif',
    fontSize: properties.fontSize ? `${properties.fontSize}pt` : '9pt',
    fontWeight: properties.fontBold ? 600 : 400,
    color: properties.foreColor || (type === 'Button' && properties.backColor ? '#FFFFFF' : '#1E293B'),
  };

  const bgStyle: React.CSSProperties = {
    backgroundColor: properties.backColor || (type === 'Button' ? '#2563EB' : 'transparent'),
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isInteractive) {
      e.stopPropagation();
      if (events?.Click) {
        onEventTrigger?.('Click', events.Click, properties.name);
      }
    }
  };

  const handleMouseEnter = () => {
    if (isInteractive && events?.MouseEnter) {
      onEventTrigger?.('MouseEnter', events.MouseEnter, properties.name);
    }
  };

  switch (type) {
    case 'Button':
      return (
        <button
          type="button"
          disabled={!properties.enabled}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          style={{ ...fontStyle, ...bgStyle }}
          className={`w-full h-full flex items-center justify-center px-3 rounded shadow-xs select-none transition-all active:scale-[0.98] ${
            !properties.backColor ? 'bg-blue-600 text-white hover:bg-blue-700' : 'hover:opacity-95'
          } ${!properties.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className="truncate">{properties.text || properties.name}</span>
        </button>
      );

    case 'TextBox':
      return (
        <div
          style={{ ...bgStyle }}
          className="w-full h-full flex items-center border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 px-2.5 overflow-hidden shadow-2xs"
        >
          {isInteractive ? (
            <input
              type={properties.useSystemPasswordChar ? 'password' : 'text'}
              value={properties.text ?? ''}
              placeholder={properties.placeholder || ''}
              disabled={!properties.enabled}
              onChange={e => {
                onPropertyChange?.('text', e.target.value);
                if (events?.TextChanged) {
                  onEventTrigger?.('TextChanged', events.TextChanged, properties.name, { text: e.target.value });
                }
              }}
              style={fontStyle}
              className="w-full bg-transparent border-none outline-hidden text-zinc-900 dark:text-zinc-100"
            />
          ) : (
            <span style={fontStyle} className="truncate text-zinc-800 dark:text-zinc-200">
              {properties.text || <span className="text-zinc-400">{properties.placeholder || ''}</span>}
            </span>
          )}
        </div>
      );

    case 'Label':
      return (
        <div
          style={fontStyle}
          className="w-full h-full flex items-center select-none overflow-hidden"
        >
          <span className="truncate">{properties.text || properties.name}</span>
        </div>
      );

    case 'CheckBox':
      return (
        <label
          style={fontStyle}
          className="w-full h-full flex items-center gap-2 select-none cursor-pointer"
          onClick={e => {
            if (isInteractive) {
              e.stopPropagation();
              const nextVal = !properties.checked;
              onPropertyChange?.('checked', nextVal);
              if (events?.CheckedChanged) {
                onEventTrigger?.('CheckedChanged', events.CheckedChanged, properties.name, { checked: nextVal });
              }
            }
          }}
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              properties.checked
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-800'
            }`}
          >
            {properties.checked && <CheckSquare className="w-3.5 h-3.5" />}
          </div>
          <span className="truncate">{properties.text || properties.name}</span>
        </label>
      );

    case 'RadioButton':
      return (
        <label
          style={fontStyle}
          className="w-full h-full flex items-center gap-2 select-none cursor-pointer"
        >
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              properties.checked
                ? 'border-blue-600 bg-white'
                : 'border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-800'
            }`}
          >
            {properties.checked && <div className="w-2 h-2 rounded-full bg-blue-600" />}
          </div>
          <span className="truncate">{properties.text || properties.name}</span>
        </label>
      );

    case 'ComboBox':
      return (
        <div
          style={{ ...fontStyle, ...bgStyle }}
          className="w-full h-full flex items-center justify-between border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 px-2.5 shadow-2xs"
        >
          <span className="truncate text-zinc-800 dark:text-zinc-200">
            {properties.text || (properties.items && properties.items[0]) || properties.name}
          </span>
          <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 ml-1" />
        </div>
      );

    case 'ListBox':
      return (
        <div
          style={{ ...bgStyle }}
          className="w-full h-full border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 p-1 overflow-y-auto text-xs"
        >
          {(properties.items && properties.items.length > 0
            ? properties.items
            : ['Item 1', 'Item 2', 'Item 3', 'Item 4']
          ).map((item, idx) => (
            <div
              key={idx}
              style={fontStyle}
              onClick={() => {
                if (isInteractive && events?.SelectedIndexChanged) {
                  onEventTrigger?.('SelectedIndexChanged', events.SelectedIndexChanged, properties.name);
                }
              }}
              className={`px-2 py-1 rounded truncate cursor-pointer ${
                idx === 0
                  ? 'bg-blue-600 text-white font-medium'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-300'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      );

    case 'NumericUpDown':
      const numVal = properties.value !== undefined ? Number(properties.value) : 0;
      return (
        <div
          style={{ ...fontStyle, ...bgStyle }}
          className="w-full h-full flex items-center justify-between border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs"
        >
          <div className="flex-1 px-2.5 truncate font-mono text-zinc-800 dark:text-zinc-200">
            {numVal}
          </div>
          <div className="w-5 h-full flex flex-col border-l border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
            <button
              type="button"
              disabled={!properties.enabled}
              onClick={e => {
                if (isInteractive) {
                  e.stopPropagation();
                  onEventTrigger?.('ValueChanged', events?.ValueChanged || `${properties.name}_ValueChanged`, properties.name);
                }
              }}
              className="flex-1 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[8px] cursor-pointer"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={!properties.enabled}
              onClick={e => {
                if (isInteractive) {
                  e.stopPropagation();
                  onEventTrigger?.('ValueChanged', events?.ValueChanged || `${properties.name}_ValueChanged`, properties.name);
                }
              }}
              className="flex-1 flex items-center justify-center border-t border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[8px] cursor-pointer"
            >
              ▼
            </button>
          </div>
        </div>
      );

    case 'DateTimePicker':
      return (
        <div
          style={{ ...fontStyle, ...bgStyle }}
          className="w-full h-full flex items-center justify-between border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 px-2.5 shadow-2xs"
        >
          <div className="flex items-center gap-1.5 truncate text-zinc-800 dark:text-zinc-200">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">
              {properties.text || (properties.format === 'Short' ? '26.09.2026' : 'Суббота, 26 сентября 2026 г.')}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
        </div>
      );

    case 'ProgressBar':
      const val = Math.min(100, Math.max(0, properties.progressValue ?? 50));
      return (
        <div className="w-full h-full border border-zinc-300 dark:border-zinc-700 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${val}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-zinc-700 dark:text-zinc-300 font-semibold">
            {val}%
          </div>
        </div>
      );

    case 'PictureBox':
      return (
        <div
          style={bgStyle}
          className="w-full h-full border border-dashed border-zinc-400 dark:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-2 text-zinc-400 text-xs"
        >
          {properties.imageSrc ? (
            <img
              src={properties.imageSrc}
              alt={properties.name}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <>
              <ImageIcon className="w-6 h-6 mb-1 text-zinc-400" />
              <span className="text-[10px] text-zinc-500">{properties.name}</span>
            </>
          )}
        </div>
      );

    case 'GroupBox':
      return (
        <div
          style={{ ...bgStyle }}
          className="w-full h-full border border-zinc-300 dark:border-zinc-700 rounded pt-3 relative bg-white/50 dark:bg-zinc-900/40"
        >
          <div className="absolute -top-2.5 left-3 px-1.5 bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
            <span style={fontStyle}>{properties.text || properties.name}</span>
          </div>
        </div>
      );

    case 'TabControl':
      const tabs = properties.tabTitles || ['Tab 1', 'Tab 2'];
      return (
        <div className="w-full h-full border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 px-1 pt-1 gap-1">
            {tabs.map((tab, idx) => {
              const isActive = idx === activeTab;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onTabChange?.(idx)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t border-t border-x transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white -mb-px'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <div className="flex-1 p-2 bg-white dark:bg-zinc-900 relative" />
        </div>
      );

    case 'DataGridView':
      const cols = properties.columns && properties.columns.length > 0
        ? properties.columns
        : ['Id', 'Имя', 'Должность', 'Зарплата'];
      const currentGridRows = (properties.rows && properties.rows.length > 0)
        ? properties.rows
        : [
            ['1', 'Александр В.', 'Senior C# Dev', '$120,000'],
            ['2', 'Елена М.', 'UI/UX Lead', '$95,000'],
            ['3', 'Дмитрий С.', 'Backend Eng', '$88,000'],
          ];

      return (
        <div
          style={{ ...bgStyle }}
          className="w-full h-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden text-[11px] font-sans select-none"
        >
          {/* Table Header Row */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300">
            {/* Corner Selector Cell */}
            <div className="w-8 border-r border-zinc-300 dark:border-zinc-700 p-1 flex items-center justify-center bg-zinc-200 dark:bg-zinc-750 text-zinc-400">
              ▶
            </div>
            {cols.map((col, idx) => (
              <div
                key={idx}
                className="flex-1 px-2 py-1 border-r border-zinc-300 dark:border-zinc-700 truncate"
              >
                {col}
              </div>
            ))}
          </div>

          {/* Table Rows */}
          <div className="flex-1 overflow-auto divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[10px]">
            {currentGridRows.map((row, rIdx) => {
              const isSelected = rIdx === (properties.selectedIndex ?? 0);
              return (
                <div
                  key={rIdx}
                  onClick={() => {
                    if (isInteractive) {
                      onPropertyChange?.('selectedIndex', rIdx);
                      if (events?.CellClick) {
                        onEventTrigger?.('CellClick', events.CellClick, properties.name, { rowIndex: rIdx, row });
                      }
                    }
                  }}
                  className={`flex items-center cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <div className={`w-8 border-r p-1 text-center shrink-0 ${
                    isSelected ? 'border-blue-500 bg-blue-700 text-white font-bold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50'
                  }`}>
                    {isSelected ? '▶' : rIdx + 1}
                  </div>
                  {row.map((val, cIdx) => (
                    <div
                      key={cIdx}
                      className="flex-1 px-2 py-1 truncate border-r border-zinc-200/50 dark:border-zinc-800/50"
                    >
                      {val}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* AllowUserToAddRows new row indicator (*) */}
            {properties.allowUserToAddRows !== false && (
              <div className="flex items-center text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850">
                <div className="w-8 border-r border-zinc-200 dark:border-zinc-800 p-1 text-center font-bold text-amber-500 shrink-0 bg-zinc-100 dark:bg-zinc-800/50">
                  *
                </div>
                {cols.map((_, cIdx) => (
                  <div
                    key={cIdx}
                    className="flex-1 px-2 py-1 italic text-zinc-400 border-r border-zinc-200/40 dark:border-zinc-800/40"
                  >
                    {cIdx === 0 ? '' : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case 'MenuStrip':
      const menuItems = properties.menuItems || [
        {
          id: 'mi_file',
          text: 'Файл',
          children: [
            { id: 'mi_new', text: 'Новый проект', shortcut: 'Ctrl+N' },
            { id: 'mi_open', text: 'Открыть...', shortcut: 'Ctrl+O' },
            { id: 'mi_save', text: 'Сохранить', shortcut: 'Ctrl+S' },
            { id: 'mi_sep1', text: '-', isSeparator: true },
            { id: 'mi_exit', text: 'Выход', shortcut: 'Alt+F4' },
          ],
        },
        { id: 'mi_edit', text: 'Правка' },
        { id: 'mi_view', text: 'Вид' },
        { id: 'mi_help', text: 'Справка' },
      ];

      return (
        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-850 border-b border-zinc-300 dark:border-zinc-700 flex items-center px-1.5 text-xs text-zinc-800 dark:text-zinc-200 select-none relative font-sans shadow-2xs">
          {menuItems.map((item, idx) => {
            const hasChildren = item.children && item.children.length > 0;
            return (
              <div key={item.id || idx} className="relative group">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-750 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>{item.text}</span>
                  {hasChildren && <span className="text-[9px] text-zinc-400">▼</span>}
                </button>

                {/* Dropdown Menu preview on hover/focus */}
                {hasChildren && (
                  <div className="hidden group-hover:block absolute top-full left-0 z-50 min-w-[200px] bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-xl py-1 text-xs text-zinc-800 dark:text-zinc-200 animate-in fade-in-50 duration-150">
                    {item.children?.map((sub, sIdx) => {
                      if (sub.isSeparator) {
                        return <div key={sub.id || sIdx} className="my-1 border-t border-zinc-200 dark:border-zinc-800" />;
                      }
                      return (
                        <div
                          key={sub.id || sIdx}
                          onClick={() => {
                            if (sub.clickEvent && isInteractive) {
                              onEventTrigger?.('Click', sub.clickEvent, sub.text);
                            }
                          }}
                          className="px-3 py-1.5 flex items-center justify-between hover:bg-blue-600 hover:text-white cursor-pointer group/item transition-colors"
                        >
                          <span>{sub.text}</span>
                          {sub.shortcut && (
                            <span className="text-[10px] text-zinc-400 group-hover/item:text-blue-100 font-mono ml-4">
                              {sub.shortcut}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );

    case 'ToolStrip':
      const tsItems = properties.toolStripItems || [
        { id: '1', text: 'Создать', toolTip: 'Новый проект' },
        { id: '2', text: 'Открыть', toolTip: 'Открыть...' },
        { id: '3', text: 'Сохранить', toolTip: 'Сохранить (Ctrl+S)' },
      ];
      return (
        <div className="w-full h-full bg-zinc-200/70 dark:bg-zinc-800/80 border-b border-zinc-300 dark:border-zinc-700 flex items-center px-1 gap-1 text-xs text-zinc-700 dark:text-zinc-300 select-none shadow-2xs">
          {tsItems.map((item, idx) => {
            if (item.isSeparator) {
              return <div key={item.id || idx} className="h-4 w-px bg-zinc-400 dark:bg-zinc-600 my-auto mx-0.5" />;
            }
            return (
              <button
                key={item.id || idx}
                type="button"
                title={item.toolTip || item.text}
                onClick={() => {
                  if (item.clickEvent && isInteractive) {
                    onEventTrigger?.('Click', item.clickEvent, item.text);
                  }
                }}
                className="px-2 py-1 rounded hover:bg-white/80 dark:hover:bg-zinc-700 flex items-center gap-1.5 text-[11px] font-medium border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <span>{item.text}</span>
              </button>
            );
          })}
        </div>
      );

    case 'StatusStrip':
      const ssItems = properties.statusStripItems || [
        { id: '1', text: 'Готово' },
        { id: '2', text: 'Стр 1, Кол 1' },
      ];
      return (
        <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 border-t border-zinc-300 dark:border-zinc-700 flex items-center px-2 text-[11px] text-zinc-700 dark:text-zinc-300 select-none font-mono">
          {ssItems.map((item, idx) => {
            if (item.type === 'ProgressBar') {
              return (
                <div key={item.id || idx} className="w-20 h-3 bg-zinc-300 dark:bg-zinc-700 rounded overflow-hidden mx-2 relative">
                  <div className="h-full bg-emerald-500" style={{ width: `${item.progressValue || 100}%` }} />
                </div>
              );
            }
            return (
              <React.Fragment key={item.id || idx}>
                {item.isSpring && <div className="flex-1" />}
                <span className="px-1.5 py-0.5">{item.text}</span>
                {idx < ssItems.length - 1 && !item.isSpring && <span className="text-zinc-400 dark:text-zinc-600">|</span>}
              </React.Fragment>
            );
          })}
        </div>
      );

    case 'TreeView':
      const treeNodes = properties.treeNodes || [
        {
          id: '1',
          text: 'Корень',
          isExpanded: true,
          children: [{ id: '2', text: 'Элемент 1' }, { id: '3', text: 'Элемент 2' }],
        },
      ];
      return (
        <div className="w-full h-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 overflow-auto text-xs text-zinc-800 dark:text-zinc-200 font-sans select-none shadow-2xs">
          {treeNodes.map((node, idx) => (
            <div key={node.id || idx} className="space-y-1">
              <div className="flex items-center gap-1.5 hover:bg-blue-500/10 px-1 py-0.5 rounded cursor-pointer font-medium">
                <span className="text-[10px] text-zinc-500">▼</span>
                <FolderTree className="w-3.5 h-3.5 text-amber-500" />
                <span>{node.text}</span>
              </div>
              {node.children && (
                <div className="pl-5 space-y-1 border-l border-zinc-200 dark:border-zinc-800 ml-2">
                  {node.children.map((child, cIdx) => (
                    <div key={child.id || cIdx} className="flex items-center gap-1.5 hover:bg-blue-500/20 px-1.5 py-0.5 rounded cursor-pointer text-zinc-600 dark:text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{child.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case 'ListView':
      const lvCols = properties.listViewColumns || [{ text: 'Имя', width: 120 }, { text: 'Размер', width: 80 }];
      const lvItems = properties.listViewItems || [
        { id: '1', text: 'Document.pdf', subItems: ['2.4 МБ'] },
        { id: '2', text: 'Photo.png', subItems: ['1.1 МБ'] },
      ];
      return (
        <div className="w-full h-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden text-xs text-zinc-800 dark:text-zinc-200 select-none shadow-2xs">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 font-semibold">
            {lvCols.map((c, i) => (
              <div key={i} className="px-2 py-1 border-r border-zinc-300 dark:border-zinc-700 truncate" style={{ width: c.width }}>
                {c.text}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-auto divide-y divide-zinc-100 dark:divide-zinc-850">
            {lvItems.map((item, i) => (
              <div key={item.id || i} className="flex items-center hover:bg-blue-500/10 px-1 py-1">
                <div className="px-2 truncate font-medium text-blue-600 dark:text-blue-400" style={{ width: lvCols[0]?.width || 120 }}>
                  📄 {item.text}
                </div>
                {item.subItems?.map((sub, sI) => (
                  <div key={sI} className="px-2 truncate text-zinc-500" style={{ width: lvCols[sI + 1]?.width || 80 }}>
                    {sub}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case 'RichTextBox':
      return (
        <div className="w-full h-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 overflow-auto text-xs text-zinc-800 dark:text-zinc-100 font-sans shadow-2xs leading-relaxed">
          {properties.text ? (
            <div className="prose dark:prose-invert text-xs">
              {properties.text.replace(/\\rtf1[\s\S]*/, 'Добро пожаловать в NextGen C# Designer! Текст с поддержкой стилей и цветов.')}
            </div>
          ) : (
            <span className="text-zinc-400 italic">Форматированный текст RichTextBox...</span>
          )}
        </div>
      );

    case 'DataChart':
      return (
        <div className="w-full h-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 flex flex-col justify-between select-none shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 pb-1">
            <span>📈 {properties.text || 'График данных (DataChart)'}</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/10 text-blue-500 rounded font-mono">ChartSeries</span>
          </div>
          <div className="flex-1 flex items-end justify-around gap-2 pt-3 px-2">
            {[40, 65, 85, 50, 95].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t transition-all group-hover:brightness-110"
                  style={{ height: `${val}%` }}
                />
                <span className="text-[9px] text-zinc-500 font-mono">X{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'Panel':
    default:
      return (
        <div
          style={{ ...bgStyle }}
          className={`w-full h-full border ${
            properties.borderStyle === 'None'
              ? 'border-transparent'
              : 'border-zinc-200 dark:border-zinc-800'
          } rounded-xs`}
        />
      );
  }
};
