import React, { memo } from 'react';
import { DesignerNode } from '../../types/ast';
import { ControlRenderer } from './ControlRenderer';
import { SmartTagActionGlyph } from './SmartTagActionGlyph';
import { RadialActionHalo } from './RadialActionHalo';
import { SignalWireEngine } from '../../utils/SignalWireEngine';
import { useDesigner } from '../../context/DesignerContext';

interface CanvasNodeItemProps {
  node: DesignerNode;
  isSelected: boolean;
  spacePressed: boolean;
  isEmulatorMode?: boolean;
  isInlineEditing?: boolean;
  onSelect: (id: string, shift: boolean) => void;
  onDoubleClick?: (id: string, e: React.MouseEvent) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onStartDrag: (id: string, e: React.MouseEvent) => void;
  onStartResize: (id: string, handle: string, e: React.MouseEvent) => void;
  onDropOnContainer?: (e: React.DragEvent, id: string) => void;
  onEventTrigger?: (eventName: string, handlerName: string, controlName: string) => void;
  onSaveInlineText?: (id: string, newText: string) => void;
  onCancelInlineEdit?: () => void;
  renderChildren?: (id: string) => React.ReactNode;
}

export const CanvasNodeItem = memo<CanvasNodeItemProps>(({
  node,
  isSelected,
  spacePressed,
  isEmulatorMode = false,
  isInlineEditing = false,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onStartDrag,
  onStartResize,
  onDropOnContainer,
  onEventTrigger,
  onSaveInlineText,
  onCancelInlineEdit,
  renderChildren,
}) => {
  const isContainer = ['Panel', 'GroupBox', 'TabControl'].includes(node.type);
  const {
    p2pPeers,
    isTabOrderMode,
    assignTabIndex,
    showWiring,
    addWire,
    pendingWireStart,
    setPendingWireStart,
    addConsoleLog,
  } = useDesigner();

  const { outPorts, inPorts } = SignalWireEngine.getDefaultPorts(node);

  // Find if any remote peer has selected this control (Multi-Select Color Halo - Pravka 25.3)
  const activePeer = p2pPeers?.find(p => p.selectedNodeId === node.id);

  const handleDragOver = (e: React.DragEvent) => {
    if (isContainer && !isEmulatorMode && !isTabOrderMode) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isContainer && onDropOnContainer && !isEmulatorMode && !isTabOrderMode) {
      onDropOnContainer(e, node.id);
    }
  };

  return (
    <div
      data-node-id={node.id}
      style={{
        position: 'absolute',
        left: `${node.bounds.x}px`,
        top: `${node.bounds.y}px`,
        width: `${node.bounds.width}px`,
        height: `${node.bounds.height}px`,
        zIndex: isSelected && !isEmulatorMode ? 40 : 10,
        // Override border/outline color with peer user color
        ...(activePeer && !isSelected && !isEmulatorMode ? {
          outline: `2px solid ${activePeer.color}`,
          boxShadow: `0 0 8px ${activePeer.color}80`
        } : {})
      }}
      onMouseDown={e => {
        if (isEmulatorMode) {
          // In emulator mode, allow clicks to reach native inputs and buttons
          return;
        }
        e.stopPropagation();

        if (isTabOrderMode) {
          // Tab Order Click Mode - sequential focus index assignment
          assignTabIndex(node.id);
          return;
        }

        if (spacePressed) return;
        onSelect(node.id, e.shiftKey);
        if (!node.properties.locked) {
          onStartDrag(node.id, e);
        }
      }}
      onDoubleClick={e => {
        if (!isEmulatorMode && !isTabOrderMode && onDoubleClick) {
          e.stopPropagation();
          onDoubleClick(node.id, e);
        }
      }}
      onContextMenu={e => {
        if (!isEmulatorMode && !isTabOrderMode && onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onSelect(node.id, e.shiftKey);
          onContextMenu(node.id, e);
        }
      }}
      onDragOver={isContainer ? handleDragOver : undefined}
      onDrop={isContainer ? handleDrop : undefined}
      className={`group transition-shadow ${
        isEmulatorMode
          ? ''
          : isTabOrderMode
          ? 'cursor-crosshair ring-2 ring-blue-500/70'
          : isSelected
          ? 'ring-2 ring-blue-500 shadow-md ring-offset-1 ring-offset-transparent'
          : activePeer
          ? '' // outlined by styles above
          : 'hover:outline-1 hover:outline-dashed hover:outline-blue-400'
      }`}
    >
      {/* 1. Tab Order Interactive Badge: [ 0 ], [ 1 ], [ 2 ] */}
      {isTabOrderMode && node.type !== 'Form' && (
        <div
          className={`absolute -top-3 -left-2 z-[60] px-1.5 py-0.5 rounded text-[11px] font-bold font-mono shadow-md border pointer-events-none select-none flex items-center gap-1 ${
            node.properties.tabIndex !== undefined
              ? 'bg-blue-600 border-blue-300 text-white ring-2 ring-blue-400/50'
              : 'bg-zinc-800 border-zinc-600 text-zinc-400'
          }`}
        >
          <span>{node.properties.tabIndex !== undefined ? node.properties.tabIndex : '?'}</span>
        </div>
      )}

      {/* 2. Smart Tags / Action Glyphs: [ ► ] */}
      {!isEmulatorMode && !isTabOrderMode && (
        <SmartTagActionGlyph node={node} isSelected={isSelected} />
      )}

      {/* 3. 🎯 Radial Action Halo (Круговой микро-HUD прямо на элементе) */}
      {!isEmulatorMode && !isTabOrderMode && isSelected && node.type !== 'Form' && (
        <RadialActionHalo node={node} />
      )}

      {/* 4. ⚡️ Visual Signal-Wiring Ports (Входные и выходные неоновые коннекторы) */}
      {showWiring && !isEmulatorMode && node.type !== 'Form' && (
        <>
          {/* Left In-Ports */}
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-50 pointer-events-auto">
            {inPorts.map(p => (
              <button
                key={p.name}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  if (pendingWireStart && pendingWireStart.nodeId !== node.id) {
                    addWire({
                      id: `wire_${Date.now()}_${Math.random().toString().slice(2, 6)}`,
                      from: pendingWireStart,
                      to: p,
                      transformerExpr: p.name === 'Text' && pendingWireStart.name === 'Text' ? `$"Привет, {val}!"` : undefined,
                    });
                    addConsoleLog('System', `Создана нить данных: ${pendingWireStart.name} ➔ ${node.properties.name}.${p.name}`);
                  }
                }}
                className={`w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  pendingWireStart && pendingWireStart.nodeId !== node.id
                    ? 'bg-emerald-500 scale-125 animate-ping'
                    : 'bg-blue-600 hover:bg-cyan-400'
                }`}
                title={`Входной порт [In: ${p.name} (${p.dataType})]`}
              >
                <span className="w-1 h-1 bg-white rounded-full pointer-events-none" />
              </button>
            ))}
          </div>

          {/* Right Out-Ports */}
          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-50 pointer-events-auto">
            {outPorts.map(p => {
              const isSelectedPort = pendingWireStart?.nodeId === node.id && pendingWireStart.name === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setPendingWireStart(isSelectedPort ? null : p);
                    if (!isSelectedPort) {
                      addConsoleLog('System', `Вытянут сигнал из ${node.properties.name}.${p.name}. Кликните на входной порт целевого контрола.`);
                    }
                  }}
                  className={`w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isSelectedPort
                      ? 'bg-amber-400 ring-2 ring-amber-300 scale-125 animate-pulse'
                      : 'bg-cyan-500 hover:bg-amber-400'
                  }`}
                  title={`Выходной порт [Out: ${p.name} (${p.dataType})]. Кликните для протягивания нити`}
                >
                  <span className="w-1 h-1 bg-white rounded-full pointer-events-none" />
                </button>
              );
            })}
          </div>
        </>
      )}
      {/* Peer selection halo badge */}
      {!isEmulatorMode && activePeer && !isSelected && (
        <div
          style={{ backgroundColor: activePeer.color }}
          className="absolute -top-5 left-0 px-1.5 py-0.5 text-[9px] text-white font-bold rounded shadow-md pointer-events-none whitespace-nowrap z-50 animate-fadeIn"
        >
          <span>👤 {activePeer.name}</span>
        </div>
      )}

      {/* Visual Component Render (Base Layer z-0) */}
      <div className="w-full h-full relative z-0">
        <ControlRenderer
          node={node}
          isInteractive={isEmulatorMode}
          onEventTrigger={onEventTrigger}
        />

        {/* ✍️ Inline Text Editing Overlay (Canvas In-Place Edit) */}
        {!isEmulatorMode && isInlineEditing && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center p-0.5 bg-zinc-950/90 rounded border-2 border-cyan-400 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              autoFocus
              defaultValue={node.properties.text !== undefined ? node.properties.text : node.properties.name}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSaveInlineText?.(node.id, e.currentTarget.value);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancelInlineEdit?.();
                }
              }}
              onBlur={(e) => {
                onSaveInlineText?.(node.id, e.currentTarget.value);
              }}
              style={{
                fontFamily: node.properties.fontFamily || 'Segoe UI',
                fontSize: `${Math.max(10, node.properties.fontSize || 12)}px`,
                fontWeight: node.properties.fontBold ? 'bold' : 'normal',
                color: '#FFFFFF',
              }}
              className="w-full h-full bg-transparent text-center text-white outline-none border-0 px-1 font-sans"
            />
          </div>
        )}
      </div>

      {/* Children container if Panel or GroupBox (Layer z-10 - Smart Hierarchy Priority) */}
      {isContainer && renderChildren && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          <div className="relative w-full h-full pointer-events-auto">
            {renderChildren(node.id)}
          </div>
        </div>
      )}

      {/* Selection Gizmo with 8 resize handles & dimension tag (Only in Designer mode) */}
      {!isEmulatorMode && isSelected && !node.properties.locked && (
        <>
          {/* Top info badge */}
          <div className="absolute -top-6 left-0 px-1.5 py-0.5 bg-blue-600 text-[10px] text-white font-mono rounded-xs shadow-xs pointer-events-none whitespace-nowrap flex items-center gap-1 z-50">
            <span>{node.properties.name}</span>
            <span className="opacity-80">
              {Math.round(node.bounds.width)}×{Math.round(node.bounds.height)}
            </span>
            <span className="opacity-80">
              ({Math.round(node.bounds.x)}, {Math.round(node.bounds.y)})
            </span>
          </div>

          {/* 8-point Handles */}
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => {
            const handleClasses: Record<string, string> = {
              nw: '-top-1.5 -left-1.5 cursor-nwse-resize',
              n: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
              ne: '-top-1.5 -right-1.5 cursor-nesw-resize',
              e: 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize',
              se: '-bottom-1.5 -right-1.5 cursor-nwse-resize',
              s: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
              sw: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
              w: 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize',
            };

            return (
              <div
                key={handle}
                className={`absolute w-2.5 h-2.5 bg-white border-2 border-blue-600 rounded-2xs z-50 shadow-xs ${handleClasses[handle]}`}
                onMouseDown={e => {
                  e.stopPropagation();
                  onStartResize(node.id, handle, e);
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
});
CanvasNodeItem.displayName = 'CanvasNodeItem';
