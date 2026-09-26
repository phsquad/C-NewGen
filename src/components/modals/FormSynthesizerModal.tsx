import React, { useState, useEffect } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  OfflineFormSynthesizer,
  FormFieldBlueprint,
  SynthesizerConfig,
} from '../../utils/OfflineFormSynthesizer';
import {
  Wand2,
  X,
  Plus,
  Trash2,
  Sparkles,
  Lock,
  FileSpreadsheet,
  Calculator,
  Database,
  Type,
  Key,
  List,
  CheckSquare,
  Calendar,
  Square,
  Sliders,
  Check,
  Zap,
  Grid,
} from 'lucide-react';

interface FormSynthesizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS: {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FormFieldBlueprint[];
}[] = [
  {
    id: 'auth',
    name: '🔐 Авторизация',
    icon: Lock,
    fields: [
      { id: '1', label: 'Логин / Email', type: 'TextBox', defaultValue: 'admin@system.local' },
      { id: '2', label: 'Пароль', type: 'PasswordBox', defaultValue: '123456' },
      { id: '3', label: 'Запомнить меня', type: 'CheckBox', defaultValue: 'true' },
      { id: '4', label: 'Войти в систему', type: 'Button' },
      { id: '5', label: 'Отмена', type: 'Button' },
    ],
  },
  {
    id: 'registration',
    name: '📋 Анкета / Регистрация',
    icon: FileSpreadsheet,
    fields: [
      { id: '1', label: 'ФИО Студента', type: 'TextBox' },
      { id: '2', label: 'Группа', type: 'ComboBox', defaultValue: 'ИВТ-401', options: ['ИВТ-401', 'ПИН-302', 'ИБ-201'] },
      { id: '3', label: 'Электронная почта', type: 'TextBox', defaultValue: 'student@university.edu' },
      { id: '4', label: 'Дата рождения', type: 'DatePicker' },
      { id: '5', label: 'Сдал зачет', type: 'CheckBox', defaultValue: 'true' },
      { id: '6', label: 'Сохранить анкету', type: 'Button' },
      { id: '7', label: 'Сбросить', type: 'Button' },
    ],
  },
  {
    id: 'calc',
    name: '🔢 Калькулятор 4×4',
    icon: Calculator,
    fields: [
      { id: '1', label: 'Число A', type: 'TextBox', defaultValue: '128' },
      { id: '2', label: 'Число B', type: 'TextBox', defaultValue: '64' },
      { id: '3', label: 'Операция', type: 'ComboBox', defaultValue: 'Сложение (+)', options: ['Сложение (+)', 'Вычитание (-)', 'Умножение (*)', 'Деление (/)'] },
      { id: '4', label: 'Результат', type: 'TextBox', defaultValue: '192' },
      { id: '5', label: 'Вычислить', type: 'Button' },
      { id: '6', label: 'Очистить', type: 'Button' },
    ],
  },
  {
    id: 'crud',
    name: '📊 CRUD БД',
    icon: Database,
    fields: [
      { id: '1', label: 'Наименование товара', type: 'TextBox', defaultValue: 'Ноутбук Dell XPS' },
      { id: '2', label: 'Категория', type: 'ComboBox', defaultValue: 'Электроника', options: ['Электроника', 'Комплектующие', 'Оргтехника'] },
      { id: '3', label: 'Стоимость (руб)', type: 'TextBox', defaultValue: '145000' },
      { id: '4', label: 'В наличии на складе', type: 'CheckBox', defaultValue: 'true' },
      { id: '5', label: 'Добавить в базу', type: 'Button' },
      { id: '6', label: 'Удалить запись', type: 'Button' },
    ],
  },
];

export const FormSynthesizerModal: React.FC<FormSynthesizerModalProps> = ({ isOpen, onClose }) => {
  const { project, activeFormId, setProjectState } = useDesigner();

  const [activeTab, setActiveTab] = useState<'fields' | 'matrix'>('fields');
  const [selectedPreset, setSelectedPreset] = useState<string>('auth');
  const [fields, setFields] = useState<FormFieldBlueprint[]>(PRESETS[0].fields);
  const [dslInput, setDslInput] = useState<string>(
    'Логин:str, Пароль:pass, Запомнить:chk, Войти:btn, Отмена:btn'
  );
  const [columns, setColumns] = useState<1 | 2>(1);
  const [rowGap, setRowGap] = useState<number>(12);
  const [fieldWidth, setFieldWidth] = useState<number>(240);
  const [labelWidth, setLabelWidth] = useState<number>(110);
  const [generationTimeMs, setGenerationTimeMs] = useState<number>(0.002);

  // Matrix Grid State
  const [matrixRows, setMatrixRows] = useState<number>(4);
  const [matrixCols, setMatrixCols] = useState<number>(4);
  const [matrixPreset, setMatrixPreset] = useState<'calc4x4' | 'tictactoe3x3' | 'numpad4x3' | 'custom'>('calc4x4');
  const [matrixLabels, setMatrixLabels] = useState<string[][]>([
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['C', '0', '=', '+'],
  ]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setFields(preset.fields);
      const dsl = preset.fields
        .map(f => {
          let code = 'str';
          if (f.type === 'PasswordBox') code = 'pass';
          if (f.type === 'ComboBox') code = 'list';
          if (f.type === 'CheckBox') code = 'chk';
          if (f.type === 'DatePicker') code = 'date';
          if (f.type === 'Button') code = 'btn';
          return `${f.label}:${code}`;
        })
        .join(', ');
      setDslInput(dsl);
    }
  };

  const handleDslChange = (value: string) => {
    setDslInput(value);
    const parsed = OfflineFormSynthesizer.parseQuickDsl(value);
    if (parsed.length > 0) {
      setFields(parsed);
    }
  };

  const handleDslKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSynthesizeAndDeploy();
    }
  };

  const handleMatrixPresetChange = (preset: 'calc4x4' | 'tictactoe3x3' | 'numpad4x3') => {
    setMatrixPreset(preset);
    if (preset === 'calc4x4') {
      setMatrixRows(4);
      setMatrixCols(4);
      setMatrixLabels([
        ['7', '8', '9', '/'],
        ['4', '5', '6', '*'],
        ['1', '2', '3', '-'],
        ['C', '0', '=', '+'],
      ]);
    } else if (preset === 'tictactoe3x3') {
      setMatrixRows(3);
      setMatrixCols(3);
      setMatrixLabels([
        [' ', ' ', ' '],
        [' ', ' ', ' '],
        [' ', ' ', ' '],
      ]);
    } else if (preset === 'numpad4x3') {
      setMatrixRows(4);
      setMatrixCols(3);
      setMatrixLabels([
        ['7', '8', '9'],
        ['4', '5', '6'],
        ['1', '2', '3'],
        ['C', '0', '='],
      ]);
    }
  };

  const handleAddField = () => {
    const newField: FormFieldBlueprint = {
      id: `field_${Date.now()}`,
      label: `Поле ${fields.length + 1}`,
      type: 'TextBox',
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleUpdateField = (id: string, updates: Partial<FormFieldBlueprint>) => {
    setFields(fields.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleSynthesizeAndDeploy = () => {
    const startTime = performance.now();
    const targetParentId = activeFormId || project.rootFormId;

    let newNodes: Record<string, any> = {};
    let addedIds: string[] = [];

    if (activeTab === 'fields') {
      const config: SynthesizerConfig = {
        startX: 24,
        startY: 24,
        fieldWidth,
        labelWidth,
        rowGap,
        columns,
        targetParentId,
      };
      const res = OfflineFormSynthesizer.synthesizeForm(fields, config);
      newNodes = res.newNodes;
      addedIds = res.addedIds;
    } else {
      // Matrix Grid Mode
      const res = OfflineFormSynthesizer.synthesizeMatrixGrid(matrixRows, matrixCols, {
        startX: 24,
        startY: 24,
        cellWidth: 60,
        cellHeight: 48,
        gap: 8,
        labelsMatrix: matrixLabels,
        targetParentId,
      });
      newNodes = res.newNodes;
      addedIds = res.addedIds;
    }

    // Merge generated nodes into current project state
    const currentProject = JSON.parse(JSON.stringify(project));
    const parentNode = currentProject.nodes[targetParentId];

    if (parentNode) {
      if (!parentNode.childrenIds) parentNode.childrenIds = [];
      parentNode.childrenIds.push(...addedIds);
    }

    Object.assign(currentProject.nodes, newNodes);

    setProjectState(currentProject);

    const elapsed = (performance.now() - startTime).toFixed(3);
    setGenerationTimeMs(parseFloat(elapsed) || 0.002);

    onClose();
  };

  const nodeCountPreview = activeTab === 'fields'
    ? fields.reduce((acc, f) => (f.type === 'CheckBox' || f.type === 'Button' ? acc + 1 : acc + 2), 0)
    : matrixRows * matrixCols;

  return (
    <div className="fixed inset-0 z-[99999] modal-overlay bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50 duration-150">
      <div className="relative z-[100000] modal-card bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col text-zinc-100 ring-1 ring-white/10 max-h-[90vh]">
        {/* Header */}
        <div className="bg-zinc-850 px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md text-white">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                АВТОНОМНЫЙ СИНТЕЗАТОР ФОРМ
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-mono">
                  100% OFFLINE
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Параметрическая генерация полей & Матричных сеток N×M
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-5 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`px-4 py-2 font-semibold rounded-t-lg border-t border-x transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'fields'
                ? 'bg-zinc-900 border-zinc-700 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>📝 Формы и Конструктор полей</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 font-semibold rounded-t-lg border-t border-x transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-zinc-900 border-zinc-700 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>🔢 Матричная сетка N×M (Калькулятор)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'fields' ? (
            <>
              {/* Section 1: Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  📂 Готовые шаблоны диалогов (Пресеты):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESETS.map(preset => {
                    const Icon = preset.icon;
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium ring-1 ring-indigo-500/50'
                            : 'bg-zinc-800/60 border-zinc-700/80 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-zinc-400'}`} />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Quick DSL with Enter Key support */}
              <div className="space-y-1.5 bg-zinc-800/40 p-3 rounded-lg border border-zinc-700/60">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Быстрый ввод одной строкой (Quick DSL — нажми Enter для сборки):
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Имя:тип (str, pass, list, chk, date, btn)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={dslInput}
                    onChange={e => handleDslChange(e.target.value)}
                    onKeyDown={handleDslKeyDown}
                    placeholder="ФИО:str, Группа:list, Сдал:chk, Войти:btn, Отмена:btn"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSynthesizeAndDeploy}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded shadow-xs cursor-pointer shrink-0"
                  >
                    Enter ↵
                  </button>
                </div>
              </div>

              {/* Section 3: Interactive Field Constructor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    ✍️ Конструктор полей ({fields.length} полей, {nodeCountPreview} узлов AST):
                  </label>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    Добавить поле
                  </button>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700 p-2 rounded-lg"
                    >
                      <span className="text-[11px] font-mono text-zinc-500 w-5 shrink-0 text-center">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={field.label}
                        onChange={e => handleUpdateField(field.id, { label: e.target.value })}
                        placeholder="Название поля"
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-zinc-100 font-medium focus:outline-hidden focus:border-indigo-500"
                      />
                      <select
                        value={field.type}
                        onChange={e => handleUpdateField(field.id, { type: e.target.value as any })}
                        className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-300 font-sans focus:outline-hidden focus:border-indigo-500 shrink-0"
                      >
                        <option value="TextBox">📝 TextBox</option>
                        <option value="PasswordBox">🔑 PasswordBox</option>
                        <option value="ComboBox">📋 ComboBox</option>
                        <option value="CheckBox">☑️ CheckBox</option>
                        <option value="DatePicker">📅 DatePicker</option>
                        <option value="Button">🔘 Button</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50 rounded transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Layout Settings */}
              <div className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-400 font-medium block mb-1">Колонки:</label>
                  <select
                    value={columns}
                    onChange={e => setColumns(Number(e.target.value) as 1 | 2)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200"
                  >
                    <option value={1}>1 Колонка</option>
                    <option value={2}>2 Колонки</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-medium block mb-1">Отступ (RowGap):</label>
                  <input
                    type="number"
                    value={rowGap}
                    onChange={e => setRowGap(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-medium block mb-1">Ширина инпутов:</label>
                  <input
                    type="number"
                    value={fieldWidth}
                    onChange={e => setFieldWidth(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-medium block mb-1">Ширина меток:</label>
                  <input
                    type="number"
                    value={labelWidth}
                    onChange={e => setLabelWidth(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200 font-mono"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Matrix Grid Generator Mode (Правка 13.3) */
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  🎯 Пресеты макетов сетки N×M:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleMatrixPresetChange('calc4x4')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                      matrixPreset === 'calc4x4'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div>🔢 Калькулятор 4×4</div>
                      <div className="text-[10px] text-zinc-500">16 кнопок (7,8,9,/,C,+,=...)</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatrixPresetChange('tictactoe3x3')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                      matrixPreset === 'tictactoe3x3'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                    }`}
                  >
                    <Grid className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div>❌⭕ Крестики-Нолики 3×3</div>
                      <div className="text-[10px] text-zinc-500">Сетка 9 ячеек игрового поля</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMatrixPresetChange('numpad4x3')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                      matrixPreset === 'numpad4x3'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                    }`}
                  >
                    <Square className="w-4 h-4 text-amber-400" />
                    <div>
                      <div>📱 Numpad 4×3</div>
                      <div className="text-[10px] text-zinc-500">12 кнопок цифрового ввода</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Grid dimensions inputs */}
              <div className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-700/60 flex items-center gap-4 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Строк (N):</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={matrixRows}
                    onChange={e => setMatrixRows(Number(e.target.value))}
                    className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-mono text-center"
                  />
                </div>
                <span className="text-zinc-500 text-lg">×</span>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Колонок (M):</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={matrixCols}
                    onChange={e => setMatrixCols(Number(e.target.value))}
                    className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-mono text-center"
                  />
                </div>
                <div className="flex-1 text-right text-zinc-400">
                  Будет создано кнопок: <strong className="text-indigo-400 font-mono text-sm">{matrixRows * matrixCols} шт.</strong>
                  <div className="text-[10px] text-zinc-500">C# имена: btn_0_0 ... btn_{matrixRows - 1}_{matrixCols - 1} | TabIndex: 0..{matrixRows * matrixCols - 1}</div>
                </div>
              </div>

              {/* Visual Matrix Grid Live Preview */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col items-center justify-center">
                <div className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">
                  Интерактивный предпросмотр матрицы кнопок:
                </div>
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${matrixCols}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: matrixRows }).map((_, r) =>
                    Array.from({ length: matrixCols }).map((_, c) => {
                      const text = matrixLabels?.[r]?.[c] ?? `${r},${c}`;
                      return (
                        <div
                          key={`${r}_${c}`}
                          className="w-14 h-11 bg-zinc-800 border border-zinc-700 hover:border-indigo-500 rounded-lg flex flex-col items-center justify-center p-1 text-xs font-bold text-white shadow-xs font-mono"
                        >
                          <span>{text}</span>
                          <span className="text-[8px] text-zinc-500 font-sans">btn_{r}_{c}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Status & Actions */}
        <div className="bg-zinc-850 px-5 py-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Синтезировано: <strong className="text-indigo-300">{nodeCountPreview} узлов</strong></span>
            <span>|</span>
            <span>Память: <strong className="text-emerald-400">0 КБ внешних запросов</strong></span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-medium cursor-pointer transition-colors"
            >
              ❌ Отмена
            </button>
            <button
              type="button"
              onClick={handleSynthesizeAndDeploy}
              className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              🚀 РАЗВЕРНУТЬ НА ХОЛСТЕ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
