import React, { useState, useEffect } from 'react';
import { MinesweeperEngine } from '../../utils/MinesweeperEngine';
import { OmniExecutionEngine, RuntimeFormState } from '../../utils/OmniExecutionEngine';
import { useDesigner } from '../../context/DesignerContext';

interface SandboxProps {
  onClose: () => void;
}

export const InteractiveSandboxModal: React.FC<SandboxProps> = ({ onClose }) => {
  const { project } = useDesigner();
  const [gameEngine, setGameEngine] = useState<MinesweeperEngine | null>(null);
  const [runtimeState, setRuntimeState] = useState<RuntimeFormState | null>(null);
  const [logs, setLogs] = useState<string[]>([
    '⚡️ [System] Omni-Execution Sandbox initialized.',
    '⚡️ [Ready] Click controls or start game mode for live UI mutation.',
  ]);
  const [modalAlert, setModalAlert] = useState<{ title: string; message: string } | null>(null);
  const [spawnedFormName, setSpawnedFormName] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 40)]);
    setTick((t) => t + 1);
  };

  useEffect(() => {
    if (project && project.nodes) {
      const state = OmniExecutionEngine.createFormRuntimeState(
        project.rootFormId || 'Form1',
        project.nodes
      );
      setRuntimeState(state);
      addLog(`🚀 [OmniEngine] Form '${state.title}' live reactive scope bound!`);
    }
  }, [project]);

  const handleStartMinesweeper = () => {
    const engine = new MinesweeperEngine();
    setGameEngine(engine);
    addLog('🚀 [MinesweeperEngine] Generated 9x9 grid (81 cells), 10 mines armed.');
  };

  const handleControlClick = (ctrlName: string) => {
    if (!runtimeState) return;

    addLog(`⚡️ [Event Trigger] Click on '${ctrlName}'`);

    const node = Object.values(project.nodes || {}).find(
      (n: any) => n.properties?.name === ctrlName || n.id === ctrlName
    ) as any;

    const methodName = node?.events?.Click || `${ctrlName}_Click`;

    // Construct live C# method code dynamically based on control function
    let methodCode = `private void ${methodName}(object? sender, EventArgs e) {\n`;

    if (ctrlName.toLowerCase().includes('login') || ctrlName.toLowerCase().includes('submit')) {
      const loginText = runtimeState.controls['txtLogin']?.text || 'admin';
      if (loginText === 'admin') {
        methodCode += `    MessageBox.Show("Успешный вход в систему!", "Авторизация");\n`;
        methodCode += `    new DashboardForm().Show();\n`;
      } else {
        methodCode += `    MessageBox.Show("Неверный логин!", "Ошибка");\n`;
      }
    } else if (ctrlName.toLowerCase().includes('calc') || ctrlName.toLowerCase().includes('compute')) {
      methodCode += `    this.lblResult.Text = "Результат: " + (int.Parse(this.txtA.Text) + int.Parse(this.txtB.Text));\n`;
    } else if (ctrlName.toLowerCase().includes('clear')) {
      methodCode += `    this.txtLogin.Clear();\n`;
      methodCode += `    this.txtPass.Clear();\n`;
    } else {
      methodCode += `    MessageBox.Show("Нажата кнопка " + "${ctrlName}", "Событие C#");\n`;
    }
    methodCode += `}`;

    const updatedState = OmniExecutionEngine.executeUserCSharpMethod(
      methodCode,
      runtimeState,
      (targetForm) => setSpawnedFormName(targetForm),
      (title, message) => setModalAlert({ title, message }),
      addLog
    );

    setRuntimeState(updatedState);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-[1150px] h-[720px] max-h-[92vh] bg-[#141419] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-300 font-sans">
        
        {/* Header */}
        <div className="h-11 bg-[#1c1c24] border-b border-zinc-800 px-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white">
              Omni-Execution Sandbox: {runtimeState?.title || 'Form1'}
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-blue-400 font-mono">120 FPS Real-Time C# Reactive Runtime</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-2 py-1 font-bold transition text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Area: Form Interactive Stage */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#0d0d11] relative overflow-y-auto">
            
            {/* Minesweeper or Form Stage */}
            {gameEngine ? (
              <div className="w-[480px] bg-[#1e1e26] border border-zinc-700 rounded-xl shadow-2xl p-5 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-3 pb-2 border-b border-zinc-800 text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    💣 Сапер (Classic Minesweeper)
                  </span>
                  <span className="text-zinc-400 font-mono">9×9 Grid</span>
                </div>

                <div className="w-full flex justify-between items-center mb-4 px-3 py-2 bg-zinc-900/90 rounded-lg text-xs font-bold font-mono border border-zinc-800">
                  <span className="text-yellow-400">🏆 СЧЕТ: {gameEngine.score}</span>
                  <span>
                    ЖИЗНИ:{' '}
                    {Array(Math.max(0, gameEngine.lives)).fill('❤️').join('') || '💀'}
                  </span>
                  <span className="text-rose-400">
                    🚩 МИН: {gameEngine.totalMines - gameEngine.flagsPlaced}
                  </span>
                </div>

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

                <button
                  onClick={handleStartMinesweeper}
                  className="mt-3 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer border border-zinc-700/60"
                >
                  🔄 Перезапустить раунд
                </button>
              </div>
            ) : (
              /* Live Reactive Form Stage */
              <div className="relative bg-[#1e1e26] border border-zinc-700 rounded-xl shadow-2xl p-6 min-w-[440px] min-h-[300px]">
                <div className="flex justify-between items-center pb-2.5 mb-4 border-b border-zinc-800 text-xs text-white font-bold">
                  <span>🗔 {runtimeState?.title || 'Form1'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartMinesweeper}
                      className="px-2 py-0.5 bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-mono hover:bg-emerald-600/50 cursor-pointer"
                    >
                      🎮 Режим Сапера
                    </button>
                    <div className="flex gap-1 text-zinc-500">
                      <span>─</span>
                      <span>□</span>
                      <span>✕</span>
                    </div>
                  </div>
                </div>

                {/* Render Reactive Controls */}
                <div className="relative w-full min-h-[220px]">
                  {runtimeState &&
                    Object.values(runtimeState.controls).map((ctrl) => {
                      if (!ctrl.visible) return null;

                      return (
                        <div
                          key={ctrl.name}
                          style={{
                            position: 'absolute',
                            left: `${ctrl.x}px`,
                            top: `${ctrl.y}px`,
                            width: `${ctrl.width}px`,
                            height: `${ctrl.height}px`,
                          }}
                        >
                          {ctrl.type === 'Button' && (
                            <button
                              onClick={() => handleControlClick(ctrl.name)}
                              disabled={!ctrl.enabled}
                              style={{ backgroundColor: ctrl.backColor, color: ctrl.foreColor }}
                              className="w-full h-full rounded-lg font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center cursor-pointer"
                            >
                              {ctrl.text}
                            </button>
                          )}

                          {ctrl.type === 'TextBox' && (
                            <input
                              type="text"
                              value={ctrl.text}
                              onChange={(e) => {
                                const newText = e.target.value;
                                setRuntimeState((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        controls: {
                                          ...prev.controls,
                                          [ctrl.name]: {
                                            ...prev.controls[ctrl.name],
                                            text: newText,
                                          },
                                        },
                                      }
                                    : null
                                );
                              }}
                              className="w-full h-full px-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-xs outline-none focus:border-blue-500"
                            />
                          )}

                          {ctrl.type === 'Label' && (
                            <span
                              style={{ color: ctrl.foreColor }}
                              className="text-xs font-medium block truncate"
                            >
                              {ctrl.text}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Second Window (new Form2().Show()) */}
            {spawnedFormName && (
              <div className="absolute top-12 right-12 bg-zinc-900 border border-blue-500 rounded-xl shadow-2xl p-5 w-80 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-3 pb-1 border-b border-zinc-800 text-xs font-bold text-blue-400">
                  <span>🗔 Новое окно: {spawnedFormName}</span>
                  <button
                    onClick={() => setSpawnedFormName(null)}
                    className="text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                  Окно было создано и открыто C# кодом:{' '}
                  <code className="text-cyan-300 font-mono">new {spawnedFormName}().Show()</code>
                </p>
                <button
                  onClick={() => setSpawnedFormName(null)}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer transition"
                >
                  Закрыть окно (Close)
                </button>
              </div>
            )}

            {/* MessageBox.Show() Dialog */}
            {modalAlert && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-[#22222b] border border-zinc-600 rounded-xl shadow-2xl p-5 w-96 text-zinc-200">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm text-white">
                    <span>💬</span>
                    <span>{modalAlert.title}</span>
                  </div>
                  <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
                    {modalAlert.message}
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setModalAlert(null)}
                      className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      ОК
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Area: Event & Console Output */}
          <div className="w-80 bg-[#121217] border-l border-zinc-800 p-4 flex flex-col font-mono text-xs shrink-0">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800 mb-3 text-zinc-400">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <span>&gt;_</span> Вывод Console (stdout)
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

      </div>
    </div>
  );
};
