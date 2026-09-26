import { DesignerProjectState } from '../types/ast';
import { saveProjectToLocalStorage, loadProjectFromLocalStorage } from './storage';

export type StorageSaveStatus = 'saved' | 'buffering' | 'flushing';

export interface StorageStatusInfo {
  status: StorageSaveStatus;
  lastSavedTime: number;
  debounceMs: number;
}

class DebouncedStorageAdapter {
  private timer: number | null = null;
  private pendingProject: DesignerProjectState | null = null;
  private lastSavedTime: number = Date.now();
  private status: StorageSaveStatus = 'saved';
  private listeners: Set<(info: StorageStatusInfo) => void> = new Set();
  private readonly debounceMs: number;

  constructor(debounceMs = 250) {
    this.debounceMs = debounceMs;

    // Attach critical lifecycle hooks for zero-data-loss guarantee
    if (typeof window !== 'undefined') {
      // 1. Before unload (closing tab, refresh)
      window.addEventListener('beforeunload', () => {
        this.flushSync();
      });

      // 2. Page hide (mobile tabs, desktop minimize/background)
      window.addEventListener('pagehide', () => {
        this.flushSync();
      });

      // 3. Document visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushSync();
        }
      });
    }
  }

  /**
   * Schedule debounced save with 250ms buffer
   * Coalesces rapid mouse movements (60–120 FPS) into a single write
   */
  public scheduleSave(project: DesignerProjectState): void {
    this.pendingProject = project;
    this.updateStatus('buffering');

    if (this.timer !== null) {
      window.clearTimeout(this.timer);
    }

    this.timer = window.setTimeout(() => {
      this.flushSync();
    }, this.debounceMs);
  }

  /**
   * Synchronously flushes any pending changes to LocalStorage immediately
   */
  public flushSync(): void {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pendingProject) {
      try {
        saveProjectToLocalStorage(this.pendingProject);
        this.pendingProject = null;
        this.lastSavedTime = Date.now();
        this.updateStatus('saved');
      } catch (err) {
        console.error('Failed to flush project to localStorage:', err);
      }
    } else {
      this.updateStatus('saved');
    }
  }

  public getStatusInfo(): StorageStatusInfo {
    return {
      status: this.status,
      lastSavedTime: this.lastSavedTime,
      debounceMs: this.debounceMs,
    };
  }

  public subscribe(listener: (info: StorageStatusInfo) => void): () => void {
    this.listeners.add(listener);
    // Initial emit
    listener(this.getStatusInfo());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateStatus(newStatus: StorageSaveStatus) {
    this.status = newStatus;
    const info = this.getStatusInfo();
    this.listeners.forEach(fn => fn(info));
  }
}

// Global singleton with exact 250ms debounce specification
export const debouncedStorage = new DebouncedStorageAdapter(250);
