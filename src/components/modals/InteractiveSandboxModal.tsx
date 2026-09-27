import React, { useState } from 'react';
import { MinesweeperEngine } from '../../utils/MinesweeperEngine';

interface SandboxProps {
  onClose: () => void;
}

export const InteractiveSandboxModal: React.FC<SandboxProps> = ({ onClose }) => {
  const [gameEngine, setGameEngine] = useState<MinesweeperEngine | null>(null);
  const [logs, setLogs] = useState<string[]>([
    '⚡️ [System] Песочница инициализирована.',
    '⚡️ [Ready] Нажмите "🎮 НАЧАТЬ ИГРУ" для генерации игрового поля.',
  ]);
  const [, setTick] = useState(0);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 30)]);
    setTick((t) => t + 1);
  };

  const handleStartMinesweeper = () => {
    const engine = new MinesweeperEngine();
    setGameEngine(engine);
    addLog('🚀 [Minesweeper] Создано поле 9x9 (81 ячейка), размещено 10 мин.');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-[1100px] h-[700px] max-h-[90vh] bg-[#141419] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-300 font-sans">
        
        {/* Header */}
        <div className="h-11 bg-[#1c1c24] border-b border-zinc-800 px-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white">Живое тестирование формы (Interactive Sandbox)</span>
            <span className="text-zinc-500">|</span>
            <span className="text-blue-400 font-mono">.NET 8 WinForms Runtime</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-2 py-1 text-sm font-bold cursor-pointer transition"
            title="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Live Interactive Form */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#0d0d11] relative overflow-y-auto">
            
            {/* Minesweeper Window */}
            <div className="w-[480px] bg-[#1e1e26] border border-zinc-700 rounded-xl shadow-2xl p-5 flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-3 pb-2 border-b border-zinc-800 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  💣 Сапер (Classic Minesweeper)
                </span>
                <span className="text-zinc-400 font-mono">9×9 Grid</span>
              </div>

              {/* Game Status Bar */}
              <div className="w-full flex justify-between items-center mb-4 px-3 py-2 bg-zinc-900/90 rounded-lg text-xs font-bold font-mono border border-zinc-800">
                <span className="text-yellow-400">🏆 СЧЕТ: {gameEngine ? gameEngine.score : 0}</span>
                <span>
                  ЖИЗНИ:{' '}
                  {gameEngine
                    ? Array(Math.max(0, gameEngine.lives)).fill('❤️').join('') || '💀'
                    : '❤️❤️❤️'}
                </span>
                <span className="text-rose-400">
                  🚩 МИН: {gameEngine ? gameEngine.totalMines - gameEngine.flagsPlaced : 10}
                </span>
              </div>

              {/* Start Game Button or Interactive Grid */}
              {!gameEngine ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <p className="text-xs text-zinc-400 text-center max-w-xs mb-2">
                    Нажмите кнопку ниже, чтобы сгенерировать матрицу ячеек и начать игру вживую:
                  </p>
                  <button
                    onClick={handleStartMinesweeper}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <span>🎮</span>
                    <span>НАЧАТЬ ИГРУ</span>
                  </button>
                </div>
              ) : (
                /* Interactive 9x9 Minesweeper Grid */
                <div className="flex flex-col items-center gap-3">
                  <div className="grid grid-cols-9 gap-1 p-2 bg-zinc-950 rounded-xl border border-zinc-800 shadow-inner">
                    {gameEngine.grid.map((row, y) =>
                      row.map((cell, x) => (
                        <button
                          key={`${x}-${y}`}
                          onClick={() => gameEngine.openCell(x, y, addLog)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            gameEngine.toggleFlag(x, y, addLog);
                            setTick((t) => t + 1);
                          }}
                          className={`w-9 h-9 text-xs font-bold rounded flex items-center justify-center transition select-none cursor-pointer ${
                            !cell.isOpen
                              ? 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-transparent shadow border border-zinc-700/50'
                              : cell.isMine
                              ? 'bg-rose-600 text-white shadow-inner animate-bounce'
                              : 'bg-zinc-900 text-blue-400 border border-zinc-800/80'
                          }`}
                        >
                          {cell.isOpen ? (
                            cell.isMine ? '💣' : cell.neighborMines > 0 ? cell.neighborMines : ''
                          ) : cell.isFlagged ? (
                            '🚩'
                          ) : (
                            ''
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={handleStartMinesweeper}
                    className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer border border-zinc-700/60"
                  >
                    🔄 Перезапустить раунд
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Right: Event Log Console */}
          <div className="w-80 bg-[#121217] border-l border-zinc-800 p-4 flex flex-col font-mono text-xs shrink-0">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800 mb-3 text-zinc-400">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <span>&gt;_</span> Журнал событий
              </span>
              <button
                onClick={() => setLogs([])}
                className="hover:text-white cursor-pointer text-xs"
                title="Очистить лог"
              >
                🗑
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-[11px] scrollbar-thin">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300 leading-relaxed break-words"
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="h-9 bg-[#1c1c24] border-t border-zinc-800 px-5 flex justify-between items-center text-[11px] text-zinc-500 shrink-0">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            .NET 8.0 SDK Simulation Engine | 60 FPS
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition text-xs cursor-pointer border border-zinc-700/60"
          >
            Вернуться в дизайнер
          </button>
        </div>

      </div>
    </div>
  );
};
