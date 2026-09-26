/**
 * Storage Manager & Emergency Purge Module
 */
export class StorageManager {
  /**
   * 1. Очистка только активного черновика (LocalStorage)
   */
  public static clearCurrentDraft(): void {
    localStorage.removeItem('nextgen_active_project');
    localStorage.removeItem('nextgen_canvas_settings');
    console.log('[Storage] Черновик LocalStorage успешно очищен.');
    window.location.reload();
  }

  /**
   * 2. Очистка всей базы сохраненных проектов (IndexedDB)
   */
  public static async clearIndexedDbProjects(): Promise<void> {
    if (window.indexedDB) {
      const dbs = ['NextGenCSharpDesignerDB', 'NextGenDesignerDB', 'projects_db'];
      for (const dbName of dbs) {
        window.indexedDB.deleteDatabase(dbName);
      }
    }
    console.log('[Storage] Локальная база данных IndexedDB очищена.');
    window.location.reload();
  }

  /**
   * 3. Полный сброс всех данных (Hard Reset к заводским настройкам)
   */
  public static async hardResetAll(): Promise<void> {
    try {
      // 1. Очищаем LocalStorage и SessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // 2. Удаляем базу данных IndexedDB
      if (window.indexedDB) {
        const dbs = ['NextGenCSharpDesignerDB', 'NextGenDesignerDB', 'projects_db'];
        for (const dbName of dbs) {
          window.indexedDB.deleteDatabase(dbName);
        }
      }

      // 3. Очищаем кэш Service Worker (PWA)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      console.log('[Storage] Полный Hard Reset выполнен успешно!');

      // Перезагружаем страницу на чистый холст
      window.location.href = window.location.pathname;
    } catch (error) {
      console.error('[Storage Error] Ошибка при очистке:', error);
      window.location.reload();
    }
  }
}
