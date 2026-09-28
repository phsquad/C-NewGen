import React, { useState, useMemo } from 'react';
import { ACTIONS_REGISTRY, ACTION_CATEGORIES } from '../../utils/actionRegistry';
import { ActionDefinition } from '../../types/actions';
import { compileActionStepsToCSharp } from '../../utils/actionFlowCompiler';
import { Search, Zap, Check, X, Code2, Layers, Sliders } from 'lucide-react';

interface CatalogModalProps {
  onClose: () => void;
  onInsertCodeSnippet: (csharpCode: string) => void;
}

export const NoCodeActionsCatalogModal: React.FC<CatalogModalProps> = ({
  onClose,
  onInsertCodeSnippet,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<ActionDefinition>(ACTIONS_REGISTRY[0]);
  const [paramValues, setParamValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    ACTIONS_REGISTRY[0].paramsSchema?.forEach((p) => {
      initial[p.key] = p.defaultValue ?? '';
    });
    return initial;
  });

  const filtered = useMemo(() => {
    return ACTIONS_REGISTRY.filter((act) => {
      const matchesCat = activeCategory === 'all' || act.category === activeCategory;
      if (!matchesCat) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        act.title.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q) ||
        String(act.num) === q
      );
    });
  }, [activeCategory, search]);

  const handleSelectAction = (act: ActionDefinition) => {
    setSelectedAction(act);
    const newParams: Record<string, any> = {};
    act.paramsSchema?.forEach((p) => {
      newParams[p.key] = p.defaultValue ?? '';
    });
    setParamValues(newParams);
  };

  const handleParamChange = (key: string, val: any) => {
    setParamValues((prev) => ({ ...prev, [key]: val }));
  };

  // Compile selected action with current parameters to C#
  const compiledCode = useMemo(() => {
    if (!selectedAction) return '';
    const step = {
      id: `step_${selectedAction.num}`,
      actionNum: selectedAction.num,
      actionId: selectedAction.id,
      params: paramValues,
    };
    return compileActionStepsToCSharp([step], '    ');
  }, [selectedAction, paramValues]);

  const handleApply = () => {
    onInsertCodeSnippet(compiledCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 select-none font-sans animate-in fade-in zoom-in-95 duration-100">
      <div className="w-[1080px] h-[720px] max-h-[92vh] bg-[#16161c] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-300">
        {/* 1. Header */}
        <div className="h-13 bg-[#1F1F27] border-b border-zinc-800 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-yellow-500/20 text-yellow-400 rounded-xl text-lg">⚡️</span>
            <div>
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <span>Каталог 100+ Действий Без Кода (No-Code Action Studio)</span>
                <span className="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  10 Категорий
                </span>
              </h2>
              <span className="text-[10px] text-zinc-400">
                1 клик по действию ──► параметры ──► генерация чистого C# кода без синтаксических ошибок
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg p-1.5 transition text-sm font-bold cursor-pointer"
            title="Закрыть (Esc)"
          >
            ✕
          </button>
        </div>

        {/* 2. Search & Category Filters */}
        <div className="p-3 bg-[#121217] border-b border-zinc-800 space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Быстрый поиск среди 100 действий (например: открыть форму, таймер, sql, пауза, random, диалог)..."
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white text-xs outline-none focus:border-yellow-500 transition font-medium"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-yellow-500 text-black font-bold shadow-md shadow-yellow-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
              }`}
            >
              ⭐ Все (100)
            </button>
            {ACTION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? 'bg-yellow-500 text-black font-bold shadow-md shadow-yellow-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. TWO-PANEL WORKSPACE: Left 55% Action List, Right 45% Config & Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Cards List */}
          <div className="w-[55%] border-r border-zinc-800 p-3.5 overflow-y-auto space-y-2 bg-[#121217]/50 scrollbar-thin">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex justify-between">
              <span>Найдено: {filtered.length} действий</span>
              <span>100% C# .NET 8</span>
            </div>

            {filtered.map((act) => {
              const isSelected = selectedAction.id === act.id;
              return (
                <div
                  key={act.id}
                  onClick={() => handleSelectAction(act)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-yellow-500/15 border-yellow-500 text-white shadow-lg ring-1 ring-yellow-500/40'
                      : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <span className="text-xl p-2 bg-zinc-950/80 rounded-xl border border-zinc-800/80 shrink-0 font-mono font-bold text-yellow-400">
                    #{String(act.num).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">{act.title}</h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">{act.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Parameters & Live C# Preview */}
          <div className="flex-1 p-5 bg-[#16161c] flex flex-col justify-between overflow-y-auto scrollbar-thin">
            <div className="space-y-4">
              {/* Selected Action Banner */}
              <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center gap-3">
                <span className="text-2xl p-2 bg-yellow-500/20 text-yellow-400 rounded-xl font-bold font-mono">
                  #{String(selectedAction.num).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm truncate">{selectedAction.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{selectedAction.description}</p>
                </div>
              </div>

              {/* Dynamic Parameter Fields */}
              <div className="space-y-2.5 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Параметры действия:</span>
                </div>

                {!selectedAction.paramsSchema || selectedAction.paramsSchema.length === 0 ? (
                  <div className="text-xs text-zinc-500 italic p-2 bg-zinc-950/40 rounded border border-zinc-800/40">
                    Это действие выполняется автономно и не требует дополнительных параметров.
                  </div>
                ) : (
                  selectedAction.paramsSchema.map((param) => (
                    <div key={param.key} className="space-y-1">
                      <label className="text-xs text-zinc-300 font-semibold flex items-center justify-between">
                        <span>{param.label}:</span>
                        {param.type === 'color' && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            {paramValues[param.key]}
                          </span>
                        )}
                      </label>

                      {param.type === 'select' ? (
                        <select
                          value={paramValues[param.key] ?? param.defaultValue}
                          onChange={(e) => handleParamChange(param.key, e.target.value)}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-xs outline-none focus:border-yellow-500"
                        >
                          {param.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : param.type === 'color' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={paramValues[param.key] || '#2563EB'}
                            onChange={(e) => handleParamChange(param.key, e.target.value)}
                            className="w-8 h-8 bg-transparent border-0 cursor-pointer rounded"
                          />
                          <input
                            type="text"
                            value={paramValues[param.key] || '#2563EB'}
                            onChange={(e) => handleParamChange(param.key, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-xs font-mono outline-none"
                          />
                        </div>
                      ) : (
                        <input
                          type={param.type === 'number' ? 'number' : 'text'}
                          value={paramValues[param.key] ?? ''}
                          onChange={(e) => handleParamChange(param.key, e.target.value)}
                          placeholder={param.label}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-xs font-mono outline-none focus:border-yellow-500"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Live C# Code Preview */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Сгенерированный чистый C# код:</span>
                </span>
                <pre className="p-3 bg-black/90 border border-zinc-800 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed shadow-inner">
                  {compiledCode}
                </pre>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/20 flex items-center gap-2 transition cursor-pointer active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Вставить действие в метод</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
