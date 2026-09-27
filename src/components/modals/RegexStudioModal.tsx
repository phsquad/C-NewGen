import React, { useState, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  RegexPatternStudioEngine,
  REGEX_PRESETS,
  RegexAnalysisResult,
  RegexPresetPattern,
} from '../../utils/RegexPatternStudioEngine';
import {
  Sparkles,
  Play,
  Copy,
  Check,
  Code2,
  Layers,
  Search,
  BookOpen,
  ArrowRight,
  X,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
} from 'lucide-react';

interface RegexStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegexStudioModal: React.FC<RegexStudioModalProps> = ({ isOpen, onClose }) => {
  const { addConsoleLog } = useDesigner();

  const [pattern, setPattern] = useState('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
  const [flags, setFlags] = useState('i');
  const [inputText, setInputText] = useState(
    'Контактные email-адреса разработчиков:\nalice.smith@company.com\nbob_dev99@gmail.com\ninvalid-email@\nadmin@sub.domain.org'
  );
  const [replacement, setReplacement] = useState('[REDACTED_EMAIL]');
  const [activeTab, setActiveTab] = useState<'matches' | 'replace' | 'csharp' | 'railroad' | 'presets'>('matches');
  const [copied, setCopied] = useState(false);

  // Analyze in real-time
  const analysis: RegexAnalysisResult = useMemo(
    () => RegexPatternStudioEngine.evaluate(pattern, inputText, flags, replacement),
    [pattern, inputText, flags, replacement]
  );

  if (!isOpen) return null;

  const toggleFlag = (flagChar: string) => {
    setFlags((prev) => (prev.includes(flagChar) ? prev.replace(flagChar, '') : prev + flagChar));
  };

  const handleSelectPreset = (preset: RegexPresetPattern) => {
    setPattern(preset.pattern);
    setFlags(preset.flags || '');
    setInputText(preset.sampleInput);
    setActiveTab('matches');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Roslyn Regex & Pattern Studio
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-normal">
                  System.Text.RegularExpressions
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Интерактивный визуальный тестер регулярных выражений C#, группы захвата и генерация кода
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pattern Input & Flags Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 font-mono text-purple-400 text-sm font-bold">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Введите регулярное выражение..."
                className="w-full bg-slate-900 border border-purple-500/40 rounded-lg pl-7 pr-7 py-2 text-sm font-mono text-purple-200 focus:border-purple-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 font-mono text-purple-400 text-sm font-bold">/{flags}</span>
            </div>

            {/* Quick Flag Toggles */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => toggleFlag('i')}
                className={`px-2 py-1 rounded font-mono font-semibold transition-colors ${
                  flags.includes('i') ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="IgnoreCase (i)"
              >
                i (IgnoreCase)
              </button>
              <button
                onClick={() => toggleFlag('m')}
                className={`px-2 py-1 rounded font-mono font-semibold transition-colors ${
                  flags.includes('m') ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Multiline (m)"
              >
                m (Multiline)
              </button>
              <button
                onClick={() => toggleFlag('s')}
                className={`px-2 py-1 rounded font-mono font-semibold transition-colors ${
                  flags.includes('s') ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Singleline (s)"
              >
                s (Singleline)
              </button>
            </div>
          </div>

          {/* Error Banner if invalid */}
          {!analysis.isValid && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{analysis.errorMessage}</span>
            </div>
          )}
        </div>

        {/* Studio Tabs Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'matches'
                ? 'bg-slate-900 text-purple-400 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Совпадения ({analysis.matchCount})</span>
            <span className="text-[10px] text-slate-500 font-mono">{analysis.executionTimeMs}ms</span>
          </button>
          <button
            onClick={() => setActiveTab('replace')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'replace'
                ? 'bg-slate-900 text-purple-400 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Regex.Replace
          </button>
          <button
            onClick={() => setActiveTab('railroad')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'railroad'
                ? 'bg-slate-900 text-purple-400 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            FSM Диаграмма токенов
          </button>
          <button
            onClick={() => setActiveTab('csharp')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'csharp'
                ? 'bg-slate-900 text-purple-400 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            C# Код для проекта
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-slate-900 text-purple-400 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Библиотека шаблонов ({REGEX_PRESETS.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'matches' && (
            <div className="grid grid-cols-12 gap-4">
              {/* Test Input Area */}
              <div className="col-span-7 space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Тестовый текст (Sample Text):
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none"
                  placeholder="Вставьте текст для проверки регулярного выражения..."
                />
              </div>

              {/* Match Inspector */}
              <div className="col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Найденные совпадения ({analysis.matches.length}):
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">
                    Roslyn JIT Regex: {analysis.executionTimeMs}ms
                  </span>
                </div>

                <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 max-h-72 overflow-y-auto space-y-2">
                  {analysis.matches.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      Совпадений не обнаружено.
                    </div>
                  ) : (
                    analysis.matches.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-indigo-300 font-bold">
                          <span>Match #{idx + 1}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            Позиция: {m.index} (Длина: {m.length})
                          </span>
                        </div>
                        <div className="bg-purple-950/30 text-purple-200 px-2 py-1 rounded border border-purple-500/20 break-all">
                          {m.value}
                        </div>
                        {m.groups.length > 1 && (
                          <div className="pt-1 border-t border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Группы захвата:
                            </span>
                            {m.groups.slice(1).map((grp, gIdx) => (
                              <div
                                key={gIdx}
                                className="flex items-center justify-between text-[11px] text-slate-300"
                              >
                                <span className="text-amber-400 font-semibold">{grp.name}:</span>
                                <span className="text-slate-200 truncate max-w-[180px]">
                                  {grp.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'replace' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Шаблон замены (Replacement pattern):
                  </label>
                  <input
                    type="text"
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    placeholder="e.g. $1-$2 or [REPLACED]"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Поддерживает подстановки: $0 (все совпадение), $1, $2, $$ (символ $)
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-400 block mb-1">
                    Результат Regex.Replace:
                  </label>
                  <div className="p-3 bg-slate-900 rounded border border-emerald-500/30 text-xs font-mono text-emerald-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {analysis.replacedText}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'railroad' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Визуальная диаграмма конечного автомата (FSM & Token Breakdown):
              </div>
              <div className="flex flex-wrap gap-2 p-4 bg-slate-950 rounded-lg border border-slate-800">
                {analysis.explanationTokens.map((tok, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900 rounded-lg border border-purple-500/30 flex flex-col gap-1 min-w-[120px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-purple-300 px-1.5 py-0.5 bg-purple-950/60 rounded border border-purple-500/40">
                        {tok.token}
                      </span>
                      <span className="text-[10px] text-slate-400">{tok.type}</span>
                    </div>
                    <span className="text-[11px] text-slate-300 leading-tight">
                      {tok.explanation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'csharp' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Готовый к вставке в Form1.cs оптимизированный код:
                </span>
                <button
                  onClick={() => handleCopy(analysis.csharpSnippet)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-xs rounded text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Скопировано!' : 'Копировать в буфер'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-purple-200 overflow-x-auto max-h-[450px]">
                {analysis.csharpSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 gap-3">
              {REGEX_PRESETS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-lg cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-purple-400 font-semibold">
                      {p.category}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-purple-300 bg-slate-900 p-1.5 rounded border border-slate-800 truncate">
                    {p.pattern}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>RegexOptions: <strong className="text-white">Compiled, {flags || 'None'}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                addConsoleLog('System', `[Regex Studio] Шаблон '${pattern}' скопирован для использования в C#.`);
                handleCopy(analysis.csharpSnippet);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
            >
              <Copy className="w-4 h-4" />
              Копировать C# Snippet
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
