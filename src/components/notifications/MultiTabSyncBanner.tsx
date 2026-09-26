import React, { useState, useEffect } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { subscribeToTabBroadcast, TabBroadcastMessage } from '../../utils/tabBroadcast';
import { getActiveDirectoryHandle, syncProjectToLocalDirectory } from '../../utils/fileSystemSync';
import { RefreshCw, HardDrive, Laptop, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const MultiTabSyncBanner: React.FC = () => {
  const { project, setProjectState, saveProject, hasUnsavedChanges } = useDesigner();
  const [externalUpdate, setExternalUpdate] = useState<TabBroadcastMessage | null>(null);
  const [saveToast, setSaveToast] = useState<{ text: string; isDisk: boolean } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToTabBroadcast((msg) => {
      if (msg.type === 'PROJECT_CHANGED' && msg.state) {
        // If current project has no unsaved local changes, we can offer to sync
        setExternalUpdate(msg);
      } else if (msg.type === 'PROJECT_SAVED') {
        setExternalUpdate(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Global Ctrl+S handler for File System Access API & Local Storage
  useEffect(() => {
    const handleGlobalSave = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProject();

        const dirHandle = getActiveDirectoryHandle();
        if (dirHandle) {
          try {
            const res = await syncProjectToLocalDirectory(dirHandle, project);
            const formNames = Object.values(project.nodes)
              .filter(n => n.type === 'Form')
              .map(n => `${n.properties.name || 'Form1'}.Designer.cs`)
              .join(', ');

            setSaveToast({
              text: `💾 Файлы (${formNames}, Program.cs) перезаписаны на жестком диске в папке «${dirHandle.name}»!`,
              isDisk: true,
            });
          } catch (err: any) {
            setSaveToast({
              text: `⚠️ Ошибка записи на диск: ${err.message}`,
              isDisk: false,
            });
          }
        } else {
          setSaveToast({
            text: `💾 Проект «${project.projectName}» сохранен в память браузера (Ctrl+S)`,
            isDisk: false,
          });
        }

        setTimeout(() => setSaveToast(null), 4000);
      }
    };

    window.addEventListener('keydown', handleGlobalSave);
    return () => window.removeEventListener('keydown', handleGlobalSave);
  }, [project, saveProject]);

  const handleApplyExternalUpdate = () => {
    if (externalUpdate?.state) {
      setProjectState(externalUpdate.state);
      setExternalUpdate(null);
      setSaveToast({
        text: '✅ Холст успешно синхронизирован с другой вкладкой браузера',
        isDisk: false,
      });
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  return (
    <>
      {/* 1. Multi-Tab Conflict Protection Banner (Pravka 11.2) */}
      {externalUpdate && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className="bg-zinc-900 border border-cyan-500/80 rounded-lg shadow-2xl px-4 py-2.5 flex items-center gap-3 text-xs text-zinc-100 ring-2 ring-cyan-500/30">
            <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-cyan-300">
                Внимание: проект изменен в другой вкладке браузера!
              </div>
              <div className="text-[11px] text-zinc-400">
                Проект «{externalUpdate.projectName}» обновлен ({new Date(externalUpdate.timestamp).toLocaleTimeString()}).
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={handleApplyExternalUpdate}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded shadow-xs transition-colors cursor-pointer"
              >
                🔄 Обновить холст
              </button>
              <button
                type="button"
                onClick={() => setExternalUpdate(null)}
                className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                title="Игнорировать"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Ctrl+S Direct Disk Write Toast Notification (Pravka 11.1) */}
      {saveToast && (
        <div className="fixed bottom-10 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200 pointer-events-none select-none">
          <div
            className={`px-3.5 py-2.5 rounded-lg shadow-2xl border flex items-center gap-2.5 text-xs font-medium ${
              saveToast.isDisk
                ? 'bg-zinc-900/95 border-cyan-500/80 text-cyan-200 ring-2 ring-cyan-500/30'
                : 'bg-zinc-900/95 border-emerald-500/80 text-emerald-200 ring-2 ring-emerald-500/30'
            }`}
          >
            {saveToast.isDisk ? (
              <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{saveToast.text}</span>
          </div>
        </div>
      )}
    </>
  );
};
