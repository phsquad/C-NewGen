import React, { useRef, useEffect } from 'react';
import { SnapGuide, LayoutBounds, EquidistantTick } from '../../types/ast';

interface InfiniteDotGridProps {
  scale: number;
  translateX: number;
  translateY: number;
  width: number;
  height: number;
  gridSize?: number; // default 8px
  majorGridMultiple?: number; // default 8 (64px)
  snapGuides?: SnapGuide[];
  equidistantTicks?: EquidistantTick[];
  formBounds?: LayoutBounds;
}

export const InfiniteDotGrid: React.FC<InfiniteDotGridProps> = ({
  scale,
  translateX,
  translateY,
  width,
  height,
  gridSize = 8,
  majorGridMultiple = 8,
  snapGuides = [],
  equidistantTicks = [],
  formBounds,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep dark background for IDE canvas
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    const baseStep = gridSize * scale;
    const majorStep = baseStep * majorGridMultiple;

    // Adaptive Level-Of-Detail (LOD):
    const drawMinorDots = baseStep >= 7;

    // 1. Minor 8px Dots (WinForms standard baseline alignment)
    if (drawMinorDots) {
      const fadeAlpha = Math.min(0.12, Math.max(0.03, ((baseStep - 7) / 15) * 0.12));
      ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha.toFixed(3)})`;

      const startX = ((translateX % baseStep) + baseStep) % baseStep;
      const startY = ((translateY % baseStep) + baseStep) % baseStep;

      for (let x = startX; x < width; x += baseStep) {
        for (let y = startY; y < height; y += baseStep) {
          ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
        }
      }
    }

    // 2. Major 64px Accent Dots
    if (majorStep >= 10) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      const majorStartX = ((translateX % majorStep) + majorStep) % majorStep;
      const majorStartY = ((translateY % majorStep) + majorStep) % majorStep;

      for (let x = majorStartX; x < width; x += majorStep) {
        for (let y = majorStartY; y < height; y += majorStep) {
          ctx.fillRect(x - 1, y - 1, 2.5, 2.5);
        }
      }
    }

    // Origin in screen space
    const formClientOriginX = (formBounds?.x || 0) * scale + translateX;
    const formClientOriginY = ((formBounds?.y || 0) + 36) * scale + translateY;

    // 3. Render Smart Laser Alignment Guides (Smart Snapping)
    if (snapGuides && snapGuides.length > 0) {
      snapGuides.forEach(guide => {
        // Color classification per spec:
        // Blue (#3B82F6) for Center
        // Purple (#8B5CF6) for Edges
        // Green (#10B981) for Margins & Gaps
        let strokeColor = guide.color || '#8B5CF6';
        if (guide.kind === 'center') strokeColor = '#3B82F6';
        else if (guide.kind === 'margin' || guide.kind === 'gap') strokeColor = '#10B981';
        else if (guide.kind === 'edge') strokeColor = '#8B5CF6';

        if (guide.type === 'x') {
          const screenX = formClientOriginX + guide.position * scale;
          const startY = formClientOriginY + guide.start * scale;
          const endY = formClientOriginY + guide.end * scale;

          // Subtle laser glow underlay
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.strokeStyle = strokeColor;
          ctx.globalAlpha = 0.25;
          ctx.setLineDash([]);
          ctx.moveTo(screenX, startY);
          ctx.lineTo(screenX, endY);
          ctx.stroke();

          // Core dashed laser line
          ctx.beginPath();
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = 0.95;
          ctx.setLineDash([4, 3]);
          ctx.moveTo(screenX, startY);
          ctx.lineTo(screenX, endY);
          ctx.stroke();

          // Label Badge Pill
          if (guide.label) {
            ctx.setLineDash([]);
            ctx.font = 'bold 9px monospace';
            const textWidth = ctx.measureText(guide.label).width;
            const badgeX = screenX + 5;
            const badgeY = Math.max(10, startY + 8);

            // Badge background
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(badgeX - 3, badgeY - 10, textWidth + 6, 14);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(badgeX - 3, badgeY - 10, textWidth + 6, 14);

            // Badge text
            ctx.fillStyle = strokeColor;
            ctx.fillText(guide.label, badgeX, badgeY);
          }
        } else {
          const screenY = formClientOriginY + guide.position * scale;
          const startX = formClientOriginX + guide.start * scale;
          const endX = formClientOriginX + guide.end * scale;

          // Subtle laser glow underlay
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.strokeStyle = strokeColor;
          ctx.globalAlpha = 0.25;
          ctx.setLineDash([]);
          ctx.moveTo(startX, screenY);
          ctx.lineTo(endX, screenY);
          ctx.stroke();

          // Core dashed laser line
          ctx.beginPath();
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = 0.95;
          ctx.setLineDash([4, 3]);
          ctx.moveTo(startX, screenY);
          ctx.lineTo(endX, screenY);
          ctx.stroke();

          // Label Badge Pill
          if (guide.label) {
            ctx.setLineDash([]);
            ctx.font = 'bold 9px monospace';
            const textWidth = ctx.measureText(guide.label).width;
            const badgeX = Math.max(10, startX + 8);
            const badgeY = screenY - 5;

            // Badge background
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(badgeX - 3, badgeY - 10, textWidth + 6, 14);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(badgeX - 3, badgeY - 10, textWidth + 6, 14);

            // Badge text
            ctx.fillStyle = strokeColor;
            ctx.fillText(guide.label, badgeX, badgeY);
          }
        }
      });
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
    }

    // 4. Render Equidistant Spacing Ticks (|← 16px →|)
    if (equidistantTicks && equidistantTicks.length > 0) {
      equidistantTicks.forEach(tick => {
        const color = '#F59E0B'; // Warm amber / cyan accent
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);

        if (tick.type === 'x') {
          const sx = formClientOriginX + tick.startPos * scale;
          const ex = formClientOriginX + tick.endPos * scale;
          const cy = formClientOriginY + tick.crossCoord * scale;
          const tickH = 6;

          // Vertical end bars: |
          ctx.beginPath();
          ctx.moveTo(sx, cy - tickH);
          ctx.lineTo(sx, cy + tickH);
          ctx.moveTo(ex, cy - tickH);
          ctx.lineTo(ex, cy + tickH);
          ctx.stroke();

          // Connecting line
          ctx.beginPath();
          ctx.moveTo(sx, cy);
          ctx.lineTo(ex, cy);
          ctx.stroke();

          // Inward arrows < >
          const arrowSize = 3;
          ctx.beginPath();
          ctx.moveTo(sx + arrowSize, cy - arrowSize);
          ctx.lineTo(sx, cy);
          ctx.lineTo(sx + arrowSize, cy + arrowSize);
          ctx.moveTo(ex - arrowSize, cy - arrowSize);
          ctx.lineTo(ex, cy);
          ctx.lineTo(ex - arrowSize, cy + arrowSize);
          ctx.stroke();

          // Distance Badge: |← 16px →|
          const labelText = tick.label || `${Math.round(tick.distance)}px`;
          ctx.font = 'bold 9px monospace';
          const textW = ctx.measureText(labelText).width;
          const midX = (sx + ex) / 2;

          ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
          ctx.fillRect(midX - textW / 2 - 3, cy - 14, textW + 6, 12);
          ctx.strokeStyle = color;
          ctx.strokeRect(midX - textW / 2 - 3, cy - 14, textW + 6, 12);

          ctx.fillStyle = color;
          ctx.fillText(labelText, midX - textW / 2, cy - 5);
        } else {
          const sy = formClientOriginY + tick.startPos * scale;
          const ey = formClientOriginY + tick.endPos * scale;
          const cx = formClientOriginX + tick.crossCoord * scale;
          const tickW = 6;

          // Horizontal end bars: -
          ctx.beginPath();
          ctx.moveTo(cx - tickW, sy);
          ctx.lineTo(cx + tickW, sy);
          ctx.moveTo(cx - tickW, ey);
          ctx.lineTo(cx + tickW, ey);
          ctx.stroke();

          // Connecting line
          ctx.beginPath();
          ctx.moveTo(cx, sy);
          ctx.lineTo(cx, ey);
          ctx.stroke();

          // Inward arrows
          const arrowSize = 3;
          ctx.beginPath();
          ctx.moveTo(cx - arrowSize, sy + arrowSize);
          ctx.lineTo(cx, sy);
          ctx.lineTo(cx + arrowSize, sy + arrowSize);
          ctx.moveTo(cx - arrowSize, ey - arrowSize);
          ctx.lineTo(cx, ey);
          ctx.lineTo(cx + arrowSize, ey - arrowSize);
          ctx.stroke();

          // Distance Badge
          const labelText = tick.label || `${Math.round(tick.distance)}px`;
          ctx.font = 'bold 9px monospace';
          const textW = ctx.measureText(labelText).width;
          const midY = (sy + ey) / 2;

          ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
          ctx.fillRect(cx + 6, midY - 6, textW + 6, 12);
          ctx.strokeStyle = color;
          ctx.strokeRect(cx + 6, midY - 6, textW + 6, 12);

          ctx.fillStyle = color;
          ctx.fillText(labelText, cx + 9, midY + 3);
        }
      });
    }

    ctx.restore();
  }, [
    scale,
    translateX,
    translateY,
    width,
    height,
    gridSize,
    majorGridMultiple,
    snapGuides,
    equidistantTicks,
    formBounds,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      className="absolute inset-0 pointer-events-none select-none z-0"
    />
  );
};
