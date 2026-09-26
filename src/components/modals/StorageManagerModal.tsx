import React, { useState } from 'react';
import { StorageManager } from '../../utils/StorageManager';
import { Trash2, AlertTriangle, X, RefreshCw, Database, FileCode, Flame } from 'lucide-react';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({ isOpen, onClose }) => {
  const [selectedOption, setSelectedOption] = useState<'draft' | 'db' | 'hard'>('hard');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExecutePurge = async () => {
    setIsProcessing(true);
    setTimeout(async () => {
      if (selectedOption === 'draft') {
        StorageManager.clearCurrentDraft();
      } else if (selectedOption === 'db') {
        await StorageManager.clearIndexedDbProjects();
      } else if (selectedOption === 'hard') {
        await StorageManager.hardResetAll();
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50 duration-150">
      <div className="relative z-[100000] bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col select-none">
        {/* Modal Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🧹 ОЧИСТКА ХРАНИЛИЩА И СБРОС (STORAGE MANAGER)</span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Управление памятью, удаление черновиков и экстренный Hard Reset
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Options */}
        <div className="p-5 space-y-3.5 text-xs">
          <p className="text-[11.5px] text-zinc-300 font-medium">
            Выберите необходимый уровень очистки локальных данных браузера:
          </p>

          {/* Option 1: Draft Only */}
          <div
            onClick={() => setSelectedOption('draft')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              selectedOption === 'draft'
                ? 'bg-blue-950/40 border-blue-500/80 text-blue-200 shadow-md ring-1 ring-blue-500/30'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
            }`}
          >
            <input
              type="radio"
              name="purgeOption"
              checked={selectedOption === 'draft'}
              onChange={() => setSelectedOption('draft')}
              className="mt-0.5 accent-blue-500 cursor-pointer"
            />
            <div className="space-y-1">
              <div className="font-bold text-xs flex items-center gap-2 text-white">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>1. Очистить активный черновик (LocalStorage)</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Удаляет несохраненные изменения текущей активной формы. Сохраненные проекты в IndexedDB останутся нетронутыми.
              </p>
            </div>
          </div>

          {/* Option 2: IndexedDB Projects */}
          <div
            onClick={() => setSelectedOption('db')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              selectedOption === 'db'
                ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-md ring-1 ring-amber-500/30'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
            }`}
          >
            <input
              type="radio"
              name="purgeOption"
              checked={selectedOption === 'db'}
              onChange={() => setSelectedOption('db')}
              className="mt-0.5 accent-amber-500 cursor-pointer"
            />
            <div className="space-y-1">
              <div className="font-bold text-xs flex items-center gap-2 text-white">
                <Database className="w-4 h-4 text-amber-400" />
                <span>2. Удалить все сохраненные проекты (IndexedDB)</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Очищает локальную базу данных проектов в браузере. Восстанавливает чистый стартовый проект.
              </p>
            </div>
          </div>

          {/* Option 3: Hard Reset All */}
          <div
            onClick={() => setSelectedOption('hard')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              selectedOption === 'hard'
                ? 'bg-red-950/50 border-red-500 text-red-200 shadow-md ring-1 ring-red-500/50'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
            }`}
          >
            <input
              type="radio"
              name="purgeOption"
              checked={selectedOption === 'hard'}
              onChange={() => setSelectedOption('hard')}
              className="mt-0.5 accent-red-500 cursor-pointer"
            />
            <div className="space-y-1">
              <div className="font-bold text-xs flex items-center gap-2 text-red-400">
                <Flame className="w-4 h-4 text-red-500" />
                <span>3. ПОЛНЫЙ СБРОС К ЗАВОДСКИМ НАСТРОЙКАМ (HARD RESET)</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-normal">
                Полная экстренная очистка: LocalStorage + IndexedDB + Кэш ServiceWorker + Автоперезагрузка страницы. Гарантированно устраняет любые баги залипших данных!
              </p>
            </div>
          </div>

          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-center gap-2 text-[11px] text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Внимание: данное действие перезагрузит страницу и применит настройки незамедлительно.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg text-xs transition-colors cursor-pointer"
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={handleExecutePurge}
            disabled={isProcessing}
            className={`px-5 py-2 font-bold rounded-lg text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 ${
              selectedOption === 'hard'
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>ОЧИСТКА...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>🧹 ВЫПОЛНИТЬ ОЧИСТКУ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
