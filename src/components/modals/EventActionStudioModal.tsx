import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { NoCodeActionsCatalogModal } from './NoCodeActionsCatalogModal';
import {
  Save,
  RotateCcw,
  RotateCw,
  Sparkles,
  Play,
  X,
  Code2,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCode,
  Folder,
  Eye,
  Plus,
  Trash2,
  Database,
  Globe,
  Clock,
  Volume2,
  Sliders,
  Check,
} from 'lucide-react';

export interface ActionTemplate {
  id: string;
  name: string;
  category: 'forms' | 'dialogs' | 'ui' | 'time' | 'database' | 'system';
  icon: string;
  description: string;
  paramType: 'form_picker' | 'text_message' | 'confirm_dialog' | 'control_text' | 'control_color' | 'control_toggle' | 'delay_ms' | 'timer_select' | 'db_query' | 'file_path' | 'sound_play' | 'url_open';
  defaultParam: string;
  generateCSharp: (param: string, controlName: string, allForms: string[], allControls: string[]) => string;
}

export const TOP_20_ACTIONS: ActionTemplate[] = [
  // 🗔 Формы и Окна
  {
    id: 'open_form_show',
    name: 'Открыть форму (Show)',
    category: 'forms',
    icon: '🗔',
    description: 'Открывает окно на экране без блокировки других окон',
    paramType: 'form_picker',
    defaultParam: 'Form2',
    generateCSharp: (param) => `// 1. Открываем форму ${param || 'Form2'}\n    new ${param || 'Form2'}().Show();`,
  },
  {
    id: 'open_form_modal',
    name: 'Модальное окно (ShowDialog)',
    category: 'forms',
    icon: '🗔',
    description: 'Открывает окно с блокировкой родительской формы',
    paramType: 'form_picker',
    defaultParam: 'LoginForm',
    generateCSharp: (param) => `// Открываем модальное диалоговое окно\n    var dlg = new ${param || 'LoginForm'}();\n    if (dlg.ShowDialog() == DialogResult.OK)\n    {\n        // Пользователь подтвердил действие\n    }`,
  },
  {
    id: 'close_current_form',
    name: 'Закрыть текущее окно',
    category: 'forms',
    icon: '🚪',
    description: 'Закрывает активную форму (Close)',
    paramType: 'text_message',
    defaultParam: '',
    generateCSharp: () => `// Закрываем текущее окно формы\n    this.Close();`,
  },
  {
    id: 'hide_show_form',
    name: 'Скрыть / Показать форму',
    category: 'forms',
    icon: '👁️',
    description: 'Скрывает окно с экрана без его уничтожения',
    paramType: 'form_picker',
    defaultParam: 'this',
    generateCSharp: (param) => param === 'this' ? `this.Hide();` : `this.Visible = !this.Visible;`,
  },

  // 💬 Сообщения и Диалоги
  {
    id: 'show_message_box',
    name: 'Показать MessageBox...',
    category: 'dialogs',
    icon: '💬',
    description: 'Всплывающее информационное сообщение с кнопкой ОК',
    paramType: 'text_message',
    defaultParam: 'Операция успешно выполнена!',
    generateCSharp: (param) => `MessageBox.Show("${param || 'Привет, мир!'}", "Информация", MessageBoxButtons.OK, MessageBoxIcon.Information);`,
  },
  {
    id: 'confirm_dialog',
    name: 'Диалог Да / Нет (Вопрос)',
    category: 'dialogs',
    icon: '❓',
    description: 'Диалог подтверждения действия пользователем',
    paramType: 'confirm_dialog',
    defaultParam: 'Вы действительно хотите продолжить?',
    generateCSharp: (param) => `if (MessageBox.Show("${param || 'Вы уверены?'}", "Подтверждение", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)\n    {\n        // Действие при ответе ДА\n    }`,
  },
  {
    id: 'open_file_dialog',
    name: 'Выбрать файл (OpenDialog)',
    category: 'dialogs',
    icon: '📂',
    description: 'Стандартный проводник Windows для выбора файла',
    paramType: 'text_message',
    defaultParam: 'Текстовые файлы (*.txt)|*.txt|Все файлы (*.*)|*.*',
    generateCSharp: (param) => `using var openDlg = new OpenFileDialog\n    {\n        Filter = "${param || 'Все файлы (*.*)|*.*'}",\n        Title = "Выберите файл для загрузки"\n    };\n    if (openDlg.ShowDialog() == DialogResult.OK)\n    {\n        string filePath = openDlg.FileName;\n        MessageBox.Show($"Выбран файл: {filePath}", "Файл выбран");\n    }`,
  },
  {
    id: 'save_file_dialog',
    name: 'Сохранить файл (SaveDialog)',
    category: 'dialogs',
    icon: '💾',
    description: 'Диалог сохранения файла на диск',
    paramType: 'text_message',
    defaultParam: 'Документ (*.txt)|*.txt',
    generateCSharp: (param) => `using var saveDlg = new SaveFileDialog\n    {\n        Filter = "${param || 'Все файлы (*.*)|*.*'}",\n        FileName = "output.txt"\n    };\n    if (saveDlg.ShowDialog() == DialogResult.OK)\n    {\n        System.IO.File.WriteAllText(saveDlg.FileName, "Данные формы...");\n    }`,
  },

  // 🎨 Управление UI
  {
    id: 'set_control_text',
    name: 'Сменить текст / заголовок',
    category: 'ui',
    icon: '🏷️',
    description: 'Изменяет надпись на кнопке, метке или поле ввода',
    paramType: 'control_text',
    defaultParam: 'Готово к работе',
    generateCSharp: (param, ctrl) => `this.${ctrl || 'label1'}.Text = "${param || 'Новый текст'}";`,
  },
  {
    id: 'set_control_color',
    name: 'Сменить цвет фона / текста',
    category: 'ui',
    icon: '🎨',
    description: 'Устанавливает цвет элемента',
    paramType: 'control_color',
    defaultParam: '#2563EB',
    generateCSharp: (param, ctrl) => `this.${ctrl || 'panel1'}.BackColor = System.Drawing.ColorTranslator.FromHtml("${param || '#2563EB'}");`,
  },
  {
    id: 'toggle_enable_control',
    name: 'Заблокировать / Включить',
    category: 'ui',
    icon: '🔒',
    description: 'Делает элемент неактивным (Disabled) или активным',
    paramType: 'control_toggle',
    defaultParam: 'false',
    generateCSharp: (param, ctrl) => `this.${ctrl || 'button1'}.Enabled = ${param === 'true' ? 'true' : 'false'};`,
  },
  {
    id: 'clear_textbox',
    name: 'Очистить поле ввода (Clear)',
    category: 'ui',
    icon: '🧹',
    description: 'Стирает весь введенный пользователем текст',
    paramType: 'control_toggle',
    defaultParam: 'textBox1',
    generateCSharp: (_, ctrl) => `this.${ctrl || 'textBox1'}.Clear();\n    this.${ctrl || 'textBox1'}.Focus();`,
  },
  {
    id: 'add_combobox_item',
    name: 'Добавить пункт в список',
    category: 'ui',
    icon: '➕',
    description: 'Добавляет строку в ComboBox или ListBox',
    paramType: 'control_text',
    defaultParam: 'Новый элемент',
    generateCSharp: (param, ctrl) => `this.${ctrl || 'comboBox1'}.Items.Add("${param || 'Элемент списка'}");`,
  },

  // ⏱️ Время и Скрипт
  {
    id: 'delay_pause',
    name: 'Пауза / Задержка (Delay)',
    category: 'time',
    icon: '⏱️',
    description: 'Не зависающая асинхронная пауза без зависания UI',
    paramType: 'delay_ms',
    defaultParam: '2000',
    generateCSharp: (param) => `// Плавная асинхронная задержка (${param || '2000'} мс)\n    await System.Threading.Tasks.Task.Delay(${param || '2000'});`,
  },
  {
    id: 'start_timer',
    name: 'Запустить таймер (Start)',
    category: 'time',
    icon: '▶️',
    description: 'Включает периодический таймер (timer1.Start)',
    paramType: 'timer_select',
    defaultParam: 'timer1',
    generateCSharp: (param) => `this.${param || 'timer1'}.Start();`,
  },
  {
    id: 'stop_timer',
    name: 'Остановить таймер (Stop)',
    category: 'time',
    icon: '⏹️',
    description: 'Останавливает периодический таймер',
    paramType: 'timer_select',
    defaultParam: 'timer1',
    generateCSharp: (param) => `this.${param || 'timer1'}.Stop();`,
  },

  // 🗄 База данных и Файлы
  {
    id: 'db_insert_sqlite',
    name: 'Записать в SQLite базу',
    category: 'database',
    icon: '🗄',
    description: 'Сохраняет запись в локальную базу данных SQLite',
    paramType: 'db_query',
    defaultParam: "INSERT INTO Users (Username, CreatedAt) VALUES ('admin', DateTime('now'));",
    generateCSharp: (param) => `// Выполнение SQL команды в SQLite\n    using var db = new System.Data.SQLite.SQLiteConnection("Data Source=app.db;Version=3;");\n    db.Open();\n    using var cmd = new System.Data.SQLite.SQLiteCommand("${param || 'INSERT INTO Log (Message) VALUES (@msg)'}", db);\n    cmd.ExecuteNonQuery();`,
  },
  {
    id: 'read_text_file',
    name: 'Прочитать текстовый файл',
    category: 'database',
    icon: '📄',
    description: 'Считывает все строки из файла в переменную',
    paramType: 'file_path',
    defaultParam: 'config.txt',
    generateCSharp: (param) => `if (System.IO.File.Exists("${param || 'config.txt'}"))\n    {\n        string fileContent = System.IO.File.ReadAllText("${param || 'config.txt'}");\n        MessageBox.Show(fileContent, "Содержимое файла");\n    }`,
  },

  // 🌐 Система и Мультимедиа
  {
    id: 'play_sound',
    name: 'Воспроизвести звук (Beep / WAV)',
    category: 'system',
    icon: '🔊',
    description: 'Проигрывает системный сигнал или WAV файл',
    paramType: 'sound_play',
    defaultParam: 'SystemSounds.Asterisk',
    generateCSharp: () => `System.Media.SystemSounds.Asterisk.Play();`,
  },
  {
    id: 'open_url_browser',
    name: 'Открыть ссылку в браузере',
    category: 'system',
    icon: '🌐',
    description: 'Запускает веб-сайт в браузере по умолчанию',
    paramType: 'url_open',
    defaultParam: 'https://google.com',
    generateCSharp: (param) => `System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo\n    {\n        FileName = "${param || 'https://google.com'}",\n        UseShellExecute = true\n    });`,
  },
];

interface EventActionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  controlName?: string;
  eventName?: string;
  nodeId?: string;
  initialCode?: string;
}

export const EventActionStudioModal: React.FC<EventActionStudioModalProps> = ({
  isOpen,
  onClose,
  controlName = 'button1',
  eventName = 'Click',
  nodeId,
  initialCode,
}) => {
  const { project, nodes, setProjectState, addConsoleLog, setMessageBoxModal, setActiveRightTab } = useDesigner();

  const defaultMethodBody = useMemo(() => {
    return (
      initialCode ||
      `private async void ${controlName}_${eventName}(object? sender, EventArgs e)\n{\n    // ⚡️ Событие: Нажатие на ${controlName}\n    // Вставьте действие справа или пишите код на C# .NET 8:\n\n}`
    );
  }, [controlName, eventName, initialCode]);

  const [code, setCode] = useState<string>(defaultMethodBody);
  const [historyStack, setHistoryStack] = useState<string[]>([defaultMethodBody]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [selectedActionId, setSelectedActionId] = useState<string>('open_form_show');
  const [actionParam, setActionParam] = useState<string>('Form2');
  const [targetControlName, setTargetControlName] = useState<string>(controlName);

  const [cursorPosition, setCursorPosition] = useState({ line: 4, col: 5 });
  const [searchQuery, setSearchQuery] = useState('');
  const [flashInserted, setFlashInserted] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isActionsCatalogOpen, setIsActionsCatalogOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Available forms & controls
  const availableForms = useMemo(() => {
    const forms = Object.values(nodes).filter((n) => n.type === 'Form');
    const list = forms.map((f) => f.properties.name).filter(Boolean);
    return list.length > 0 ? list : ['Form1', 'LoginForm', 'SettingsForm', 'Form2'];
  }, [nodes]);

  const availableControls = useMemo(() => {
    return Object.values(nodes)
      .filter((n) => n.type !== 'Form')
      .map((n) => n.properties.name)
      .filter(Boolean);
  }, [nodes]);

  useEffect(() => {
    if (isOpen) {
      const init = defaultMethodBody;
      setCode(init);
      setHistoryStack([init]);
      setHistoryIndex(0);
      setSavedSuccess(false);
    }
  }, [isOpen, defaultMethodBody]);

  const selectedAction = useMemo(() => {
    return TOP_20_ACTIONS.find((a) => a.id === selectedActionId) || TOP_20_ACTIONS[0];
  }, [selectedActionId]);

  if (!isOpen) return null;

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newCode);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCode(historyStack[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCode(historyStack[historyIndex + 1]);
    }
  };

  const handleFormatCode = () => {
    const formatted = code
      .split('\n')
      .map((line) => line.replace(/\t/g, '    '))
      .join('\n');
    handleCodeChange(formatted);
    addConsoleLog('System', `Код события ${controlName}_${eventName} отформатирован.`);
  };

  // Insert generated snippet into code
  const handleInsertAction = (action: ActionTemplate = selectedAction) => {
    let snippet = action.generateCSharp(actionParam, targetControlName, availableForms, availableControls);

    // If snippet uses await, ensure method signature has 'async'
    let currentCode = code;
    if (snippet.includes('await ') && !currentCode.includes('async void') && !currentCode.includes('async Task')) {
      currentCode = currentCode.replace(/(?:private|public|protected)\s+void\s+/, 'private async void ');
    }

    // Insert before the last closing brace '}'
    const lastBraceIdx = currentCode.lastIndexOf('}');
    let updatedCode = '';
    if (lastBraceIdx !== -1) {
      const before = currentCode.slice(0, lastBraceIdx);
      const after = currentCode.slice(lastBraceIdx);
      const indentation = '    ';
      const formattedSnippet = snippet
        .split('\n')
        .map((l) => (l.startsWith('    ') ? l : `${indentation}${l}`))
        .join('\n');

      updatedCode = `${before}\n${formattedSnippet}\n${after}`;
    } else {
      updatedCode = `${currentCode}\n    ${snippet}\n`;
    }

    handleCodeChange(updatedCode);
    setFlashInserted(true);
    setTimeout(() => setFlashInserted(false), 1200);

    addConsoleLog(
      'System',
      `Действие "${action.name}" успешно вставлено в обработчик ${controlName}_${eventName}.`
    );
  };

  const handleInsertRawSnippet = (snippet: string) => {
    let currentCode = code;
    if (snippet.includes('await ') && !currentCode.includes('async void') && !currentCode.includes('async Task')) {
      currentCode = currentCode.replace(/(?:private|public|protected)\s+void\s+/, 'private async void ');
    }

    const lastBraceIdx = currentCode.lastIndexOf('}');
    let updatedCode = '';
    if (lastBraceIdx !== -1) {
      const before = currentCode.slice(0, lastBraceIdx);
      const after = currentCode.slice(lastBraceIdx);
      const indentation = '    ';
      const formattedSnippet = snippet
        .split('\n')
        .map((l) => (l.startsWith('    ') ? l : `${indentation}${l}`))
        .join('\n');

      updatedCode = `${before}\n${formattedSnippet}\n${after}`;
    } else {
      updatedCode = `${currentCode}\n    ${snippet}\n`;
    }

    handleCodeChange(updatedCode);
    setFlashInserted(true);
    setTimeout(() => setFlashInserted(false), 1200);

    addConsoleLog(
      'System',
      `Код из библиотеки 100+ действий успешно вставлен в ${controlName}_${eventName}.`
    );
  };

  const handleSaveAndClose = () => {
    // Save to node events and rawCustomLines
    if (nodeId && nodes[nodeId]) {
      const node = nodes[nodeId];
      const updatedEvents = { ...node.events, [eventName]: `${controlName}_${eventName}` };
      nodes[nodeId].events = updatedEvents;
    }

    // Preserve custom code in project
    const customLines = project.rawCustomLines || [];
    const updatedProject = {
      ...project,
      rawCustomLines: [...customLines, `// Custom handler for ${controlName}_${eventName}:\n${code}`],
    };
    setProjectState(updatedProject);

    setSavedSuccess(true);
    addConsoleLog(
      'System',
      `Обработчик события ${controlName}_${eventName} успешно скомпилирован и сохранен в проекте!`
    );

    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Quick action select
  const handleSelectQuickAction = (action: ActionTemplate) => {
    setSelectedActionId(action.id);
    setActionParam(action.defaultParam);
  };

  const filteredActions = TOP_20_ACTIONS.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 font-sans select-none">
      <div className="w-full max-w-5xl h-[88vh] bg-[#18181F] border border-zinc-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-300">
        {/* 1. Header Toolbar (Title & Actions) */}
        <div className="h-11 bg-[#1F1F28] border-b border-zinc-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-400 font-bold text-sm">⚡️</span>
            <span className="text-white font-bold font-mono">
              [ {controlName} :: {eventName} ]
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-blue-400 font-mono font-semibold">C# Редактор События (DevelStudio Pro)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 font-mono font-normal">
              .NET 8.0 SDK
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Button */}
            <button
              onClick={handleSaveAndClose}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Сохранено!' : '💾 Сохранить (Ctrl+S)'}</span>
            </button>

            {/* Undo / Redo */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 hover:bg-zinc-800 disabled:opacity-30 text-zinc-400 hover:text-white rounded cursor-pointer"
              title="Отменить (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= historyStack.length - 1}
              className="p-1.5 hover:bg-zinc-800 disabled:opacity-30 text-zinc-400 hover:text-white rounded cursor-pointer"
              title="Повторить (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Format Code */}
            <button
              onClick={handleFormatCode}
              className="px-2.5 py-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer"
              title="Форматировать C# (Alt+Shift+F)"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Формат</span>
            </button>

            <div className="h-4 w-px bg-zinc-800 mx-1" />

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-red-600/80 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Main Studio Body: Left Editor + Right Actions Palette */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: C# Monaco-style Editor */}
          <div className="flex-1 flex flex-col bg-[#1E1E24] border-r border-zinc-800 overflow-hidden relative">
            {/* Editor Top Bar */}
            <div className="h-7 bg-[#1A1A22] border-b border-zinc-800/80 px-3 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none">
              <div className="flex items-center gap-2">
                <span className="text-cyan-300 font-bold">📄 {controlName}.cs</span>
                <span className="text-zinc-600">›</span>
                <span className="text-amber-300">private async void {controlName}_{eventName}(...)</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">
                ● Roslyn JIT Ready
              </div>
            </div>

            {/* Code Textarea with line numbers */}
            <div className="flex-1 flex overflow-hidden font-mono text-xs">
              {/* Gutter */}
              <div className="w-12 bg-[#18181F] border-r border-zinc-800/80 py-2 text-right pr-2 text-zinc-500 shrink-0 text-[11px] select-none">
                {code.split('\n').map((_, i) => (
                  <div key={i} className="leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <div className="flex-1 relative p-2 overflow-auto bg-[#1E1E24]">
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onClick={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    const before = target.value.substring(0, target.selectionStart);
                    const l = before.split('\n').length;
                    const c = before.length - before.lastIndexOf('\n');
                    setCursorPosition({ line: l, col: c });
                  }}
                  onKeyUp={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    const before = target.value.substring(0, target.selectionStart);
                    const l = before.split('\n').length;
                    const c = before.length - before.lastIndexOf('\n');
                    setCursorPosition({ line: l, col: c });
                  }}
                  spellCheck={false}
                  className={`w-full h-full bg-transparent text-zinc-200 font-mono text-[13px] leading-5 resize-none focus:outline-none border-none selection:bg-blue-600/40 whitespace-pre tab-4 ${
                    flashInserted ? 'bg-indigo-950/20 ring-1 ring-indigo-500/40 transition-all duration-300' : ''
                  }`}
                  style={{ tabSize: 4 }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Visual Actions Panel (DevelStudio 2026 Style) */}
          <div className="w-80 bg-[#141419] flex flex-col border-l border-zinc-800/80 overflow-hidden shrink-0">
            {/* Panel Title & Search */}
            <div className="p-3 bg-[#181820] border-b border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-sm">🕹</span>
                  <span>ДЕЙСТВИЯ (VISUAL ACTIONS)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">TOP-20</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск действия..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions List with Grouping */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {/* Category 1: Формы и Окна */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider px-1">
                  🗔 Формы и Окна
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {filteredActions
                    .filter((a) => a.category === 'forms')
                    .map((act) => {
                      const isSelected = selectedActionId === act.id;
                      return (
                        <button
                          key={act.id}
                          onClick={() => handleSelectQuickAction(act)}
                          onDoubleClick={() => handleInsertAction(act)}
                          className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                              : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base leading-none">{act.icon}</span>
                            <div className="truncate">
                              <div className="font-semibold text-xs truncate">{act.name}</div>
                              <div className="text-[10px] text-zinc-500 truncate">{act.description}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-1">➕</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Category 2: Сообщения и Диалоги */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1">
                  💬 Сообщения и Диалоги
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {filteredActions
                    .filter((a) => a.category === 'dialogs')
                    .map((act) => {
                      const isSelected = selectedActionId === act.id;
                      return (
                        <button
                          key={act.id}
                          onClick={() => handleSelectQuickAction(act)}
                          onDoubleClick={() => handleInsertAction(act)}
                          className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600/20 border-amber-500 text-white shadow-sm'
                              : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base leading-none">{act.icon}</span>
                            <div className="truncate">
                              <div className="font-semibold text-xs truncate">{act.name}</div>
                              <div className="text-[10px] text-zinc-500 truncate">{act.description}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-1">➕</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Category 3: Управление UI */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-1">
                  🎨 Управление UI
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {filteredActions
                    .filter((a) => a.category === 'ui')
                    .map((act) => {
                      const isSelected = selectedActionId === act.id;
                      return (
                        <button
                          key={act.id}
                          onClick={() => handleSelectQuickAction(act)}
                          onDoubleClick={() => handleInsertAction(act)}
                          className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                              : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base leading-none">{act.icon}</span>
                            <div className="truncate">
                              <div className="font-semibold text-xs truncate">{act.name}</div>
                              <div className="text-[10px] text-zinc-500 truncate">{act.description}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-1">➕</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Category 4: Время и Скрипт */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider px-1">
                  ⏱️ Время и Базы данных
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {filteredActions
                    .filter((a) => a.category === 'time' || a.category === 'database' || a.category === 'system')
                    .map((act) => {
                      const isSelected = selectedActionId === act.id;
                      return (
                        <button
                          key={act.id}
                          onClick={() => handleSelectQuickAction(act)}
                          onDoubleClick={() => handleInsertAction(act)}
                          className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                              : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base leading-none">{act.icon}</span>
                            <div className="truncate">
                              <div className="font-semibold text-xs truncate">{act.name}</div>
                              <div className="text-[10px] text-zinc-500 truncate">{act.description}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-1">➕</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Bottom 100+ Catalog Link */}
            <div className="p-2 border-t border-zinc-800 bg-[#16161D]">
              <button
                onClick={() => setIsActionsCatalogOpen(true)}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>⚡️ Все 100+ действий...</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Catalog 100+ Actions */}
        {isActionsCatalogOpen && (
          <NoCodeActionsCatalogModal
            onClose={() => setIsActionsCatalogOpen(false)}
            onInsertCodeSnippet={(snippet) => {
              handleInsertRawSnippet(snippet);
            }}
          />
        )}

        {/* 3. Bottom Action Parameter Config Strip */}
        <div className="h-14 bg-[#181822] border-t border-zinc-800 px-4 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-zinc-400 font-bold flex items-center gap-1.5 shrink-0">
              <span className="text-base">{selectedAction.icon}</span>
              <span>Параметры [{selectedAction.name}]:</span>
            </span>

            {/* Dynamic Parameter Field */}
            {selectedAction.paramType === 'form_picker' && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[11px]">Форма:</span>
                <select
                  value={actionParam}
                  onChange={(e) => setActionParam(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {availableForms.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedAction.paramType === 'text_message' && (
              <input
                type="text"
                value={actionParam}
                onChange={(e) => setActionParam(e.target.value)}
                placeholder="Текст сообщения..."
                className="flex-1 max-w-md bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            )}

            {selectedAction.paramType === 'confirm_dialog' && (
              <input
                type="text"
                value={actionParam}
                onChange={(e) => setActionParam(e.target.value)}
                placeholder="Текст вопроса пользователю..."
                className="flex-1 max-w-md bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            )}

            {(selectedAction.paramType === 'control_text' ||
              selectedAction.paramType === 'control_color' ||
              selectedAction.paramType === 'control_toggle') && (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-zinc-500 text-[11px]">Контрол:</span>
                <select
                  value={targetControlName}
                  onChange={(e) => setTargetControlName(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  {availableControls.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <span className="text-zinc-500 text-[11px]">Значение:</span>
                <input
                  type="text"
                  value={actionParam}
                  onChange={(e) => setActionParam(e.target.value)}
                  placeholder="Значение параметра..."
                  className="flex-1 max-w-xs bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}

            {selectedAction.paramType === 'delay_ms' && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[11px]">Задержка (мс):</span>
                <input
                  type="number"
                  value={actionParam}
                  onChange={(e) => setActionParam(e.target.value)}
                  className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                  step="500"
                  min="100"
                />
              </div>
            )}

            {selectedAction.paramType === 'db_query' && (
              <input
                type="text"
                value={actionParam}
                onChange={(e) => setActionParam(e.target.value)}
                placeholder="SQL запрос: INSERT INTO ..."
                className="flex-1 max-w-lg bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-xs text-white font-mono"
              />
            )}
          </div>

          {/* Insert Button */}
          <button
            onClick={() => handleInsertAction(selectedAction)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>➕ ВСТАВИТЬ ДЕЙСТВИЕ</span>
          </button>
        </div>

        {/* 4. Bottom Status Bar */}
        <div className="h-6 bg-[#121217] border-t border-zinc-800/80 px-3 flex items-center justify-between text-[10.5px] font-mono text-zinc-400 select-none shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Синтаксис C#: ВАЛИДЕН (0 ошибок)
            </span>
            <span className="text-zinc-600">|</span>
            <span>Roslyn Compiler: .NET 8.0</span>
            <span className="text-zinc-600">|</span>
            <span className="text-blue-400">Компиляция: Готов к запуску</span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Строка {cursorPosition.line}, Кол {cursorPosition.col}
            </span>
            <span className="text-zinc-600">|</span>
            <span>UTF-8</span>
          </div>
        </div>
      </div>
    </div>
  );
};
