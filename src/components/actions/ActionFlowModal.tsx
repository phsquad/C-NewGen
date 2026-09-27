import React, { useState, useEffect, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { ActionFlow, ActionStep, ActionCategoryId } from '../../types/actions';
import { ACTION_CATEGORIES, ACTIONS_REGISTRY } from '../../utils/actionRegistry';
import { compileActionStepsToCSharp } from '../../utils/actionFlowCompiler';
import { executeActionStepsInSandbox } from '../../utils/actionSandboxRunner';
import {
  Zap,
  Plus,
  Play,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code2,
  Search,
  Filter,
  Layers,
  ArrowRight,
  GitBranch,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface ActionFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNodeId?: string;
  initialEvent?: string;
}

export const ActionFlowModal: React.FC<ActionFlowModalProps> = ({
  isOpen,
  onClose,
  initialNodeId,
  initialEvent = 'Click',
}) => {
  const {
    project,
    nodes,
    updateNodeProperties,
    addConsoleLog,
    setMessageBoxModal,
    getAllForms,
    setActiveFormId,
    setProjectState,
  } = useDesigner();

  // All controls in project for target dropdowns
  const allControls = useMemo(() => {
    return Object.values(nodes).filter(n => n.type !== 'Form');
  }, [nodes]);

  const allForms = useMemo(() => {
    const forms = Object.values(nodes).filter(n => n.type === 'Form');
    return forms.length > 0 ? forms : [nodes[project.rootFormId]].filter(Boolean);
  }, [nodes, project.rootFormId]);

  // Selected Target Node & Event
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    initialNodeId || project.selectedNodeIds[0] || project.rootFormId
  );
  const [selectedEvent, setSelectedEvent] = useState<string>(initialEvent);

  // Active Action Steps for the current trigger
  const [steps, setSteps] = useState<ActionStep[]>([]);
  const [catalogDrawerOpen, setCatalogDrawerOpen] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState<ActionCategoryId | 'all'>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [addingTargetBranch, setAddingTargetBranch] = useState<{ stepId?: string; branch?: 'then' | 'else' } | null>(null);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [testSuccessToast, setTestSuccessToast] = useState<string | null>(null);

  // Sync initial node selection
  useEffect(() => {
    if (initialNodeId && nodes[initialNodeId]) {
      setSelectedNodeId(initialNodeId);
    }
  }, [initialNodeId, nodes]);

  // Load existing action flow for this node and event
  useEffect(() => {
    if (!isOpen) return;

    const existingFlows: ActionFlow[] = (project as any).actionFlows || [];
    const found = existingFlows.find(
      f => f.triggerNodeId === selectedNodeId && f.triggerEvent === selectedEvent
    );

    if (found && found.steps.length > 0) {
      setSteps(JSON.parse(JSON.stringify(found.steps)));
    } else {
      // Create a sensible default demonstration flow for buttons / forms
      const node = nodes[selectedNodeId];
      if (node && (node.properties.name?.toLowerCase().includes('login') || node.properties.text?.toLowerCase().includes('войти'))) {
        // Default login validation flow
        setSteps([
          {
            id: 'step_1_if',
            actionNum: 33,
            actionId: 'ACT_33_IF_ELSE_CONDITION',
            params: {
              sourceControl: 'txtPassword',
              operator: '==',
              compareValue: '12345',
            },
            thenBranch: [
              {
                id: 'step_then_open',
                actionNum: 1,
                actionId: 'ACT_01_OPEN_FORM',
                params: { targetForm: 'Form2', mode: 'ShowDialog' },
              },
              {
                id: 'step_then_msg',
                actionNum: 21,
                actionId: 'ACT_21_SHOW_MESSAGE',
                params: { text: 'Успешный вход в систему!', title: 'Успех', icon: 'Information' },
              },
            ],
            elseBranch: [
              {
                id: 'step_else_msg',
                actionNum: 21,
                actionId: 'ACT_21_SHOW_MESSAGE',
                params: { text: 'Неверный пароль! Попробуйте 12345', title: 'Ошибка авторизации', icon: 'Error' },
              },
            ],
          },
        ]);
      } else {
        // Simple default greeting message action
        setSteps([
          {
            id: `step_${Date.now()}`,
            actionNum: 21,
            actionId: 'ACT_21_SHOW_MESSAGE',
            params: {
              text: `Событие ${selectedEvent} для ${node?.properties.name || 'элемента'} успешно выполнено!`,
              title: 'Информация',
              icon: 'Information',
            },
          },
        ]);
      }
    }
  }, [selectedNodeId, selectedEvent, isOpen, nodes, project]);

  if (!isOpen) return null;

  const currentNode = nodes[selectedNodeId] || nodes[project.rootFormId];

  // Available events for current control
  const availableEvents = useMemo(() => {
    if (!currentNode) return ['Click', 'Load'];
    switch (currentNode.type) {
      case 'Button':
      case 'IconButton':
        return ['Click', 'MouseEnter', 'MouseLeave'];
      case 'TextBox':
      case 'RichTextBox':
        return ['TextChanged', 'Enter', 'Leave', 'KeyDown'];
      case 'CheckBox':
      case 'RadioButton':
      case 'ToggleSwitch':
        return ['CheckedChanged', 'Click'];
      case 'ComboBox':
      case 'ListBox':
        return ['SelectedIndexChanged', 'SelectedValueChanged'];
      case 'DataGridView':
        return ['SelectionChanged', 'CellClick', 'CellDoubleClick'];
      case 'Form':
        return ['Load', 'FormClosing', 'Activated', 'Resize'];
      default:
        return ['Click', 'DoubleClick', 'TextChanged'];
    }
  }, [currentNode]);

  // Filtered action catalog items
  const filteredActions = useMemo(() => {
    return ACTIONS_REGISTRY.filter(act => {
      if (catalogCategory !== 'all' && act.category !== catalogCategory) {
        return false;
      }
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q) ||
          act.num.toString().includes(q)
        );
      }
      return true;
    });
  }, [catalogCategory, catalogSearch]);

  // Add Action Step from Catalog
  const handleSelectActionFromCatalog = (actionDef: typeof ACTIONS_REGISTRY[0]) => {
    const defaultParams: Record<string, any> = {};
    actionDef.paramsSchema.forEach(ps => {
      defaultParams[ps.key] = ps.defaultValue !== undefined ? ps.defaultValue : '';
    });

    const newStep: ActionStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actionNum: actionDef.num,
      actionId: actionDef.id,
      params: defaultParams,
      thenBranch: actionDef.hasBranching ? [] : undefined,
      elseBranch: actionDef.hasBranching ? [] : undefined,
    };

    if (addingTargetBranch && addingTargetBranch.stepId) {
      // Add inside then/else branch of a parent step
      const updateBranches = (items: ActionStep[]): ActionStep[] => {
        return items.map(s => {
          if (s.id === addingTargetBranch.stepId) {
            if (addingTargetBranch.branch === 'then') {
              return { ...s, thenBranch: [...(s.thenBranch || []), newStep] };
            } else {
              return { ...s, elseBranch: [...(s.elseBranch || []), newStep] };
            }
          }
          if (s.thenBranch) s.thenBranch = updateBranches(s.thenBranch);
          if (s.elseBranch) s.elseBranch = updateBranches(s.elseBranch);
          return s;
        });
      };
      setSteps(updateBranches(steps));
    } else {
      setSteps([...steps, newStep]);
    }

    setCatalogDrawerOpen(false);
    setAddingTargetBranch(null);
  };

  // Remove Step
  const handleRemoveStep = (stepId: string) => {
    const filterRec = (items: ActionStep[]): ActionStep[] => {
      return items
        .filter(s => s.id !== stepId)
        .map(s => ({
          ...s,
          thenBranch: s.thenBranch ? filterRec(s.thenBranch) : undefined,
          elseBranch: s.elseBranch ? filterRec(s.elseBranch) : undefined,
        }));
    };
    setSteps(filterRec(steps));
  };

  // Move Step Up / Down
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const copy = [...steps];
    const item = copy.splice(index, 1)[0];
    copy.splice(targetIdx, 0, item);
    setSteps(copy);
  };

  // Update Param of Step
  const handleUpdateStepParam = (stepId: string, paramKey: string, val: any) => {
    const updateRec = (items: ActionStep[]): ActionStep[] => {
      return items.map(s => {
        if (s.id === stepId) {
          return {
            ...s,
            params: {
              ...s.params,
              [paramKey]: val,
            },
          };
        }
        return {
          ...s,
          thenBranch: s.thenBranch ? updateRec(s.thenBranch) : undefined,
          elseBranch: s.elseBranch ? updateRec(s.elseBranch) : undefined,
        };
      });
    };
    setSteps(updateRec(steps));
  };

  // Live Test Action Flow in Sandbox
  const handleTestLogic = async () => {
    addConsoleLog('System', `🧪 Тестирование логики Action Flow для ${currentNode?.properties.name}.${selectedEvent}...`);
    await executeActionStepsInSandbox(steps, {
      nodes,
      updateNodeProperties,
      addConsoleLog,
      setMessageBoxModal,
      allForms,
      setActiveFormId,
    });
    setTestSuccessToast(`🧪 Логика успешно выполнена! Проверьте результат и журнал консоли.`);
    setTimeout(() => setTestSuccessToast(null), 4000);
  };

  // Save and Apply Action Flow to Project
  const handleApplyFlow = () => {
    const existingFlows: ActionFlow[] = (project as any).actionFlows || [];
    const otherFlows = existingFlows.filter(
      f => !(f.triggerNodeId === selectedNodeId && f.triggerEvent === selectedEvent)
    );

    const newFlow: ActionFlow = {
      id: `flow_${selectedNodeId}_${selectedEvent}`,
      triggerNodeId: selectedNodeId,
      triggerEvent: selectedEvent,
      title: `${currentNode?.properties.name}_${selectedEvent}`,
      steps,
    };

    const nextProject = {
      ...project,
      actionFlows: [...otherFlows, newFlow],
    };

    // Ensure event handler name is attached to control events dictionary
    const node = nextProject.nodes[selectedNodeId];
    if (node) {
      const handlerName = `${node.properties.name}_${selectedEvent}`;
      node.events = {
        ...node.events,
        [selectedEvent]: handlerName,
      };
    }

    setProjectState(nextProject);
    addConsoleLog('System', `Сохранена цепочка действий без кода для '${currentNode?.properties.name}.${selectedEvent}' (${steps.length} шагов).`);
    onClose();
  };

  // Compiled C# code preview
  const compiledCSharp = useMemo(() => {
    return compileActionStepsToCSharp(steps, '            ');
  }, [steps]);

  // Render a single action step card
  const renderStepCard = (step: ActionStep, index: number, isSubBranch = false) => {
    const actDef = ACTIONS_REGISTRY.find(a => a.num === step.actionNum || a.id === step.actionId);
    const catMeta = ACTION_CATEGORIES.find(c => c.id === actDef?.category);

    return (
      <div
        key={step.id}
        className={`p-3.5 rounded-xl border transition-all text-xs space-y-3 bg-zinc-900/90 border-zinc-700/80 shadow-md ${
          isSubBranch ? 'ml-4 border-l-2' : ''
        }`}
        style={{ borderLeftColor: catMeta?.color || '#3b82f6' }}
      >
        {/* Step Header */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold font-mono text-white shrink-0"
              style={{ backgroundColor: catMeta?.color || '#3b82f6' }}
            >
              #{step.actionNum}
            </span>
            <div>
              <span className="font-bold text-zinc-100 block">
                {actDef?.title || `Действие #${step.actionNum}`}
              </span>
              <span className="text-[10px] text-zinc-400 block font-mono">
                {catMeta?.title}
              </span>
            </div>
          </div>

          {/* Card action buttons */}
          <div className="flex items-center gap-1">
            {!isSubBranch && (
              <>
                <button
                  type="button"
                  onClick={() => handleMoveStep(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                  title="Переместить выше"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveStep(index, 'down')}
                  disabled={index === steps.length - 1}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                  title="Переместить ниже"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => handleRemoveStep(step.id)}
              className="p-1 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 rounded cursor-pointer"
              title="Удалить шаг"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Parameters Form */}
        {actDef && actDef.paramsSchema.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {actDef.paramsSchema.map(ps => {
              const currentVal = step.params?.[ps.key] !== undefined ? step.params[ps.key] : ps.defaultValue;

              return (
                <div key={ps.key} className={ps.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    {ps.label}:
                  </label>

                  {/* 1. Form Selector */}
                  {ps.type === 'form' && (
                    <select
                      value={currentVal}
                      onChange={e => handleUpdateStepParam(step.id, ps.key, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {allForms.map((f: any) => (
                        <option key={f.id} value={f.properties.name || f.id}>
                          {f.properties.name || f.id} (Форма)
                        </option>
                      ))}
                    </select>
                  )}

                  {/* 2. Control Selector */}
                  {ps.type === 'control' && (
                    <select
                      value={currentVal}
                      onChange={e => handleUpdateStepParam(step.id, ps.key, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {allControls.map(c => (
                        <option key={c.id} value={c.properties.name || c.id}>
                          {c.properties.name} ({c.type})
                        </option>
                      ))}
                    </select>
                  )}

                  {/* 3. Dropdown Options */}
                  {ps.type === 'select' && (
                    <select
                      value={currentVal}
                      onChange={e => handleUpdateStepParam(step.id, ps.key, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {ps.options?.map(opt => {
                        const val = typeof opt === 'string' ? opt : opt.value;
                        const lbl = typeof opt === 'string' ? opt : opt.label;
                        return (
                          <option key={val} value={val}>
                            {lbl}
                          </option>
                        );
                      })}
                    </select>
                  )}

                  {/* 4. Text input */}
                  {ps.type === 'text' && (
                    <input
                      type="text"
                      value={currentVal || ''}
                      placeholder={ps.placeholder}
                      onChange={e => handleUpdateStepParam(step.id, ps.key, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-blue-500 focus:outline-none font-mono"
                    />
                  )}

                  {/* 5. Color picker */}
                  {ps.type === 'color' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={currentVal || '#2563EB'}
                        onChange={e => handleUpdateStepParam(step.id, ps.key, e.target.value)}
                        className="w-7 h-7 rounded border border-zinc-700 bg-zinc-950 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={currentVal || '#2563EB'}
                        onChange={e => handleUpdateStepParam(step.id, ps.key, e.target.value)}
                        className="w-24 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* 6. Number input */}
                  {ps.type === 'number' && (
                    <input
                      type="number"
                      value={currentVal ?? 0}
                      onChange={e => handleUpdateStepParam(step.id, ps.key, Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-blue-500 focus:outline-none font-mono"
                    />
                  )}

                  {/* 7. Textarea */}
                  {ps.type === 'textarea' && (
                    <textarea
                      rows={2}
                      value={currentVal || ''}
                      onChange={e => handleUpdateStepParam(step.id, ps.key, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-zinc-200 text-xs font-mono focus:border-blue-500 focus:outline-none"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 🌿 Branching UI for If/Else / Confirm Dialogs */}
        {actDef?.hasBranching && (
          <div className="pt-2 border-t border-zinc-800 space-y-3">
            {/* Branch 1: ЕСЛИ ДА (УСПЕХ) */}
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ЕСЛИ ДА (УСПЕХ / ИСТИНА):</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAddingTargetBranch({ stepId: step.id, branch: 'then' });
                    setCatalogDrawerOpen(true);
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white transition cursor-pointer text-[10px]"
                >
                  ➕ Добавить в Успех
                </button>
              </div>

              {step.thenBranch && step.thenBranch.length > 0 ? (
                <div className="space-y-2">
                  {step.thenBranch.map((subStep, subIdx) => renderStepCard(subStep, subIdx, true))}
                </div>
              ) : (
                <div className="text-[10px] text-emerald-500/70 italic py-1">
                  (Действия ветки УСПЕХ пока не добавлены)
                </div>
              )}
            </div>

            {/* Branch 2: ЕСЛИ НЕТ (ОШИБКА) */}
            <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-red-400">
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ЕСЛИ НЕТ (ОШИБКА / ЛОЖЬ):</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAddingTargetBranch({ stepId: step.id, branch: 'else' });
                    setCatalogDrawerOpen(true);
                  }}
                  className="px-2 py-0.5 rounded bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white transition cursor-pointer text-[10px]"
                >
                  ➕ Добавить в Ошибку
                </button>
              </div>

              {step.elseBranch && step.elseBranch.length > 0 ? (
                <div className="space-y-2">
                  {step.elseBranch.map((subStep, subIdx) => renderStepCard(subStep, subIdx, true))}
                </div>
              ) : (
                <div className="text-[10px] text-red-500/70 italic py-1">
                  (Действия ветки ОШИБКА пока не добавлены)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-100">
        {/* 1. MODAL TOP HEADER */}
        <div className="px-5 py-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 font-mono flex items-center gap-2">
                <span>DEV-OS: ВИЗУАЛЬНЫЙ КОНСТРУКТОР ДЕЙСТВИЙ (NO-CODE)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                  100 Экшенов
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Создавайте алгоритмы без кода: выбирайте готовые карточки и связывайте их в цепочки
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. TRIGGER SELECTION BAR */}
        <div className="px-5 py-3 bg-zinc-950/60 border-b border-zinc-850 flex items-center justify-between gap-4 flex-wrap text-xs shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Element Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-medium">🏷 Элемент:</span>
              <select
                value={selectedNodeId}
                onChange={e => setSelectedNodeId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 font-bold text-blue-400 text-xs focus:outline-none"
              >
                {Object.values(nodes).map(n => (
                  <option key={n.id} value={n.id}>
                    {n.properties.name} ({n.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Event Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-medium">⚡️ Событие:</span>
              <select
                value={selectedEvent}
                onChange={e => setSelectedEvent(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 font-bold text-amber-400 text-xs focus:outline-none font-mono"
              >
                {availableEvents.map(evt => (
                  <option key={evt} value={evt}>
                    При {evt === 'Click' ? 'нажатии (Click)' : evt === 'Load' ? 'запуске (Load)' : evt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle View Mode: Flow vs C# Code */}
          <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setShowCodePreview(false)}
              className={`px-2.5 py-1 rounded-md transition ${
                !showCodePreview
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Визуальная цепочка
            </button>
            <button
              type="button"
              onClick={() => setShowCodePreview(true)}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                showCodePreview
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>C# Код</span>
            </button>
          </div>
        </div>

        {/* 3. MAIN WORKSPACE CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 relative bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950">
          {!showCodePreview ? (
            <div className="max-w-2xl mx-auto space-y-3">
              {/* TRIGGER CARD */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-zinc-900 border border-blue-500/40 shadow-lg text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 font-bold block">
                      ТРИГГЕР ЗАПУСКА:
                    </span>
                    <span className="font-bold text-sm text-zinc-100 block">
                      {currentNode?.properties.name} ➔ Событие {selectedEvent}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono text-[10px] font-semibold border border-blue-500/20">
                  Когда происходит?
                </span>
              </div>

              {/* ACTION STEPS LIST WITH ARROWS */}
              {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  {/* Connector Arrow */}
                  <div className="flex items-center justify-center py-0.5">
                    <ArrowDown className="w-4 h-4 text-zinc-500 animate-bounce" />
                  </div>
                  {renderStepCard(step, idx)}
                </React.Fragment>
              ))}

              {/* EMPTY STATE */}
              {steps.length === 0 && (
                <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800 space-y-3">
                  <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div>
                    <h4 className="font-bold text-sm text-zinc-300">Цепочка действий пуста</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Добавьте первое действие из каталога 100 экшенов для этого триггера
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTargetBranch(null);
                      setCatalogDrawerOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    ➕ Добавить действие
                  </button>
                </div>
              )}

              {/* Bottom Add Action Button */}
              {steps.length > 0 && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTargetBranch(null);
                      setCatalogDrawerOpen(true);
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer border border-zinc-700 shadow-md inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-blue-400" />
                    <span>Добавить действие в цепочку</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* C# CODE PREVIEW */
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono">Сгенерированный C# обработчик событий:</span>
                <span className="text-[10px] text-emerald-400">● 100% валидный C# без ручного ввода</span>
              </div>
              <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed shadow-inner">
                <code>
{`// --- ⚡️ DEV-OS Визуальная цепочка действий (No-Code Flow) ---
private void ${currentNode?.properties.name || 'Control'}_${selectedEvent}(object sender, EventArgs e)
{
${compiledCSharp}
}`}
                </code>
              </pre>
            </div>
          )}
        </div>

        {/* 4. MODAL BOTTOM FOOTER */}
        <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAddingTargetBranch(null);
                setCatalogDrawerOpen(true);
              }}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer border border-zinc-700 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Каталог 100 экшенов</span>
            </button>

            <button
              type="button"
              onClick={handleTestLogic}
              className="px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>🧪 Протестировать логику</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleApplyFlow}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>💾 Применить (Без кода)</span>
            </button>
          </div>
        </div>

        {/* 5. DRAWER / MODAL: CATALOG OF 100 ACTIONS */}
        {catalogDrawerOpen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col animate-in fade-in duration-100">
            {/* Catalog Header */}
            <div className="px-5 py-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white font-mono">
                  КАТАЛОГ 100 ГОТОВЫХ ДЕЙСТВИЙ (10 КАТЕГОРИЙ)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCatalogDrawerOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Catalog Search & Category Filters */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Поиск по 100 экшенам (например: 'открыть форму', 'база данных', 'таймер', 'ЕСЛИ')..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 10 Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
                <button
                  type="button"
                  onClick={() => setCatalogCategory('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer whitespace-nowrap ${
                    catalogCategory === 'all'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  Все (100)
                </button>
                {ACTION_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCatalogCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      catalogCategory === cat.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.title} ({cat.range})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Cards Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredActions.map(act => {
                const catMeta = ACTION_CATEGORIES.find(c => c.id === act.category);

                return (
                  <div
                    key={act.id}
                    onClick={() => handleSelectActionFromCatalog(act)}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 hover:border-blue-500/80 transition cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold font-mono text-white"
                          style={{ backgroundColor: catMeta?.color || '#3b82f6' }}
                        >
                          Экшен #{act.num}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {catMeta?.emoji}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-zinc-100 group-hover:text-blue-400 transition">
                        {act.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {act.description}
                      </p>
                    </div>

                    <div className="pt-3 flex items-center justify-between text-[10px] font-mono text-blue-400 font-semibold border-t border-zinc-900 mt-2">
                      <span>Выбрать экшен</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Test Success Toast */}
        {testSuccessToast && (
          <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 text-xs animate-in slide-in-from-bottom-5 duration-150">
            <span>{testSuccessToast}</span>
          </div>
        )}
      </div>
    </div>
  );
};
