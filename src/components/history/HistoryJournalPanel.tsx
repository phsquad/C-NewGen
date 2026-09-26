import React, { useState, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { HistoryCommand } from '../../utils/historyEngine';
import {
  History,
  X,
  Search,
  Bookmark,
  RotateCcw,
  RotateCw,
  PlusCircle,
  Palette,
  Scaling,
  Move,
  Zap,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  HardDrive,
} from 'lucide-react';

export const HistoryJournalPanel: React.FC = () => {
  const {
    historyJournal,
    redoJournal,
    historyPanelOpen,
    setHistoryPanelOpen,
    jumpToHistoryStep,
    createCheckpoint,
    undo,
    redo,
    getHistoryMemorySizeKb,
  } = useDesigner();

  const [searchQuery, setSearchQuery] = useState('');
  const [customCheckpointLabel, setCustomCheckpointLabel] = useState('');
  const [showCheckpointInput, setShowCheckpointInput] = useState(false);

  if (!historyPanelOpen) return null;

  const currentStepNumber = historyJournal.length;
  const memoryKb = getHistoryMemorySizeKb();

  // Combine all steps (applied steps + undone/redoable steps)
  const allTimelineSteps = useMemo(() => {
    const list: { command: HistoryCommand; isApplied: boolean; isCurrent: boolean }[] = [];

    historyJournal.forEach((cmd, idx) => {
      list.push({
        command: cmd,
        isApplied: true,
        isCurrent: idx === historyJournal.length - 1,
      });
    });

    redoJournal.forEach(cmd => {
      list.push({
        command: cmd,
        isApplied: false,
        isCurrent: false,
      });
    });

    return list;
  }, [historyJournal, redoJournal]);

  const filteredSteps = useMemo(() => {
    if (!searchQuery.trim()) return allTimelineSteps;
    const query = searchQuery.toLowerCase().trim();
    return allTimelineSteps.filter(item =>
      item.command.description.toLowerCase().includes(query) ||
      item.command.category.toLowerCase().includes(query) ||
      item.command.timeStr.toLowerCase().includes(query)
    );
  }, [allTimelineSteps, searchQuery]);

  const getCategoryIcon = (category: HistoryCommand['category']) => {
    switch (category) {
      case 'create':
        return <PlusCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'delete':
        return <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      case 'property':
        return <Palette className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'resize':
        return <Scaling className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'move':
        return <Move className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'event':
        return <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'checkpoint':
        return <Bookmark className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'duplicate':
        return <Copy className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'template':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case 'align':
      case 'order':
        return <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      default:
        return <History className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };

  const handleCreateCheckpoint = () => {
    const label = customCheckpointLabel.trim() || `Точка сохранения #${historyJournal.length + 1}`;
    createCheckpoint(label);
    setCustomCheckpointLabel('');
    setShowCheckpointInput(false);
  };

  return (
    <div className="absolute right-4 top-14 w-88 max-w-[90vw] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* 1. Panel Header */}
      <div className="h-10 px-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-xs text-zinc-100 tracking-wide">
            📜 ЖУРНАЛ ИСТОРИИ ДЕЙСТВИЙ
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHistoryPanelOpen(false)}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Quick Undo / Redo buttons & Search Bar */}
      <div className="p-2.5 bg-zinc-900/90 border-b border-zinc-800 space-y-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={undo}
            disabled={historyJournal.length === 0}
            title="Отменить последнее действие (Ctrl+Z)"
            className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-semibold rounded border border-zinc-700/60 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Отменить</span>
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={redoJournal.length === 0}
            title="Повторить отмененное действие (Ctrl+Y)"
            className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-semibold rounded border border-zinc-700/60 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <RotateCw className="w-3 h-3 text-blue-400" />
            <span>Повторить</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="🔍 Поиск по шагам..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-7 pr-6 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Steps List with Time-Travel Jumping */}
      <div className="max-h-72 overflow-y-auto p-1.5 space-y-1 bg-zinc-950/60">
        {filteredSteps.length === 0 ? (
          <div className="py-8 text-center text-zinc-600 text-xs italic">
            История пуста или совпадений не найдено.
          </div>
        ) : (
          filteredSteps.map((item, i) => {
            const stepNum = i + 1;
            const isApplied = item.isApplied;
            const isCurrent = item.isCurrent;

            return (
              <button
                key={item.command.id}
                type="button"
                onClick={() => jumpToHistoryStep(stepNum)}
                className={`w-full text-left p-1.5 rounded text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/15 border border-amber-500/50 text-amber-200 shadow-xs'
                    : isApplied
                    ? 'hover:bg-zinc-800/80 text-zinc-200 border border-transparent'
                    : 'opacity-45 hover:opacity-80 text-zinc-400 hover:bg-zinc-800/40 line-through border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-mono text-[11px] text-zinc-500 w-5 shrink-0 text-right">
                    {stepNum}.
                  </span>
                  {getCategoryIcon(item.command.category)}
                  <span className="truncate font-medium text-[11px]">
                    {item.command.description}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isCurrent && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500 text-black font-bold uppercase tracking-wider">
                      ТЕКУЩИЙ
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {item.command.timeStr}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 4. Checkpoint Creation Action */}
      <div className="p-2 bg-zinc-900 border-t border-zinc-800 space-y-2">
        {showCheckpointInput ? (
          <div className="space-y-1.5 animate-in fade-in">
            <input
              type="text"
              placeholder="Название точки сохранения (напр: До рефакторинга меню)"
              value={customCheckpointLabel}
              onChange={e => setCustomCheckpointLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateCheckpoint();
                if (e.key === 'Escape') setShowCheckpointInput(false);
              }}
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-hidden focus:border-cyan-500"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCreateCheckpoint}
                className="flex-1 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Сохранить точку
              </button>
              <button
                type="button"
                onClick={() => setShowCheckpointInput(false)}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs transition-colors cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCheckpointInput(true)}
            className="w-full py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            <span>📌 СОЗДАТЬ ТОЧКУ СОХРАНЕНИЯ</span>
          </button>
        )}
      </div>

      {/* 5. Bottom Real-time Status Bar */}
      <div className="h-6 px-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 font-mono select-none">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <HardDrive className="w-3 h-3 text-emerald-400" />
          <span>Буфер: [{currentStepNumber} / 100 шагов]</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Память: [{memoryKb} КБ]</span>
          <span className="text-zinc-600">|</span>
          <span className="text-emerald-400 font-semibold">Откат: [0ms]</span>
        </div>
      </div>
    </div>
  );
};
