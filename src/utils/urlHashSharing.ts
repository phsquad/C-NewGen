import LZString from 'lz-string';
import { DesignerProjectState } from '../types/ast';

/**
 * Encodes a complete project state and optional room ID into a compressed URL hash string
 */
export function encodeProjectToHashUrl(project: DesignerProjectState, roomId?: string | null): string {
  const jsonStr = JSON.stringify(project);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);
  const baseUrl = window.location.origin + window.location.pathname;
  
  const hashParts: string[] = [`project=${compressed}`];
  if (roomId) {
    hashParts.push(`room=${roomId}`);
  }
  
  return `${baseUrl}#${hashParts.join('&')}`;
}

/**
 * Decodes a compressed URL hash into a DesignerProjectState object if present
 */
export function decodeProjectFromHashUrl(): DesignerProjectState | null {
  try {
    const hash = window.location.hash;
    if (!hash) return null;

    // Remove leading hash mark
    const hashStr = hash.replace(/^#/, '');
    const params = new URLSearchParams(hashStr);
    const compressed = params.get('project');

    if (!compressed) {
      // Legacy fallback
      if (hash.includes('project=')) {
        const legacyCompressed = hash.split('project=')[1]?.split('&')[0];
        if (legacyCompressed) {
          const jsonStr = LZString.decompressFromEncodedURIComponent(legacyCompressed);
          if (jsonStr) {
            return JSON.parse(jsonStr) as DesignerProjectState;
          }
        }
      }
      return null;
    }

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

/**
 * Retrieves the collaborative room ID from the URL hash or query parameters
 */
export function getRoomIdFromUrl(): string | null {
  try {
    // 1. Check URL hash parameters (e.g. #room=roomId or #project=...&room=roomId)
    const hash = window.location.hash;
    if (hash) {
      const hashStr = hash.replace(/^#/, '');
      const params = new URLSearchParams(hashStr);
      const room = params.get('room');
      if (room) return room;
    }

    // 2. Fallback to standard URL query parameters (e.g. ?room=roomId)
    const urlParams = new URLSearchParams(window.location.search);
    const queryRoom = urlParams.get('room');
    if (queryRoom) return queryRoom;
  } catch (err) {
    console.error('Failed to parse room ID from URL:', err);
  }
  return null;
}
