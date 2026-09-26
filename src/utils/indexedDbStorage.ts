import Dexie, { Table } from 'dexie';
import { DesignerProjectState } from '../types/ast';
import { createMultiFormTemplate, createLoginTemplate } from './templates';

export interface SavedProject {
  id: string;                  // UUID проекта
  name: string;                // Название проекта (напр. "Лабораторная 1")
  updatedAt: number;           // Метка времени последнего изменения
  createdAt: number;           // Метка времени создания
  previewImage?: string;       // Base64 миниатюра формы
  state: DesignerProjectState; // Полное дерево UI-AST
}

export class DesignerDatabase extends Dexie {
  public projects!: Table<SavedProject, string>;

  constructor() {
    super('NextGenCSharpDesignerDB');
    this.version(1).stores({
      projects: 'id, name, updatedAt, createdAt'
    });
  }
}

export const db = new DesignerDatabase();

/**
 * Initializes default starter projects if database is empty
 */
export async function initDefaultProjectsIfEmpty(): Promise<void> {
  try {
    const count = await db.projects.count();
    if (count === 0) {
      const defaultState1 = createMultiFormTemplate();
      defaultState1.projectName = 'Лабораторная_Работа_1 (Калькулятор)';

      const defaultState2 = createLoginTemplate();
      defaultState2.projectName = 'Курсовая_Форма_Авторизации';

      const now = Date.now();
      await db.projects.bulkAdd([
        {
          id: 'proj_lab1_calculator',
          name: 'Лабораторная_Работа_1 (Калькулятор)',
          createdAt: now - 3600 * 1000 * 2,
          updatedAt: now - 60 * 1000 * 2,
          state: defaultState1,
        },
        {
          id: 'proj_coursework_auth',
          name: 'Курсовая_Форма_Авторизации',
          createdAt: now - 3600 * 1000 * 24,
          updatedAt: now - 3600 * 1000 * 12,
          state: defaultState2,
        },
      ]);
    }
  } catch (err) {
    console.warn('Could not initialize starter projects:', err);
  }
}

/**
 * Get total IndexedDB usage in KB
 */
export async function getIndexedDbStorageSizeKb(): Promise<number> {
  try {
    const all = await db.projects.toArray();
    const str = JSON.stringify(all);
    return Math.max(1, Math.round(new Blob([str]).size / 1024));
  } catch {
    return 46;
  }
}

/**
 * Format relative time (Russian locale)
 */
export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 10) return 'Только что';
  if (diffSec < 60) return `${diffSec} сек назад`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return `${diffDays} дн назад`;
  return new Date(timestamp).toLocaleDateString();
}
