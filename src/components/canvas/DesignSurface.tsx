import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { DesignerNode, LayoutBounds, ControlType, SnapGuide } from '../../types/ast';
import { CanvasNodeItem } from './CanvasNodeItem';
import { InfiniteDotGrid } from './InfiniteDotGrid';
import { ViewportHud } from './ViewportHud';
import { FormWindowShell } from './FormWindowShell';
import { ViewportTransform } from '../../utils/viewportTransform';
import { calculateSmartSnapping } from '../../utils/smartSnapping';
import { getDefaultEventForControl } from '../../utils/defaultEvents';
import { useDesignerStore } from '../../store/designerStore';

export const DesignSurface: React.FC = () => {
  const {
    project,
    nodes,
    selectedNodes,
    selectedNode,
    selectNode,
    clearSelection,
    updateNodeBounds,
    updateMultipleNodeBounds,
    updateNodeEvents,
    setActiveRightTab,
    addControl,
    beginTransaction,
    commitTransaction,
    cancelTransaction,
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    snapGuides,
    setSnapGuides,
    equidistantTicks,
    setEquidistantTicks,
    setSnapTelemetry,
    isPanMode,
    setIsPanMode,
    activeDpiMode,
    setActiveDpiMode,
    setCursorPos,
    setFps,
    appMode,
    addConsoleLog,
    setMessageBoxModal,
    setCodeDockOpen,
    activeFormId,
    setActiveFormId,
    formZOrder,
    bringFormToFront,
    globalTheme,
    setGlobalTheme,
    gridStep,
    setGridStep,
    addForm,
    removeForm,
    getAllForms,
    duplicateSelectedNodes,
    deleteSelectedNodes,
    alignSelectedNodes,
    undo,
    redo,
    p2pSessionCode,
    p2pPeers,
    p2pInstance,
    isTabOrderMode,
    nextTabOrderIndex,
    setTabOrderMode,
    resetTabOrder,
  } = useDesigner();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

  const [showHotkeysHelp, setShowHotkeysHelp] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const allForms = useMemo(() => {
    const forms = Object.values(nodes).filter(n => n.type === 'Form');
    return forms.length > 0 ? forms : (nodes[project.rootFormId] ? [nodes[project.rootFormId]] : []);
  }, [nodes, project.rootFormId]);

  const activeForm = useMemo(() => {
    if (activeFormId && nodes[activeFormId]) return nodes[activeFormId];
    if (nodes[project.rootFormId]) return nodes[project.rootFormId];
    return allForms[0] || null;
  }, [activeFormId, nodes, project.rootFormId, allForms]);

  // Viewport container dimensions
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  // Affine 2D Viewport Transform instance
  const vTransform = useMemo(
    () => new ViewportTransform(zoom, panOffset.x, panOffset.y),
    [zoom, panOffset.x, panOffset.y]
  );

  // Dragging state for controls & forms (Fix 4.2: Relative Delta Grouping)
  const [dragState, setDragState] = useState<{
    active: boolean;
    nodeId: string;
    dragIds: string[];
    startX: number;
    startY: number;
    initialBounds: LayoutBounds;
    initialBoundsMap: Record<string, LayoutBounds>;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Kinetic Snap Hysteresis tracking (Pravka 5.1)
  const [snapHysteresisState, setSnapHysteresisState] = useState<{
    snappedXAxis: number | null;
    snappedYAxis: number | null;
  } | null>(null);

  // Resize state for gizmo handles & forms
  const [resizeState, setResizeState] = useState<{
    active: boolean;
    nodeId: string;
    handle: string;
    startX: number;
    startY: number;
    initialBounds: LayoutBounds;
  } | null>(null);

  // Panning State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Spacebar pan mode
  const [spacePressed, setSpacePressed] = useState(false);

  // Marquee Selection Box
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        setContainerSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Real-time FPS Monitor Loop (60-144 FPS)
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [setFps]);

  // Spacebar pan toggle + Keyboard Shortcuts Navigation & Operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: Exit Tab Order mode
      if (e.code === 'Escape' && isTabOrderMode) {
        setTabOrderMode(false);
        return;
      }

      // 1. Spacebar pan toggle
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setSpacePressed(true);
        }
      }

      // 2. Navigation Mode toggle (V/H)
      if (e.code === 'KeyV' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          setIsPanMode(false);
        }
      }
      if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          setIsPanMode(true);
        }
      }

      // Check if typing in inputs/textareas to avoid stealing typing keys
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable ||
        target.closest('[contenteditable="true"]')
      ) {
        return;
      }

      // 3. Delete Selected Controls (Del / Backspace)
      if (e.code === 'Delete' || e.code === 'Backspace') {
        const hasSelectedControls = project.selectedNodeIds.some(id => id !== activeFormId);
        if (hasSelectedControls) {
          e.preventDefault();
          deleteSelectedNodes();
        }
      }

      // 4. Duplicate (Ctrl+D / Cmd+D)
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
        e.preventDefault();
        duplicateSelectedNodes();
      }

      // 5. Undo (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // 6. Redo (Ctrl+Y or Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.shiftKey && e.code === 'KeyZ'))) {
        e.preventDefault();
        redo();
      }

      // 7. Select All controls in the active form (Ctrl+A)
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
        if (activeFormId) {
          e.preventDefault();
          const activeFormChildren = Object.values(nodes)
            .filter(n => n.parentId === activeFormId && n.type !== 'Form')
            .map(n => n.id);
          
          if (activeFormChildren.length > 0) {
            useDesignerStore.setState({ selectedNodeIds: activeFormChildren });
          }
        }
      }

      // 8. Arrow keys: Nudge and Resize Controls (Shift+Arrows)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        const selectedControls = project.selectedNodeIds.filter(id => {
          const n = nodes[id];
          return n && n.type !== 'Form';
        });

        if (selectedControls.length > 0) {
          e.preventDefault();
          // Step: 1px if Ctrl/Alt is pressed, else use snap gridStep (default: 8)
          const step = (e.ctrlKey || e.altKey) ? 1 : (gridStep || 8);
          const updates: Record<string, Partial<LayoutBounds>> = {};

          selectedControls.forEach(id => {
            const node = nodes[id];
            if (!node) return;
            const b = node.bounds;

            if (e.shiftKey) {
              // Shift + Arrows: Resize Width/Height
              let dw = 0;
              let dh = 0;
              if (e.code === 'ArrowLeft') dw = -step;
              if (e.code === 'ArrowRight') dw = step;
              if (e.code === 'ArrowUp') dh = -step;
              if (e.code === 'ArrowDown') dh = dh = step;

              updates[id] = {
                width: Math.max(8, b.width + dw),
                height: Math.max(8, b.height + dh),
              };
            } else {
              // Arrows: Move X/Y
              let dx = 0;
              let dy = 0;
              if (e.code === 'ArrowLeft') dx = -step;
              if (e.code === 'ArrowRight') dx = step;
              if (e.code === 'ArrowUp') dy = -step;
              if (e.code === 'ArrowDown') dy = step;

              updates[id] = {
                x: b.x + dx,
                y: b.y + dy,
              };
            }
          });

          updateMultipleNodeBounds(updates, true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed, isPanMode, setIsPanMode, activeFormId, nodes, project.selectedNodeIds, gridStep, deleteSelectedNodes, duplicateSelectedNodes, undo, redo, updateMultipleNodeBounds]);

  // Cursor-Anchored Zoom (Pravka 2.2)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    if (e.shiftKey && !e.ctrlKey) {
      setPanOffset(prev => ({ ...prev, x: prev.x - e.deltaY }));
      return;
    }

    if (isPanMode && !e.ctrlKey) {
      setPanOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      return;
    }

    const worldX = (cursorX - panOffset.x) / zoom;
    const worldY = (cursorY - panOffset.y) / zoom;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = Math.min(5.0, Math.max(0.25, parseFloat((zoom * zoomFactor).toFixed(2))));

    const nextTx = Math.round(cursorX - worldX * nextZoom);
    const nextTy = Math.round(cursorY - worldY * nextZoom);

    setZoom(nextZoom);
    setPanOffset({ x: nextTx, y: nextTy });
  };

  // Zoom control handlers for Viewport HUD
  const handleZoomIn = () => {
    const nextZoom = Math.min(5.0, parseFloat((zoom + 0.1).toFixed(2)));
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    const updated = vTransform.zoomAt(centerX, centerY, nextZoom);
    setZoom(updated.scale);
    setPanOffset({ x: Math.round(updated.translateX), y: Math.round(updated.translateY) });
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(0.25, parseFloat((zoom - 0.1).toFixed(2)));
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    const updated = vTransform.zoomAt(centerX, centerY, nextZoom);
    setZoom(updated.scale);
    setPanOffset({ x: Math.round(updated.translateX), y: Math.round(updated.translateY) });
  };

  const handleZoomChange = (val: number) => {
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    const updated = vTransform.zoomAt(centerX, centerY, val);
    setZoom(updated.scale);
    setPanOffset({ x: Math.round(updated.translateX), y: Math.round(updated.translateY) });
  };

  // Fit All Forms to Viewport
  const handleFitToScreen = () => {
    if (allForms.length === 0) return;
    const minX = Math.min(...allForms.map(f => f.bounds.x));
    const minY = Math.min(...allForms.map(f => f.bounds.y));
    const maxX = Math.max(...allForms.map(f => f.bounds.x + f.bounds.width));
    const maxY = Math.max(...allForms.map(f => f.bounds.y + f.bounds.height + 36));

    const totalW = Math.max(200, maxX - minX);
    const totalH = Math.max(200, maxY - minY);

    const res = vTransform.fitToBounds(
      containerSize.width,
      containerSize.height,
      totalW,
      totalH,
      80
    );

    setZoom(res.scale);
    setPanOffset({
      x: Math.round((containerSize.width - totalW * res.scale) / 2 - minX * res.scale),
      y: Math.round((containerSize.height - totalH * res.scale) / 2 - minY * res.scale),
    });
  };

  // Reset Scale to 1:1 (100%) and Center Active Form
  const handleResetOneToOne = () => {
    const target = activeForm || allForms[0];
    if (!target) return;
    const titlebarHeight = 36;
    const newTx = Math.round((containerSize.width - target.bounds.width) / 2 - target.bounds.x);
    const newTy = Math.round((containerSize.height - (target.bounds.height + titlebarHeight)) / 2 - target.bounds.y);
    setZoom(1.0);
    setPanOffset({ x: newTx, y: newTy });
  };

  // Pointer Down on Canvas Surface
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (spacePressed || isPanMode || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (e.target === canvasRef.current) {
      clearSelection();
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - panOffset.x) / zoom;
      const clickY = (e.clientY - rect.top - panOffset.y) / zoom;
      setMarquee({ startX: clickX, startY: clickY, currentX: clickX, currentY: clickY });
    }
  };

  // Pointer Movement (Coordinates tracking, dragging, resizing, panning)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // 1. Calculate and update cursor telemetry (Screen space and Form space)
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = Math.round(e.clientX - rect.left);
      const screenY = Math.round(e.clientY - rect.top);

      // Relative to activeForm:
      const formOriginX = activeForm ? activeForm.bounds.x : 0;
      const formOriginY = activeForm ? activeForm.bounds.y + 36 : 36;

      const formPos = vTransform.screenToFormSpace(screenX, screenY, formOriginX, formOriginY);
      const isInside =
        activeForm &&
        formPos.x >= 0 &&
        formPos.x <= activeForm.bounds.width &&
        formPos.y >= 0 &&
        formPos.y <= activeForm.bounds.height;

      setCursorPos({
        screenX,
        screenY,
        formX: isInside ? formPos.x : null,
        formY: isInside ? formPos.y : null,
      });

      if (p2pInstance) {
        p2pInstance.broadcastCursor(screenX, screenY, selectedNode ? selectedNode.id : null);
      }
    }

    // 2. Pan canvas
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // 3. Dragging control or form
    if (dragState && dragState.active) {
      const deltaX = (e.clientX - dragState.startX) / zoom;
      const deltaY = (e.clientY - dragState.startY) / zoom;

      const draggedNode = nodes[dragState.nodeId];

      // A. Moving a Form in world coordinates
      if (draggedNode?.type === 'Form') {
        let formX = Math.round(dragState.initialBounds.x + deltaX);
        let formY = Math.round(dragState.initialBounds.y + deltaY);
        if (snapToGrid) {
          formX = Math.round(formX / gridStep) * gridStep;
          formY = Math.round(formY / gridStep) * gridStep;
        }
        updateNodeBounds(dragState.nodeId, { x: formX, y: formY }, false);
        return;
      }

      // B. Moving Child Control(s) - Relative Delta Group Transformation (Fix 4.2) + Smart Snapping Engine O(N)
      const rawNewX = dragState.initialBounds.x + deltaX;
      const rawNewY = dragState.initialBounds.y + deltaY;

      const parentNode = draggedNode?.parentId ? nodes[draggedNode.parentId] : activeForm;
      const pw = parentNode?.bounds.width || 600;
      const ph = parentNode?.bounds.height || 400;

      // Filter static sibling nodes (excluding all items currently in the dragged group)
      const staticSiblingNodes = (parentNode?.childrenIds || [])
        .filter(cid => !dragState.dragIds.includes(cid))
        .map(cid => nodes[cid])
        .filter(Boolean);

      // Pravka 5.3: Check if Ctrl or Alt is held for temporary sub-pixel precision bypass
      const isPrecisionOverride = e.ctrlKey || e.altKey || e.metaKey;

      // 1D Spatial Sweep Smart Snapping Engine with Kinetic Hysteresis (Pravka 5.1 & 5.2)
      const snapResult = calculateSmartSnapping(
        {
          x: rawNewX,
          y: rawNewY,
          width: dragState.initialBounds.width,
          height: dragState.initialBounds.height,
        },
        staticSiblingNodes,
        pw,
        ph,
        {
          draggingType: draggedNode?.type,
          previousSnapState: snapHysteresisState,
          disableSnap: isPrecisionOverride,
        }
      );

      setSnapHysteresisState(snapResult.currentSnapState);

      let primaryNewX = snapResult.snappedX;
      let primaryNewY = snapResult.snappedY;

      // If no magnetic guides caught and standard grid snapping is active (and precision override is not active):
      if (!isPrecisionOverride && snapToGrid && snapResult.activeGuides.length === 0 && snapResult.equidistantTicks.length === 0) {
        primaryNewX = Math.round(primaryNewX / gridStep) * gridStep;
        primaryNewY = Math.round(primaryNewY / gridStep) * gridStep;
      }

      setSnapGuides(snapResult.activeGuides);
      setEquidistantTicks(snapResult.equidistantTicks);
      setSnapTelemetry(snapResult.snapTelemetry);

      // Relative delta transformation: X_new = X_initial + DeltaX, Y_new = Y_initial + DeltaY
      const effectiveDeltaX = primaryNewX - dragState.initialBounds.x;
      const effectiveDeltaY = primaryNewY - dragState.initialBounds.y;

      const boundsUpdates: Record<string, Partial<LayoutBounds>> = {};
      dragState.dragIds.forEach(nid => {
        const init = dragState.initialBoundsMap[nid];
        if (init) {
          boundsUpdates[nid] = {
            x: Math.round(init.x + effectiveDeltaX),
            y: Math.round(init.y + effectiveDeltaY),
          };
        }
      });

      updateMultipleNodeBounds(boundsUpdates, false);
      return;
    }

    // 4. Resizing control or form (Fix 4.1: Sub-Pixel Anchor Clamping)
    if (resizeState && resizeState.active) {
      const deltaX = (e.clientX - resizeState.startX) / zoom;
      const deltaY = (e.clientY - resizeState.startY) / zoom;
      const isPrecisionOverride = e.ctrlKey || e.altKey || e.metaKey;

      // A. Resizing a Form (ClientSize)
      if (resizeState.handle === 'form-se') {
        let nw = Math.max(260, Math.round(resizeState.initialBounds.width + deltaX));
        let nh = Math.max(180, Math.round(resizeState.initialBounds.height + deltaY));
        if (!isPrecisionOverride && snapToGrid) {
          nw = Math.max(260, Math.round(nw / gridStep) * gridStep);
          nh = Math.max(180, Math.round(nh / gridStep) * gridStep);
        }
        updateNodeBounds(resizeState.nodeId, { width: nw, height: nh }, false);
        return;
      }

      // B. Resizing child controls with 8 gizmo handles (Sub-Pixel Anchor Clamping: Minimum 12x12 threshold)
      const MIN_WIDTH = 12;
      const MIN_HEIGHT = 12;
      const b = { ...resizeState.initialBounds };
      let nx = b.x;
      let ny = b.y;
      let nw = b.width;
      let nh = b.height;

      // East handle (E, NE, SE)
      if (resizeState.handle.includes('e')) {
        nw = Math.max(MIN_WIDTH, Math.round(b.width + deltaX));
      }

      // South handle (S, SE, SW)
      if (resizeState.handle.includes('s')) {
        nh = Math.max(MIN_HEIGHT, Math.round(b.height + deltaY));
      }

      // West handle (W, NW, SW) - Anchored right, moving left edge
      if (resizeState.handle.includes('w')) {
        const maxDeltaX = b.width - MIN_WIDTH;
        const clampedDeltaX = Math.min(deltaX, maxDeltaX);
        nw = Math.max(MIN_WIDTH, Math.round(b.width - clampedDeltaX));
        nx = Math.round(b.x + clampedDeltaX);
      }

      // North handle (N, NE, NW) - Anchored bottom, moving top edge
      if (resizeState.handle.includes('n')) {
        const maxDeltaY = b.height - MIN_HEIGHT;
        const clampedDeltaY = Math.min(deltaY, maxDeltaY);
        nh = Math.max(MIN_HEIGHT, Math.round(b.height - clampedDeltaY));
        ny = Math.round(b.y + clampedDeltaY);
      }

      if (!isPrecisionOverride && snapToGrid) {
        nx = Math.round(nx / gridStep) * gridStep;
        ny = Math.round(ny / gridStep) * gridStep;
        nw = Math.max(MIN_WIDTH, Math.round(nw / gridStep) * gridStep);
        nh = Math.max(MIN_HEIGHT, Math.round(nh / gridStep) * gridStep);
      }

      // Invariant clamp to guarantee minimum 12x12 threshold
      nw = Math.max(MIN_WIDTH, nw);
      nh = Math.max(MIN_HEIGHT, nh);

      updateNodeBounds(resizeState.nodeId, { x: nx, y: ny, width: nw, height: nh }, false);
      return;
    }

    // 5. Marquee selection update
    if (marquee) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const currentX = (e.clientX - rect.left - panOffset.x) / zoom;
      const currentY = (e.clientY - rect.top - panOffset.y) / zoom;
      setMarquee(prev => prev ? { ...prev, currentX, currentY } : null);
    }
  }, [
    isPanning,
    panStart,
    dragState,
    resizeState,
    marquee,
    zoom,
    panOffset,
    nodes,
    activeForm,
    snapToGrid,
    gridStep,
    vTransform,
    setCursorPos,
    setPanOffset,
    setSnapGuides,
    setEquidistantTicks,
    setSnapTelemetry,
    updateMultipleNodeBounds,
    updateNodeBounds,
  ]);

  // Pointer Up (finish drag, resize, pan, or marquee) (Pravka 10.1: Coalesced Atomic Steps)
  const handleMouseUp = useCallback(() => {
    if (isPanning) setIsPanning(false);

    if (dragState && dragState.active) {
      let moved = false;
      dragState.dragIds.forEach(nid => {
        const current = nodes[nid];
        const init = dragState.initialBoundsMap[nid];
        if (current && init && (current.bounds.x !== init.x || current.bounds.y !== init.y)) {
          moved = true;
        }
      });

      if (moved) {
        const count = dragState.dragIds.length;
        const primaryName = nodes[dragState.nodeId]?.properties.name || 'Элемент';
        const desc = count > 1
          ? `Перемещение ${count} элементов`
          : `Перемещение ${primaryName} в (X:${Math.round(nodes[dragState.nodeId]?.bounds.x || 0)}, Y:${Math.round(nodes[dragState.nodeId]?.bounds.y || 0)})`;
        commitTransaction(desc, 'move');
      } else {
        cancelTransaction();
      }

      setDragState(null);
      setSnapGuides([]);
      setEquidistantTicks([]);
      setSnapTelemetry(null);
      setSnapHysteresisState(null);
    }

    if (resizeState && resizeState.active) {
      const node = nodes[resizeState.nodeId];
      const init = resizeState.initialBounds;
      const resized = node && (
        node.bounds.width !== init.width ||
        node.bounds.height !== init.height ||
        node.bounds.x !== init.x ||
        node.bounds.y !== init.y
      );

      if (resized && node) {
        const desc = `Изменение размера ${node.properties.name} (${Math.round(node.bounds.width)}×${Math.round(node.bounds.height)})`;
        commitTransaction(desc, 'resize');
      } else {
        cancelTransaction();
      }

      setResizeState(null);
    }

    if (marquee) {
      const x1 = Math.min(marquee.startX, marquee.currentX);
      const y1 = Math.min(marquee.startY, marquee.currentY);
      const x2 = Math.max(marquee.startX, marquee.currentX);
      const y2 = Math.max(marquee.startY, marquee.currentY);

      if (x2 - x1 > 5 || y2 - y1 > 5) {
        // Select child controls inside marquee
        const selected: string[] = [];
        Object.values(nodes).forEach(n => {
          if (n.type === 'Form') return;
          const parent = n.parentId ? nodes[n.parentId] : activeForm;
          const parentX = parent ? parent.bounds.x : 0;
          const parentY = parent ? parent.bounds.y + 36 : 36;
          const absX = parentX + n.bounds.x;
          const absY = parentY + n.bounds.y;

          if (absX >= x1 && absX + n.bounds.width <= x2 && absY >= y1 && absY + n.bounds.height <= y2) {
            selected.push(n.id);
          }
        });

        if (selected.length > 0) {
          selected.forEach((id, idx) => selectNode(id, idx > 0));
        }
      }
      setMarquee(null);
    }
  }, [isPanning, dragState, resizeState, marquee, nodes, activeForm, setSnapGuides, setEquidistantTicks, setSnapTelemetry, selectNode, commitTransaction, cancelTransaction]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Start dragging a control (Fix 4.2: Relative Delta Grouping & Coalesced History)
  const handleStartDrag = (id: string, e: React.MouseEvent) => {
    const node = nodes[id];
    if (!node || node.properties.locked) return;

    beginTransaction();

    const isMulti = project.selectedNodeIds.includes(id) && project.selectedNodeIds.length > 1;
    const dragIds = isMulti
      ? project.selectedNodeIds.filter(nid => nodes[nid] && nodes[nid].type !== 'Form' && !nodes[nid].properties.locked)
      : [id];

    const initialBoundsMap: Record<string, LayoutBounds> = {};
    dragIds.forEach(nid => {
      if (nodes[nid]) {
        initialBoundsMap[nid] = { ...nodes[nid].bounds };
      }
    });

    setDragState({
      active: true,
      nodeId: id,
      dragIds,
      startX: e.clientX,
      startY: e.clientY,
      initialBounds: { ...node.bounds },
      initialBoundsMap,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  };

  // Start resizing a control (Pravka 10.1)
  const handleStartResize = (id: string, handle: string, e: React.MouseEvent) => {
    const node = nodes[id];
    if (!node || node.properties.locked) return;
    beginTransaction();
    setResizeState({
      active: true,
      nodeId: id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialBounds: { ...node.bounds },
    });
  };

  // Start moving a Form
  const handleStartFormMove = (formId: string, e: React.MouseEvent) => {
    const formNode = nodes[formId];
    if (!formNode) return;
    beginTransaction();
    setActiveFormId(formId);
    setDragState({
      active: true,
      nodeId: formId,
      dragIds: [formId],
      startX: e.clientX,
      startY: e.clientY,
      initialBounds: { ...formNode.bounds },
      initialBoundsMap: { [formId]: { ...formNode.bounds } },
      currentX: e.clientX,
      currentY: e.clientY,
    });
  };

  // Start resizing a Form
  const handleStartFormResize = (formId: string, e: React.MouseEvent) => {
    const formNode = nodes[formId];
    if (!formNode) return;
    beginTransaction();
    setActiveFormId(formId);
    setResizeState({
      active: true,
      nodeId: formId,
      handle: 'form-se',
      startX: e.clientX,
      startY: e.clientY,
      initialBounds: { ...formNode.bounds },
    });
  };

  // Drop from toolbox
  const handleDrop = useCallback((e: React.DragEvent, parentId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const type = e.dataTransfer.getData('controlType') as ControlType;
    if (!type) return;

    const parentNode = nodes[parentId];
    if (!parentNode) return;

    const targetElement = e.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const dropX = Math.max(8, Math.round((e.clientX - rect.left) / zoom));
    const dropY = Math.max(8, Math.round((e.clientY - rect.top) / zoom));

    addControl(type, parentId, { x: dropX, y: dropY });
  }, [zoom, nodes, addControl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Intelligent Mock Runtime Simulation for Live Emulator mode
  const handleEventTrigger = useCallback((eventName: string, handlerName: string, controlName: string) => {
    addConsoleLog('Event', `Сработало событие: ${handlerName}()`);

    const lowerCtrl = controlName.toLowerCase();
    const lowerHandler = handlerName.toLowerCase();

    if (lowerCtrl.includes('calc') || lowerHandler.includes('calc') || controlName === 'btnCalculate') {
      const domInputs = document.querySelectorAll('input[type="text"]');
      let numA = 150;
      let numB = 50;

      if (domInputs.length >= 2) {
        numA = parseFloat((domInputs[0] as HTMLInputElement).value) || 150;
        numB = parseFloat((domInputs[1] as HTMLInputElement).value) || 50;
      }

      const sum = numA + numB;
      addConsoleLog('Console.WriteLine', `Сумма чисел: ${sum}`);
      addConsoleLog('MessageBox.Show', `Заголовок: "Успех", Сообщение: "Расчет завершен!"`);

      setMessageBoxModal({
        isOpen: true,
        title: 'Успех',
        text: `Расчет завершен!\nСумма чисел: ${sum}`,
      });
      return;
    }

    if (lowerCtrl.includes('submit') || lowerCtrl.includes('send') || lowerCtrl.includes('save') || lowerCtrl.includes('login')) {
      addConsoleLog('Console.WriteLine', `Данные формы успешно проверены и отправлены обработчиком ${handlerName}.`);
      addConsoleLog('MessageBox.Show', `Заголовок: "Успех", Сообщение: "Операция завершена!"`);
      setMessageBoxModal({
        isOpen: true,
        title: 'Успех',
        text: `Операция успешно выполнена для элемента ${controlName}!`,
      });
      return;
    }

    if (eventName === 'Click') {
      addConsoleLog('Console.WriteLine', `Нажата кнопка ${controlName}. Обработчик ${handlerName} выполнен.`);
      addConsoleLog('MessageBox.Show', `Заголовок: "${controlName}", Сообщение: "Клик обработан успешно!"`);
      setMessageBoxModal({
        isOpen: true,
        title: controlName,
        text: `Действие успешно выполнено: ${controlName}`,
      });
    } else {
      addConsoleLog('Console.WriteLine', `Событие ${eventName} для ${controlName} обработано.`);
    }
  }, [addConsoleLog, setMessageBoxModal]);

  // Double-Click on control: Auto-wire default primary event & switch to Events tab
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    const node = nodes[nodeId];
    if (!node) return;

    selectNode(nodeId);
    const def = getDefaultEventForControl(node.type);
    const existingHandler = node.events?.[def.eventName];

    if (!existingHandler) {
      const handlerName = `${node.properties.name}_${def.eventName}`;
      updateNodeEvents(nodeId, { [def.eventName]: handlerName });
    }

    setActiveRightTab('events');
  }, [nodes, selectNode, updateNodeEvents, setActiveRightTab]);

  // Render tree of controls inside a container
  const renderControlsInside = (parentId: string): React.ReactNode => {
    const parent = nodes[parentId];
    if (!parent || !parent.childrenIds) return null;

    const isEmulator = appMode === 'emulator';

    return parent.childrenIds.map(childId => {
      const node = nodes[childId];
      if (!node) return null;

      const isSelected = project.selectedNodeIds.includes(node.id);

      return (
        <CanvasNodeItem
          key={node.id}
          node={node}
          isSelected={isSelected}
          spacePressed={spacePressed || isPanMode}
          isEmulatorMode={isEmulator}
          onEventTrigger={handleEventTrigger}
          onSelect={selectNode}
          onDoubleClick={handleNodeDoubleClick}
          onContextMenu={(id, e) => {
            setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id });
          }}
          onStartDrag={handleStartDrag}
          onStartResize={handleStartResize}
          onDropOnContainer={handleDrop}
          renderChildren={renderControlsInside}
        />
      );
    });
  };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={e => {
        const targetId = activeForm?.id || project.rootFormId;
        handleDrop(e, targetId);
      }}
      style={{
        cursor: spacePressed || isPanning || isPanMode ? 'grab' : 'default',
      }}
      className="w-full h-full relative overflow-hidden select-none bg-[#09090b]"
    >
      {/* 1. HTML5 Canvas Lower Layer (Infinite Dot Grid + Snap Guides at 120 FPS) */}
      {showGrid && (
        <InfiniteDotGrid
          scale={zoom}
          translateX={panOffset.x}
          translateY={panOffset.y}
          width={containerSize.width}
          height={containerSize.height}
          gridSize={gridStep}
          majorGridMultiple={8}
          snapGuides={snapGuides}
          equidistantTicks={equidistantTicks}
          formBounds={activeForm ? activeForm.bounds : undefined}
        />
      )}

      {/* 2. Floating Super-Canvas Toolbar (Viewport HUD) */}
      <ViewportHud
        scale={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomChange={handleZoomChange}
        onFitToScreen={handleFitToScreen}
        onResetOneToOne={handleResetOneToOne}
        isPanMode={isPanMode}
        onTogglePanMode={() => setIsPanMode(!isPanMode)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        gridStep={gridStep}
        onGridStepChange={setGridStep}
        globalTheme={globalTheme}
        onThemeChange={setGlobalTheme}
        activeDpiMode={activeDpiMode}
        onDpiChange={setActiveDpiMode}
        allForms={allForms}
        activeForm={activeForm}
        onSelectForm={setActiveFormId}
        onAddForm={() => addForm()}
      />

      {/* 3. Upper DOM Layer with Hardware-Accelerated matrix() Transformation */}
      <div
        style={{
          transform: `matrix(${zoom}, 0, 0, ${zoom}, ${panOffset.x}, ${panOffset.y})`,
          transformOrigin: '0 0',
          transition: isPanning ? 'none' : 'transform 0.04s ease-out',
        }}
        className="absolute top-0 left-0 pointer-events-auto"
      >
        {/* Render All Forms in the Multi-Form Stacking Context with Z-Index Virtualization (Pravka 2.6) */}
        {allForms.map(form => {
          const zIndexRank = formZOrder.indexOf(form.id);
          const isCurrentActive = form.id === (activeFormId || allForms[0]?.id);
          const computedZIndex = 15 + (zIndexRank !== -1 ? (zIndexRank + 1) * 5 : 5) + (isCurrentActive ? 40 : 0);

          return (
            <FormWindowShell
              key={form.id}
              form={form}
              isActive={isCurrentActive}
              zIndex={computedZIndex}
              isEmulatorMode={appMode === 'emulator'}
              theme={form.properties.customProps?.themeOverride || globalTheme}
              onSelectForm={() => {
                bringFormToFront(form.id);
              }}
              onStartMove={e => {
                bringFormToFront(form.id);
                handleStartFormMove(form.id, e);
              }}
              onStartResize={e => {
                bringFormToFront(form.id);
                handleStartFormResize(form.id, e);
              }}
              onCloseForm={allForms.length > 1 ? () => removeForm(form.id) : undefined}
              renderChildren={() => renderControlsInside(form.id)}
            />
          );
        })}
      </div>

      {/* Tab Order Mode Floating Banner */}
      {isTabOrderMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 backdrop-blur-md border border-blue-500/80 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-top-4 duration-150 select-none">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span className="font-bold text-white font-mono">🔢 РЕЖИМ TAB ORDER:</span>
            <span className="text-zinc-300">Кликайте по контролам для задания очередности.</span>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-zinc-400">Следующий:</span>
            <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-xs shadow-xs">
              [ {nextTabOrderIndex} ]
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          <button
            type="button"
            onClick={resetTabOrder}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer text-[11px]"
            title="Сбросить счетчик в 0 и очистить TabIndex"
          >
            Сбросить (0)
          </button>

          <button
            type="button"
            onClick={() => setTabOrderMode(false)}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors cursor-pointer text-[11px]"
          >
            Готово (Esc)
          </button>
        </div>
      )}

      {/* Marquee Selection Rectangle */}
      {marquee && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(marquee.startX * zoom + panOffset.x, marquee.currentX * zoom + panOffset.x)}px`,
            top: `${Math.min(marquee.startY * zoom + panOffset.y, marquee.currentY * zoom + panOffset.y)}px`,
            width: `${Math.abs(marquee.currentX - marquee.startX) * zoom}px`,
            height: `${Math.abs(marquee.currentY - marquee.startY) * zoom}px`,
            border: '1px solid #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            pointerEvents: 'none',
            zIndex: 45,
          }}
        />
      )}

      {/* Selected Control Coordinate Annotation Callout */}
      {selectedNode && selectedNode.type !== 'Form' && (
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-md text-[11px] font-mono text-zinc-300 pointer-events-none shadow-lg flex items-center gap-2 z-40 animate-fadeIn">
          <span className="text-blue-400 font-semibold">{selectedNode.properties.name}:</span>
          <span>
            X: <strong className="text-zinc-100">{Math.round(selectedNode.bounds.x)}px</strong>,
            Y: <strong className="text-zinc-100">{Math.round(selectedNode.bounds.y)}px</strong>
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            W: <strong className="text-zinc-100">{Math.round(selectedNode.bounds.width)}px</strong>,
            H: <strong className="text-zinc-100">{Math.round(selectedNode.bounds.height)}px</strong>
          </span>
        </div>
      )}

      {/* Keyboard Shortcuts Floating Legend Button & Overlay (SaaS Dashboard & Developer Experience Polish) */}
      <div className="absolute bottom-4 left-4 z-40 flex flex-col items-start gap-2">
        {showHotkeysHelp && (
          <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-xl p-4 w-72 shadow-2xl text-zinc-300 space-y-2.5 animate-fadeIn font-sans border-b-2 border-b-purple-500">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="font-bold text-xs text-zinc-100 flex items-center gap-1.5 font-mono text-purple-400">
                ⌨️ ГОРЯЧИЕ КЛАВИШИ
              </span>
              <button
                onClick={() => setShowHotkeysHelp(false)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 hover:bg-zinc-900 rounded border border-zinc-800/60 cursor-pointer"
              >
                Скрыть
              </button>
            </div>
            
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">Смещение по сетке ({gridStep}px)</span>
                <kbd className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-200">⇅⇄ Стрелки</kbd>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">Точное смещение (1px)</span>
                <kbd className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-200">Ctrl/Alt + ⇅⇄</kbd>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">Изменить размер</span>
                <kbd className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-200">Shift + ⇅⇄</kbd>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">Дублировать</span>
                <kbd className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-200">Ctrl + D</kbd>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">Отмена / Повтор</span>
                <kbd className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-200">Ctrl + Z / Y</kbd>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">Выделить всё в форме</span>
                <kbd className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-200">Ctrl + A</kbd>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">Панорамирование холста</span>
                <kbd className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-200">Пробел + Драг</kbd>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">Удалить выбранное</span>
                <kbd className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-200">Del / Backspace</kbd>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowHotkeysHelp(!showHotkeysHelp)}
          className="px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800/90 backdrop-blur-md border border-zinc-800 rounded-md text-[11px] font-medium text-zinc-400 hover:text-zinc-200 pointer-events-auto shadow-lg flex items-center gap-1.5 transition cursor-pointer"
        >
          <span>⌨️</span>
          <span>Горячие клавиши</span>
        </button>
      </div>

      {/* Floating RMB Context Menu (Правка 16.2) */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          className="z-50 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-xl shadow-2xl py-1.5 w-52 text-xs select-none animate-in fade-in-50 duration-75 text-zinc-200"
          onClick={() => setContextMenu(null)}
        >
          <div className="px-3 py-1 font-mono text-[10px] text-zinc-500 uppercase border-b border-zinc-800/80 mb-1">
            Контрол: {nodes[contextMenu.nodeId]?.properties.name || 'Элемент'}
          </div>

          <button
            type="button"
            onClick={() => duplicateSelectedNodes()}
            className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center justify-between cursor-pointer"
          >
            <span>📄 Дублировать</span>
            <span className="text-[10px] font-mono text-zinc-500">Ctrl+D</span>
          </button>

          <button
            type="button"
            onClick={() => alignSelectedNodes('bringForward')}
            className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
          >
            <span>🔝 На передний план</span>
            <span className="text-[10px] font-mono text-zinc-500">Ctrl+]</span>
          </button>

          <button
            type="button"
            onClick={() => alignSelectedNodes('sendBackward')}
            className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
          >
            <span>🔙 На задний план</span>
            <span className="text-[10px] font-mono text-zinc-500">Ctrl+[</span>
          </button>

          <button
            type="button"
            onClick={() => alignSelectedNodes('center')}
            className="w-full px-3 py-1.5 text-left hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
          >
            <span>📐 Выровнять по центру</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (contextMenu.nodeId) {
                handleNodeDoubleClick(contextMenu.nodeId);
              }
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-amber-600/20 hover:text-amber-300 flex items-center justify-between cursor-pointer"
          >
            <span>⚡ Привязать событие Click...</span>
          </button>

          <div className="h-px bg-zinc-800 my-1" />

          <button
            type="button"
            onClick={() => deleteSelectedNodes()}
            className="w-full px-3 py-1.5 text-left hover:bg-red-600/20 text-red-300 flex items-center justify-between cursor-pointer font-medium"
          >
            <span>🗑 Удалить</span>
            <span className="text-[10px] font-mono text-zinc-500">Del</span>
          </button>
        </div>
      )}

      {/* 🟢 РЕДАКТОР СОВМЕСТНОЙ РАБОТЫ: КУРСОРЫ НАПАРНИКОВ */}
      {p2pPeers.map(peer => (
        <div
          key={peer.peerId}
          style={{
            position: 'absolute',
            left: `${peer.x}px`,
            top: `${peer.y}px`,
            pointerEvents: 'none',
            zIndex: 100,
            transition: 'left 120ms cubic-bezier(0.1, 0.8, 0.2, 1), top 120ms cubic-bezier(0.1, 0.8, 0.2, 1)'
          }}
          className="flex flex-col items-start"
        >
          <svg
            className="w-5 h-5 filter drop-shadow-md"
            viewBox="0 0 24 24"
            fill={peer.color}
          >
            <path d="M4.5 3v15.2l4.8-4.8 3.8 9 2.5-1.1-3.8-9 6.2-.3z" />
          </svg>
          <span
            style={{ backgroundColor: peer.color }}
            className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-lg whitespace-nowrap animate-fadeIn mt-1 flex flex-col gap-0.5"
          >
            <span>{peer.name}</span>
            {peer.selectedNodeId && (
              <span className="text-[8px] font-medium opacity-90 border-t border-white/20 pt-0.5 mt-0.5">
                🎯 Изменяет {peer.selectedNodeId}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};
