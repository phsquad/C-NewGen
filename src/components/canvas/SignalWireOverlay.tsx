import React, { useState } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { WireConnection, SignalPort } from '../../types/ast';
import { X, Sparkles, Sliders, Zap, Check } from 'lucide-react';

interface SignalWireOverlayProps {
  canvasZoom: number;
  canvasPan: { x: number; y: number };
}

export const SignalWireOverlay: React.FC<SignalWireOverlayProps> = ({ canvasZoom, canvasPan }) => {
  const {
    wires,
    nodes,
    showWiring,
    removeWire,
    addWire,
    pendingWireStart,
    setPendingWireStart,
    cursorPos,
    addConsoleLog,
  } = useDesigner();

  const [editingWireId, setEditingWireId] = useState<string | null>(null);
  const [transformerText, setTransformerText] = useState<string>('');

  if (!showWiring) return null;

  // Calculate center/port coordinates for a node
  const getNodePortCoord = (nodeId: string, portType: SignalPort['portType'], portName: string) => {
    const node = nodes[nodeId];
    if (!node) return null;

    // Relative to canvas space
    const isOut = portType.includes('out');
    const x = isOut ? node.bounds.x + node.bounds.width : node.bounds.x;
    const y = node.bounds.y + node.bounds.height / 2;

    return { x, y };
  };

  const handleOpenTransformer = (wire: WireConnection) => {
    setEditingWireId(wire.id);
    setTransformerText(wire.transformerExpr || `$"Привет, {val}!"`);
  };

  const handleSaveTransformer = (wireId: string) => {
    const wire = wires.find(w => w.id === wireId);
    if (wire) {
      removeWire(wireId);
      addWire({ ...wire, transformerExpr: transformerText });
      addConsoleLog('System', `Обновлено выражение трансформатора данных для нити: ${transformerText}`);
    }
    setEditingWireId(null);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      <svg className="w-full h-full overflow-visible">
        <defs>
          {/* Neon Gradient Blue to Cyan */}
          <linearGradient id="wireGradBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Neon Gradient Amber to Orange (for Click/Events) */}
          <linearGradient id="wireGradAmber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Existing Wires */}
        {wires.map(wire => {
          const start = getNodePortCoord(wire.from.nodeId, wire.from.portType, wire.from.name);
          const end = getNodePortCoord(wire.to.nodeId, wire.to.portType, wire.to.name);
          if (!start || !end) return null;

          const isEvent = wire.from.portType === 'event_out';
          const strokeGrad = isEvent ? 'url(#wireGradAmber)' : 'url(#wireGradBlue)';

          // Smooth Bezier Curve
          const dx = Math.abs(end.x - start.x) * 0.5 + 40;
          const cp1x = start.x + dx;
          const cp1y = start.y;
          const cp2x = end.x - dx;
          const cp2y = end.y;
          const pathD = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;

          // Midpoint for badge
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;

          const sNode = nodes[wire.from.nodeId];
          const tNode = nodes[wire.to.nodeId];
          const label = `${sNode?.properties.name || ''}.${wire.from.name} ➔ ${tNode?.properties.name || ''}.${wire.to.name}`;

          return (
            <g key={wire.id} className="pointer-events-auto group">
              {/* Outer glow line */}
              <path
                d={pathD}
                fill="none"
                stroke={isEvent ? '#f59e0b' : '#3b82f6'}
                strokeWidth="6"
                strokeOpacity="0.25"
                filter="url(#neonGlow)"
              />

              {/* Main Core Wire Line */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeGrad}
                strokeWidth="2.5"
                className="transition-all hover:stroke-white cursor-pointer"
              />

              {/* Animated energy pulse packet along the wire */}
              <circle r="4" fill="#ffffff">
                <animateMotion
                  path={pathD}
                  dur={isEvent ? '1.4s' : '2.2s'}
                  repeatCount="indefinite"
                />
              </circle>

              {/* Start & End Port Anchors */}
              <circle cx={start.x} cy={start.y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={end.x} cy={end.y} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />

              {/* Interactive Middle Wire Chip */}
              <foreignObject
                x={midX - 90}
                y={midY - 14}
                width="180"
                height="32"
                className="overflow-visible"
              >
                <div
                  onClick={() => handleOpenTransformer(wire)}
                  className="px-2 py-0.5 bg-zinc-950/90 border border-blue-500/80 rounded-full shadow-lg backdrop-blur-md flex items-center justify-between text-[10px] font-mono text-zinc-200 cursor-pointer hover:border-white transition-all hover:scale-105"
                  title="Кликните для настройки трансформатора или удаления связи"
                >
                  <div className="flex items-center gap-1 truncate min-w-0 pr-1">
                    <Zap className={`w-3 h-3 shrink-0 ${isEvent ? 'text-amber-400' : 'text-blue-400'}`} />
                    <span className="truncate">{label}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeWire(wire.id);
                      addConsoleLog('System', `Удалена нить связи: ${label}`);
                    }}
                    className="p-0.5 hover:bg-red-600 rounded-full text-zinc-400 hover:text-white shrink-0 ml-1"
                    title="Удалить нить"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Dynamic Pending Wire being dragged from a port */}
        {pendingWireStart && (
          (() => {
            const start = getNodePortCoord(pendingWireStart.nodeId, pendingWireStart.portType, pendingWireStart.name);
            if (!start) return null;
            // Screen cursor converted to canvas coordinate
            const endX = cursorPos.screenX;
            const endY = cursorPos.screenY;

            const dx = Math.abs(endX - start.x) * 0.5 + 30;
            const pathD = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${endX - dx} ${endY}, ${endX} ${endY}`;

            return (
              <g className="pointer-events-none">
                <path
                  d={pathD}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
                <circle cx={start.x} cy={start.y} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                <circle cx={endX} cy={endY} r="5" fill="#f43f5e" />
              </g>
            );
          })()
        )}
      </svg>

      {/* Wire Expression Transformer Popover Modal */}
      {editingWireId && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-zinc-900 border border-blue-500 rounded-xl shadow-2xl p-4 z-50 text-xs font-sans text-zinc-200 pointer-events-auto animate-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
            <span className="font-bold flex items-center gap-1.5 text-blue-400 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ТРАНСФОРМАТОР НИТИ ДАННЫХ</span>
            </span>
            <button
              onClick={() => setEditingWireId(null)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <label className="text-[11px] text-zinc-400">
              Выражение форматирования C# (используйте <code className="text-cyan-300">{"{val}"}</code>):
            </label>
            <input
              type="text"
              value={transformerText}
              onChange={(e) => setTransformerText(e.target.value)}
              placeholder='$"Привет, {val}!"'
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <div className="text-[10px] text-zinc-500 font-mono">
              Пример: $"ID пользователя: {"{val}"}" или val.ToUpper()
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingWireId(null)}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => handleSaveTransformer(editingWireId)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Сохранить</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
