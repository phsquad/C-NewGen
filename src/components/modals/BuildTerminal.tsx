import React, { useRef, useEffect, useState } from 'react';
import {
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  FolderArchive,
  Sparkles,
} from 'lucide-react';

export interface BuildLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'step';
}

export interface BuildTerminalProps {
  logs: string[];
  isBuilding: boolean;
  progress: number;
  buildComplete: boolean;
  packageName?: string;
  onClearLogs?: () => void;
  onDownloadPackage?: () => void;
}

export const BuildTerminal: React.FC<BuildTerminalProps> = ({
  logs,
  isBuilding,
  progress,
  buildComplete,
  packageName = 'App_Standalone_Package',
  onClearLogs,
  onDownloadPackage,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const text = logs.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogStyle = (log: string) => {
    if (log.includes('🎉') || log.includes('✨') || log.includes('УСПЕШНО') || log.includes('SUCCESS')) {
      return 'text-emerald-400 font-semibold';
    }
    if (log.includes('❌') || log.includes('ERROR') || log.includes('ОШИБКА')) {
      return 'text-rose-400 font-semibold';
    }
    if (log.includes('⚠️') || log.includes('WARN')) {
      return 'text-amber-400';
    }
    if (log.includes('🚀') || log.includes('⚡️') || log.includes('📦')) {
      return 'text-cyan-300 font-semibold';
    }
    return 'text-zinc-300';
  };

  return (
    <div className="flex flex-col bg-[#0c0c10] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* Terminal Top Control Bar */}
      <div className="h-9 bg-[#16161d] border-b border-zinc-800 px-3.5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-zinc-400 font-semibold text-[11px] flex items-center gap-1.5 ml-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Terminal Output Stream</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-500 font-mono text-[10px]">Vite & Roslyn Compiler</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll((prev) => !prev)}
            className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium transition cursor-pointer ${
              autoScroll
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          </button>

          <button
            onClick={handleCopyLogs}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition cursor-pointer"
            title="Скопировать логи"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded transition cursor-pointer"
              title="Очистить терминал"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Status */}
      <div className="px-4 py-2.5 bg-[#111116] border-b border-zinc-800/80 flex flex-col gap-1.5 shrink-0">
        <div className="flex justify-between items-center text-[11px]">
          <span className="font-semibold text-white flex items-center gap-2">
            {isBuilding ? (
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            ) : buildComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span>
              {isBuilding
                ? 'Выполняется компиляция, сборка чанков и упаковка...'
                : buildComplete
                ? 'Сборка завершена успешно!'
                : 'Готов к сборке'}
            </span>
          </span>
          <span className="font-mono font-bold text-blue-400">{progress}%</span>
        </div>

        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/60">
          <div
            className={`h-full transition-all duration-300 rounded-full shadow-lg ${
              buildComplete ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Terminal Console Stream Body */}
      <div className="p-4 bg-[#09090d] text-[11px] space-y-1.5 min-h-[200px] max-h-[320px] overflow-y-auto scrollbar-thin select-text">
        {logs.length === 0 ? (
          <div className="text-zinc-600 italic flex items-center gap-2 py-8 justify-center">
            <Sparkles className="w-4 h-4 text-zinc-600 animate-pulse" />
            <span>Нажмите «🚀 СОБРАТЬ ПРОГРАММУ» для запуска компиляции в реальном времени.</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`leading-relaxed break-words font-mono ${getLogStyle(log)}`}>
              <span className="text-zinc-600 select-none mr-2">[{index + 1}]</span>
              {log}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Build Complete Success & Artifact Action */}
      {buildComplete && (
        <div className="p-3.5 bg-emerald-950/40 border-t border-emerald-500/30 flex flex-col gap-2.5 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Дистрибутив готов: {packageName}.zip</span>
            </div>

            {onDownloadPackage && (
              <button
                onClick={onDownloadPackage}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать автономный архив (.zip)</span>
              </button>
            )}
          </div>

          <div className="p-2.5 bg-zinc-950/80 rounded-lg border border-zinc-800 text-[11px] space-y-1">
            <div className="font-bold text-zinc-300">💡 Инструкция по запуску EXE:</div>
            <div className="text-zinc-400 font-sans">
              Распакуйте <strong className="text-white">{packageName}.zip</strong> ──► Запустите{' '}
              <strong className="text-amber-400 font-mono">build.bat</strong> ──► В папке{' '}
              <strong className="text-cyan-400 font-mono">publish/</strong> появится готовый{' '}
              <strong className="text-emerald-400 font-mono">.exe</strong> файл!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
