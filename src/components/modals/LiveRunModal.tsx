import React, { useState, useEffect, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { ControlRenderer } from '../canvas/ControlRenderer';
import { DesignerNode } from '../../types/ast';
import { templateEngine } from '../../utils/templateExecutionEngine';
import {
  Minus,
  Square,
  X,
  Play,
  Terminal,
  Trash2,
  AppWindow,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
  Layers,
} from 'lucide-react';

interface EventLogEntry {
  id: string;
  time: string;
  controlName: string;
  eventName: string;
  handlerName: string;
  message?: string;
  details?: string;
}

export const LiveRunModal: React.FC = () => {
  const {
    project,
    liveRunOpen,
    setLiveRunOpen,
    addConsoleLog,
    getAllForms,
  } = useDesigner();

  // Active form being simulated
  const [activeFormId, setActiveFormId] = useState<string>(project.rootFormId);

  // Live sandbox state of all nodes (isolated from designer canvas)
  const [liveNodes, setLiveNodes] = useState<Record<string, DesignerNode>>({});

  const [activeTabByControl, setActiveTabByControl] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<EventLogEntry[]>([]);
  const [activeToast, setActiveToast] = useState<{
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Reset/Initialize live sandbox whenever modal opens or project changes
  useEffect(() => {
    if (liveRunOpen) {
      setLiveNodes(JSON.parse(JSON.stringify(project.nodes)));
      setActiveFormId(project.rootFormId);
      templateEngine.resetCalcState(project.nodes['txtDisplay']?.properties.text || '0');

      const formName = project.nodes[project.rootFormId]?.properties.name || 'Form1';
      addConsoleLog('System', `[Process Started] Запущен интерактивный процесс: ${project.projectName || 'WinFormsApp'}.exe`);
      addConsoleLog('System', `[Form Initialize] Загрузка формы: ${formName}.InitializeComponent()`);

      setLogs([
        {
          id: Math.random().toString(),
          time: new Date().toTimeString().split(' ')[0],
          controlName: formName,
          eventName: 'Load',
          handlerName: `${formName}_Load`,
          message: `⚡️ [FormLoad] Форма «${formName}» успешно инициализирована и отображена`,
          details: `Application.Run(new ${formName}());`,
        },
      ]);
    }
  }, [liveRunOpen, project]);

  // Sync activeFormId if rootFormId changes
  useEffect(() => {
    if (liveRunOpen && !liveNodes[activeFormId]) {
      setActiveFormId(project.rootFormId);
    }
  }, [liveRunOpen, activeFormId, liveNodes, project.rootFormId]);

  const allForms = useMemo(() => {
    const forms = Object.values(liveNodes).filter(n => n.type === 'Form');
    return forms.length > 0 ? forms : [liveNodes[project.rootFormId]].filter(Boolean);
  }, [liveNodes, project.rootFormId]);

  const currentForm = liveNodes[activeFormId] || liveNodes[project.rootFormId];

  if (!liveRunOpen || !currentForm) return null;

  // Handle two-way property changes from inputs
  const handlePropertyChange = (nodeId: string, propName: string, val: any) => {
    setLiveNodes(prev => {
      const node = prev[nodeId];
      if (!node) return prev;
      return {
        ...prev,
        [nodeId]: {
          ...node,
          properties: {
            ...node.properties,
            [propName]: val,
          },
        },
      };
    });
  };

  // Dispatch interactive events via templateEngine
  const handleEventTrigger = async (
    eventName: string,
    handlerName: string,
    controlName: string,
    payload?: any
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');

    // Run through domain execution engine
    const result = await templateEngine.executeEvent(
      eventName,
      handlerName,
      controlName,
      liveNodes,
      project,
      payload
    );

    // Apply updated nodes
    setLiveNodes(result.updatedNodes);

    // Handle toast notification
    if (result.notification) {
      setActiveToast(result.notification);
      setTimeout(() => setActiveToast(null), 4500);
    }

    // Handle navigation
    if (result.navigationTargetFormId && liveNodes[result.navigationTargetFormId]) {
      setActiveFormId(result.navigationTargetFormId);
    }

    // Handle CSV / file download
    if (result.downloadPayload) {
      const blob = new Blob([result.downloadPayload.content], { type: result.downloadPayload.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.downloadPayload.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Add to console logs
    if (result.logEntry) {
      addConsoleLog('Event', `⚡️ ${result.logEntry.handlerName}(): ${result.logEntry.message}`);
      setLogs(prev => [
        {
          id: Math.random().toString(),
          time: timeStr,
          controlName: result.logEntry!.controlName,
          eventName: result.logEntry!.eventName,
          handlerName: result.logEntry!.handlerName,
          message: result.logEntry!.message,
          details: result.logEntry!.details,
        },
        ...prev.slice(0, 70),
      ]);
    }
  };

  const handleRestart = () => {
    setLiveNodes(JSON.parse(JSON.stringify(project.nodes)));
    setActiveFormId(project.rootFormId);
    templateEngine.resetCalcState('0');
    setLogs(prev => [
      {
        id: Math.random().toString(),
        time: new Date().toTimeString().split(' ')[0],
        controlName: 'System',
        eventName: 'Restart',
        handlerName: 'Application.Restart',
        message: '🔄 Состояние формы и песочницы сброшено к исходному состоянию',
      },
      ...prev,
    ]);
  };

  const renderChildren = (parentId: string) => {
    const parent = liveNodes[parentId];
    if (!parent?.childrenIds) return null;

    return parent.childrenIds.map(childId => {
      const node = liveNodes[childId];
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
            onPropertyChange={(pName, val) => handlePropertyChange(node.id, pName, val)}
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="flex flex-col max-w-5xl w-full max-h-[92vh] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="h-11 px-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-semibold text-zinc-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span>Живое тестирование формы (Interactive Sandbox)</span>
            <span className="text-zinc-500 font-normal">| {project.targetFramework || 'WinForms (.NET 8.0)'}</span>

            {/* Multi-Form switcher if project has multiple forms */}
            {allForms.length > 1 && (
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700 ml-2">
                <Layers className="w-3 h-3 text-blue-400" />
                <span className="text-[11px] text-zinc-400">Форма:</span>
                <select
                  value={activeFormId}
                  onChange={e => setActiveFormId(e.target.value)}
                  className="bg-transparent text-white text-[11px] outline-hidden cursor-pointer"
                >
                  {allForms.map(f => (
                    <option key={f.id} value={f.id} className="bg-zinc-800">
                      {f.properties.text || f.properties.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestart}
              title="Перезапустить симуляцию (Сброс)"
              className="px-2.5 py-1 bg-zinc-700/70 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Сбросить состояние</span>
            </button>
            <button
              type="button"
              onClick={() => setLiveRunOpen(false)}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Container: Running Form Viewport + Event Output Console */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-950">
          {/* Running Form Viewport */}
          <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-zinc-950/90 bg-canvas-grid relative">
            {/* In-app Toast Banner */}
            {activeToast && (
              <div
                className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg shadow-xl border flex items-center gap-2 text-xs font-medium animate-in slide-in-from-top-2 duration-200 ${
                  activeToast.type === 'success'
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-600/80'
                    : activeToast.type === 'warning'
                    ? 'bg-amber-950/90 text-amber-200 border-amber-600/80'
                    : activeToast.type === 'error'
                    ? 'bg-red-950/90 text-red-200 border-red-600/80'
                    : 'bg-blue-950/90 text-blue-200 border-blue-600/80'
                }`}
              >
                {activeToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {activeToast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                {activeToast.type === 'error' && <X className="w-4 h-4 text-red-400 shrink-0" />}
                {activeToast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
                <div>
                  <div className="font-semibold">{activeToast.title}</div>
                  <div className="text-[11px] opacity-90">{activeToast.message}</div>
                </div>
              </div>
            )}

            <div
              style={{
                width: `${currentForm.bounds.width}px`,
                minHeight: `${currentForm.bounds.height}px`,
                backgroundColor: currentForm.properties.backColor || '#FFFFFF',
              }}
              className="relative rounded-t-lg shadow-2xl border border-zinc-400/80 dark:border-zinc-600 transition-all overflow-hidden"
            >
              {/* Form Window Titlebar */}
              <div className="h-8 px-3 bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 flex items-center justify-between select-none">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  <AppWindow className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate">{currentForm.properties.text || currentForm.properties.name}</span>
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
                  width: `${currentForm.bounds.width}px`,
                  height: `${currentForm.bounds.height}px`,
                }}
                className="relative overflow-hidden"
              >
                {renderChildren(currentForm.id)}
              </div>
            </div>
          </div>

          {/* Real-time Diagnostics & Event Output Console */}
          <div className="w-full md:w-88 border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-900/95 flex flex-col h-64 md:h-auto">
            <div className="p-2.5 border-b border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Журнал событий Console</span>
              </div>
              <button
                type="button"
                onClick={() => setLogs([])}
                title="Очистить лог"
                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="text-zinc-600 text-center py-8 italic text-xs">
                  Взаимодействуйте с формой (нажимайте кнопки, цифры калькулятора, вводите текст) для живого выполнения...
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-2 rounded bg-zinc-950/90 border border-zinc-800 text-zinc-300">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                      <span>{log.time}</span>
                      <span className="text-blue-400 font-semibold px-1 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
                        {log.controlName}
                      </span>
                    </div>
                    <div className="text-emerald-400 font-medium flex items-center gap-1">
                      <span>⚡️ {log.handlerName}()</span>
                    </div>
                    <div className="text-[11px] text-zinc-200 mt-1 font-sans font-medium">{log.message}</div>
                    {log.details && (
                      <pre className="mt-1 text-[10px] font-mono text-zinc-400 bg-zinc-900/90 p-1 rounded overflow-x-auto whitespace-pre-wrap border border-zinc-800/60">
                        {log.details}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="h-10 px-4 bg-zinc-800/80 border-t border-zinc-700 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>.NET 8.0 SDK JIT Simulation Engine | 60 FPS</span>
          </div>
          <button
            type="button"
            onClick={() => setLiveRunOpen(false)}
            className="px-3.5 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white transition-colors cursor-pointer"
          >
            Вернуться в дизайнер
          </button>
        </div>
      </div>
    </div>
  );
};
