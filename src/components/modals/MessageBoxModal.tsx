import React from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { Info, AlertTriangle, AlertCircle, X, Check } from 'lucide-react';

export const MessageBoxModal: React.FC = () => {
  const { messageBoxModal, setMessageBoxModal, addConsoleLog } = useDesigner();

  if (!messageBoxModal || !messageBoxModal.isOpen) return null;

  const handleClose = () => {
    addConsoleLog('System', `[MessageBox.Show] Пользователь нажал "ОК", диалог закрыт.`);
    setMessageBoxModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        {/* Windows Dialog Titlebar */}
        <div className="h-8 px-3 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100 truncate">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{messageBoxModal.title || 'Сообщение'}</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dialog Content */}
        <div className="p-4 flex items-start gap-3 bg-zinc-950">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 text-xs text-zinc-200 font-sans whitespace-pre-wrap leading-relaxed">
            {messageBoxModal.text}
          </div>
        </div>

        {/* Dialog Buttons Footer */}
        <div className="h-10 px-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={handleClose}
            className="px-4 py-1 text-xs font-medium rounded bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>ОК</span>
          </button>
        </div>
      </div>
    </div>
  );
};
