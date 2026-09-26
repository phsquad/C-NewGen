/**
 * Windows Forms 96-DPI Normalizer
 * Standardizes web viewport pixels to canonical .NET Windows Forms logical pixels (96 DPI).
 *
 * In .NET WinForms:
 * - 96 DPI = 100% scaling (1 pixel = 1 unit).
 * - 120 DPI = 125% scaling (1.25x).
 * - 144 DPI = 150% scaling (1.5x).
 * - 192 DPI = 200% scaling (2.0x).
 */

export type DpiMode = 'standard-96' | 'hd-120' | 'fhd-144' | 'retina-192' | 'system';

export interface DpiProfile {
  name: string;
  dpi: number;
  scaleFactor: number;
  description: string;
}

export const DPI_PROFILES: Record<DpiMode, DpiProfile> = {
  'standard-96': {
    name: '96 DPI (100%)',
    dpi: 96,
    scaleFactor: 1.0,
    description: 'Классический стандарт .NET WinForms (1 unit = 1 pixel)',
  },
  'hd-120': {
    name: '120 DPI (125%)',
    dpi: 120,
    scaleFactor: 1.25,
    description: 'Ноутбуки 1080p с масштабированием Windows 125%',
  },
  'fhd-144': {
    name: '144 DPI (150%)',
    dpi: 144,
    scaleFactor: 1.5,
    description: 'Масштабирование Windows 150%',
  },
  'retina-192': {
    name: '192 DPI (200%)',
    dpi: 192,
    scaleFactor: 2.0,
    description: '4K экраны / Retina 200%',
  },
  'system': {
    name: 'System Native',
    dpi: typeof window !== 'undefined' ? Math.round(96 * (window.devicePixelRatio || 1)) : 96,
    scaleFactor: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
    description: 'Автоматический масштаб вашего монитора',
  },
};

export class DpiNormalizer {
  /**
   * Returns current browser hardware devicePixelRatio
   */
  public static getDevicePixelRatio(): number {
    if (typeof window === 'undefined') return 1.0;
    return window.devicePixelRatio || 1.0;
  }

  /**
   * Normalizes screen measurement to canonical .NET 96-DPI units
   */
  public static toDotNetPixels(screenPixels: number, activeDpiScale = 1.0): number {
    return Math.round(screenPixels / activeDpiScale);
  }

  /**
   * Converts canonical .NET 96-DPI units to screen pixels for rendering
   */
  public static fromDotNetPixels(dotNetPixels: number, activeDpiScale = 1.0): number {
    return Math.round(dotNetPixels * activeDpiScale);
  }

  /**
   * Computes device pixel ratio for HTML5 canvas buffer
   */
  public static getCanvasBackingRatio(): number {
    return this.getDevicePixelRatio();
  }
}
