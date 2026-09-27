/**
 * In-Browser Windows .ICO Generator
 * Converts images (PNG / JPG / Canvas) into authentic Microsoft Windows .ICO multi-resolution binary format
 * Standard ICO Header (6 bytes) + Directory Entries (16 bytes each) + Embedded PNG/BMP images
 */

export interface IcoFrameSize {
  width: number;
  height: number;
}

export const DEFAULT_ICO_SIZES: IcoFrameSize[] = [
  { width: 16, height: 16 },
  { width: 32, height: 32 },
  { width: 48, height: 48 },
  { width: 64, height: 64 },
  { width: 128, height: 128 },
  { width: 256, height: 256 },
];

export class IcoGenerator {
  /**
   * Generates a multi-resolution .ico ArrayBuffer from an Image element or Canvas
   */
  public static async generateIcoFromImage(
    imgElement: HTMLImageElement | HTMLCanvasElement,
    sizes: IcoFrameSize[] = DEFAULT_ICO_SIZES
  ): Promise<{ icoBuffer: ArrayBuffer; dataUrl: string }> {
    const pngBlobs: { width: number; height: number; blob: Blob; buffer: ArrayBuffer }[] = [];

    for (const size of sizes) {
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imgElement, 0, 0, size.width, size.height);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/png')
        );

        if (blob) {
          const buffer = await blob.arrayBuffer();
          pngBlobs.push({
            width: size.width,
            height: size.height,
            blob,
            buffer,
          });
        }
      }
    }

    // Build ICO Binary structure
    // 1. Header (6 bytes)
    // 2. Icon Directory Entries (16 bytes * count)
    // 3. Image Data payload
    const count = pngBlobs.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    const totalDirSize = count * dirEntrySize;
    let offset = headerSize + totalDirSize;

    const totalPayloadSize = pngBlobs.reduce((acc, p) => acc + p.buffer.byteLength, 0);
    const totalFileSize = offset + totalPayloadSize;

    const icoData = new Uint8Array(totalFileSize);
    const view = new DataView(icoData.buffer);

    // 1. ICO Header
    view.setUint16(0, 0, true); // Reserved (must be 0)
    view.setUint16(2, 1, true); // Type (1 = ICO, 2 = CUR)
    view.setUint16(4, count, true); // Count of images

    // 2. Directory Entries
    let currentDirOffset = headerSize;
    let currentDataOffset = offset;

    pngBlobs.forEach((p) => {
      view.setUint8(currentDirOffset + 0, p.width >= 256 ? 0 : p.width); // Width (0 means 256)
      view.setUint8(currentDirOffset + 1, p.height >= 256 ? 0 : p.height); // Height (0 means 256)
      view.setUint8(currentDirOffset + 2, 0); // Color palette
      view.setUint8(currentDirOffset + 3, 0); // Reserved
      view.setUint16(currentDirOffset + 4, 1, true); // Color planes
      view.setUint16(currentDirOffset + 6, 32, true); // Bits per pixel (32-bit RGBA)
      view.setUint32(currentDirOffset + 8, p.buffer.byteLength, true); // Size of image data
      view.setUint32(currentDirOffset + 12, currentDataOffset, true); // Offset of image data

      // Copy PNG buffer to payload
      icoData.set(new Uint8Array(p.buffer), currentDataOffset);

      currentDirOffset += dirEntrySize;
      currentDataOffset += p.buffer.byteLength;
    });

    const blob = new Blob([icoData], { type: 'image/x-icon' });
    const dataUrl = URL.createObjectURL(blob);

    return {
      icoBuffer: icoData.buffer,
      dataUrl,
    };
  }

  /**
   * Generates a default SVG-based application icon
   */
  public static generateDefaultAppIcon(colorHex: string = '#2563EB', text: string = '⚡️'): string {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Rounded rectangle
      ctx.fillStyle = colorHex;
      ctx.beginPath();
      ctx.roundRect(16, 16, 224, 224, 48);
      ctx.fill();

      // Border shine
      ctx.strokeStyle = '#FFFFFF40';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Center symbol
      ctx.font = '96px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 128);
    }
    return canvas.toDataURL('image/png');
  }
}
