import React, { useState } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { ControlRenderer } from '../canvas/ControlRenderer';
import {
  Minus,
  Square,
  X,
  Play,
  Terminal,
  Trash2,
  AppWindow,
  RotateCcw,
} from 'lucide-react';

interface EventLogEntry {
  id: string;
  time: string;
  controlName: string;
  eventName: string;
  handlerName: string;
  message?: string;
}

export const LiveRunModal: React.FC = () => {
  const {
    project,
    liveRunOpen,
    setLiveRunOpen,
    addConsoleLog,
    setMessageBoxModal,
  } = useDesigner();
  const rootForm = project.nodes[project.rootFormId];

  const [activeTabByControl, setActiveTabByControl] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<EventLogEntry[]>([]);

  if (!liveRunOpen || !rootForm) return null;

  const handleEventTrigger = (eventName: string, handlerName: string, controlName: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');

    addConsoleLog('Event', `Сработало событие: ${handlerName}()`);

    let msg = `Вызов: ${handlerName}(sender, EventArgs)`;
    if (eventName === 'Click') {
      msg = `[Click] Обработчик ${handlerName} выполнен успешно!`;
      addConsoleLog('Console.WriteLine', `Нажата кнопка: ${controlName}`);
      addConsoleLog('MessageBox.Show', `Заголовок: "Успех", Сообщение: "Действие успешно выполнено: ${controlName}"`);
      setMessageBoxModal({
        isOpen: true,
        title: 'Успех',
        text: `Действие успешно выполнено: ${controlName}`,
      });
    } else if (eventName === 'TextChanged') {
      msg = `[TextChanged] Текст в поле ${controlName} обновлен`;
      addConsoleLog('Console.WriteLine', `Поле ${controlName} изменило текст`);
    }

    setLogs(prev => [
      {
        id: Math.random().toString(),
        time: timeStr,
        controlName,
        eventName,
        handlerName,
        message: msg,
      },
      ...prev.slice(0, 50),
    ]);
  };

  const renderChildren = (parentId: string) => {
    const parent = project.nodes[parentId];
    if (!parent?.childrenIds) return null;

    return parent.childrenIds.map(childId => {
      const node = project.nodes[childId];
      if (!node || node.properties.visible === false) return null;

      const isContainer = ['Panel', 'GroupBox', 'TabControl'].includes(node.type);

      return (
        <div
          key={node.id}
          style={{
            position: 'absolute',
            left: `${node.bounds.x}px`,
            top: `${node.bounds.y}px`,
            width: `${node.bounds.width}px`,
            height: `${node.bounds.height}px`,
          }}
        >
          <ControlRenderer
            node={node}
            isInteractive={true}
            onEventTrigger={handleEventTrigger}
            activeTab={activeTabByControl[node.id] || 0}
            onTabChange={idx => setActiveTabByControl(prev => ({ ...prev, [node.id]: idx }))}
          />

          {isContainer && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="relative w-full h-full pointer-events-auto">
                {renderChildren(node.id)}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="flex flex-col max-w-5xl w-full max-h-[92vh] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="h-10 px-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Режим тестирования формы (Interactive Simulation)</span>
            <span className="text-zinc-500 font-normal">| {project.targetFramework || 'WinForms'}</span>
          </div>
          <button
            type="button"
            onClick={() => setLiveRunOpen(false)}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Container: Running Form + Output Console */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-950">
          {/* Running Form Viewport */}
          <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-zinc-950/90 bg-canvas-grid">
            <div
              style={{
                width: `${rootForm.bounds.width}px`,
                minHeight: `${rootForm.bounds.height}px`,
                backgroundColor: rootForm.properties.backColor || '#FFFFFF',
              }}
              className="relative rounded-t-lg shadow-2xl border border-zinc-400/80 dark:border-zinc-600 transition-all overflow-hidden"
            >
              {/* Form Window Titlebar */}
              <div className="h-8 px-3 bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 flex items-center justify-between select-none">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  <AppWindow className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate">{rootForm.properties.text || rootForm.properties.name}</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-500">
                  <div className="w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-300 dark:hover:bg-zinc-700">
                    <Minus className="w-2.5 h-2.5" />
                  </div>
                  <div className="w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-300 dark:hover:bg-zinc-700">
                    <Square className="w-2 h-2" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setLiveRunOpen(false)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* Form Client Area */}
              <div
                style={{
                  width: `${rootForm.bounds.width}px`,
                  height: `${rootForm.bounds.height}px`,
                }}
                className="relative overflow-hidden"
              >
                {renderChildren(rootForm.id)}
              </div>
            </div>
          </div>

          {/* Real-time Diagnostics & Event Output Console */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-900/90 flex flex-col h-64 md:h-auto">
            <div className="p-2.5 border-b border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Журнал событий (Console)</span>
              </div>
              <button
                type="button"
                onClick={() => setLogs([])}
                title="Очистить лог"
                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="text-zinc-600 text-center py-8 italic">
                  Взаимодействуйте с элементами формы (нажимайте кнопки, вводите текст) для просмотра вызовов C# событий...
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-1.5 rounded bg-zinc-950/80 border border-zinc-800/80 text-zinc-300">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                      <span>{log.time}</span>
                      <span className="text-blue-400 font-semibold">{log.controlName}</span>
                    </div>
                    <div className="text-emerald-400 font-medium">⚡️ {log.handlerName}()</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{log.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="h-10 px-4 bg-zinc-800/80 border-t border-zinc-700 flex items-center justify-between text-xs text-zinc-400">
          <span>Готово к компиляции: .NET 8.0 SDK / Visual Studio 2022</span>
          <button
            type="button"
            onClick={() => setLiveRunOpen(false)}
            className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white transition-colors"
          >
            Вернуться в дизайнер
          </button>
        </div>
      </div>
    </div>
  );
};
