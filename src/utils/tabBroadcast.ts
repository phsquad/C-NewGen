import { DesignerProjectState } from '../types/ast';

export const CURRENT_TAB_ID = typeof window !== 'undefined'
  ? `tab_${Math.random().toString(36).substring(2, 7)}_${Date.now().toString(36)}`
  : 'tab_server';

export type TabBroadcastType = 'PROJECT_CHANGED' | 'PROJECT_SAVED' | 'TAB_PING' | 'TAB_PONG';

export interface TabBroadcastMessage {
  type: TabBroadcastType;
  senderTabId: string;
  projectName: string;
  timestamp: number;
  state?: DesignerProjectState;
}

const CHANNEL_NAME = 'nextgen_csharp_designer_sync_v1';

let broadcastChannel: BroadcastChannel | null = null;
const listeners = new Set<(msg: TabBroadcastMessage) => void>();

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!broadcastChannel && 'BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = (event: MessageEvent<TabBroadcastMessage>) => {
        if (event.data && event.data.senderTabId !== CURRENT_TAB_ID) {
          listeners.forEach(fn => fn(event.data));
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel not available, multi-tab sync will use storage events', err);
    }
  }
  return broadcastChannel;
}

// Fallback to Window 'storage' event if BroadcastChannel is blocked or in older browser
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'csharp_designer_multitab_broadcast' && e.newValue) {
      try {
        const msg = JSON.parse(e.newValue) as TabBroadcastMessage;
        if (msg && msg.senderTabId !== CURRENT_TAB_ID) {
          listeners.forEach(fn => fn(msg));
        }
      } catch {
        // ignore JSON parse error
      }
    }
  });
}

/**
 * Broadcasts project modification from current tab to all other browser tabs
 */
export function broadcastProjectUpdate(project: DesignerProjectState): void {
  const msg: TabBroadcastMessage = {
    type: 'PROJECT_CHANGED',
    senderTabId: CURRENT_TAB_ID,
    projectName: project.projectName || 'WinFormsApp1',
    timestamp: Date.now(),
    state: project,
  };

  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage(msg);
    } catch (e) {
      // fallback
    }
  }

  // Also trigger storage event for cross-tab fallback
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('csharp_designer_multitab_broadcast', JSON.stringify(msg));
    } catch {
      // quota or private mode ignore
    }
  }
}

/**
 * Broadcasts explicit save event
 */
export function broadcastProjectSaved(projectName: string): void {
  const msg: TabBroadcastMessage = {
    type: 'PROJECT_SAVED',
    senderTabId: CURRENT_TAB_ID,
    projectName,
    timestamp: Date.now(),
  };

  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage(msg);
    } catch {
      // ignore
    }
  }
}

/**
 * Subscribe to external changes from other tabs
 */
export function subscribeToTabBroadcast(listener: (msg: TabBroadcastMessage) => void): () => void {
  getChannel(); // ensure initialized
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
