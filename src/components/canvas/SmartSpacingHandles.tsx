import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DesignerNode, LayoutBounds } from '../../types/ast';

interface SmartSpacingHandlesProps {
  selectedNodes: DesignerNode[];
  formOrigin: { x: number; y: number };
  zoom: number;
  onUpdateMultipleNodeBounds: (
    updates: Record<string, Partial<LayoutBounds>>,
    recordHistory?: boolean
  ) => void;
  onBeginTransaction: () => void;
  onCommitTransaction: (desc: string) => void;
}

interface GapGroup {
  id: string;
  type: 'horizontal' | 'vertical';
  gapValue: number;
  handlePos: { x: number; y: number };
  barRect: { x: number; y: number; width: number; height: number };
  items: { node: DesignerNode; index: number }[];
}

export const SmartSpacingHandles: React.FC<SmartSpacingHandlesProps> = ({
  selectedNodes,
  formOrigin,
  zoom,
  onUpdateMultipleNodeBounds,
  onBeginTransaction,
  onCommitTransaction,
}) => {
  const [activeDrag, setActiveDrag] = useState<{
    type: 'horizontal' | 'vertical';
    startPos: number;
    initialGap: number;
    initialBoundsMap: Record<string, LayoutBounds>;
    items: { node: DesignerNode; index: number }[];
  } | null>(null);

  // Compute horizontal and vertical gap groups from selected nodes
  const gapGroups = useMemo(() => {
    if (selectedNodes.length < 2) return [];

    const groups: GapGroup[] = [];

    // --- 1. Horizontal Gaps Analysis ---
    // Sort nodes by X
    const sortedByX = [...selectedNodes].sort((a, b) => a.bounds.x - b.bounds.x);

    for (let i = 0; i < sortedByX.length - 1; i++) {
      const a = sortedByX[i];
      const b = sortedByX[i + 1];

      const gapX = b.bounds.x - (a.bounds.x + a.bounds.width);

      // Check vertical overlap between the two items
      const overlapTop = Math.max(a.bounds.y, b.bounds.y);
      const overlapBottom = Math.min(
        a.bounds.y + a.bounds.height,
        b.bounds.y + b.bounds.height
      );

      if (gapX >= -20 && gapX <= 250 && overlapBottom > overlapTop) {
        const midY = (overlapTop + overlapBottom) / 2;
        const startX = a.bounds.x + a.bounds.width;
        const width = Math.max(8, gapX);

        groups.push({
          id: `h_gap_${a.id}_${b.id}`,
          type: 'horizontal',
          gapValue: Math.round(gapX),
          handlePos: {
            x: formOrigin.x + startX + gapX / 2,
            y: formOrigin.y + midY,
          },
          barRect: {
            x: formOrigin.x + startX,
            y: formOrigin.y + overlapTop,
            width: width,
            height: overlapBottom - overlapTop,
          },
          items: sortedByX.map((node, idx) => ({ node, index: idx })),
        });
      }
    }

    // --- 2. Vertical Gaps Analysis ---
    // Sort nodes by Y
    const sortedByY = [...selectedNodes].sort((a, b) => a.bounds.y - b.bounds.y);

    for (let i = 0; i < sortedByY.length - 1; i++) {
      const a = sortedByY[i];
      const b = sortedByY[i + 1];

      const gapY = b.bounds.y - (a.bounds.y + a.bounds.height);

      // Check horizontal overlap between the two items
      const overlapLeft = Math.max(a.bounds.x, b.bounds.x);
      const overlapRight = Math.min(
        a.bounds.x + a.bounds.width,
        b.bounds.x + b.bounds.width
      );

      if (gapY >= -20 && gapY <= 250 && overlapRight > overlapLeft) {
        const midX = (overlapLeft + overlapRight) / 2;
        const startY = a.bounds.y + a.bounds.height;
        const height = Math.max(8, gapY);

        groups.push({
          id: `v_gap_${a.id}_${b.id}`,
          type: 'vertical',
          gapValue: Math.round(gapY),
          handlePos: {
            x: formOrigin.x + midX,
            y: formOrigin.y + startY + gapY / 2,
          },
          barRect: {
            x: formOrigin.x + overlapLeft,
            y: formOrigin.y + startY,
            width: overlapRight - overlapLeft,
            height: height,
          },
          items: sortedByY.map((node, idx) => ({ node, index: idx })),
        });
      }
    }

    return groups;
  }, [selectedNodes, formOrigin]);

  // Handle Dragging
  const handleStartDrag = (
    e: React.MouseEvent,
    group: GapGroup
  ) => {
    e.stopPropagation();
    e.preventDefault();

    onBeginTransaction();

    const initialBoundsMap: Record<string, LayoutBounds> = {};
    selectedNodes.forEach((n) => {
      initialBoundsMap[n.id] = { ...n.bounds };
    });

    setActiveDrag({
      type: group.type,
      startPos: group.type === 'horizontal' ? e.clientX : e.clientY,
      initialGap: group.gapValue,
      initialBoundsMap,
      items: group.items,
    });
  };

  useEffect(() => {
    if (!activeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const isH = activeDrag.type === 'horizontal';
      const currentPos = isH ? e.clientX : e.clientY;
      const rawDelta = (currentPos - activeDrag.startPos) / zoom;
      const newGap = Math.max(0, Math.round(activeDrag.initialGap + rawDelta));
      const gapDelta = newGap - activeDrag.initialGap;

      const updates: Record<string, Partial<LayoutBounds>> = {};

      if (isH) {
        // Shift each subsequent item along X
        activeDrag.items.forEach((item, idx) => {
          if (idx > 0) {
            const initial = activeDrag.initialBoundsMap[item.node.id];
            if (initial) {
              updates[item.node.id] = {
                x: initial.x + idx * gapDelta,
              };
            }
          }
        });
      } else {
        // Shift each subsequent item along Y
        activeDrag.items.forEach((item, idx) => {
          if (idx > 0) {
            const initial = activeDrag.initialBoundsMap[item.node.id];
            if (initial) {
              updates[item.node.id] = {
                y: initial.y + idx * gapDelta,
              };
            }
          }
        });
      }

      onUpdateMultipleNodeBounds(updates, false);
    };

    const handleMouseUp = () => {
      if (activeDrag) {
        onCommitTransaction(
          `Изменение умных зазоров (${activeDrag.type === 'horizontal' ? 'по горизонтали' : 'по вертикали'})`
        );
      }
      setActiveDrag(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, zoom, onUpdateMultipleNodeBounds, onCommitTransaction]);

  if (gapGroups.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {gapGroups.map((group) => {
        const isH = group.type === 'horizontal';

        return (
          <React.Fragment key={group.id}>
            {/* Pink Gap Shading Area */}
            <div
              style={{
                position: 'absolute',
                left: `${group.barRect.x}px`,
                top: `${group.barRect.y}px`,
                width: `${group.barRect.width}px`,
                height: `${group.barRect.height}px`,
              }}
              className="bg-pink-500/15 border border-pink-500/30 rounded-xs pointer-events-none animate-in fade-in"
            />

            {/* Interactive Pink Handle & Gap Badge */}
            <div
              style={{
                position: 'absolute',
                left: `${group.handlePos.x}px`,
                top: `${group.handlePos.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="pointer-events-auto flex items-center justify-center group"
              onMouseDown={(e) => handleStartDrag(e, group)}
            >
              {/* Pink circular dot handle */}
              <div
                title={`Потяните для изменения зазора (${group.gapValue}px)`}
                className={`w-4 h-4 rounded-full bg-pink-500 hover:bg-pink-400 border-2 border-white shadow-lg cursor-${
                  isH ? 'ew-resize' : 'ns-resize'
                } flex items-center justify-center transition-transform hover:scale-125 active:scale-110`}
              >
                <span className="w-1 h-1 bg-white rounded-full pointer-events-none" />
              </div>

              {/* Distance Pill Tag */}
              <div
                className={`absolute px-1.5 py-0.5 rounded-full bg-pink-600/90 text-white font-mono font-bold text-[9px] shadow-md border border-pink-300/40 pointer-events-none select-none transition-opacity ${
                  isH ? '-top-5' : '-right-8'
                }`}
              >
                {group.gapValue}px
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
