import React, { memo } from 'react';
import { DesignerNode } from '../../types/ast';
import { ControlRenderer } from './ControlRenderer';
import { SmartTagActionGlyph } from './SmartTagActionGlyph';
import { useDesigner } from '../../context/DesignerContext';

interface CanvasNodeItemProps {
  node: DesignerNode;
  isSelected: boolean;
  spacePressed: boolean;
  isEmulatorMode?: boolean;
  onSelect: (id: string, shift: boolean) => void;
  onDoubleClick?: (id: string, e: React.MouseEvent) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onStartDrag: (id: string, e: React.MouseEvent) => void;
  onStartResize: (id: string, handle: string, e: React.MouseEvent) => void;
  onDropOnContainer?: (e: React.DragEvent, id: string) => void;
  onEventTrigger?: (eventName: string, handlerName: string, controlName: string) => void;
  renderChildren?: (id: string) => React.ReactNode;
}

export const CanvasNodeItem = memo<CanvasNodeItemProps>(({
  node,
  isSelected,
  spacePressed,
  isEmulatorMode = false,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onStartDrag,
  onStartResize,
  onDropOnContainer,
  onEventTrigger,
  renderChildren,
}) => {
  const isContainer = ['Panel', 'GroupBox', 'TabControl'].includes(node.type);
  const { p2pPeers, isTabOrderMode, assignTabIndex } = useDesigner();

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
