import React, { useState, useEffect } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { ControlType } from '../../types/ast';
import { COMPONENT_REGISTRY, ControlMetadata } from '../../utils/componentRegistry';
import { NuGetIngestor } from '../../utils/NuGetIngestor';
import { SolutionExplorerPro } from '../solution/SolutionExplorerPro';
import { DocumentOutlinePanel } from './DocumentOutlinePanel';
import {
  Search,
  Box,
  Layers,
  Type,
  Tag,
  CheckSquare,
  Disc,
  List,
  Percent,
  Image as ImageIcon,
  Square,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronRight,
  ChevronDown,
  Plus,
  AppWindow,
  Binary,
  Calendar,
  Table,
  FolderTree,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  TableProperties,
  HelpCircle,
  Menu,
  Wrench,
  Activity,
  GitFork,
  ListFilter,
  FileCode,
  BarChart3,
  Pin,
  PinOff,
} from 'lucide-react';

interface ToolItemDefinition {
  type: ControlType;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  meta: ControlMetadata;
}

const TOOLBOX_GROUPS: {
  key: 'Common' | 'Containers' | 'Menus' | 'Advanced' | 'Data';
  title: string;
  countLabel: string;
  types: ControlType[];
}[] = [
  {
    key: 'Common',
    title: '🔘 Кнопки и Ввод',
    countLabel: '14',
    types: [
      'Button',
      'ToggleSwitch',
      'CheckBox',
      'RadioButton',
      'IconButton',
      'SplitButton',
      'RepeatButton',
      'TextBox',
      'PasswordBox',
      'Label',
      'NumericUpDown',
      'TrackBar',
      'ComboBox',
      'ListBox',
    ],
  },
  {
    key: 'Containers',
    title: '📦 Контейнеры',
    countLabel: '4',
    types: ['Panel', 'GroupBox', 'TabControl', 'SplitContainer'],
  },
  {
    key: 'Menus',
    title: '📑 Меню и навигация',
    countLabel: '4',
    types: ['MenuStrip', 'ToolStrip', 'StatusStrip', 'ContextMenuStrip'],
  },
  {
    key: 'Advanced',
    title: '🌲 Списки и Деревья',
    countLabel: '7',
    types: ['TreeView', 'ListView', 'RichTextBox', 'CheckedListBox', 'DateTimePicker', 'Timer', 'BackgroundWorker'],
  },
  {
    key: 'Data',
    title: '📊 Данные и графика',
    countLabel: '7',
    types: ['DataGridView', 'DataChart', 'PictureBox', 'ProgressBar', 'ColorPicker', 'OpenFileDialog', 'SaveFileDialog'],
  },
];

const CONTROL_ICONS: Record<ControlType, { icon: React.ComponentType<{ className?: string }>; emoji: string }> = {
  Form: { icon: AppWindow, emoji: '🗔' },
  Button: { icon: Square, emoji: '🔘' },
  ToggleSwitch: { icon: Square, emoji: '🔘' },
  CheckBox: { icon: CheckSquare, emoji: '☑️' },
  RadioButton: { icon: Disc, emoji: '🔘' },
  IconButton: { icon: Square, emoji: '🔘' },
  SplitButton: { icon: Square, emoji: '🔘' },
  RepeatButton: { icon: Square, emoji: '🔘' },
  TextBox: { icon: Type, emoji: '📝' },
  PasswordBox: { icon: Lock, emoji: '🔒' },
  Label: { icon: Tag, emoji: '🏷️' },
  RichTextBox: { icon: FileCode, emoji: '📝' },
  NumericUpDown: { icon: Binary, emoji: '🔢' },
  TrackBar: { icon: Activity, emoji: '🎚️' },
  ComboBox: { icon: ChevronDown, emoji: '📋' },
  ListBox: { icon: List, emoji: '📜' },
  CheckedListBox: { icon: CheckSquare, emoji: '☑️' },
  TreeView: { icon: GitFork, emoji: '🌲' },
  ListView: { icon: ListFilter, emoji: '📑' },
  DateTimePicker: { icon: Calendar, emoji: '📅' },
  MenuStrip: { icon: Menu, emoji: '📑' },
  ToolStrip: { icon: Wrench, emoji: '🛠️' },
  StatusStrip: { icon: Activity, emoji: '📟' },
  ContextMenuStrip: { icon: Menu, emoji: '🖱️' },
  Panel: { icon: Box, emoji: '📦' },
  GroupBox: { icon: Layers, emoji: '🔲' },
  TabControl: { icon: FolderTree, emoji: '📑' },
  SplitContainer: { icon: Box, emoji: '↔️' },
  FlowLayoutPanel: { icon: Box, emoji: '📦' },
  DataGridView: { icon: Table, emoji: '▦' },
  DataChart: { icon: BarChart3, emoji: '📈' },
  PictureBox: { icon: ImageIcon, emoji: '🖼️' },
  ProgressBar: { icon: Percent, emoji: '📊' },
  ColorPicker: { icon: Sparkles, emoji: '🎨' },
  Timer: { icon: Activity, emoji: '⏱️' },
  BackgroundWorker: { icon: Binary, emoji: '⚡️' },
  OpenFileDialog: { icon: FolderOpen, emoji: '📂' },
  SaveFileDialog: { icon: FolderOpen, emoji: '💾' },
};

export const LeftSidebar: React.FC = () => {
  const {
    project,
    activeLeftTab,
    setActiveLeftTab,
    selectedNode,
    selectNode,
    addControl,
    applyQuickTemplate,
    deleteSelectedNodes,
    updateNodeProperties,
    setToolboxDragState,
  } = useDesigner();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const { toolboxDragState } = useDesigner();

  // Auto-collapse left sidebar on small laptops (< 1400px) (Правка 16.3)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1400) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleSetTab = (e: any) => {
      const tab = e.detail;
      if (tab === 'toggle') {
        setIsCollapsed(prev => !prev);
      } else {
        setActiveLeftTab(tab);
        setIsCollapsed(false);
      }
    };

    window.addEventListener('set-left-tab', handleSetTab);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('set-left-tab', handleSetTab);
    };
  }, [setActiveLeftTab]);

  const toggleCategory = (catKey: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const handleDragStart = (e: React.DragEvent, type: ControlType) => {
    e.dataTransfer.setData('controlType', type);
    e.dataTransfer.setData('application/x-control-type', type);
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';

    // Calculate future name (e.g. button2)
    const count = Object.values(project.nodes).filter(n => n.type === type).length + 1;
    const futureName = `${type.charAt(0).toLowerCase()}${type.slice(1)}${count}`;
    const targetParent = project.nodes[project.activeFormId || project.rootFormId];

    setToolboxDragState({
      isDragging: true,
      controlType: type,
      targetContainerId: targetParent?.id || null,
      targetContainerName: targetParent?.properties.name || 'Form1',
      futureName,
      localPos: { x: 64, y: 40 },
      screenPos: null,
    });
  };

  const handleDragEnd = () => {
    setToolboxDragState(null);
  };

  // Render DOM tree node recursively
  const renderTreeNode = (nodeId: string, depth = 0) => {
    const node = project.nodes[nodeId];
    if (!node) return null;

    const isSelected = project.selectedNodeIds.includes(node.id);
    const hasChildren = node.childrenIds && node.childrenIds.length > 0;
    const isForm = node.type === 'Form';

    return (
      <div key={node.id} className="text-xs">
        <div
          onClick={e => {
            e.stopPropagation();
            selectNode(node.id, e.shiftKey);
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`h-7 pr-2 flex items-center justify-between group cursor-pointer border-l-2 transition-colors ${
            isSelected
              ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-medium'
              : 'border-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {isForm ? (
              <AppWindow className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            ) : ['Panel', 'GroupBox', 'TabControl'].includes(node.type) ? (
              <Box className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Square className="w-3 h-3 text-zinc-500 shrink-0" />
            )}
            <span className="truncate">{node.properties.name}</span>
            <span className="text-[10px] text-zinc-600 dark:text-zinc-500">({node.type})</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Visibility Toggle */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                updateNodeProperties(node.id, { visible: !node.properties.visible });
              }}
              title={node.properties.visible ? 'Скрыть' : 'Показать'}
              className="p-1 hover:text-zinc-100 text-zinc-500"
            >
              {node.properties.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-amber-500" />}
            </button>

            {/* Lock Toggle */}
            {!isForm && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  updateNodeProperties(node.id, { locked: !node.properties.locked });
                }}
                title={node.properties.locked ? 'Разблокировать' : 'Заблокировать'}
                className="p-1 hover:text-zinc-100 text-zinc-500"
              >
                {node.properties.locked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Children nodes */}
        {hasChildren && (
          <div>
            {node.childrenIds.map(childId => renderTreeNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <>
        {/* 1. Slim Icon Rail (44px) */}
        <aside className="w-11 bg-zinc-900/95 backdrop-blur-md border-r border-zinc-800 flex flex-col items-center py-2.5 text-zinc-400 select-none shrink-0 z-30 space-y-3 shadow-lg">
          {/* Solution Explorer icon */}
          <button
            type="button"
            onClick={() => {
              setActiveLeftTab('solution');
              setIsFlyoutOpen((prev) => (activeLeftTab === 'solution' ? !prev : true));
            }}
            title="Обозреватель решений (Solution Explorer Pro)"
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeLeftTab === 'solution' && isFlyoutOpen
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 shadow-sm'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-amber-300'
            }`}
          >
            <FolderTree className="w-4 h-4" />
          </button>

          {/* Toolbox icon */}
          <button
            type="button"
            onClick={() => {
              setActiveLeftTab('toolbox');
              setIsFlyoutOpen((prev) => (activeLeftTab === 'toolbox' ? !prev : true));
            }}
            title="Палитра компонентов (Toolbox / 40+ элементов)"
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeLeftTab === 'toolbox' && isFlyoutOpen
                ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40 shadow-sm'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-blue-300'
            }`}
          >
            <Box className="w-4 h-4" />
          </button>

          {/* Document Outline icon */}
          <button
            type="button"
            onClick={() => {
              setActiveLeftTab('tree');
              setIsFlyoutOpen((prev) => (activeLeftTab === 'tree' ? !prev : true));
            }}
            title="Структура документа и Z-Index (Outline)"
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              (activeLeftTab === 'tree' || activeLeftTab === 'outline') && isFlyoutOpen
                ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40 shadow-sm'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-purple-300'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          <div className="w-5 h-px bg-zinc-800 my-1" />

          {/* Expand to Dock button */}
          <button
            type="button"
            onClick={() => {
              setIsCollapsed(false);
              setIsFlyoutOpen(false);
            }}
            title="Закрепить боковую панель [▶]"
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex-1 text-[10px] font-mono [writing-mode:vertical-lr] rotate-180 text-zinc-600 tracking-wider py-2 select-none">
            {activeLeftTab.toUpperCase()}
          </div>
        </aside>

        {/* 2. Floating Flyout Drawer Overlay (Opens on icon click without shifting canvas) */}
        {isFlyoutOpen && (
          <div
            className={`fixed left-11 top-12 bottom-7 w-76 bg-zinc-950/95 backdrop-blur-2xl border-r border-zinc-700 shadow-2xl z-40 flex flex-col transition-opacity duration-200 animate-in slide-in-from-left-4 ${
              toolboxDragState?.isDragging ? 'opacity-30 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Flyout Header */}
            <div className="p-2.5 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                {activeLeftTab === 'solution' && (
                  <>
                    <FolderTree className="w-4 h-4 text-amber-400" />
                    <span>Обозреватель решений</span>
                  </>
                )}
                {activeLeftTab === 'toolbox' && (
                  <>
                    <Box className="w-4 h-4 text-blue-400" />
                    <span>Палитра компонентов</span>
                  </>
                )}
                {(activeLeftTab === 'tree' || activeLeftTab === 'outline') && (
                  <>
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Структура документа</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCollapsed(false);
                    setIsFlyoutOpen(false);
                  }}
                  title="Закрепить панель (Dock)"
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>Закрепить</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFlyoutOpen(false)}
                  title="Закрыть шторку"
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Render Tab Content inside Flyout */}
            {activeLeftTab === 'solution' && <SolutionExplorerPro />}

            {activeLeftTab === 'toolbox' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 1. Search Bar */}
                <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/40">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Найти контрол..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors font-mono"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 text-zinc-500 hover:text-zinc-300 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. 1-Click Quick Templates */}
                <div className="p-2 border-b border-zinc-800/80 bg-zinc-950/50">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Быстрые шаблоны в 1 клик</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('open-templates-gallery'))}
                      className="flex items-center justify-between px-2 py-1.5 rounded bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-amber-300 font-bold transition-colors text-left"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                        <span className="truncate">📦 Галерея 100 шаблонов</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-400">100</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickTemplate('login')}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 hover:text-white transition-colors text-left"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="font-medium truncate">➕ Блок Авторизации</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickTemplate('tableFilter')}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 hover:text-white transition-colors text-left"
                    >
                      <TableProperties className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-medium truncate">➕ Таблица с Фильтром</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickTemplate('confirmDialog')}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 hover:text-white transition-colors text-left"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="font-medium truncate">➕ Диалог Подтверждения</span>
                    </button>
                  </div>
                </div>

                {/* 3. Control Groups Palette */}
                <div className="flex-1 overflow-y-auto p-2 space-y-3">
                  {TOOLBOX_GROUPS.map((group) => {
                    const isCollapsedCat = collapsedCategories[group.key];
                    const items = group.types
                      .filter((type) => {
                        const meta = COMPONENT_REGISTRY[type];
                        if (!meta) return false;
                        if (!searchQuery.trim()) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          type.toLowerCase().includes(query) ||
                          meta.displayName.toLowerCase().includes(query) ||
                          meta.description.toLowerCase().includes(query)
                        );
                      })
                      .map((type) => {
                        const meta = COMPONENT_REGISTRY[type];
                        const iconData = CONTROL_ICONS[type] || { icon: Square, emoji: '📦' };
                        return {
                          type,
                          meta,
                          emoji: iconData.emoji,
                          icon: iconData.icon,
                        };
                      });

                    if (items.length === 0) return null;

                    return (
                      <div key={group.key} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleCategory(group.key)}
                          className="w-full flex items-center justify-between text-zinc-400 hover:text-zinc-200 py-1 text-[11px] font-semibold border-b border-zinc-800/80 uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-1.5">
                            {isCollapsedCat ? (
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                            )}
                            <span className="text-zinc-300 font-bold">{group.title}</span>
                            <span className="text-zinc-500 font-mono text-[10px]">
                              ({items.length})
                            </span>
                          </div>
                        </button>

                        {!isCollapsedCat && (
                          <div className="grid grid-cols-1 gap-1 pt-1">
                            {items.map((item) => (
                              <div
                                key={item.type}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item.type)}
                                onDragEnd={handleDragEnd}
                                onClick={() => addControl(item.type)}
                                className="group flex items-center justify-between px-2.5 py-1.5 rounded bg-zinc-950/40 hover:bg-zinc-800/80 border border-zinc-800/60 hover:border-blue-500/50 cursor-grab active:cursor-grabbing transition-all text-xs text-zinc-300 hover:text-white"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-sm select-none">{item.emoji}</span>
                                  <div className="truncate">
                                    <span className="font-medium">{item.meta.displayName}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addControl(item.type);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-600 text-zinc-400 hover:text-white transition-all shrink-0 font-bold text-[10px]"
                                >
                                  +
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(activeLeftTab === 'tree' || activeLeftTab === 'outline') && <DocumentOutlinePanel />}
          </div>
        )}
      </>
    );
  }

  return (
    <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full select-none shrink-0 text-xs">
      {/* Tab Switcher & Collapse Toggle */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1">
        {/* Tab 1: Solution Explorer */}
        <button
          type="button"
          onClick={() => setActiveLeftTab('solution')}
          title="Обозреватель решений (Solution Explorer Pro)"
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 font-medium rounded transition-colors text-[11px] ${
            activeLeftTab === 'solution'
              ? 'bg-zinc-800 text-zinc-100 shadow-xs font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Решение</span>
        </button>

        {/* Tab 2: Toolbox */}
        <button
          type="button"
          onClick={() => setActiveLeftTab('toolbox')}
          title="Палитра компонентов (Toolbox)"
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 font-medium rounded transition-colors text-[11px] ${
            activeLeftTab === 'toolbox'
              ? 'bg-zinc-800 text-zinc-100 shadow-xs font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Box className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Палитра</span>
        </button>

        {/* Tab 3: Document Outline */}
        <button
          type="button"
          onClick={() => setActiveLeftTab('tree')}
          title="Структура документа и Z-Index (Document Outline)"
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 font-medium rounded transition-colors text-[11px] ${
            activeLeftTab === 'tree' || activeLeftTab === 'outline'
              ? 'bg-zinc-800 text-zinc-100 shadow-xs font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>Структура</span>
        </button>

        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          title="Свернуть левую панель [◀]"
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer shrink-0"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
      </div>

      {/* Content for Solution Explorer Pro Tab */}
      {activeLeftTab === 'solution' && <SolutionExplorerPro />}

      {/* Content for Toolbox Tab */}
      {activeLeftTab === 'toolbox' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 1. Search Bar: [ 🔍 Найти контрол... ] */}
          <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/40">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Найти контрол..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 2. 1-Click Quick Templates (Развилка Б) */}
          <div className="p-2 border-b border-zinc-800/80 bg-zinc-950/50">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Быстрые шаблоны в 1 клик</span>
            </div>
            <div className="grid grid-cols-1 gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => applyQuickTemplate('login')}
                title="Добавить готовую панель авторизации с полями логина, пароля и кнопками"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 hover:text-white transition-colors text-left"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-medium truncate">➕ Блок Авторизации</span>
              </button>

              <button
                type="button"
                onClick={() => applyQuickTemplate('tableFilter')}
                title="Добавить панель поиска с полем фильтрации и таблицей DataGridView"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 hover:text-white transition-colors text-left"
              >
                <TableProperties className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-medium truncate">➕ Таблица с Фильтром</span>
              </button>

              <button
                type="button"
                onClick={() => applyQuickTemplate('confirmDialog')}
                title="Добавить диалоговую группу подтверждения с кнопками Да / Отмена"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 hover:text-white transition-colors text-left"
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="font-medium truncate">➕ Диалог Подтверждения</span>
              </button>
            </div>
          </div>

          {/* 3. 15 Base Controls in 3 Collapsible Accordion Groups */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {TOOLBOX_GROUPS.map(group => {
              const groupItems = group.types
                .map(t => ({
                  type: t,
                  meta: COMPONENT_REGISTRY[t],
                  ...CONTROL_ICONS[t],
                }))
                .filter(item => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    item.type.toLowerCase().includes(q) ||
                    item.meta.displayName.toLowerCase().includes(q) ||
                    item.meta.description.toLowerCase().includes(q)
                  );
                });

              if (groupItems.length === 0) return null;
              const isCollapsed = collapsedCategories[group.key];

              return (
                <div key={group.key} className="space-y-1">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.key)}
                    className="w-full flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-zinc-400 hover:text-zinc-200 py-1 px-1 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>{isCollapsed ? '▶' : '▼'}</span>
                      <span>{group.title}</span>
                      <span className="text-zinc-500 font-mono text-[10px]">({group.countLabel})</span>
                    </div>
                    {isCollapsed ? <ChevronRight className="w-3 h-3 text-zinc-500" /> : <ChevronDown className="w-3 h-3 text-zinc-500" />}
                  </button>

                  {/* Controls Grid */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-1 gap-1">
                      {groupItems.map(item => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.type}
                            draggable
                            onDragStart={e => handleDragStart(e, item.type)}
                            onDragEnd={handleDragEnd}
                            onClick={() => addControl(item.type)}
                            title={`${item.meta.displayName}\nТип: ${item.meta.csharpType}\nРазмер: ${item.meta.defaultSize.width} × ${item.meta.defaultSize.height} px\n${item.meta.description}`}
                            className="group flex items-center justify-between px-2.5 py-1.5 rounded bg-zinc-800/40 hover:bg-zinc-800 hover:border-blue-500/50 border border-transparent cursor-grab active:cursor-grabbing transition-all text-xs text-zinc-300"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-sm select-none">{item.emoji}</span>
                              <div className="truncate">
                                <span className="font-medium text-zinc-200 group-hover:text-white">
                                  {item.type}
                                </span>
                                <span className="text-[10px] text-zinc-500 ml-1.5 hidden group-hover:inline">
                                  {item.meta.defaultSize.width}×{item.meta.defaultSize.height}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                addControl(item.type);
                              }}
                              title="Добавить на форму"
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-blue-600 hover:text-white text-zinc-400 transition-all shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 4. 21.3 Third-Party Custom Controls from Installed NuGet Packages */}
            {(() => {
              const nugetControls = NuGetIngestor.getAllCustomControls();
              if (nugetControls.length === 0) return null;

              return (
                <div className="space-y-1 pt-2 border-t border-zinc-800">
                  <div className="w-full flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-amber-400 py-1 px-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>📦 NuGet Контролы</span>
                      <span className="text-amber-500/80 font-mono text-[10px]">({nugetControls.length})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    {nugetControls.map((ctrl) => (
                      <div
                        key={ctrl.name}
                        onClick={() => addControl('Button')}
                        className="group flex items-center justify-between px-2.5 py-1.5 rounded bg-amber-950/20 hover:bg-amber-900/30 border border-amber-500/30 cursor-pointer transition-all text-xs text-amber-200"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm select-none">🎨</span>
                          <div className="truncate">
                            <span className="font-medium text-amber-200 group-hover:text-amber-100">
                              {ctrl.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 block truncate">
                              {ctrl.description}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addControl('Button');
                          }}
                          className="p-1 rounded bg-amber-600 hover:bg-amber-500 text-white transition-all shrink-0 font-bold text-[10px]"
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Content for Document Outline Tab */}
      {(activeLeftTab === 'tree' || activeLeftTab === 'outline') && <DocumentOutlinePanel />}
    </aside>
  );
};
