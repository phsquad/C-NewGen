import LZString from 'lz-string';
import { DesignerProjectState } from '../types/ast';

/**
 * Encodes a complete project state into a compressed URL hash string
 */
export function encodeProjectToHashUrl(project: DesignerProjectState): string {
  const jsonStr = JSON.stringify(project);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#project=${compressed}`;
}

/**
 * Decodes a compressed URL hash into a DesignerProjectState object if present
 */
export function decodeProjectFromHashUrl(): DesignerProjectState | null {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('#project=')) return null;

    const compressed = hash.split('#project=')[1];
    if (!compressed) return null;

    const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
    if (!jsonStr) return null;

    const parsed = JSON.parse(jsonStr) as DesignerProjectState;
    if (parsed && parsed.rootFormId && parsed.nodes) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to decode project from URL hash:', err);
  }
  return null;
}
