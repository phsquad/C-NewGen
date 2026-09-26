import React, { useState } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { encodeProjectToHashUrl } from '../../utils/urlHashSharing';
import { Share2, X, Copy, Check, Globe, ShieldCheck, Zap } from 'lucide-react';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({ isOpen, onClose }) => {
  const { project } = useDesigner();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = encodeProjectToHashUrl(project);
  const controlCount = Object.keys(project.nodes).length - 1;
  const linkLengthKb = (shareUrl.length / 1024).toFixed(2);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] modal-overlay bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50 duration-150">
      <div className="relative z-[100000] modal-card bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col select-none max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔗 МГНОВЕННЫЙ ШЕРИНГ ПРОЕКТА (URL-HASH)</span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Передача формы и C#/Python кода без серверов и баз данных
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

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Globe className="w-3.5 h-3.5" />
                <span>🌐 Готовая ссылка на вашу форму:</span>
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                Сжатие: LZ-String ({linkLengthKb} KB)
              </span>
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={shareUrl}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg p-2.5 text-zinc-300 font-mono text-[11px] leading-relaxed resize-none focus:outline-none"
              />
            </div>
          </div>

          {/* Features badge */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10.5px]">
            <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="text-zinc-500 font-semibold uppercase text-[9px]">Контролов</div>
              <div className="text-emerald-400 font-bold font-mono text-sm">{controlCount} шт.</div>
            </div>

            <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="text-zinc-500 font-semibold uppercase text-[9px]">Безопасность</div>
              <div className="text-blue-400 font-bold flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Client-Only</span>
              </div>
            </div>

            <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="text-zinc-500 font-semibold uppercase text-[9px]">Скорость</div>
              <div className="text-cyan-400 font-bold flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
                <span>0.3 сек</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Отправьте эту ссылку в Telegram, Discord или ВКонтакте. Преподаватель или одногруппник перейдет по ней и сразу увидит скомпонованную форму и чистый рабочий C#/Python код!
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg text-xs transition-colors cursor-pointer"
          >
            Закрыть
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-5 py-2 font-bold rounded-lg text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>СКОПИРОВАНО В БУФЕР!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>📋 СКОПИРОВАТЬ ССЫЛКУ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
