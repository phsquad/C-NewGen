import React, { useState, useEffect, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { sanitizeCsIdentifier, validateStrictCsIdentifier } from '../../utils/csharpSanitizer';
import { isPropertyDirty, getDefaultPropertyValue } from '../../utils/propertyDefaults';
import {
  getCategorizedEventsForControl,
  getDefaultEventForControl,
  getLiveEventMethodSnippet,
} from '../../utils/defaultEvents';
import { AnchorEditor } from './AnchorEditor';
import { DockEditor, DockStyleValue } from './DockEditor';
import { ColorPickerEditor } from './ColorPickerEditor';
import { FontEditor } from './FontEditor';
import { ToggleSwitch } from './ToggleSwitch';
import {
  Settings,
  Zap,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  MoveHorizontal,
  MoveVertical,
  ShieldAlert,
  ShieldCheck,
  Search,
  FolderTree,
  ArrowDownAZ,
  Tag,
  RotateCcw,
  Sparkles,
  Layers,
  FileCode,
  Link2,
  History,
  Clock,
} from 'lucide-react';

export const RightSidebar: React.FC = () => {
  const {
    project,
    selectedNode,
    selectedNodes,
    updateNodeProperties,
    updateMultipleNodesProperties,
    updateNodeBounds,
    updateMultipleNodeBounds,
    updateNodeEvents,
    deleteSelectedNodes,
    duplicateSelectedNodes,
    alignSelectedNodes,
    activeRightTab,
    setActiveRightTab,
    setCodeDockOpen,
    setEventStudioModal,
    historyJournal,
    redoJournal,
    jumpToHistoryStep,
    createCheckpoint,
    getHistoryMemorySizeKb,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDesigner();

  // Search and Sort Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'categorized' | 'alphabetical'>('categorized');
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Categories collapsed state
  const [activeCategory, setActiveCategory] = useState<Record<string, boolean>>({
    Appearance: true,
    Layout: true,
    Behavior: true,
    Window: true,
    Specific: true,
    Design: true,
  });

  const [customItemText, setCustomItemText] = useState('');
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [activeEventSnippetName, setActiveEventSnippetName] = useState<string | null>(null);
  const [collapsedEventCategories, setCollapsedEventCategories] = useState<Record<string, boolean>>({
    Action: true,
    Mouse: true,
    Keyboard: true,
    Window: true,
  });

  const [pendingCascadeRename, setPendingCascadeRename] = useState<{
    oldName: string;
    newName: string;
    eventsToRename: Record<string, string>;
  } | null>(null);

  // Pravka 9.3: All unique event handlers currently defined in the solution
  const allExistingProjectHandlers = useMemo(() => {
    const handlersSet = new Set<string>();
    Object.values(project.nodes).forEach(n => {
      if (n.events) {
        Object.values(n.events).forEach(h => {
          if (h && h.trim()) handlersSet.add(h.trim());
        });
      }
    });
    if (project.orphanedHandlers) {
      project.orphanedHandlers.forEach(o => {
        if (o.handlerName && o.handlerName.trim()) handlersSet.add(o.handlerName.trim());
      });
    }
    return Array.from(handlersSet).sort();
  }, [project.nodes, project.orphanedHandlers]);

  const toggleEventCategory = (cat: string) => {
    setCollapsedEventCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Determine if single or batch multi-selection mode
  const isMultiSelect = selectedNodes.length > 1;
  const fallbackForm =
    project.nodes[project.activeFormId] ||
    project.nodes[project.rootFormId] ||
    Object.values(project.nodes).find(n => n.type === 'Form') ||
    Object.values(project.nodes)[0] ||
    null;

  const primaryNode = selectedNode || (selectedNodes.length > 0 ? selectedNodes[0] : null) || fallbackForm;

  // 1. (Name) input state & strict validation
  const otherNames = useMemo(() => {
    if (!primaryNode) return [];
    return Object.values(project.nodes)
      .filter(n => n.id !== primaryNode.id)
      .map(n => n.properties.name);
  }, [project.nodes, primaryNode]);

  const [nameInput, setNameInput] = useState(primaryNode?.properties.name || '');

  useEffect(() => {
    if (primaryNode) {
      setNameInput(primaryNode.properties.name);
    }
  }, [primaryNode?.properties.name, primaryNode?.id]);

  if (!primaryNode) {
    return (
      <aside className="w-80 bg-[#18181f] border-l border-zinc-800 flex flex-col h-full text-zinc-500 items-center justify-center p-6 text-center select-none shrink-0">
        <Settings className="w-10 h-10 mb-3 text-zinc-700 animate-pulse" />
        <p className="text-sm font-medium text-zinc-400">Нет выбранных элементов</p>
        <p className="text-xs text-zinc-600 mt-1">
          Выберите элемент на холсте для редактирования его свойств.
        </p>
      </aside>
    );
  }

  const { properties, bounds, events, type, id } = primaryNode;
  const isForm = type === 'Form';

  // Strict Validation for (Name) - Pravka 6.3
  const nameValidation = validateStrictCsIdentifier(nameInput, otherNames);
  const nameSanitization = sanitizeCsIdentifier(nameInput, type, otherNames);

  const toggleCategory = (cat: string) => {
    setActiveCategory(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Pravka 10.2: Atomic Batch Multi-Property Setter
  const handleBatchPropChange = (key: string, val: any, recordHistory = true) => {
    if (isMultiSelect) {
      updateMultipleNodesProperties(selectedNodes.map(n => n.id), { [key]: val }, recordHistory);
    } else {
      updateNodeProperties(id, { [key]: val }, recordHistory);
    }
  };

  // Pravka 10.1: Text Input Coalescing (300ms debounce buffer)
  const textDebounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleDebouncedTextPropChange = (key: string, val: string) => {
    // 1. Immediately update visual state without creating intermediate undo history
    handleBatchPropChange(key, val, false);

    // 2. Schedule single atomic commit after 300ms pause
    if (textDebounceTimerRef.current) {
      clearTimeout(textDebounceTimerRef.current);
    }
    textDebounceTimerRef.current = setTimeout(() => {
      handleBatchPropChange(key, val, true);
    }, 300);
  };

  const handleFlushTextProp = (key: string, val: string) => {
    if (textDebounceTimerRef.current) {
      clearTimeout(textDebounceTimerRef.current);
      textDebounceTimerRef.current = null;
    }
    handleBatchPropChange(key, val, true);
  };

  const handleBatchBoundsChange = (dimension: 'width' | 'height', val: number) => {
    if (isMultiSelect) {
      const updates: Record<string, Partial<import('../../types/ast').LayoutBounds>> = {};
      selectedNodes.forEach(node => {
        updates[node.id] = { [dimension]: val };
      });
      updateMultipleNodeBounds(updates, true);
    } else {
      updateNodeBounds(id, { [dimension]: val });
    }
  };

  // Pravka 6.2: Reset property to default handler
  const handleResetProp = (propKey: string) => {
    const defVal = getDefaultPropertyValue(type, propKey);
    if (defVal !== undefined) {
      handleBatchPropChange(propKey, defVal);
    }
  };

  // Pravka 6.1: Value resolver for Multi-Selection
  const getMultiPropValue = (propKey: keyof typeof properties): any => {
    if (!isMultiSelect) return properties[propKey];
    const firstVal = selectedNodes[0]?.properties[propKey];
    const allSame = selectedNodes.every(n => n.properties[propKey] === firstVal);
    return allSame ? firstVal : undefined;
  };

  // Auto-generate Event handler name
  const handleAutoEventName = (eventName: string) => {
    const handler = `${properties.name}_${eventName}`;
    updateNodeEvents(id, { [eventName]: handler });
  };

  // Get common events
  const getAvailableEvents = (): string[] => {
    switch (type) {
      case 'Button': return ['Click', 'MouseEnter', 'MouseLeave', 'MouseDown', 'MouseUp'];
      case 'TextBox': return ['TextChanged', 'KeyDown', 'KeyPress', 'Enter', 'Leave'];
      case 'CheckBox':
      case 'RadioButton': return ['CheckedChanged', 'Click'];
      case 'ComboBox':
      case 'ListBox': return ['SelectedIndexChanged', 'SelectedValueChanged', 'DropDown'];
      case 'Form': return ['Load', 'FormClosing', 'Resize', 'Activated', 'Deactivate'];
      case 'ProgressBar': return ['ValueChanged'];
      case 'TabControl': return ['SelectedIndexChanged'];
      case 'DateTimePicker': return ['ValueChanged', 'CloseUp'];
      case 'NumericUpDown': return ['ValueChanged'];
      case 'PictureBox': return ['Click', 'DoubleClick', 'SizeModeChanged'];
      default: return ['Click', 'MouseEnter', 'MouseLeave'];
    }
  };

  const matchesSearch = (propName: string, category: string = '') => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return propName.toLowerCase().includes(q) || category.toLowerCase().includes(q);
  };

  // Helper row component with Dirty state indicator and [↺] Reset button (Pravka 6.2)
  const renderPropertyLabel = (label: string, propKey: string) => {
    const isDirty = !isMultiSelect && isPropertyDirty(type, propKey, properties[propKey as keyof typeof properties]);

    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={`text-xs select-none transition-colors ${
            isDirty ? 'text-zinc-100 font-bold' : 'text-zinc-400 font-normal'
          }`}
        >
          {label}
        </span>
        {isDirty && (
          <button
            type="button"
            onClick={() => handleResetProp(propKey)}
            title={`Сбросить ${label} на стандартное значение .NET`}
            className="p-0.5 rounded hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  if (isRightCollapsed) {
    return (
      <aside className="w-10 bg-zinc-900 border-l border-zinc-800 flex flex-col items-center py-2 text-zinc-400 select-none shrink-0 z-20">
        <button
          type="button"
          onClick={() => setIsRightCollapsed(false)}
          title="Развернуть Инспектор свойств [◀]"
          className="p-2 hover:bg-zinc-800 text-purple-400 rounded-lg transition-colors cursor-pointer mb-3"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsRightCollapsed(false)}
          title="Развернуть [◀]"
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1 text-[10px] font-mono [writing-mode:vertical-lr] rotate-180 text-zinc-500 tracking-wider py-4">
          ИНСПЕКТОР СВОЙСТВ & СОБЫТИЙ
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full select-none shrink-0 shadow-xl">
      {/* 1. Header with Selected Control Badge or Batch Multi-Select Badge */}
      <div className="p-2.5 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between gap-1">
        <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
          {isMultiSelect ? (
            /* Multi-Selection Badge */
            <div className="flex items-center gap-1.5 truncate min-w-0">
              <Layers className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
              <div className="truncate">
                <span className="text-[11px] font-semibold text-blue-300">
                  Выбрано: {selectedNodes.length} элементов
                </span>
                <div className="text-[10px] text-zinc-400 truncate">
                  {Array.from(new Set(selectedNodes.map(n => n.type))).join(', ')}
                </div>
              </div>
            </div>
          ) : (
            /* Single Node Badge: 🏷 Выбран: btnCE (Button) | Родитель: CalculatorForm */
            <div className="flex items-center gap-1.5 truncate min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <div className="flex items-center gap-1 truncate">
                <span className="text-blue-400 font-bold font-mono text-xs">{properties.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({type})</span>
              </div>
              <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700/60 shrink-0">
                {isForm ? 'Главная Форма' : 'Контрол'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {!isForm && (
              <>
                <button
                  type="button"
                  onClick={duplicateSelectedNodes}
                  title="Дублировать (Ctrl+D)"
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={deleteSelectedNodes}
                  title="Удалить (Del)"
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsRightCollapsed(true)}
              title="Свернуть правую панель [▶]"
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer shrink-0 ml-1"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Alignment Toolbar */}
        {!isForm && (
          <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-zinc-400">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => alignSelectedNodes('left')}
                title="По левому краю"
                className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => alignSelectedNodes('center')}
                title="По центру горизонтали"
                className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => alignSelectedNodes('right')}
                title="По правому краю"
                className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-3 w-px bg-zinc-800" />
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => alignSelectedNodes('top')}
                title="По верхнему краю"
                className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => alignSelectedNodes('middle')}
                title="По центру вертикали"
                className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => alignSelectedNodes('bottom')}
                title="По нижнему краю"
                className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-3 w-px bg-zinc-800" />
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => alignSelectedNodes('sameWidth')}
                title="Одинаковая ширина"
                className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
              >
                <MoveHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => alignSelectedNodes('sameHeight')}
                title="Одинаковая высота"
                className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
              >
                <MoveVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Tabs: [ ⚙️ Свойства ] vs [ ⚡️ События ] vs [ 🕒 История ] */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-950/60 p-1 gap-0.5">
        <button
          type="button"
          onClick={() => setActiveRightTab('properties')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
            activeRightTab === 'properties'
              ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-blue-400" />
          <span>Свойства</span>
        </button>
        <button
          type="button"
          disabled={isMultiSelect}
          onClick={() => !isMultiSelect && setActiveRightTab('events')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
            isMultiSelect
              ? 'opacity-40 cursor-not-allowed text-zinc-600'
              : activeRightTab === 'events'
              ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title={isMultiSelect ? 'События доступны только для одного выбранного элемента' : 'События C#'}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>События</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveRightTab('history')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
            activeRightTab === 'history'
              ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="История изменений и таймлайн операций"
        >
          <History className="w-3.5 h-3.5 text-purple-400" />
          <span>История</span>
        </button>
      </div>

      {/* 3. Search and Sort Modes Toolbar */}
      {activeRightTab === 'properties' && (
        <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/40 space-y-1.5">
          {/* Search Input: 🔍 [ Поиск свойства... ] */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск свойства..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded pl-7 pr-6 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Buttons: [ 🗂 По категориям ] [ 🔤 A-Z ] */}
          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800/80">
            <button
              type="button"
              onClick={() => setSortMode('categorized')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                sortMode === 'categorized'
                  ? 'bg-zinc-800 text-blue-400 font-medium shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FolderTree className="w-3 h-3" />
              <span>По категориям</span>
            </button>
            <button
              type="button"
              onClick={() => setSortMode('alphabetical')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                sortMode === 'alphabetical'
                  ? 'bg-zinc-800 text-blue-400 font-medium shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowDownAZ className="w-3 h-3" />
              <span>По алфавиту A-Z</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Properties Tab Body */}
      {activeRightTab === 'properties' && (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-3 text-xs">
          {/* Multi-Selection Info Banner (Pravka 6.1) */}
          {isMultiSelect && (
            <div className="p-2 bg-blue-950/40 border border-blue-800/50 rounded text-[11px] text-blue-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                Групповое редактирование: изменения применяются ко всем {selectedNodes.length} выбранным контролам.
              </span>
            </div>
          )}

          {/* CATEGORIZED MODE */}
          {sortMode === 'categorized' ? (
            <>
              {/* Category: Appearance (Внешний вид) */}
              {(matchesSearch('Text') ||
                matchesSearch('BackColor') ||
                matchesSearch('ForeColor') ||
                matchesSearch('Font') ||
                matchesSearch('FlatStyle') ||
                matchesSearch('BorderStyle')) && (
                <div className="border border-zinc-800/80 rounded bg-zinc-950/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory('Appearance')}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 text-[11px] font-semibold tracking-wider text-zinc-300 hover:text-zinc-100 cursor-pointer"
                  >
                    <span>▼ Внешний вид (Appearance)</span>
                    {activeCategory.Appearance ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {activeCategory.Appearance && (
                    <div className="p-2.5 space-y-2.5">
                      {/* Text */}
                      {!isMultiSelect && properties.text !== undefined && matchesSearch('Text') && (
                        <div className="flex items-center justify-between gap-2">
                          {renderPropertyLabel('Text', 'text')}
                          <input
                            type="text"
                            value={properties.text}
                            onChange={e => handleDebouncedTextPropChange('text', e.target.value)}
                            onBlur={e => handleFlushTextProp('text', e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleFlushTextProp('text', (e.target as HTMLInputElement).value);
                            }}
                            className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:border-blue-500 focus:outline-hidden font-sans"
                          />
                        </div>
                      )}

                      {/* BackColor */}
                      {matchesSearch('BackColor') && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            {renderPropertyLabel('BackColor', 'backColor')}
                          </div>
                          <ColorPickerEditor
                            label=""
                            value={getMultiPropValue('backColor') || '#2563EB'}
                            onChange={hex => handleBatchPropChange('backColor', hex)}
                            defaultColor="#2563EB"
                          />
                        </div>
                      )}

                      {/* ForeColor */}
                      {matchesSearch('ForeColor') && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            {renderPropertyLabel('ForeColor', 'foreColor')}
                          </div>
                          <ColorPickerEditor
                            label=""
                            value={getMultiPropValue('foreColor') || '#FFFFFF'}
                            onChange={hex => handleBatchPropChange('foreColor', hex)}
                            defaultColor="#FFFFFF"
                          />
                        </div>
                      )}

                      {/* Font */}
                      {matchesSearch('Font') && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            {renderPropertyLabel('Font', 'fontFamily')}
                          </div>
                          <FontEditor
                            fontFamily={getMultiPropValue('fontFamily') || 'Segoe UI'}
                            fontSize={getMultiPropValue('fontSize') || 9}
                            fontBold={Boolean(getMultiPropValue('fontBold'))}
                            onChangeFamily={f => handleBatchPropChange('fontFamily', f)}
                            onChangeSize={s => handleBatchPropChange('fontSize', s)}
                            onChangeBold={b => handleBatchPropChange('fontBold', b)}
                          />
                        </div>
                      )}

                      {/* FlatStyle */}
                      {(!isForm || isMultiSelect) && matchesSearch('FlatStyle') && (
                        <div className="flex items-center justify-between gap-2">
                          {renderPropertyLabel('FlatStyle', 'flatStyle')}
                          <select
                            value={getMultiPropValue('flatStyle') || 'Standard'}
                            onChange={e => handleBatchPropChange('flatStyle', e.target.value)}
                            className="bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-hidden"
                          >
                            <option value="Standard">Standard</option>
                            <option value="Flat">Flat</option>
                            <option value="Popup">Popup</option>
                            <option value="System">System</option>
                          </select>
                        </div>
                      )}

                      {/* BorderStyle */}
                      {!isMultiSelect && properties.borderStyle !== undefined && matchesSearch('BorderStyle') && (
                        <div className="flex items-center justify-between gap-2">
                          {renderPropertyLabel('BorderStyle', 'borderStyle')}
                          <select
                            value={properties.borderStyle || 'FixedSingle'}
                            onChange={e => handleBatchPropChange('borderStyle', e.target.value)}
                            className="bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-hidden"
                          >
                            <option value="None">None</option>
                            <option value="FixedSingle">FixedSingle</option>
                            <option value="Fixed3D">Fixed3D</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Category: Layout (Разметка) */}
              {(matchesSearch('Location') ||
                matchesSearch('Size') ||
                matchesSearch('Anchor') ||
                matchesSearch('Dock') ||
                matchesSearch('AutoSize') ||
                matchesSearch('AutoScroll')) && (
                <div className="border border-zinc-800/80 rounded bg-zinc-950/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory('Layout')}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 text-[11px] font-semibold tracking-wider text-zinc-300 hover:text-zinc-100 cursor-pointer"
                  >
                    <span>▼ Разметка (Layout)</span>
                    {activeCategory.Layout ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {activeCategory.Layout && (
                    <div className="p-2.5 space-y-2.5">
                      {/* Location (X, Y) */}
                      {!isForm && !isMultiSelect && matchesSearch('Location') && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            {renderPropertyLabel('Location (Point)', 'location')}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1">
                              <span className="text-[10px] text-zinc-500 font-mono">X:</span>
                              <input
                                type="number"
                                value={Math.round(bounds.x)}
                                onChange={e => updateNodeBounds(id, { x: parseInt(e.target.value, 10) || 0 })}
                                className="w-full bg-transparent border-none text-xs text-zinc-200 font-mono focus:outline-hidden"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1">
                              <span className="text-[10px] text-zinc-500 font-mono">Y:</span>
                              <input
                                type="number"
                                value={Math.round(bounds.y)}
                                onChange={e => updateNodeBounds(id, { y: parseInt(e.target.value, 10) || 0 })}
                                className="w-full bg-transparent border-none text-xs text-zinc-200 font-mono focus:outline-hidden"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Size (W, H) - Supports Multi-Selection batch resizing */}
                      {matchesSearch('Size') && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            {renderPropertyLabel(isForm ? 'ClientSize (Size)' : 'Size', 'size')}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1">
                              <span className="text-[10px] text-zinc-500 font-mono">W:</span>
                              <input
                                type="number"
                                min="12"
                                value={Math.round(bounds.width)}
                                onChange={e => handleBatchBoundsChange('width', Math.max(12, parseInt(e.target.value, 10) || 12))}
                                className="w-full bg-transparent border-none text-xs text-zinc-200 font-mono focus:outline-hidden"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1">
                              <span className="text-[10px] text-zinc-500 font-mono">H:</span>
                              <input
                                type="number"
                                min="12"
                                value={Math.round(bounds.height)}
                                onChange={e => handleBatchBoundsChange('height', Math.max(12, parseInt(e.target.value, 10) || 12))}
                                className="w-full bg-transparent border-none text-xs text-zinc-200 font-mono focus:outline-hidden"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Graphical Anchor Widget */}
                      {!isForm && matchesSearch('Anchor') && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            {renderPropertyLabel('Anchor', 'anchor')}
                          </div>
                          <AnchorEditor
                            anchor={getMultiPropValue('anchor') || ['Top', 'Left']}
                            onChange={anchors => handleBatchPropChange('anchor', anchors)}
                          />
                        </div>
                      )}

                      {/* Graphical Dock Widget */}
                      {!isForm && matchesSearch('Dock') && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            {renderPropertyLabel('Dock', 'dock')}
                          </div>
                          <DockEditor
                            dock={getMultiPropValue('dock') || 'None'}
                            onChange={dock => handleBatchPropChange('dock', dock)}
                          />
                        </div>
                      )}

                      {/* AutoSize Toggle */}
                      {!isMultiSelect && properties.autoSize !== undefined && matchesSearch('AutoSize') && (
                        <div className="flex items-center justify-between">
                          {renderPropertyLabel('AutoSize', 'autoSize')}
                          <ToggleSwitch
                            checked={Boolean(properties.autoSize)}
                            onChange={val => handleBatchPropChange('autoSize', val)}
                            label={properties.autoSize ? 'True' : 'False'}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Category: Behavior (Поведение) */}
              {(matchesSearch('Enabled') ||
                matchesSearch('Visible') ||
                matchesSearch('TabIndex') ||
                matchesSearch('AutoScroll')) && (
                <div className="border border-zinc-800/80 rounded bg-zinc-950/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory('Behavior')}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 text-[11px] font-semibold tracking-wider text-zinc-300 hover:text-zinc-100 cursor-pointer"
                  >
                    <span>▼ Поведение (Behavior)</span>
                    {activeCategory.Behavior ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {activeCategory.Behavior && (
                    <div className="p-2.5 space-y-2.5">
                      {/* Enabled Toggle */}
                      {matchesSearch('Enabled') && (
                        <div className="flex items-center justify-between">
                          {renderPropertyLabel('Enabled', 'enabled')}
                          <ToggleSwitch
                            checked={Boolean(getMultiPropValue('enabled') ?? true)}
                            onChange={val => handleBatchPropChange('enabled', val)}
                            label={Boolean(getMultiPropValue('enabled') ?? true) ? 'True' : 'False'}
                          />
                        </div>
                      )}

                      {/* Visible Toggle */}
                      {matchesSearch('Visible') && (
                        <div className="flex items-center justify-between">
                          {renderPropertyLabel('Visible', 'visible')}
                          <ToggleSwitch
                            checked={Boolean(getMultiPropValue('visible') ?? true)}
                            onChange={val => handleBatchPropChange('visible', val)}
                            label={Boolean(getMultiPropValue('visible') ?? true) ? 'True' : 'False'}
                          />
                        </div>
                      )}

                      {/* TabIndex */}
                      {!isForm && !isMultiSelect && matchesSearch('TabIndex') && (
                        <div className="flex items-center justify-between gap-2">
                          {renderPropertyLabel('TabIndex', 'tabIndex')}
                          <input
                            type="number"
                            value={properties.tabIndex ?? 0}
                            onChange={e => handleBatchPropChange('tabIndex', parseInt(e.target.value, 10) || 0)}
                            className="w-16 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono text-center focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Category: Specific (Специфичные свойства контрола) */}
              {!isMultiSelect &&
                (properties.items !== undefined ||
                  properties.progressValue !== undefined ||
                  properties.placeholder !== undefined ||
                  properties.checked !== undefined ||
                  properties.sizeMode !== undefined ||
                  properties.dropDownStyle !== undefined) && (
                <div className="border border-zinc-800/80 rounded bg-zinc-950/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory('Specific')}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 text-[11px] font-semibold tracking-wider text-zinc-300 hover:text-zinc-100 cursor-pointer"
                  >
                    <span>▼ Специфичные ({type})</span>
                    {activeCategory.Specific ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {activeCategory.Specific && (
                    <div className="p-2.5 space-y-2.5">
                      {/* Checked Toggle */}
                      {properties.checked !== undefined && matchesSearch('Checked') && (
                        <div className="flex items-center justify-between">
                          {renderPropertyLabel('Checked', 'checked')}
                          <ToggleSwitch
                            checked={Boolean(properties.checked)}
                            onChange={val => handleBatchPropChange('checked', val)}
                            label={properties.checked ? 'True' : 'False'}
                          />
                        </div>
                      )}

                      {/* Progress Value Slider */}
                      {properties.progressValue !== undefined && matchesSearch('Value') && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-zinc-400">
                            {renderPropertyLabel('Value', 'progressValue')}
                            <span className="font-mono text-cyan-400 font-semibold">{properties.progressValue}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={properties.progressValue}
                            onChange={e => handleBatchPropChange('progressValue', parseInt(e.target.value, 10))}
                            className="w-full accent-blue-600 cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Placeholder */}
                      {properties.placeholder !== undefined && matchesSearch('Placeholder') && (
                        <div className="flex items-center justify-between gap-2">
                          {renderPropertyLabel('Placeholder', 'placeholder')}
                          <input
                            type="text"
                            value={properties.placeholder}
                            onChange={e => handleBatchPropChange('placeholder', e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>
                      )}

                      {/* DropDownStyle */}
                      {properties.dropDownStyle !== undefined && matchesSearch('DropDownStyle') && (
                        <div className="flex items-center justify-between gap-2">
                          {renderPropertyLabel('DropDownStyle', 'dropDownStyle')}
                          <select
                            value={properties.dropDownStyle || 'DropDown'}
                            onChange={e => handleBatchPropChange('dropDownStyle', e.target.value)}
                            className="bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-hidden"
                          >
                            <option value="DropDown">DropDown</option>
                            <option value="DropDownList">DropDownList</option>
                            <option value="Simple">Simple</option>
                          </select>
                        </div>
                      )}

                      {/* Items Collection */}
                      {properties.items !== undefined && matchesSearch('Items') && (
                        <div>
                          <label className="text-zinc-400 block mb-1">
                            Items Collection ({properties.items.length})
                          </label>
                          <div className="space-y-1 max-h-32 overflow-y-auto mb-2 border border-zinc-800 rounded p-1 bg-zinc-950">
                            {properties.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-zinc-900 px-2 py-1 rounded text-[11px] text-zinc-300"
                              >
                                <span className="truncate">{item}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItems = properties.items!.filter((_, i) => i !== idx);
                                    handleBatchPropChange('items', newItems);
                                  }}
                                  className="text-zinc-500 hover:text-red-400 ml-2 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="Новый элемент..."
                              value={customItemText}
                              onChange={e => setCustomItemText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && customItemText.trim()) {
                                  handleBatchPropChange('items', [...(properties.items || []), customItemText.trim()]);
                                  setCustomItemText('');
                                }
                              }}
                              className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (customItemText.trim()) {
                                  handleBatchPropChange('items', [...(properties.items || []), customItemText.trim()]);
                                  setCustomItemText('');
                                }
                              }}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-200 font-semibold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Category: Design (Проектирование) */}
              {(matchesSearch('Name') || matchesSearch('Locked')) && (
                <div className="border border-zinc-800/80 rounded bg-zinc-950/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory('Design')}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 text-[11px] font-semibold tracking-wider text-zinc-300 hover:text-zinc-100 cursor-pointer"
                  >
                    <span>▼ Проектирование (Design)</span>
                    {activeCategory.Design ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {activeCategory.Design && (
                    <div className="p-2.5 space-y-2.5">
                      {/* (Name) - Strict C# Identifier Sanitizer & Cascade Event Rename (Pravka 9.2) */}
                      {!isMultiSelect && matchesSearch('Name') && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-zinc-400 w-20 shrink-0 font-medium">(Name)</label>
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={nameInput}
                                onChange={e => {
                                  const val = e.target.value;
                                  setNameInput(val);
                                  const res = sanitizeCsIdentifier(val, type, otherNames);
                                  if (res.isValidStrict) {
                                    const oldName = properties.name;
                                    const newName = res.sanitized;
                                    updateNodeProperties(id, { name: newName });

                                    // Check if events need cascade rename (Pravka 9.2)
                                    if (oldName !== newName && events && Object.keys(events).length > 0) {
                                      const renames: Record<string, string> = {};
                                      let hasMatch = false;
                                      Object.entries(events).forEach(([evt, handler]) => {
                                        if (handler === `${oldName}_${evt}` || handler.startsWith(`${oldName}_`)) {
                                          renames[evt] = `${newName}_${evt}`;
                                          hasMatch = true;
                                        }
                                      });
                                      if (hasMatch) {
                                        setPendingCascadeRename({ oldName, newName, eventsToRename: renames });
                                      }
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  const res = sanitizeCsIdentifier(nameInput, type, otherNames);
                                  setNameInput(res.sanitized);
                                  const oldName = properties.name;
                                  const newName = res.sanitized;
                                  updateNodeProperties(id, { name: newName });

                                  if (oldName !== newName && events && Object.keys(events).length > 0) {
                                    const renames: Record<string, string> = {};
                                    let hasMatch = false;
                                    Object.entries(events).forEach(([evt, handler]) => {
                                      if (handler === `${oldName}_${evt}` || handler.startsWith(`${oldName}_`)) {
                                        renames[evt] = `${newName}_${evt}`;
                                        hasMatch = true;
                                      }
                                    });
                                    if (hasMatch) {
                                      setPendingCascadeRename({ oldName, newName, eventsToRename: renames });
                                    }
                                  }
                                }}
                                placeholder="button1"
                                className={`w-full bg-zinc-900 border rounded px-2 py-1 text-xs font-mono focus:outline-hidden transition-colors ${
                                  !nameValidation.isValid
                                    ? 'border-red-500/90 bg-red-950/30 text-red-200 focus:border-red-400 ring-1 ring-red-500/50'
                                    : nameSanitization.wasModified
                                    ? 'border-amber-500/80 focus:border-amber-400 text-amber-200'
                                    : 'border-zinc-700/80 focus:border-blue-500 text-zinc-200'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Cascade Event Rename Confirmation Box (Pravka 9.2) */}
                          {pendingCascadeRename && (
                            <div className="p-2 rounded bg-blue-950/60 border border-blue-800/80 text-[11px] text-blue-200 space-y-1.5 animate-in fade-in">
                              <div className="flex items-center gap-1.5 font-semibold text-blue-300">
                                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span>Каскадное переименование связки (Cascade Rename):</span>
                              </div>
                              <div className="text-[10px] text-zinc-300 leading-tight">
                                Переименовать привязанный обработчик в{' '}
                                <strong className="text-emerald-300 font-mono">
                                  {Object.values(pendingCascadeRename.eventsToRename)[0]}
                                </strong>?
                              </div>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateNodeEvents(id, pendingCascadeRename.eventsToRename);
                                    setPendingCascadeRename(null);
                                  }}
                                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  ✔ Переименовать
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingCascadeRename(null)}
                                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded text-[10px] cursor-pointer"
                                >
                                  Оставить как есть
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Error or Auto-Correction Warning Badge (Pravka 6.3) */}
                          {!nameValidation.isValid && (
                            <div className="p-2 rounded bg-red-950/40 border border-red-800/70 text-[10px] text-red-300 space-y-1">
                              <div className="flex items-center gap-1.5 font-semibold text-red-400">
                                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                <span>Ошибка валидации C#:</span>
                              </div>
                              <div className="text-[10px] text-red-200">
                                {nameValidation.errorMessage}
                              </div>
                              <div className="flex items-center justify-between bg-zinc-950/90 px-2 py-1 rounded font-mono text-zinc-200 border border-zinc-800 mt-1">
                                <span className="text-emerald-400 font-bold">{nameSanitization.sanitized}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNameInput(nameSanitization.sanitized);
                                    updateNodeProperties(id, { name: nameSanitization.sanitized });
                                  }}
                                  className="text-[9px] text-zinc-300 hover:text-white px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
                                >
                                  Применить
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Locked Toggle */}
                      {!isForm && matchesSearch('Locked') && (
                        <div className="flex items-center justify-between">
                          {renderPropertyLabel('Locked', 'locked')}
                          <ToggleSwitch
                            checked={Boolean(getMultiPropValue('locked'))}
                            onChange={val => handleBatchPropChange('locked', val)}
                            label={Boolean(getMultiPropValue('locked')) ? 'True' : 'False'}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* ALPHABETICAL (A-Z) FLAT MODE WITH DIRTY TRACKING & RESET */
            <div className="border border-zinc-800/80 rounded bg-zinc-950/40 p-2.5 space-y-3">
              {/* (Name) */}
              {!isMultiSelect && matchesSearch('Name') && (
                <div className="flex items-center justify-between gap-2">
                  <label className="text-zinc-400 w-24 shrink-0 font-medium">(Name)</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => {
                      setNameInput(e.target.value);
                      const res = sanitizeCsIdentifier(e.target.value, type, otherNames);
                      if (res.isValidStrict) {
                        updateNodeProperties(id, { name: res.sanitized });
                      }
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 font-mono"
                  />
                </div>
              )}

              {/* Anchor */}
              {!isForm && matchesSearch('Anchor') && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    {renderPropertyLabel('Anchor', 'anchor')}
                  </div>
                  <AnchorEditor
                    anchor={getMultiPropValue('anchor') || ['Top', 'Left']}
                    onChange={anchors => handleBatchPropChange('anchor', anchors)}
                  />
                </div>
              )}

              {/* AutoSize */}
              {!isMultiSelect && properties.autoSize !== undefined && matchesSearch('AutoSize') && (
                <div className="flex items-center justify-between">
                  {renderPropertyLabel('AutoSize', 'autoSize')}
                  <ToggleSwitch
                    checked={Boolean(properties.autoSize)}
                    onChange={val => handleBatchPropChange('autoSize', val)}
                    label={properties.autoSize ? 'True' : 'False'}
                  />
                </div>
              )}

              {/* BackColor */}
              {matchesSearch('BackColor') && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    {renderPropertyLabel('BackColor', 'backColor')}
                  </div>
                  <ColorPickerEditor
                    label=""
                    value={getMultiPropValue('backColor') || '#2563EB'}
                    onChange={hex => handleBatchPropChange('backColor', hex)}
                    defaultColor="#2563EB"
                  />
                </div>
              )}

              {/* BorderStyle */}
              {!isMultiSelect && properties.borderStyle !== undefined && matchesSearch('BorderStyle') && (
                <div className="flex items-center justify-between gap-2">
                  {renderPropertyLabel('BorderStyle', 'borderStyle')}
                  <select
                    value={properties.borderStyle || 'FixedSingle'}
                    onChange={e => handleBatchPropChange('borderStyle', e.target.value)}
                    className="bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-hidden"
                  >
                    <option value="None">None</option>
                    <option value="FixedSingle">FixedSingle</option>
                    <option value="Fixed3D">Fixed3D</option>
                  </select>
                </div>
              )}

              {/* Checked */}
              {!isMultiSelect && properties.checked !== undefined && matchesSearch('Checked') && (
                <div className="flex items-center justify-between">
                  {renderPropertyLabel('Checked', 'checked')}
                  <ToggleSwitch
                    checked={Boolean(properties.checked)}
                    onChange={val => handleBatchPropChange('checked', val)}
                    label={properties.checked ? 'True' : 'False'}
                  />
                </div>
              )}

              {/* Dock */}
              {!isForm && matchesSearch('Dock') && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    {renderPropertyLabel('Dock', 'dock')}
                  </div>
                  <DockEditor
                    dock={getMultiPropValue('dock') || 'None'}
                    onChange={dock => handleBatchPropChange('dock', dock)}
                  />
                </div>
              )}

              {/* Enabled */}
              {matchesSearch('Enabled') && (
                <div className="flex items-center justify-between">
                  {renderPropertyLabel('Enabled', 'enabled')}
                  <ToggleSwitch
                    checked={Boolean(getMultiPropValue('enabled') ?? true)}
                    onChange={val => handleBatchPropChange('enabled', val)}
                    label={Boolean(getMultiPropValue('enabled') ?? true) ? 'True' : 'False'}
                  />
                </div>
              )}

              {/* FlatStyle */}
              {(!isForm || isMultiSelect) && matchesSearch('FlatStyle') && (
                <div className="flex items-center justify-between gap-2">
                  {renderPropertyLabel('FlatStyle', 'flatStyle')}
                  <select
                    value={getMultiPropValue('flatStyle') || 'Standard'}
                    onChange={e => handleBatchPropChange('flatStyle', e.target.value)}
                    className="bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-hidden"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Flat">Flat</option>
                    <option value="Popup">Popup</option>
                    <option value="System">System</option>
                  </select>
                </div>
              )}

              {/* Font */}
              {matchesSearch('Font') && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    {renderPropertyLabel('Font', 'fontFamily')}
                  </div>
                  <FontEditor
                    fontFamily={getMultiPropValue('fontFamily') || 'Segoe UI'}
                    fontSize={getMultiPropValue('fontSize') || 9}
                    fontBold={Boolean(getMultiPropValue('fontBold'))}
                    onChangeFamily={f => handleBatchPropChange('fontFamily', f)}
                    onChangeSize={s => handleBatchPropChange('fontSize', s)}
                    onChangeBold={b => handleBatchPropChange('fontBold', b)}
                  />
                </div>
              )}

              {/* ForeColor */}
              {matchesSearch('ForeColor') && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    {renderPropertyLabel('ForeColor', 'foreColor')}
                  </div>
                  <ColorPickerEditor
                    label=""
                    value={getMultiPropValue('foreColor') || '#FFFFFF'}
                    onChange={hex => handleBatchPropChange('foreColor', hex)}
                    defaultColor="#FFFFFF"
                  />
                </div>
              )}

              {/* Location */}
              {!isForm && !isMultiSelect && matchesSearch('Location') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    {renderPropertyLabel('Location', 'location')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1">
                      <span className="text-[10px] text-zinc-500 font-mono">X:</span>
                      <input
                        type="number"
                        value={Math.round(bounds.x)}
                        onChange={e => updateNodeBounds(id, { x: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-transparent border-none text-xs text-zinc-200 font-mono focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1">
                      <span className="text-[10px] text-zinc-500 font-mono">Y:</span>
                      <input
                        type="number"
                        value={Math.round(bounds.y)}
                        onChange={e => updateNodeBounds(id, { y: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-transparent border-none text-xs text-zinc-200 font-mono focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Locked */}
              {!isForm && matchesSearch('Locked') && (
                <div className="flex items-center justify-between">
                  {renderPropertyLabel('Locked', 'locked')}
                  <ToggleSwitch
                    checked={Boolean(getMultiPropValue('locked'))}
                    onChange={val => handleBatchPropChange('locked', val)}
                    label={Boolean(getMultiPropValue('locked')) ? 'True' : 'False'}
                  />
                </div>
              )}

              {/* Size */}
              {matchesSearch('Size') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    {renderPropertyLabel(isForm ? 'ClientSize' : 'Size', 'size')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1">
                      <span className="text-[10px] text-zinc-500 font-mono">W:</span>
                      <input
                        type="number"
                        min="12"
                        value={Math.round(bounds.width)}
                        onChange={e => handleBatchBoundsChange('width', Math.max(12, parseInt(e.target.value, 10) || 12))}
                        className="w-full bg-transparent border-none text-xs text-zinc-200 font-mono focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1">
                      <span className="text-[10px] text-zinc-500 font-mono">H:</span>
                      <input
                        type="number"
                        min="12"
                        value={Math.round(bounds.height)}
                        onChange={e => handleBatchBoundsChange('height', Math.max(12, parseInt(e.target.value, 10) || 12))}
                        className="w-full bg-transparent border-none text-xs text-zinc-200 font-mono focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TabIndex */}
              {!isForm && !isMultiSelect && matchesSearch('TabIndex') && (
                <div className="flex items-center justify-between gap-2">
                  {renderPropertyLabel('TabIndex', 'tabIndex')}
                  <input
                    type="number"
                    value={properties.tabIndex ?? 0}
                    onChange={e => handleBatchPropChange('tabIndex', parseInt(e.target.value, 10) || 0)}
                    className="w-16 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono text-center focus:outline-hidden"
                  />
                </div>
              )}

              {/* Text */}
              {!isMultiSelect && properties.text !== undefined && matchesSearch('Text') && (
                <div className="flex items-center justify-between gap-2">
                  {renderPropertyLabel('Text', 'text')}
                  <input
                    type="text"
                    value={properties.text}
                    onChange={e => handleBatchPropChange('text', e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-hidden font-sans"
                  />
                </div>
              )}

              {/* Visible */}
              {matchesSearch('Visible') && (
                <div className="flex items-center justify-between">
                  {renderPropertyLabel('Visible', 'visible')}
                  <ToggleSwitch
                    checked={Boolean(getMultiPropValue('visible') ?? true)}
                    onChange={val => handleBatchPropChange('visible', val)}
                    label={Boolean(getMultiPropValue('visible') ?? true) ? 'True' : 'False'}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Events Tab Content (Anatomy of C# Events Tab) */}
      {activeRightTab === 'events' && (
        <div className="flex-1 flex flex-col overflow-hidden text-xs">
          {/* Quick No-Code Action Creator Banner */}
          <div className="p-2.5 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border-b border-zinc-800 shrink-0 space-y-2">
            <button
              type="button"
              onClick={() => {
                const evtName = activeEventSnippetName || (type === 'Form' ? 'Load' : 'Click');
                setEventStudioModal({
                  isOpen: true,
                  nodeId: id,
                  controlName: properties.name,
                  eventName: evtName,
                });
              }}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition cursor-pointer text-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>🪄 Добавить No-Code действие...</span>
            </button>
            <div className="text-[10px] text-zinc-400 text-center flex items-center justify-center gap-1.5">
              <span>Событие:</span>
              <strong className="text-amber-300 font-mono">
                {activeEventSnippetName || (type === 'Form' ? 'Load' : 'Click')}
              </strong>
              <span>для</span>
              <strong className="text-blue-300 font-mono">{properties.name}</strong>
            </div>
          </div>

          {/* Events Search Bar */}
          <div className="p-2 border-b border-zinc-800 bg-zinc-950/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Поиск события (Click, Load, KeyDown)..."
                value={eventSearchQuery}
                onChange={e => setEventSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded pl-7 pr-6 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
              />
              {eventSearchQuery && (
                <button
                  type="button"
                  onClick={() => setEventSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Categorized Events List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
            {getCategorizedEventsForControl(type).map(group => {
              const filteredEvents = group.events.filter(evt =>
                !eventSearchQuery.trim() ||
                evt.name.toLowerCase().includes(eventSearchQuery.toLowerCase().trim()) ||
                group.title.toLowerCase().includes(eventSearchQuery.toLowerCase().trim())
              );

              if (filteredEvents.length === 0) return null;

              const isCollapsed = collapsedEventCategories[group.category] ?? true;

              return (
                <div key={group.category} className="border border-zinc-800/80 rounded bg-zinc-950/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleEventCategory(group.category)}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 text-[11px] font-semibold tracking-wider text-zinc-300 hover:text-zinc-100 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{group.title}</span>
                    </span>
                    {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  {isCollapsed && (
                    <div className="p-2 space-y-2">
                      {filteredEvents.map(evt => {
                        const currentHandler = events?.[evt.name] || '';
                        const isWired = Boolean(currentHandler.trim());
                        const isDefault = evt.isDefault;

                        return (
                          <div
                            key={evt.name}
                            onClick={() => setActiveEventSnippetName(evt.name)}
                            className={`p-2 rounded border transition-colors cursor-pointer ${
                              activeEventSnippetName === evt.name
                                ? 'bg-zinc-900 border-amber-500/70 ring-1 ring-amber-500/30'
                                : isWired
                                ? 'bg-zinc-900/90 border-emerald-800/60'
                                : 'bg-zinc-900/40 border-zinc-800/70 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`w-1.5 h-1.5 rounded-full ${isWired ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                                <span className="font-semibold text-zinc-200 font-mono text-[11px]">{evt.name}</span>
                                {isDefault && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans">
                                    По умолчанию
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setActiveEventSnippetName(evt.name);
                                    setEventStudioModal({
                                      isOpen: true,
                                      nodeId: id,
                                      controlName: properties.name,
                                      eventName: evt.name,
                                    });
                                  }}
                                  title={`Открыть C# редактор события ${evt.name} (F7)`}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 border border-zinc-700 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Zap className="w-2.5 h-2.5" />
                                  <span>Код (F7)</span>
                                </button>
                                {isWired && (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      updateNodeEvents(id, { [evt.name]: '' });
                                    }}
                                    title="Удалить привязку метода"
                                    className="p-0.5 rounded text-zinc-500 hover:text-red-400 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleAutoEventName(evt.name);
                                    setActiveEventSnippetName(evt.name);
                                  }}
                                  title="Автоматически сгенерировать имя обработчика"
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 transition-colors cursor-pointer ${
                                    isWired
                                      ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Авто</span>
                                </button>
                              </div>
                            </div>

                            {/* Input & Wire Status Tag */}
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                placeholder={`[${properties.name}_${evt.name}]`}
                                value={currentHandler}
                                onChange={e => {
                                  updateNodeEvents(id, { [evt.name]: e.target.value.trim() });
                                  setActiveEventSnippetName(evt.name);
                                }}
                                className={`w-full bg-zinc-950 border rounded px-2 py-1 text-xs font-mono focus:outline-hidden ${
                                  isWired
                                    ? 'border-emerald-600/70 text-emerald-300 font-semibold'
                                    : 'border-zinc-800 text-zinc-400 placeholder:text-zinc-600'
                                }`}
                              />
                              {isWired && (
                                <span className="absolute right-2 text-[10px] text-emerald-400 font-sans pointer-events-none">
                                  ◄ (Связано)
                                </span>
                              )}
                            </div>

                            {/* Pravka 9.3: Shared Handler Binding Selector */}
                            {allExistingProjectHandlers.length > 0 && (
                              <div className="mt-1 flex items-center gap-1.5 bg-zinc-950/80 px-1.5 py-0.5 rounded border border-zinc-800">
                                <Link2 className="w-3 h-3 text-cyan-400 shrink-0" />
                                <select
                                  value={currentHandler || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val) {
                                      updateNodeEvents(id, { [evt.name]: val });
                                      setActiveEventSnippetName(evt.name);
                                    }
                                  }}
                                  className="w-full bg-transparent border-none text-[10px] text-zinc-300 focus:outline-hidden font-mono cursor-pointer"
                                >
                                  <option value="" className="bg-zinc-900 text-zinc-500">
                                    🔗 Связать с существующим методом (Shared)...
                                  </option>
                                  {allExistingProjectHandlers.map(h => (
                                    <option key={h} value={h} className="bg-zinc-900 text-cyan-300">
                                      {h} {currentHandler === h ? '✔ (Связан)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="text-[10px] text-zinc-500 mt-1 leading-tight">{evt.description}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3. Live Snippet Box of Form1.cs Method Body */}
          <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Живой срез файла {properties.name}.cs (Code-Behind):</span>
              </span>
            </div>

            {/* Formatted C# Method Snippet Preview */}
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 overflow-x-auto leading-4 shadow-inner">
              <pre className="m-0 text-emerald-300 font-mono">
                {getLiveEventMethodSnippet(
                  events?.[activeEventSnippetName || (type === 'Form' ? 'Load' : 'Click')] ||
                    `${properties.name}_${activeEventSnippetName || (type === 'Form' ? 'Load' : 'Click')}`,
                  properties.name,
                  activeEventSnippetName || (type === 'Form' ? 'Load' : 'Click'),
                  type
                )}
              </pre>
            </div>

            <button
              type="button"
              onClick={() => {
                const evtName = activeEventSnippetName || (type === 'Form' ? 'Load' : 'Click');
                setEventStudioModal({
                  isOpen: true,
                  nodeId: id,
                  controlName: properties.name,
                  eventName: evtName,
                });
              }}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <span>⚡️ Открыть 2-in-1 Event Studio ({properties.name})</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. History Timeline Tab Content */}
      {activeRightTab === 'history' && (
        <div className="flex-1 flex flex-col overflow-hidden text-xs">
          {/* Quick Memory & Info Banner */}
          <div className="p-3 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Размер истории:</span>
              <strong className="text-zinc-200 font-semibold">{getHistoryMemorySizeKb()} KB</strong>
            </div>
            <div className="text-[10px] bg-purple-900/20 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40">
              Шагов: {historyJournal.length + redoJournal.length}
            </div>
          </div>

          {/* Manual Save Point / Checkpoint Creator */}
          <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/40 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
              🏁 Создать контрольную точку
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Имя точки (например: До редизайна)"
                value={checkpointLabel}
                onChange={(e) => setCheckpointLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && checkpointLabel.trim()) {
                    createCheckpoint(checkpointLabel);
                    setCheckpointLabel('');
                  }
                }}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => {
                  if (checkpointLabel.trim()) {
                    createCheckpoint(checkpointLabel);
                    setCheckpointLabel('');
                  }
                }}
                disabled={!checkpointLabel.trim()}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                Создать
              </button>
            </div>
          </div>

          {/* Core Timeline List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
              ⏳ Хронология операций
            </span>

            <div className="relative border-l border-zinc-800 pl-4 ml-2.5 space-y-3 py-1">
              {/* Initial Session State */}
              <div 
                onClick={() => jumpToHistoryStep(0)}
                className={`group relative flex items-center justify-between p-2 rounded border transition-all cursor-pointer ${
                  historyJournal.length === 0
                    ? 'bg-purple-950/20 border-purple-500/50 shadow-md shadow-purple-500/5 text-purple-200'
                    : 'bg-zinc-900/30 border-zinc-800/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {/* Visual marker dot */}
                <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border ${
                  historyJournal.length === 0
                    ? 'bg-purple-400 border-purple-400 animate-pulse scale-110 shadow-lg'
                    : 'bg-zinc-950 border-zinc-700 group-hover:border-zinc-500'
                }`} />

                <div className="flex flex-col min-w-0 pr-1">
                  <span className={`text-[11px] font-bold ${historyJournal.length === 0 ? 'text-purple-300' : 'text-zinc-400'}`}>
                    🚀 НАЧАЛО СЕССИИ
                  </span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Исходное состояние проекта</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">00:00</span>
              </div>

              {/* History Commands (Past / Undoable) */}
              {historyJournal.map((cmd, idx) => {
                const isActive = idx === historyJournal.length - 1;
                const catEmoji = getCategoryEmoji(cmd.category);

                return (
                  <div
                    key={cmd.id}
                    onClick={() => jumpToHistoryStep(idx + 1)}
                    className={`group relative flex items-center justify-between p-2 rounded border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-950/20 border-purple-500/50 shadow-md shadow-purple-500/5 text-purple-200'
                        : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100'
                    }`}
                  >
                    {/* Visual marker dot */}
                    <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border ${
                      isActive
                        ? 'bg-purple-400 border-purple-400 scale-110 shadow-lg shadow-purple-400/50'
                        : 'bg-zinc-950 border-zinc-700 group-hover:border-zinc-500'
                    }`} />

                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[11px] font-semibold flex items-center gap-1">
                        <span>{catEmoji}</span>
                        <span className="truncate">{cmd.description}</span>
                      </span>
                      <span className="text-[9px] text-zinc-500 mt-0.5 flex items-center gap-1.5 uppercase font-mono">
                        <span className="text-zinc-600">{cmd.category}</span>
                        {cmd.isCheckpoint && (
                          <span className="bg-amber-500/10 text-amber-400 text-[8px] px-1.5 py-0.2 rounded border border-amber-500/20 font-sans">
                            Точка
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end">
                      <span className="text-[9px] text-zinc-500 font-mono">{cmd.timeStr || '12:00:00'}</span>
                      <span className="text-[8px] text-purple-400 font-mono mt-0.5">#{idx + 1}</span>
                    </div>
                  </div>
                );
              })}

              {/* Redo Commands (Future / Redoable) */}
              {redoJournal.map((cmd, idx) => {
                const catEmoji = getCategoryEmoji(cmd.category);
                const targetStep = historyJournal.length + idx + 1;

                return (
                  <div
                    key={cmd.id}
                    onClick={() => jumpToHistoryStep(targetStep)}
                    className="group relative flex items-center justify-between p-2 rounded border bg-zinc-900/10 border-zinc-800/40 hover:bg-zinc-900/30 text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer opacity-50 hover:opacity-80 border-dashed"
                  >
                    {/* Visual marker dot */}
                    <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full border bg-zinc-950 border-zinc-800 group-hover:border-zinc-600" />

                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[11px] font-medium flex items-center gap-1 italic">
                        <span>{catEmoji}</span>
                        <span className="truncate">{cmd.description}</span>
                      </span>
                      <span className="text-[9px] text-zinc-600 mt-0.5 uppercase font-mono">
                        {cmd.category} (Отменено)
                      </span>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end">
                      <span className="text-[9px] text-zinc-600 font-mono">{cmd.timeStr}</span>
                      <span className="text-[8px] text-zinc-600 font-mono mt-0.5">+{idx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Undo/Redo Action footer */}
          <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="flex-1 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>↩</span>
              <span>Шаг назад</span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="flex-1 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Шаг вперед</span>
              <span>↪</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

function getCategoryEmoji(category: string): string {
  switch (category) {
    case 'create': return '➕';
    case 'delete': return '🗑️';
    case 'move': return '📦';
    case 'resize': return '↔️';
    case 'property': return '⚙️';
    case 'event': return '⚡';
    case 'theme': return '🎨';
    case 'align': return '📐';
    case 'template': return '🧩';
    case 'checkpoint': return '🏁';
    case 'order': return '🔀';
    case 'duplicate': return '👥';
    default: return '📝';
  }
}
