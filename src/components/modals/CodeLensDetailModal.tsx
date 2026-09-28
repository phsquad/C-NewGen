import React, { useState } from 'react';
import { CodeLensSymbol } from '../../utils/CSharpCodeLensEngine';
import {
  X,
  Search,
  CheckCircle2,
  Play,
  RotateCcw,
  GitCommit,
  User,
  Clock,
  Code2,
  FileCode,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CodeLensDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: CodeLensSymbol | null;
  activeTab: 'references' | 'tests' | 'author';
  onSelectTab: (tab: 'references' | 'tests' | 'author') => void;
  onJumpToLine?: (lineNumber: number) => void;
}

export const CodeLensDetailModal: React.FC<CodeLensDetailModalProps> = ({
  isOpen,
  onClose,
  symbol,
  activeTab,
  onSelectTab,
  onJumpToLine,
}) => {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testRunSuccess, setTestRunSuccess] = useState(true);
  const [testExecutionMs, setTestExecutionMs] = useState(
    symbol?.tests.lastRunDurationMs || 3.4
  );

  if (!isOpen || !symbol) return null;

  const handleRerunTest = () => {
    setIsRunningTest(true);
    setTimeout(() => {
      setIsRunningTest(false);
      setTestRunSuccess(true);
      setTestExecutionMs(parseFloat((Math.random() * 2 + 1.2).toFixed(1)));
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4 select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-850 bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-400">
              <Code2 className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-100 text-sm">{symbol.name}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {symbol.kind}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">Строка {symbol.lineNumber}</span>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 truncate max-w-md">
                {symbol.signature}
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

        {/* Tab Switcher: References | Tests | Author */}
        <div className="flex items-center border-b border-zinc-850 bg-zinc-900/40 px-3 text-xs">
          <button
            type="button"
            onClick={() => onSelectTab('references')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer ${
              activeTab === 'references'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Ссылки ({symbol.referencesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer ${
              activeTab === 'tests'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Тесты и валидация</span>
            <span className="text-[10px] px-1 rounded bg-emerald-950 text-emerald-300 font-mono">
              {symbol.tests.passed}/{symbol.tests.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('author')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer ${
              activeTab === 'author'
                ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>Автор и Git Blame</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 max-h-[420px] overflow-y-auto">
          {/* 1. REFERENCES TAB */}
          {activeTab === 'references' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Найдено <strong>{symbol.references.length}</strong> вхождений в текущем файле решения:
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">Нажмите на строку для перехода</span>
              </div>

              <div className="space-y-1.5">
                {symbol.references.map((ref, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (onJumpToLine) onJumpToLine(ref.lineNumber);
                      onClose();
                    }}
                    className="p-2.5 rounded-lg bg-zinc-900/70 hover:bg-blue-950/40 border border-zinc-800 hover:border-blue-700/60 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-400 border border-zinc-750 group-hover:border-blue-600/50 group-hover:text-blue-300 shrink-0">
                        Строка {ref.lineNumber}
                      </span>
                      <span className="text-xs font-mono text-zinc-200 truncate group-hover:text-blue-100">
                        {ref.previewText}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {ref.isDeclaration ? (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                          Объявление
                        </span>
                      ) : (
                        <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40 flex items-center gap-1">
                          <span>Ссылка</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. TESTS TAB */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200">{symbol.tests.suiteName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-bold">
                      {testRunSuccess ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {symbol.tests.details}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRerunTest}
                  disabled={isRunningTest}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isRunningTest ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Тестирование...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Перезапустить тест</span>
                    </>
                  )}
                </button>
              </div>

              {/* Execution Specs */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase">Время выполнения</div>
                  <div className="text-emerald-400 font-bold mt-1">{testExecutionMs} ms</div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase">Утверждений (Asserts)</div>
                  <div className="text-zinc-200 font-bold mt-1">{symbol.tests.total} / {symbol.tests.total} OK</div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase">Изоляция памяти</div>
                  <div className="text-cyan-400 font-bold mt-1">0.02 MB</div>
                </div>
              </div>

              {/* Roslyn Test Suite Log */}
              <div className="p-3 bg-black/60 border border-zinc-850 rounded-lg font-mono text-[11px] space-y-1.5">
                <div className="text-zinc-500 text-[10px] uppercase flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  <span>Журнал прогона Microsoft.VisualStudio.TestPlatform:</span>
                </div>
                <div className="text-emerald-400 flex items-center gap-2">
                  <span>[✓]</span>
                  <span>TestMethod_{symbol.name}_InitializesProperly() — OK (0.8ms)</span>
                </div>
                <div className="text-emerald-400 flex items-center gap-2">
                  <span>[✓]</span>
                  <span>TestMethod_{symbol.name}_NoNullReferenceExceptions() — OK (1.2ms)</span>
                </div>
                <div className="text-emerald-400 flex items-center gap-2">
                  <span>[✓]</span>
                  <span>TestMethod_{symbol.name}_ThreadSafetyWinFormsDispatcher() — OK (1.4ms)</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. AUTHOR & GIT BLAME TAB */}
          {activeTab === 'author' && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 font-bold text-sm">
                    {symbol.author.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                      <span>{symbol.author.name}</span>
                      <span className="text-[10px] px-1 rounded bg-purple-950 text-purple-300 font-mono">
                        Автор
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">{symbol.author.email}</div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-zinc-300 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{symbol.author.timeAgo}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{symbol.author.date}</div>
                </div>
              </div>

              {/* Commit details */}
              <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-purple-400 font-mono text-[11px]">
                    <GitCommit className="w-3.5 h-3.5" />
                    <span>commit {symbol.author.lastCommitHash}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    ветка: main
                  </span>
                </div>

                <div className="text-xs text-zinc-200 font-medium">
                  {symbol.author.commitMessage}
                </div>

                <div className="text-[11px] text-zinc-500 font-mono pt-1 border-t border-zinc-850">
                  Всего изменений символа: {symbol.author.commitsCount} ревизий в истории Git.
                </div>
              </div>

              {/* Visual Studio CodeLens tip */}
              <div className="flex items-center gap-2 p-2.5 bg-blue-950/20 border border-blue-900/30 rounded-lg text-blue-300 text-xs">
                <Sparkles className="w-4 h-4 shrink-0 text-blue-400" />
                <span>
                  Интеграция с Git VCS: CodeLens отслеживает авторов и коммиты в реальном времени при каждом сохранении (Ctrl+S).
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-zinc-900/80 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-500">
          <span className="font-mono text-[11px]">Microsoft Visual Studio CodeLens Standard</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
