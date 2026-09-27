import React, { useState } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { ControlType } from '../../types/ast';
import {
  Layers,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronRight,
  ChevronDown,
  AppWindow,
  Box,
  Square,
  Sparkles,
  Sliders,
  Maximize2,
  FolderTree,
} from 'lucide-react';

export const DocumentOutlinePanel: React.FC = () => {
  const {
    project,
    activeFormId,
    selectedNode,
    selectedNodes,
    selectNode,
    updateNodeProperties,
    deleteSelectedNodes,
    bringNodeToFront,
    sendNodeToBack,
    moveNodeOrder,
  } = useDesigner();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const currentFormId = activeFormId || project.rootFormId;
  const currentForm = project.nodes[currentFormId] || project.nodes[project.rootFormId];

  const toggleCollapse = (id: string) => {
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const matchesSearch = (name: string, type: string) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return name.toLowerCase().includes(q) || type.toLowerCase().includes(q);
  };

  const renderTreeNode = (nodeId: string, depth = 0): React.ReactNode => {
    const node = project.nodes[nodeId];
    if (!node) return null;

    const isSelected = project.selectedNodeIds.includes(node.id);
    const hasChildren = node.childrenIds && node.childrenIds.length > 0;
    const isForm = node.type === 'Form';
    const isCollapsed = collapsedNodes[node.id];

    if (!matchesSearch(node.properties.name, node.type) && !hasChildren) {
      return null;
    }

    return (
      <div key={node.id} className="text-xs">
        <div
          onClick={e => {
            e.stopPropagation();
            selectNode(node.id, e.shiftKey);
          }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`h-7 pr-2 flex items-center justify-between group cursor-pointer border-l-2 transition-colors select-none ${
            isSelected
              ? 'bg-blue-600/15 border-blue-500 text-blue-300 font-medium'
              : 'border-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  toggleCollapse(node.id);
                }}
                className="p-0.5 hover:text-white text-zinc-500"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 shrink-0" />
                )}
              </button>
            ) : (
              <span className="w-3 h-3 inline-block shrink-0" />
            )}

            {isForm ? (
              <AppWindow className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            ) : ['Panel', 'GroupBox', 'TabControl'].includes(node.type) ? (
              <Box className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Square className="w-3 h-3 text-zinc-500 shrink-0" />
            )}

            <span className="truncate font-mono">{node.properties.name}</span>
            <span className="text-[10px] text-zinc-500 font-sans shrink-0">({node.type})</span>
            {node.properties.tabIndex !== undefined && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-blue-400 font-mono border border-zinc-700/60 shrink-0">
                Tab: {node.properties.tabIndex}
              </span>
            )}
          </div>

          {/* Row Action Controls: Z-Index, Visibility, Lock */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {/* Visibility Toggle */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                updateNodeProperties(node.id, { visible: !node.properties.visible });
              }}
              title={node.properties.visible ? 'Скрыть контрол' : 'Показать контрол'}
              className="p-1 hover:text-white text-zinc-400 rounded cursor-pointer"
            >
              {node.properties.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-amber-400" />}
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
                className="p-1 hover:text-white text-zinc-400 rounded cursor-pointer"
              >
                {node.properties.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Child Nodes */}
        {hasChildren && !isCollapsed && (
          <div>
            {node.childrenIds.map(childId => renderTreeNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const hasSelectedNonForm = selectedNode && selectedNode.type !== 'Form';

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs bg-zinc-900 select-none">
      {/* 1. Header Toolbar with Z-Index Reordering buttons (Bring to Front / Send to Back) */}
      <div className="px-2 py-1.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-1 shrink-0">
        <span className="text-[11px] font-semibold text-zinc-400 truncate">
          Структура: <strong className="text-zinc-200">{currentForm?.properties.name || 'Form1'}</strong>
        </span>

        {/* Z-Index Controls */}
        <div className="flex items-center gap-0.5 text-zinc-400">
          <button
            type="button"
            disabled={!hasSelectedNonForm}
            onClick={() => hasSelectedNonForm && bringNodeToFront(selectedNode.id)}
            title="На самый передний план (Bring to Front / Z-Index Top)"
            className="p-1 hover:bg-zinc-800 text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:pointer-events-none rounded cursor-pointer transition-colors"
          >
            <ArrowUpToLine className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={!hasSelectedNonForm}
            onClick={() => hasSelectedNonForm && moveNodeOrder(selectedNode.id, 'up')}
            title="Переместить выше в иерархии (Move Up)"
            className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded cursor-pointer transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={!hasSelectedNonForm}
            onClick={() => hasSelectedNonForm && moveNodeOrder(selectedNode.id, 'down')}
            title="Переместить ниже в иерархии (Move Down)"
            className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded cursor-pointer transition-colors"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={!hasSelectedNonForm}
            onClick={() => hasSelectedNonForm && sendNodeToBack(selectedNode.id)}
            title="На самый задний план (Send to Back / Z-Index Bottom)"
            className="p-1 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 disabled:opacity-30 disabled:pointer-events-none rounded cursor-pointer transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
          </button>

          {hasSelectedNonForm && (
            <button
              type="button"
              onClick={deleteSelectedNodes}
              title="Удалить выбранный элемент"
              className="p-1 hover:bg-zinc-800 text-red-400 hover:text-red-300 rounded cursor-pointer transition-colors ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Search Filter Bar */}
      <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/50">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Найти контрол в документе..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded pl-8 pr-2.5 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
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

      {/* 3. Document Hierarchy Tree */}
      <div className="flex-1 overflow-y-auto py-1 font-mono text-xs">
        {currentForm ? (
          renderTreeNode(currentForm.id)
        ) : (
          <div className="p-4 text-center text-zinc-500 text-xs">
            Нет активной формы
          </div>
        )}
      </div>

      {/* 4. Footer Info */}
      <div className="p-2 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
        <span>Всего контролов: {Object.keys(project.nodes).length - 1}</span>
        {selectedNode && (
          <span className="text-blue-400 truncate max-w-[120px]">
            {selectedNode.properties.name}
          </span>
        )}
      </div>
    </div>
  );
};
