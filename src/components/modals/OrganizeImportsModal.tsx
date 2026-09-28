import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  PlusCircle,
  MinusCircle,
  ArrowUpDown,
  Check,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Info,
  Layers,
  Code2,
  Trash2,
} from 'lucide-react';
import { CSharpImportOrganizer, OrganizeResult } from '../../utils/CSharpImportOrganizer';

interface OrganizeImportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onApplyOrganizedCode: (newCode: string, summary: string) => void;
}

export const OrganizeImportsModal: React.FC<OrganizeImportsModalProps> = ({
  isOpen,
  onClose,
  code,
  onApplyOrganizedCode,
}) => {
  const [addMissing, setAddMissing] = useState(true);
  const [removeUnused, setRemoveUnused] = useState(true);

  const organizeResult: OrganizeResult = useMemo(() => {
    return CSharpImportOrganizer.organize(code, {
      addMissing,
      removeUnused,
    });
  }, [code, addMissing, removeUnused]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyOrganizedCode(organizeResult.organizedCode, organizeResult.summary);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1050] flex items-center justify-center p-4 select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-850 bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-950/70 border border-blue-800/60 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-100 text-sm">
                  Организация директив using (Organize Imports)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Shift+Alt+O / Ctrl+R, G
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Анализ ссылок Roslyn, обнаружение недостающих пространств имен и сортировка
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options Toggles */}
        <div className="px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-850 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={addMissing}
                onChange={(e) => setAddMissing(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Добавить недостающие using ({organizeResult.missingReferences.length})</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={removeUnused}
                onChange={(e) => setRemoveUnused(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Удалить неиспользуемые using ({organizeResult.removedUsings.length})</span>
              </span>
            </label>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
            <ArrowUpDown className="w-3 h-3 text-cyan-400" />
            <span>Стандарт: System.* ➔ Microsoft.* ➔ Custom</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 max-h-[460px] overflow-y-auto space-y-4">
          {/* Missing References Section */}
          {organizeResult.missingReferences.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Обнаружены недостающие ссылки ({organizeResult.missingReferences.length}):</span>
                </span>
                <span className="text-[11px] text-zinc-500 font-normal">Будут автоматически добавлены</span>
              </div>

              <div className="space-y-1.5">
                {organizeResult.missingReferences.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700/60 text-[10px]">
                        +{ref.namespace}
                      </span>
                      <span className="text-zinc-200">
                        Символ: <strong className="text-amber-300 font-bold">{ref.symbol}</strong>
                      </span>
                      <span className="text-zinc-500 text-[10px]">(Строка {ref.line})</span>
                    </div>

                    <span className="text-emerald-400 text-[10px] font-sans">
                      using {ref.namespace};
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unused Usings Section */}
          {organizeResult.removedUsings.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span>Неиспользуемые директивы using ({organizeResult.removedUsings.length}):</span>
                </span>
                <span className="text-[11px] text-zinc-500 font-normal">Будут удалены для чистоты кода</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {organizeResult.removedUsings.map((ns, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 text-xs font-mono flex items-center gap-1.5 line-through decoration-amber-500"
                  >
                    <span>using {ns};</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Final Ordered Using Statements Preview */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Итоговый упорядоченный блок using ({organizeResult.allUsings.length}):</span>
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">Microsoft Convention</span>
            </div>

            <div className="p-3 rounded-lg bg-black/60 border border-zinc-800 font-mono text-xs text-blue-200 space-y-1">
              {organizeResult.allUsings.map((ns, idx) => {
                const isAdded = organizeResult.addedUsings.includes(ns);
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-1.5 py-0.5 rounded ${
                      isAdded
                        ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 font-bold'
                        : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    <span>using {ns};</span>
                    {isAdded && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900 text-emerald-200 uppercase">
                        Новый
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Status Box */}
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {organizeResult.hasChanges ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-200 font-medium">{organizeResult.summary}</span>
                </>
              ) : (
                <>
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="text-zinc-400">
                    Все директивы using уже соответствуют стандартам Microsoft C#.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-zinc-900/80 border-t border-zinc-850 flex items-center justify-between text-xs">
          <div className="text-zinc-500 font-mono text-[11px]">
            Горячая клавиша: <strong className="text-zinc-400">Shift+Alt+O</strong> в редакторе
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={!organizeResult.hasChanges}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Применить (Apply Organize Usings)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
