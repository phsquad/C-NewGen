import Dexie, { Table } from 'dexie';
import { DesignerProjectState } from '../types/ast';
import { createMultiFormTemplate, createLoginTemplate, createCalculatorTemplate, createDashboardTemplate } from './templates';

export interface SavedProject {
  id: string;                  // UUID проекта
  name: string;                // Название проекта (напр. "Лабораторная 1")
  updatedAt: number;           // Метка времени последнего изменения
  createdAt: number;           // Метка времени создания
  previewImage?: string;       // Base64 миниатюра формы
  isPinned?: boolean;          // Закрепленный проект
  isDemo?: boolean;            // Демо-проект / Стандартный образец
  tags?: string[];             // Теги: WinForms, SQLite, Web, etc.
  framework?: string;          // Target framework
  description?: string;        // Описание проекта
  state: DesignerProjectState; // Полное дерево UI-AST
}

export class DesignerDatabase extends Dexie {
  public projects!: Table<SavedProject, string>;

  constructor() {
    super('NextGenCSharpDesignerDB');
    this.version(1).stores({
      projects: 'id, name, updatedAt, createdAt, isPinned'
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
      const defaultState1 = createCalculatorTemplate();
      defaultState1.projectName = 'Лабораторная_1 (Калькулятор & Матрицы)';

      const defaultState2 = createLoginTemplate();
      defaultState2.projectName = 'Курсовая_Форма_Авторизации (Auth & SQLite)';

      const defaultState3 = createDashboardTemplate();
      defaultState3.projectName = 'Enterprise_Dashboard_2026';

      const defaultState4 = createMultiFormTemplate();
      defaultState4.projectName = 'MDI_Многооконная_Студия';

      const now = Date.now();
      await db.projects.bulkAdd([
        {
          id: 'proj_lab1_calculator',
          name: 'Лабораторная_1 (Калькулятор & Матрицы)',
          createdAt: now - 3600 * 1000 * 48,
          updatedAt: now - 60 * 1000 * 15,
          isPinned: true,
          isDemo: true,
          tags: ['WinForms', 'Лабораторная', 'Калькулятор', 'ДЕМО'],
          framework: 'WinForms',
          description: 'Инженерный калькулятор с поддержкой вычислений и расширенной клавиатурой',
          state: defaultState1,
        },
        {
          id: 'proj_coursework_auth',
          name: 'Курсовая_Форма_Авторизации (Auth & SQLite)',
          createdAt: now - 3600 * 1000 * 24,
          updatedAt: now - 3600 * 1000 * 2,
          isPinned: true,
          isDemo: true,
          tags: ['WinForms', 'SQLite', 'Безопасность', 'Курсовая', 'ДЕМО'],
          framework: 'WinForms',
          description: 'Модуль авторизации пользователей с валидацией полей и связкой с БД SQLite',
          state: defaultState2,
        },
        {
          id: 'proj_dashboard',
          name: 'Enterprise_Dashboard_2026',
          createdAt: now - 3600 * 1000 * 72,
          updatedAt: now - 3600 * 1000 * 8,
          isPinned: false,
          isDemo: true,
          tags: ['WinForms', 'Дашборд', 'Бизнес', 'ДЕМО'],
          framework: 'WinForms',
          description: 'Аналитическая панель с метриками KPI, выручкой и мониторингом сессий',
          state: defaultState3,
        },
        {
          id: 'proj_multiform_mdi',
          name: 'MDI_Многооконная_Студия',
          createdAt: now - 3600 * 1000 * 96,
          updatedAt: now - 3600 * 1000 * 24,
          isPinned: false,
          isDemo: true,
          tags: ['WinForms', 'MDI', 'Мульти-окна', 'ДЕМО'],
          framework: 'WinForms',
          description: 'Многооконный интерфейс с переключением форм и скинами Win11/Linux',
          state: defaultState4,
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

/**
 * Toggle pinned status for a project
 */
export async function toggleProjectPin(projectId: string): Promise<boolean> {
  try {
    const proj = await db.projects.get(projectId);
    if (proj) {
      const nextPin = !proj.isPinned;
      await db.projects.update(projectId, { isPinned: nextPin });
      return nextPin;
    }
  } catch (err) {
    console.warn('Failed to toggle project pin:', err);
  }
  return false;
}
