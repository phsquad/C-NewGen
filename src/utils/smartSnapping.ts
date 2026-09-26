import { LayoutBounds, DesignerNode, SnapGuide, EquidistantTick, SnapTargetTelemetry } from '../types/ast';

export interface SmartSnapOptions {
  draggingType?: string;
  previousSnapState?: {
    snappedXAxis?: number | null;
    snappedYAxis?: number | null;
  } | null;
  disableSnap?: boolean; // When Ctrl or Alt is pressed
}

export interface SmartSnapResult {
  snappedX: number;
  snappedY: number;
  activeGuides: SnapGuide[];
  equidistantTicks: EquidistantTick[];
  snapTelemetry: SnapTargetTelemetry | null;
  currentSnapState: {
    snappedXAxis: number | null;
    snappedYAxis: number | null;
  };
}

// Pravka 5.1: Kinetic Snap Hysteresis
const SNAP_ENTER_THRESHOLD = 5;  // Distance in px to engage magnet
const SNAP_RELEASE_THRESHOLD = 8; // Distance in px to break away from locked magnet

// Pravka 5.2: WinForms Native UI Guidelines (Microsoft Desktop Standards)
const WINFORMS_MARGIN = 12;            // 12px standard WinForms container margin
const WINFORMS_GAP = 6;                // 6px standard adjacent button / control gap
const WINFORMS_LABEL_INPUT_GAP = 4;    // 4px standard Label to TextBox/Input gap

const INPUT_CONTROL_TYPES = new Set(['TextBox', 'ComboBox', 'NumericUpDown', 'DateTimePicker', 'ListBox']);

/**
 * 1D Spatial Sweep Smart Snapping Engine with Kinetic Hysteresis (O(N))
 */
export function calculateSmartSnapping(
  draggingBounds: LayoutBounds,
  staticNodes: DesignerNode[],
  containerWidth: number,
  containerHeight: number,
  options: SmartSnapOptions = {}
): SmartSnapResult {
  const { draggingType, previousSnapState, disableSnap = false } = options;

  let snappedX = draggingBounds.x;
  let snappedY = draggingBounds.y;

  // Pravka 5.3: If Ctrl/Alt is held, bypass all snapping and provide sub-pixel precision
  if (disableSnap) {
    return {
      snappedX: Math.round(snappedX),
      snappedY: Math.round(snappedY),
      activeGuides: [],
      equidistantTicks: [],
      snapTelemetry: {
        targetName: 'Freeform Precision',
        alignSummary: 'Sub-Pixel Precision (Ctrl/Alt)',
        isMagneticActive: false,
        deltaX: 0,
        deltaY: 0,
      },
      currentSnapState: {
        snappedXAxis: null,
        snappedYAxis: null,
      },
    };
  }

  const w = draggingBounds.width;
  const h = draggingBounds.height;

  const dragLeft = draggingBounds.x;
  const dragCenterX = draggingBounds.x + w / 2;
  const dragRight = draggingBounds.x + w;

  const dragTop = draggingBounds.y;
  const dragCenterY = draggingBounds.y + h / 2;
  const dragBottom = draggingBounds.y + h;

  const activeGuides: SnapGuide[] = [];
  const equidistantTicks: EquidistantTick[] = [];
  const alignTypes: string[] = [];
  let primaryTargetName: string | undefined = undefined;

  let bestDistX = SNAP_ENTER_THRESHOLD + 1;
  let bestDistY = SNAP_ENTER_THRESHOLD + 1;
  let currentSnappedXAxis: number | null = null;
  let currentSnappedYAxis: number | null = null;

  // Helper for Hysteresis: get threshold depending on whether we were previously locked to this position
  const getThresholdX = (axisPos: number) => {
    if (previousSnapState?.snappedXAxis !== null && previousSnapState?.snappedXAxis !== undefined) {
      if (Math.abs(previousSnapState.snappedXAxis - axisPos) < 2) {
        return SNAP_RELEASE_THRESHOLD; // Stickier threshold to prevent jittering
      }
    }
    return SNAP_ENTER_THRESHOLD;
  };

  const getThresholdY = (axisPos: number) => {
    if (previousSnapState?.snappedYAxis !== null && previousSnapState?.snappedYAxis !== undefined) {
      if (Math.abs(previousSnapState.snappedYAxis - axisPos) < 2) {
        return SNAP_RELEASE_THRESHOLD; // Stickier threshold to prevent jittering
      }
    }
    return SNAP_ENTER_THRESHOLD;
  };

  // ==========================================
  // 1. Container Form Standard Margins (12px) & Center
  // ==========================================
  // Left margin: 12px
  const threshMarginLeft = getThresholdX(WINFORMS_MARGIN);
  const distMarginLeft = Math.abs(dragLeft - WINFORMS_MARGIN);
  if (distMarginLeft < bestDistX && distMarginLeft <= threshMarginLeft) {
    bestDistX = distMarginLeft;
    snappedX = WINFORMS_MARGIN;
    currentSnappedXAxis = WINFORMS_MARGIN;
    activeGuides.push({
      type: 'x',
      position: WINFORMS_MARGIN,
      start: 0,
      end: containerHeight,
      kind: 'margin',
      label: '12px Margin',
      color: '#10B981', // Emerald green
      targetName: 'Form Margin',
    });
    alignTypes.push('Left Margin (12px)');
  }

  // Right margin: containerWidth - 12px - w
  const rightMarginX = containerWidth - WINFORMS_MARGIN - w;
  const threshMarginRight = getThresholdX(containerWidth - WINFORMS_MARGIN);
  const distMarginRight = Math.abs(dragLeft - rightMarginX);
  if (distMarginRight < bestDistX && distMarginRight <= threshMarginRight) {
    bestDistX = distMarginRight;
    snappedX = rightMarginX;
    currentSnappedXAxis = containerWidth - WINFORMS_MARGIN;
    activeGuides.push({
      type: 'x',
      position: containerWidth - WINFORMS_MARGIN,
      start: 0,
      end: containerHeight,
      kind: 'margin',
      label: '12px Margin',
      color: '#10B981',
      targetName: 'Form Margin',
    });
    alignTypes.push('Right Margin (12px)');
  }

  // Container Center X
  const containerCenterX = Math.round(containerWidth / 2);
  const threshCenterX = getThresholdX(containerCenterX);
  const distCenterX = Math.abs(dragCenterX - containerCenterX);
  if (distCenterX < bestDistX && distCenterX <= threshCenterX) {
    bestDistX = distCenterX;
    snappedX = containerCenterX - w / 2;
    currentSnappedXAxis = containerCenterX;
    activeGuides.push({
      type: 'x',
      position: containerCenterX,
      start: 0,
      end: containerHeight,
      kind: 'center',
      label: 'Center-X',
      color: '#3B82F6', // Blue
      targetName: 'Form Center',
    });
    alignTypes.push('Form Center-X');
  }

  // Top margin: 12px
  const threshMarginTop = getThresholdY(WINFORMS_MARGIN);
  const distMarginTop = Math.abs(dragTop - WINFORMS_MARGIN);
  if (distMarginTop < bestDistY && distMarginTop <= threshMarginTop) {
    bestDistY = distMarginTop;
    snappedY = WINFORMS_MARGIN;
    currentSnappedYAxis = WINFORMS_MARGIN;
    activeGuides.push({
      type: 'y',
      position: WINFORMS_MARGIN,
      start: 0,
      end: containerWidth,
      kind: 'margin',
      label: '12px Margin',
      color: '#10B981',
      targetName: 'Form Margin',
    });
    alignTypes.push('Top Margin (12px)');
  }

  // Bottom margin: containerHeight - 12px - h
  const bottomMarginY = containerHeight - WINFORMS_MARGIN - h;
  const threshMarginBottom = getThresholdY(containerHeight - WINFORMS_MARGIN);
  const distMarginBottom = Math.abs(dragTop - bottomMarginY);
  if (distMarginBottom < bestDistY && distMarginBottom <= threshMarginBottom) {
    bestDistY = distMarginBottom;
    snappedY = bottomMarginY;
    currentSnappedYAxis = containerHeight - WINFORMS_MARGIN;
    activeGuides.push({
      type: 'y',
      position: containerHeight - WINFORMS_MARGIN,
      start: 0,
      end: containerWidth,
      kind: 'margin',
      label: '12px Margin',
      color: '#10B981',
      targetName: 'Form Margin',
    });
    alignTypes.push('Bottom Margin (12px)');
  }

  // Container Center Y
  const containerCenterY = Math.round(containerHeight / 2);
  const threshCenterY = getThresholdY(containerCenterY);
  const distCenterY = Math.abs(dragCenterY - containerCenterY);
  if (distCenterY < bestDistY && distCenterY <= threshCenterY) {
    bestDistY = distCenterY;
    snappedY = containerCenterY - h / 2;
    currentSnappedYAxis = containerCenterY;
    activeGuides.push({
      type: 'y',
      position: containerCenterY,
      start: 0,
      end: containerWidth,
      kind: 'center',
      label: 'Center-Y',
      color: '#3B82F6',
      targetName: 'Form Center',
    });
    alignTypes.push('Form Center-Y');
  }

  // ==========================================
  // 2. Sibling Controls Magnetism & WinForms UI Guidelines
  // ==========================================
  const isDraggingLabel = draggingType === 'Label';
  const isDraggingInput = draggingType ? INPUT_CONTROL_TYPES.has(draggingType) : false;

  for (const staticNode of staticNodes) {
    const s = staticNode.bounds;
    const name = staticNode.properties.name || staticNode.id;
    const sType = staticNode.type;
    const isStaticLabel = sType === 'Label';
    const isStaticInput = INPUT_CONTROL_TYPES.has(sType);

    // Determine idiomatic WinForms gap (4px for Label-to-Input pairing, 6px for button/general controls)
    const isLabelInputPair = (isDraggingLabel && isStaticInput) || (isDraggingInput && isStaticLabel);
    const applicableGap = isLabelInputPair ? WINFORMS_LABEL_INPUT_GAP : WINFORMS_GAP;
    const gapLabel = isLabelInputPair ? '4px Label Gap' : '6px Gap';

    const staticCenterX = s.x + s.width / 2;
    const staticCenterY = s.y + s.height / 2;

    const overlapYStart = Math.min(dragTop, s.y) - 10;
    const overlapYEnd = Math.max(dragBottom, s.y + s.height) + 10;
    const overlapXStart = Math.min(dragLeft, s.x) - 10;
    const overlapXEnd = Math.max(dragRight, s.x + s.width) + 10;

    // --- Vertical Guides (X alignments) ---
    // A. Left-to-Left (Edge #8B5CF6)
    const threshLeft = getThresholdX(s.x);
    const dLeftLeft = Math.abs(dragLeft - s.x);
    if (dLeftLeft < bestDistX && dLeftLeft <= threshLeft) {
      bestDistX = dLeftLeft;
      snappedX = s.x;
      currentSnappedXAxis = s.x;
      primaryTargetName = name;
      activeGuides.push({
        type: 'x',
        position: s.x,
        start: overlapYStart,
        end: overlapYEnd,
        kind: 'edge',
        label: 'Left Edge',
        color: '#8B5CF6',
        targetName: name,
      });
      alignTypes.push(`${name} Left`);
    }

    // B. Center-X (Center #3B82F6)
    const threshCX = getThresholdX(staticCenterX);
    const dCenterX = Math.abs(dragCenterX - staticCenterX);
    if (dCenterX < bestDistX && dCenterX <= threshCX) {
      bestDistX = dCenterX;
      snappedX = staticCenterX - w / 2;
      currentSnappedXAxis = staticCenterX;
      primaryTargetName = name;
      activeGuides.push({
        type: 'x',
        position: staticCenterX,
        start: overlapYStart,
        end: overlapYEnd,
        kind: 'center',
        label: 'Center-X',
        color: '#3B82F6',
        targetName: name,
      });
      alignTypes.push(`${name} Center-X`);
    }

    // C. Right-to-Right (Edge #8B5CF6)
    const threshRight = getThresholdX(s.x + s.width);
    const dRightRight = Math.abs(dragRight - (s.x + s.width));
    if (dRightRight < bestDistX && dRightRight <= threshRight) {
      bestDistX = dRightRight;
      snappedX = s.x + s.width - w;
      currentSnappedXAxis = s.x + s.width;
      primaryTargetName = name;
      activeGuides.push({
        type: 'x',
        position: s.x + s.width,
        start: overlapYStart,
        end: overlapYEnd,
        kind: 'edge',
        label: 'Right Edge',
        color: '#8B5CF6',
        targetName: name,
      });
      alignTypes.push(`${name} Right`);
    }

    // D. Left-to-Right adjacent gap (6px / 4px Gap #10B981)
    const gapRightX = s.x + s.width + applicableGap;
    const threshGapRight = getThresholdX(gapRightX);
    const dGapRight = Math.abs(dragLeft - gapRightX);
    if (dGapRight < bestDistX && dGapRight <= threshGapRight) {
      bestDistX = dGapRight;
      snappedX = gapRightX;
      currentSnappedXAxis = gapRightX;
      primaryTargetName = name;
      activeGuides.push({
        type: 'x',
        position: gapRightX,
        start: Math.min(dragTop, s.y),
        end: Math.max(dragBottom, s.y + s.height),
        kind: 'gap',
        label: gapLabel,
        color: '#10B981',
        targetName: name,
      });
      alignTypes.push(`${name} ${gapLabel}`);
    }

    // E. Right-to-Left adjacent gap (6px / 4px Gap #10B981)
    const gapLeftX = s.x - applicableGap - w;
    const threshGapLeft = getThresholdX(s.x - applicableGap);
    const dGapLeft = Math.abs(dragLeft - gapLeftX);
    if (dGapLeft < bestDistX && dGapLeft <= threshGapLeft) {
      bestDistX = dGapLeft;
      snappedX = gapLeftX;
      currentSnappedXAxis = s.x - applicableGap;
      primaryTargetName = name;
      activeGuides.push({
        type: 'x',
        position: s.x - applicableGap,
        start: Math.min(dragTop, s.y),
        end: Math.max(dragBottom, s.y + s.height),
        kind: 'gap',
        label: gapLabel,
        color: '#10B981',
        targetName: name,
      });
      alignTypes.push(`${name} ${gapLabel}`);
    }

    // --- Horizontal Guides (Y alignments) ---
    // A. Top-to-Top (Edge #8B5CF6)
    const threshTop = getThresholdY(s.y);
    const dTopTop = Math.abs(dragTop - s.y);
    if (dTopTop < bestDistY && dTopTop <= threshTop) {
      bestDistY = dTopTop;
      snappedY = s.y;
      currentSnappedYAxis = s.y;
      primaryTargetName = name;
      activeGuides.push({
        type: 'y',
        position: s.y,
        start: overlapXStart,
        end: overlapXEnd,
        kind: 'edge',
        label: 'Top Edge',
        color: '#8B5CF6',
        targetName: name,
      });
      alignTypes.push(`${name} Top`);
    }

    // B. Center-Y (Center #3B82F6)
    const threshCY = getThresholdY(staticCenterY);
    const dCenterY = Math.abs(dragCenterY - staticCenterY);
    if (dCenterY < bestDistY && dCenterY <= threshCY) {
      bestDistY = dCenterY;
      snappedY = staticCenterY - h / 2;
      currentSnappedYAxis = staticCenterY;
      primaryTargetName = name;
      activeGuides.push({
        type: 'y',
        position: staticCenterY,
        start: overlapXStart,
        end: overlapXEnd,
        kind: 'center',
        label: 'Center-Y',
        color: '#3B82F6',
        targetName: name,
      });
      alignTypes.push(`${name} Center-Y`);
    }

    // C. Bottom-to-Bottom (Edge #8B5CF6)
    const threshBottom = getThresholdY(s.y + s.height);
    const dBottomBottom = Math.abs(dragBottom - (s.y + s.height));
    if (dBottomBottom < bestDistY && dBottomBottom <= threshBottom) {
      bestDistY = dBottomBottom;
      snappedY = s.y + s.height - h;
      currentSnappedYAxis = s.y + s.height;
      primaryTargetName = name;
      activeGuides.push({
        type: 'y',
        position: s.y + s.height,
        start: overlapXStart,
        end: overlapXEnd,
        kind: 'edge',
        label: 'Bottom Edge',
        color: '#8B5CF6',
        targetName: name,
      });
      alignTypes.push(`${name} Bottom`);
    }

    // D. Top-to-Bottom adjacent gap (6px / 4px Gap #10B981)
    const gapBottomY = s.y + s.height + applicableGap;
    const threshGapBottom = getThresholdY(gapBottomY);
    const dGapBottom = Math.abs(dragTop - gapBottomY);
    if (dGapBottom < bestDistY && dGapBottom <= threshGapBottom) {
      bestDistY = dGapBottom;
      snappedY = gapBottomY;
      currentSnappedYAxis = gapBottomY;
      primaryTargetName = name;
      activeGuides.push({
        type: 'y',
        position: gapBottomY,
        start: Math.min(dragLeft, s.x),
        end: Math.max(dragRight, s.x + s.width),
        kind: 'gap',
        label: gapLabel,
        color: '#10B981',
        targetName: name,
      });
      alignTypes.push(`${name} ${gapLabel}`);
    }

    // E. Bottom-to-Top adjacent gap (6px / 4px Gap #10B981)
    const gapTopY = s.y - applicableGap - h;
    const threshGapTop = getThresholdY(s.y - applicableGap);
    const dGapTop = Math.abs(dragTop - gapTopY);
    if (dGapTop < bestDistY && dGapTop <= threshGapTop) {
      bestDistY = dGapTop;
      snappedY = gapTopY;
      currentSnappedYAxis = s.y - applicableGap;
      primaryTargetName = name;
      activeGuides.push({
        type: 'y',
        position: s.y - applicableGap,
        start: Math.min(dragLeft, s.x),
        end: Math.max(dragRight, s.x + s.width),
        kind: 'gap',
        label: gapLabel,
        color: '#10B981',
        targetName: name,
      });
      alignTypes.push(`${name} ${gapLabel}`);
    }
  }

  // ==========================================
  // 3. Equidistant Spacing Detection (e.g. 16px step between 3 controls)
  // ==========================================
  if (staticNodes.length >= 2) {
    for (let i = 0; i < staticNodes.length; i++) {
      for (let j = i + 1; j < staticNodes.length; j++) {
        const nodeA = staticNodes[i];
        const nodeB = staticNodes[j];

        const leftNode = nodeA.bounds.x < nodeB.bounds.x ? nodeA : nodeB;
        const rightNode = leftNode === nodeA ? nodeB : nodeA;
        const existingGap = rightNode.bounds.x - (leftNode.bounds.x + leftNode.bounds.width);

        if (existingGap >= 4 && existingGap <= 80) {
          // Check placement to the right of rightNode
          const candidateX1 = rightNode.bounds.x + rightNode.bounds.width + existingGap;
          const threshEq1 = getThresholdX(candidateX1);
          if (Math.abs(dragLeft - candidateX1) <= threshEq1) {
            snappedX = candidateX1;
            currentSnappedXAxis = candidateX1;
            const midY = (dragTop + rightNode.bounds.y) / 2 + h / 2;
            equidistantTicks.push({
              type: 'x',
              startPos: leftNode.bounds.x + leftNode.bounds.width,
              endPos: rightNode.bounds.x,
              crossCoord: midY,
              distance: existingGap,
              label: `${existingGap}px`,
            });
            equidistantTicks.push({
              type: 'x',
              startPos: rightNode.bounds.x + rightNode.bounds.width,
              endPos: candidateX1,
              crossCoord: midY,
              distance: existingGap,
              label: `${existingGap}px`,
            });
            alignTypes.push(`Equidistant (${existingGap}px)`);
          }

          // Check placement to the left of leftNode
          const candidateX2 = leftNode.bounds.x - existingGap - w;
          const threshEq2 = getThresholdX(candidateX2);
          if (Math.abs(dragLeft - candidateX2) <= threshEq2) {
            snappedX = candidateX2;
            currentSnappedXAxis = candidateX2;
            const midY = (dragTop + leftNode.bounds.y) / 2 + h / 2;
            equidistantTicks.push({
              type: 'x',
              startPos: candidateX2 + w,
              endPos: leftNode.bounds.x,
              crossCoord: midY,
              distance: existingGap,
              label: `${existingGap}px`,
            });
            equidistantTicks.push({
              type: 'x',
              startPos: leftNode.bounds.x + leftNode.bounds.width,
              endPos: rightNode.bounds.x,
              crossCoord: midY,
              distance: existingGap,
              label: `${existingGap}px`,
            });
            alignTypes.push(`Equidistant (${existingGap}px)`);
          }
        }
      }
    }
  }

  // Telemetry status construction
  const isMagneticActive = activeGuides.length > 0 || equidistantTicks.length > 0;
  const deltaX = Math.round(snappedX - draggingBounds.x);
  const deltaY = Math.round(snappedY - draggingBounds.y);

  const snapTelemetry: SnapTargetTelemetry | null = isMagneticActive ? {
    targetName: primaryTargetName || 'Form Margin',
    alignSummary: alignTypes.length > 0 ? alignTypes.slice(0, 3).join(' & ') : 'Aligned',
    isMagneticActive: true,
    deltaX,
    deltaY,
  } : null;

  return {
    snappedX: Math.round(snappedX),
    snappedY: Math.round(snappedY),
    activeGuides,
    equidistantTicks,
    snapTelemetry,
    currentSnapState: {
      snappedXAxis: currentSnappedXAxis,
      snappedYAxis: currentSnappedYAxis,
    },
  };
}
