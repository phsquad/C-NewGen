/**
 * DevOS Global Pointer Capture Window Dragging Engine
 * Ensures 100% smooth dragging without losing cursor focus outside windows.
 */

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export class WindowDragController {
  private isDragging = false;
  private isResizing = false;
  private resizeHandle = '';
  private startX = 0;
  private startY = 0;
  private initialX = 0;
  private initialY = 0;
  private initialWidth = 0;
  private initialHeight = 0;

  /**
   * Attaches pointer capture drag behavior to header element
   */
  public attachHeaderDrag(
    headerElement: HTMLElement,
    onMove: (pos: WindowPosition) => void,
    onFocus: () => void,
    getCurrentPos: () => WindowPosition
  ): () => void {
    const handlePointerDown = (e: PointerEvent) => {
      // Ignore if clicking on window control buttons
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('input')) return;

      headerElement.setPointerCapture(e.pointerId);
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;

      const pos = getCurrentPos();
      this.initialX = pos.x;
      this.initialY = pos.y;

      onFocus();
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.startX;
      const deltaY = e.clientY - this.startY;

      onMove({
        x: Math.max(0, this.initialX + deltaX),
        y: Math.max(28, this.initialY + deltaY),
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (this.isDragging) {
        try {
          headerElement.releasePointerCapture(e.pointerId);
        } catch {
          // ignore if already released
        }
        this.isDragging = false;
      }
    };

    headerElement.addEventListener('pointerdown', handlePointerDown);
    headerElement.addEventListener('pointermove', handlePointerMove);
    headerElement.addEventListener('pointerup', handlePointerUp);
    headerElement.addEventListener('pointercancel', handlePointerUp);

    return () => {
      headerElement.removeEventListener('pointerdown', handlePointerDown);
      headerElement.removeEventListener('pointermove', handlePointerMove);
      headerElement.removeEventListener('pointerup', handlePointerUp);
      headerElement.removeEventListener('pointercancel', handlePointerUp);
    };
  }

  /**
   * Attaches pointer capture resize behavior to a handle
   */
  public attachResizeHandle(
    handleElement: HTMLElement,
    handleType: string,
    onResize: (size: WindowSize, pos?: WindowPosition) => void,
    getCurrentSize: () => WindowSize,
    getCurrentPos: () => WindowPosition
  ): () => void {
    const handlePointerDown = (e: PointerEvent) => {
      e.stopPropagation();
      handleElement.setPointerCapture(e.pointerId);
      this.isResizing = true;
      this.resizeHandle = handleType;
      this.startX = e.clientX;
      this.startY = e.clientY;

      const size = getCurrentSize();
      const pos = getCurrentPos();
      this.initialWidth = size.width;
      this.initialHeight = size.height;
      this.initialX = pos.x;
      this.initialY = pos.y;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!this.isResizing) return;

      const deltaX = e.clientX - this.startX;
      const deltaY = e.clientY - this.startY;

      let newWidth = this.initialWidth;
      let newHeight = this.initialHeight;
      let newX = this.initialX;
      let newY = this.initialY;

      if (this.resizeHandle.includes('r')) {
        newWidth = Math.max(380, this.initialWidth + deltaX);
      }
      if (this.resizeHandle.includes('b')) {
        newHeight = Math.max(260, this.initialHeight + deltaY);
      }
      if (this.resizeHandle.includes('l')) {
        const potentialWidth = this.initialWidth - deltaX;
        if (potentialWidth >= 380) {
          newWidth = potentialWidth;
          newX = this.initialX + deltaX;
        }
      }
      if (this.resizeHandle.includes('t')) {
        const potentialHeight = this.initialHeight - deltaY;
        if (potentialHeight >= 260) {
          newHeight = potentialHeight;
          newY = this.initialY + deltaY;
        }
      }

      onResize({ width: newWidth, height: newHeight }, { x: newX, y: newY });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (this.isResizing) {
        try {
          handleElement.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        this.isResizing = false;
      }
    };

    handleElement.addEventListener('pointerdown', handlePointerDown);
    handleElement.addEventListener('pointermove', handlePointerMove);
    handleElement.addEventListener('pointerup', handlePointerUp);
    handleElement.addEventListener('pointercancel', handlePointerUp);

    return () => {
      handleElement.removeEventListener('pointerdown', handlePointerDown);
      handleElement.removeEventListener('pointermove', handlePointerMove);
      handleElement.removeEventListener('pointerup', handlePointerUp);
      handleElement.removeEventListener('pointercancel', handlePointerUp);
    };
  }
}
