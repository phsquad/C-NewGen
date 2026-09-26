/**
 * Affine 2D Transformation Matrix & Viewport Coordinate Transformer
 * Handles exact conversions between Screen Space (browser pixels),
 * World/Canvas Space, and .NET Form Client Space (logical 96 DPI).
 *
 * Matrix formula:
 * [ X_canvas ]   [ (X_screen - Translation_X) / Scale ]
 * [ Y_canvas ] = [ (Y_screen - Translation_Y) / Scale ]
 */

export class ViewportTransform {
  public scale: number = 1.0;
  public translateX: number = 0;
  public translateY: number = 0;

  constructor(scale = 1.0, translateX = 0, translateY = 0) {
    this.scale = scale;
    this.translateX = translateX;
    this.translateY = translateY;
  }

  /**
   * Transforms screen coordinate (relative to canvas container) into World/Canvas space
   */
  public screenToCanvasSpace(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.translateX) / this.scale,
      y: (screenY - this.translateY) / this.scale,
    };
  }

  /**
   * Transforms World/Canvas space coordinate into Screen space (browser pixels)
   */
  public canvasToScreenSpace(canvasX: number, canvasY: number): { x: number; y: number } {
    return {
      x: canvasX * this.scale + this.translateX,
      y: canvasY * this.scale + this.translateY,
    };
  }

  /**
   * Transforms screen mouse click into exact internal C# Form Client space
   * where (0, 0) is the top-left of the Form's interior client rectangle.
   */
  public screenToFormSpace(
    screenX: number,
    screenY: number,
    formOriginX: number,
    formOriginY: number
  ): { x: number; y: number } {
    const world = this.screenToCanvasSpace(screenX, screenY);
    return {
      x: Math.round(world.x - formOriginX),
      y: Math.round(world.y - formOriginY),
    };
  }

  /**
   * Transforms C# Form Client coordinate to screen space
   */
  public formToScreenSpace(
    formX: number,
    formY: number,
    formOriginX: number,
    formOriginY: number
  ): { x: number; y: number } {
    return {
      x: (formX + formOriginX) * this.scale + this.translateX,
      y: (formY + formOriginY) * this.scale + this.translateY,
    };
  }

  /**
   * Smoothly zooms at a specific focal point (e.g. cursor location)
   */
  public zoomAt(
    screenFocalX: number,
    screenFocalY: number,
    nextScale: number,
    minScale = 0.25,
    maxScale = 5.0
  ): { scale: number; translateX: number; translateY: number } {
    const clampedScale = Math.min(maxScale, Math.max(minScale, nextScale));
    if (Math.abs(clampedScale - this.scale) < 0.001) {
      return { scale: this.scale, translateX: this.translateX, translateY: this.translateY };
    }

    // Preserve world coordinate under cursor:
    // worldX = (screenX - tx) / s0 = (screenX - nextTx) / s1
    // => nextTx = screenX - worldX * s1
    const worldFocal = this.screenToCanvasSpace(screenFocalX, screenFocalY);
    const nextTx = screenFocalX - worldFocal.x * clampedScale;
    const nextTy = screenFocalY - worldFocal.y * clampedScale;

    this.scale = clampedScale;
    this.translateX = nextTx;
    this.translateY = nextTy;

    return { scale: this.scale, translateX: this.translateX, translateY: this.translateY };
  }

  /**
   * Calculates ideal scale and center offset to fit the Form inside viewport
   */
  public fitToBounds(
    containerW: number,
    containerH: number,
    targetW: number,
    targetH: number,
    padding = 64
  ): { scale: number; translateX: number; translateY: number } {
    if (containerW <= 0 || containerH <= 0 || targetW <= 0 || targetH <= 0) {
      return { scale: 1.0, translateX: 0, translateY: 0 };
    }

    const availW = Math.max(100, containerW - padding * 2);
    const availH = Math.max(100, containerH - padding * 2);

    const scaleX = availW / targetW;
    const scaleY = availH / targetH;
    let newScale = Math.min(scaleX, scaleY, 1.25);
    newScale = Math.max(0.3, Math.min(2.0, parseFloat(newScale.toFixed(2))));

    // Center target form
    const newTx = (containerW - targetW * newScale) / 2;
    const newTy = (containerH - targetH * newScale) / 2;

    this.scale = newScale;
    this.translateX = newTx;
    this.translateY = newTy;

    return { scale: newScale, translateX: newTx, translateY: newTy };
  }
}
