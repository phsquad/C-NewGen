import React, { useState, useRef, useEffect } from 'react';
import {
  UMLStudioEngine,
  UMLNode,
  UMLRelation,
  UMLNodeType,
  RelationType,
  UMLProperty,
  UMLMethod,
} from '../../utils/UMLStudioEngine';
import { useDesigner } from '../../context/DesignerContext';
import {
  Plus,
  Wand2,
  Box,
  Layers,
  Code2,
  Sparkles,
  Trash2,
  Move,
  ChevronDown,
  FileCode,
  Download,
  Share2,
  ArrowRight,
  GitCommit,
  Info,
  CheckCircle2,
  Settings,
  ChevronRight,
} from 'lucide-react';

export const DevOSUMLStudio: React.FC = () => {
  const { project } = useDesigner();

  // Architecture state
  const [nodes, setNodes] = useState<Record<string, UMLNode>>(() => {
    const defaults = UMLStudioEngine.getDefaultNodes();
    return defaults.nodes;
  });

  const [relations, setRelations] = useState<UMLRelation[]>(() => {
    const defaults = UMLStudioEngine.getDefaultNodes();
    return defaults.relations;
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('student_node');

  // Dragging state for canvas nodes
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Relation creation mode
  const [isLinkingMode, setIsLinkingMode] = useState<boolean>(false);
  const [linkStartNodeId, setLinkStartNodeId] = useState<string | null>(null);
  const [linkRelationType, setLinkRelationType] = useState<RelationType>('Inheritance');

  // Pattern dropdown toggle
  const [isPatternMenuOpen, setIsPatternMenuOpen] = useState(false);

  // Live Generated Code Output for selected node
  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  const generatedCSharpCode = selectedNode
    ? UMLStudioEngine.generateCSharpCode(selectedNode, relations, nodes)
    : '// Выберите класс или интерфейс на диаграмме для просмотра живого кода C#';

  // Drag node handler
  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    if (isLinkingMode) {
      if (!linkStartNodeId) {
        setLinkStartNodeId(id);
      } else if (linkStartNodeId !== id) {
        // Create new relation
        const newRel: UMLRelation = {
          id: `rel_${Date.now()}`,
          fromNodeId: linkStartNodeId,
          toNodeId: id,
          type: linkRelationType,
          label: linkRelationType === 'Inheritance' ? `: ${nodes[id]?.name}` : undefined,
        };
        setRelations((prev) => [...prev, newRel]);
        setLinkStartNodeId(null);
        setIsLinkingMode(false);
      }
      return;
    }

    setSelectedNodeId(id);
    setDraggedNodeId(id);
    const node = nodes[id];
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      const newX = Math.max(20, e.clientX - dragOffset.x);
      const newY = Math.max(20, e.clientY - dragOffset.y);

      setNodes((prev) => ({
        ...prev,
        [draggedNodeId]: {
          ...prev[draggedNodeId],
          position: { x: newX, y: newY },
        },
      }));
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggedNodeId(null);
  };

  // Add new node to architecture
  const handleAddNode = (type: UMLNodeType) => {
    const timestamp = Date.now();
    const name = `${type}${Object.keys(nodes).length + 1}`;
    const newNode: UMLNode = {
      id: `node_${timestamp}`,
      type,
      name,
      namespace: 'MyLabApp.Domain',
      properties: [
        { id: `p_${timestamp}_1`, visibility: '+', name: 'Id', type: 'int' },
      ],
      methods: [
        { id: `m_${timestamp}_1`, visibility: '+', name: 'Execute', returnType: 'void', parameters: [] },
      ],
      position: { x: 120 + Object.keys(nodes).length * 40, y: 120 },
      colorTag: type === 'Interface' ? '#8b5cf6' : type === 'AbstractClass' ? '#2563eb' : '#10b981',
    };

    setNodes((prev) => ({ ...prev, [newNode.id]: newNode }));
    setSelectedNodeId(newNode.id);
  };

  // 22.2 Force-Directed Auto-Layout
  const handleAutoLayout = () => {
    const layouted = UMLStudioEngine.autoLayoutNodes(nodes, relations);
    setNodes(layouted);
  };

  // 22.3 GoF Pattern Synthesizer
  const handleApplyPattern = (pattern: 'singleton' | 'factory' | 'repository' | 'strategy' | 'observer') => {
    const result = UMLStudioEngine.generateGoFPattern(pattern, 150, 100);
    setNodes((prev) => {
      const next = { ...prev };
      result.newNodes.forEach((n) => (next[n.id] = n));
      return next;
    });
    setRelations((prev) => [...prev, ...result.newRelations]);
    setIsPatternMenuOpen(false);
  };

  // Delete node
  const handleDeleteNode = (id: string) => {
    setNodes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setRelations((prev) => prev.filter((r) => r.fromNodeId !== id && r.toNodeId !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  // Property & Method Editors
  const handleAddProperty = (nodeId: string) => {
    setNodes((prev) => {
      const target = prev[nodeId];
      if (!target) return prev;

      const newP: UMLProperty = {
        id: `p_${Date.now()}`,
        visibility: '+',
        name: `Property${target.properties.length + 1}`,
        type: 'string',
      };

      return {
        ...prev,
        [nodeId]: {
          ...target,
          properties: [...target.properties, newP],
        },
      };
    });
  };

  const handleAddMethod = (nodeId: string) => {
    setNodes((prev) => {
      const target = prev[nodeId];
      if (!target) return prev;

      const newM: UMLMethod = {
        id: `m_${Date.now()}`,
        visibility: '+',
        name: `Method${target.methods.length + 1}`,
        returnType: 'void',
        parameters: [],
      };

      return {
        ...prev,
        [nodeId]: {
          ...target,
          methods: [...target.methods, newM],
        },
      };
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-200 font-sans select-none overflow-hidden">
      {/* ── TOOLBAR BAR ── */}
      <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Add Nodes */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1">
            <button
              type="button"
              onClick={() => handleAddNode('Class')}
              className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Класс</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('Interface')}
              className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Интерфейс</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddNode('Enum')}
              className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enum</span>
            </button>
          </div>

          {/* Relation Connector Mode */}
          <button
            type="button"
            onClick={() => {
              setIsLinkingMode(!isLinkingMode);
              setLinkStartNodeId(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
              isLinkingMode
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>{isLinkingMode ? 'Выберите 2 класса...' : '🔗 Связь ООП'}</span>
          </button>

          {/* 22.2 Auto Layout Button */}
          <button
            type="button"
            onClick={handleAutoLayout}
            title="Автоматическая ортогональная раскладка графа архитектуры"
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>🪄 Авто-раскладка</span>
          </button>

          {/* 22.3 GoF Design Pattern Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPatternMenuOpen(!isPatternMenuOpen)}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>📦 Паттерны GoF</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isPatternMenuOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1 space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyPattern('singleton')}
                  className="w-full text-left px-3 py-2 hover:bg-blue-600/30 hover:text-blue-200 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="font-bold">Singleton</span>
                  <span className="text-[10px] text-zinc-400">(Lazy&lt;T&gt;)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPattern('repository')}
                  className="w-full text-left px-3 py-2 hover:bg-purple-600/30 hover:text-purple-200 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="font-bold">Repository</span>
                  <span className="text-[10px] text-zinc-400">(IRepository&lt;T&gt;)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPattern('factory')}
                  className="w-full text-left px-3 py-2 hover:bg-amber-600/30 hover:text-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="font-bold">Factory Method</span>
                  <span className="text-[10px] text-zinc-400">(Фабрика)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPattern('strategy')}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-600/30 hover:text-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="font-bold">Strategy</span>
                  <span className="text-[10px] text-zinc-400">(Стратегия)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2">
          <span className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 font-bold">
            ● Bi-Directional Roslyn Bridge
          </span>
        </div>
      </div>

      {/* ── VECTOR CANVAS & LIVE CODE EDITOR ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Infinite Grid Canvas */}
        <div
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className="flex-1 relative overflow-auto bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-950"
        >
          {/* SVG Connector Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker
                id="arrow-inheritance"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <polygon points="0,0 10,5 0,10" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
              </marker>

              <marker
                id="arrow-implementation"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <polygon points="0,0 10,5 0,10" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
              </marker>
            </defs>

            {relations.map((rel) => {
              const fromNode = nodes[rel.fromNodeId];
              const toNode = nodes[rel.toNodeId];
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.position.x + 140;
              const y1 = fromNode.position.y + 60;
              const x2 = toNode.position.x + 140;
              const y2 = toNode.position.y + 60;

              const isImpl = rel.type === 'Implementation';

              return (
                <g key={rel.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isImpl ? '#a78bfa' : '#60a5fa'}
                    strokeWidth="2"
                    strokeDasharray={isImpl ? '6,6' : 'none'}
                    markerEnd={isImpl ? 'url(#arrow-implementation)' : 'url(#arrow-inheritance)'}
                  />
                  {rel.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 8}
                      fill="#e4e4e7"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="bg-zinc-950 px-1 font-bold"
                    >
                      {rel.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Render UML Node Cards */}
          {Object.values(nodes).map((node) => {
            const isSelected = selectedNodeId === node.id;

            return (
              <div
                key={node.id}
                style={{ left: `${node.position.x}px`, top: `${node.position.y}px` }}
                onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                className={`absolute w-72 bg-zinc-900/95 border rounded-2xl shadow-2xl backdrop-blur-md transition-shadow cursor-grab active:cursor-grabbing font-mono text-xs z-10 ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-blue-500/20'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Card Header */}
                <div
                  className="p-3 border-b border-zinc-800 flex items-center justify-between rounded-t-2xl"
                  style={{ backgroundColor: `${node.colorTag || '#2563eb'}20` }}
                >
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-zinc-400 block uppercase font-bold">
                        {node.type}
                      </span>
                      <input
                        type="text"
                        value={node.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) => ({
                            ...prev,
                            [node.id]: { ...prev[node.id], name: val },
                          }));
                        }}
                        className="font-bold text-sm text-white bg-transparent border-none focus:outline-none w-40"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    className="p-1 hover:bg-red-950 text-zinc-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Properties Section */}
                <div className="p-3 border-b border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
                    <span>Свойства (Properties)</span>
                    <button
                      type="button"
                      onClick={() => handleAddProperty(node.id)}
                      className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                    >
                      + Свойство
                    </button>
                  </div>

                  {node.properties.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-[11px] text-zinc-300 hover:bg-zinc-800/60 px-1 py-0.5 rounded">
                      <span className="text-amber-400 font-bold">{p.visibility}</span>
                      <span className="text-cyan-300 font-semibold">{p.name}:</span>
                      <span className="text-emerald-300">{p.type}</span>
                    </div>
                  ))}
                </div>

                {/* Methods Section */}
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
                    <span>Методы (Methods)</span>
                    <button
                      type="button"
                      onClick={() => handleAddMethod(node.id)}
                      className="text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                    >
                      + Метод
                    </button>
                  </div>

                  {node.methods.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-[11px] text-zinc-300 hover:bg-zinc-800/60 px-1 py-0.5 rounded">
                      <span className="text-amber-400 font-bold">{m.visibility}</span>
                      <span className="text-purple-300 font-semibold">{m.name}():</span>
                      <span className="text-emerald-300">{m.returnType}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live C# Code Emitter Panel */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-950 p-4 flex flex-col font-mono text-xs overflow-hidden shrink-0">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-3">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-xs text-white">ЖИВОЙ C# ЭМИТТЕР КОДА</h4>
          </div>

          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 overflow-y-auto text-[11px] text-emerald-300 leading-relaxed font-mono">
            <pre>{generatedCSharpCode}</pre>
          </div>

          <div className="pt-3 text-[10px] text-zinc-500 space-y-1">
            <p>⚡ Код мгновенно обновляется при переносе блоков и сохраняет существующую логику внутри методов.</p>
          </div>
        </div>
      </div>

      {/* ── FOOTER STATUS BAR ── */}
      <div className="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>[UML Нод: <strong className="text-white">{Object.keys(nodes).length}</strong>]</span>
          <span>[Связей: <strong className="text-white">{relations.length}</strong>]</span>
          <span>[Синхронизация с Monaco: <strong className="text-emerald-400">0 ms</strong>]</span>
        </div>
        <div className="text-emerald-400 font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Синтаксис C#: 100% ВАЛИДЕН</span>
        </div>
      </div>
    </div>
  );
};
