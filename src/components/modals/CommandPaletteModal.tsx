import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  Search,
  Play,
  Rocket,
  Code2,
  FolderTree,
  Box,
  Layers,
  AlertCircle,
  Terminal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowLeftRight,
  ArrowUpDown,
  Lock,
  Hash,
  Sparkles,
  Database,
  GitFork,
  FileCode,
  Save,
  FolderGit2,
  Download,
  Upload,
  Grid,
  Magnet,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Zap,
  Home,
  X,
  Stethoscope,
  Activity,
  Cpu,
  Eye,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Debug & Build' | 'Navigation' | 'Format' | 'Tools' | 'File' | 'View';
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOverlay?: (overlay: 'database' | 'git' | 'terminal' | 'uml' | 'settings') => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenOverlay,
}) => {
  const {
    project,
    setLiveRunOpen,
    setCodeDockOpen,
    codeDockOpen,
    setActiveLeftTab,
    setErrorListOpen,
    errorListOpen,
    setAppMode,
    exitToWelcomeHub,
    saveProject,
    setImportModalOpen,
    zoom,
    setZoom,
    resetView,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    showWiring,
    toggleShowWiring,
    xrayMode,
    toggleXrayMode,
    isTabOrderMode,
    setTabOrderMode,
    alignSelectedNodes,
    updateMultipleNodesProperties,
    selectedNodes,
    activeFormId,
    nodes,
    gridStep,
    updateMultipleNodeBounds,
  } = useDesigner();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const nonFormSelected = selectedNodes.filter(n => n.type !== 'Form');
  const allLocked = nonFormSelected.length > 0 && nonFormSelected.every(n => n.properties.locked);

  const toggleLockSelected = () => {
    if (nonFormSelected.length === 0) return;
    const newLocked = !allLocked;
    const ids = nonFormSelected.map(n => n.id);
    updateMultipleNodesProperties(ids, { locked: newLocked }, true);
  };

  const handleBeautify = () => {
    const currentForm = (activeFormId && nodes[activeFormId]) || nodes[project.rootFormId];
    if (!currentForm || !currentForm.childrenIds) return;
    const step = gridStep || 8;
    const updates: Record<string, any> = {};
    currentForm.childrenIds.forEach(id => {
      const child = nodes[id];
      if (!child || child.properties.locked) return;
      const nx = Math.round(child.bounds.x / step) * step;
      const ny = Math.round(child.bounds.y / step) * step;
      const nw = Math.max(step * 2, Math.round(child.bounds.width / step) * step);
      const nh = Math.max(step * 2, Math.round(child.bounds.height / step) * step);
      updates[child.id] = { x: nx, y: ny, width: nw, height: nh };
    });
    updateMultipleNodeBounds(updates, true);
  };

  // Commands Registry
  const commands: CommandItem[] = useMemo(() => {
    return [
      // 1. Debug & Build
      {
        id: 'debug-run',
        title: 'Запустить отладку формы (Live Run & Emulator)',
        category: 'Debug & Build',
        shortcut: 'F5',
        icon: <Play className="w-4 h-4 text-emerald-400 fill-current" />,
        action: () => setLiveRunOpen(true),
        keywords: 'run start debug test launch запуск тест f5',
      },
      {
        id: 'build-wizard',
        title: 'Мастер сборки решения (.NET 9 EXE Single-File)',
        category: 'Debug & Build',
        shortcut: 'Ctrl+Shift+B',
        icon: <Rocket className="w-4 h-4 text-amber-400" />,
        action: () => window.dispatchEvent(new CustomEvent('open-build-wizard')),
        keywords: 'build compile publish exe сборка компиляция f6',
      },
      {
        id: 'audit-project',
        title: 'Аудит и диагностика проекта (Roslyn AST Linter)',
        category: 'Debug & Build',
        icon: <Stethoscope className="w-4 h-4 text-cyan-400" />,
        action: () => setErrorListOpen(true),
        keywords: 'audit inspect check diagnostics lint ошибки',
      },

      // 2. Navigation
      {
        id: 'view-code',
        title: 'Перейти к коду C# (View Code)',
        category: 'Navigation',
        shortcut: 'F7',
        icon: <Code2 className="w-4 h-4 text-blue-400" />,
        action: () => setCodeDockOpen(true),
        keywords: 'view code c# editor перейти код ф7',
      },
      {
        id: 'view-designer',
        title: 'Перейти к конструктору формы (View Designer)',
        category: 'Navigation',
        shortcut: 'Shift+F7',
        icon: <Layers className="w-4 h-4 text-purple-400" />,
        action: () => setCodeDockOpen(false),
        keywords: 'view designer canvas form visual конструктор форма',
      },
      {
        id: 'nav-solution-explorer',
        title: 'Открыть Обозреватель решений (Solution Explorer)',
        category: 'Navigation',
        shortcut: 'Ctrl+Alt+L',
        icon: <FolderTree className="w-4 h-4 text-amber-400" />,
        action: () => setActiveLeftTab('solution'),
        keywords: 'solution explorer files projects файлы проект дерево',
      },
      {
        id: 'nav-toolbox',
        title: 'Открыть Палитру компонентов (Toolbox - 40+ элементов)',
        category: 'Navigation',
        shortcut: 'Ctrl+Alt+X',
        icon: <Box className="w-4 h-4 text-blue-400" />,
        action: () => setActiveLeftTab('toolbox'),
        keywords: 'toolbox palette controls палитра элементы кнопки',
      },
      {
        id: 'nav-outline',
        title: 'Открыть Структуру документа (Document Outline / Z-Index)',
        category: 'Navigation',
        shortcut: 'Ctrl+Alt+T',
        icon: <Layers className="w-4 h-4 text-purple-400" />,
        action: () => setActiveLeftTab('tree'),
        keywords: 'document outline z-index tree слои иерархия',
      },
      {
        id: 'nav-error-list',
        title: 'Открыть Список ошибок (Error List & Warnings)',
        category: 'Navigation',
        shortcut: 'Ctrl+\\, E',
        icon: <AlertCircle className="w-4 h-4 text-red-400" />,
        action: () => setErrorListOpen(!errorListOpen),
        keywords: 'errors warnings diagnostics список ошибок',
      },
      {
        id: 'nav-terminal',
        title: 'Открыть Интерактивный Терминал (Integrated Terminal CLI)',
        category: 'Navigation',
        shortcut: 'Ctrl+`',
        icon: <Terminal className="w-4 h-4 text-cyan-400" />,
        action: () => {
          if (onOpenOverlay) onOpenOverlay('terminal');
          else setCodeDockOpen(true);
        },
        keywords: 'terminal cli console shell терминал консоль bash powershell',
      },

      // 3. Format & Layout (Visual Studio Windows Forms Standard)
      {
        id: 'format-align-left',
        title: 'Выровнять по левому краю (Align Left)',
        category: 'Format',
        icon: <AlignLeft className="w-4 h-4 text-zinc-300" />,
        action: () => alignSelectedNodes('left'),
        keywords: 'align left влево выравнивание',
      },
      {
        id: 'format-align-center',
        title: 'Выровнять по центру по горизонтали (Align Centers)',
        category: 'Format',
        icon: <AlignCenter className="w-4 h-4 text-zinc-300" />,
        action: () => alignSelectedNodes('center'),
        keywords: 'align center horizontal центр',
      },
      {
        id: 'format-align-right',
        title: 'Выровнять по правому краю (Align Right)',
        category: 'Format',
        icon: <AlignRight className="w-4 h-4 text-zinc-300" />,
        action: () => alignSelectedNodes('right'),
        keywords: 'align right вправо',
      },
      {
        id: 'format-align-top',
        title: 'Выровнять по верхнему краю (Align Tops)',
        category: 'Format',
        icon: <AlignVerticalJustifyStart className="w-4 h-4 text-zinc-300" />,
        action: () => alignSelectedNodes('top'),
        keywords: 'align top вверх',
      },
      {
        id: 'format-align-middle',
        title: 'Выровнять по центру по вертикали (Align Middles)',
        category: 'Format',
        icon: <AlignVerticalJustifyCenter className="w-4 h-4 text-zinc-300" />,
        action: () => alignSelectedNodes('middle'),
        keywords: 'align middle vertical середина',
      },
      {
        id: 'format-align-bottom',
        title: 'Выровнять по нижнему краю (Align Bottoms)',
        category: 'Format',
        icon: <AlignVerticalJustifyEnd className="w-4 h-4 text-zinc-300" />,
        action: () => alignSelectedNodes('bottom'),
        keywords: 'align bottom низ',
      },
      {
        id: 'format-same-width',
        title: 'Сделать одинаковую ширину (Make Same Width)',
        category: 'Format',
        icon: <ArrowLeftRight className="w-4 h-4 text-zinc-300" />,
        action: () => alignSelectedNodes('sameWidth'),
        keywords: 'same width одинаковая ширина',
      },
      {
        id: 'format-same-height',
        title: 'Сделать одинаковую высоту (Make Same Height)',
        category: 'Format',
        icon: <ArrowUpDown className="w-4 h-4 text-zinc-300" />,
        action: () => alignSelectedNodes('sameHeight'),
        keywords: 'same height одинаковая высота',
      },
      {
        id: 'format-lock-controls',
        title: 'Заблокировать / Разблокировать элементы (Format -> Lock Controls)',
        category: 'Format',
        shortcut: 'Ctrl+L',
        icon: <Lock className="w-4 h-4 text-amber-400" />,
        action: toggleLockSelected,
        keywords: 'lock unlock freeze заблокировать замок',
      },
      {
        id: 'format-tab-order',
        title: 'Переключить режим перехода по Tab (View -> Tab Order)',
        category: 'Format',
        icon: <Hash className="w-4 h-4 text-blue-400" />,
        action: () => setTabOrderMode(!isTabOrderMode),
        keywords: 'tab order index очередность нумерация табуляция',
      },
      {
        id: 'format-beautify',
        title: 'Автовыравнивание по сетке формы (Beautify Grid)',
        category: 'Format',
        icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
        action: handleBeautify,
        keywords: 'beautify grid snap красиво выровнять сетка',
      },

      // 4. Tools & DevOS
      {
        id: 'tool-sqlite',
        title: 'SQLite Конструктор баз данных и SQL Студия',
        category: 'Tools',
        icon: <Database className="w-4 h-4 text-amber-400" />,
        action: () => onOpenOverlay?.('database'),
        keywords: 'sqlite database sql db база данных таблицы',
      },
      {
        id: 'tool-git',
        title: 'Контроль версий Git (коммиты, ветки, граф истории)',
        category: 'Tools',
        icon: <GitFork className="w-4 h-4 text-emerald-400" />,
        action: () => onOpenOverlay?.('git'),
        keywords: 'git vcs commits branch граф гит версионность',
      },
      {
        id: 'tool-templates-100',
        title: 'Галерея 100+ готовых C# шаблонов проектов',
        category: 'Tools',
        shortcut: 'F4',
        icon: <Sparkles className="w-4 h-4 text-amber-400" />,
        action: () => window.dispatchEvent(new CustomEvent('open-templates-gallery')),
        keywords: 'templates gallery catalog шаблоны галерея примеры f4',
      },
      {
        id: 'tool-devos-desktop',
        title: 'Переключиться в виртуальный рабочий стол DevOS',
        category: 'Tools',
        icon: <Activity className="w-4 h-4 text-blue-400" />,
        action: () => setAppMode('devos'),
        keywords: 'devos desktop os рабочий стол окна',
      },

      // 5. File & Project
      {
        id: 'file-save',
        title: 'Сохранить проект в браузере (IndexedDB)',
        category: 'File',
        shortcut: 'Ctrl+S',
        icon: <Save className="w-4 h-4 text-emerald-400" />,
        action: saveProject,
        keywords: 'save сохранение сохранить ctrl+s',
      },
      {
        id: 'file-export-zip',
        title: 'Экспорт полного .NET 9 WinForms решения в ZIP',
        category: 'File',
        icon: <Download className="w-4 h-4 text-blue-400" />,
        action: () => window.dispatchEvent(new CustomEvent('open-build-wizard')),
        keywords: 'export zip download скачать проект решение',
      },
      {
        id: 'file-import-cs',
        title: 'Импортировать .Designer.cs файл',
        category: 'File',
        icon: <Upload className="w-4 h-4 text-purple-400" />,
        action: () => setImportModalOpen(true),
        keywords: 'import cs designer импорт файл загрузить',
      },
      {
        id: 'file-hub',
        title: 'Выйти в Хаб проектов (Welcome Hub)',
        category: 'File',
        icon: <Home className="w-4 h-4 text-blue-400" />,
        action: exitToWelcomeHub,
        keywords: 'exit hub home хаб выйти проекты',
      },

      // 6. View & Canvas
      {
        id: 'view-zoom-100',
        title: 'Масштаб 1:1 (100%)',
        category: 'View',
        icon: <Maximize2 className="w-4 h-4 text-zinc-300" />,
        action: () => setZoom(1),
        keywords: 'zoom 100% reset scale масштаб',
      },
      {
        id: 'view-zoom-in',
        title: 'Увеличить масштаб (Zoom In)',
        category: 'View',
        shortcut: 'Ctrl++',
        icon: <ZoomIn className="w-4 h-4 text-zinc-300" />,
        action: () => setZoom(z => Math.min(3, z * 1.2)),
        keywords: 'zoom in приблизить масштаб',
      },
      {
        id: 'view-zoom-out',
        title: 'Уменьшить масштаб (Zoom Out)',
        category: 'View',
        shortcut: 'Ctrl+-',
        icon: <ZoomOut className="w-4 h-4 text-zinc-300" />,
        action: () => setZoom(z => Math.max(0.2, z / 1.2)),
        keywords: 'zoom out отдалить масштаб',
      },
      {
        id: 'view-toggle-grid',
        title: 'Показать / скрыть сетку (Toggle Grid)',
        category: 'View',
        icon: <Grid className="w-4 h-4 text-zinc-300" />,
        action: () => setShowGrid(!showGrid),
        keywords: 'grid сетка скрыть показать',
      },
      {
        id: 'view-toggle-snap',
        title: 'Включить / отключить магнитное прилипание (Snap to Grid)',
        category: 'View',
        icon: <Magnet className="w-4 h-4 text-zinc-300" />,
        action: () => setSnapToGrid(!snapToGrid),
        keywords: 'snap magnet магнит прилипание',
      },
      {
        id: 'view-toggle-wiring',
        title: 'Интерактивные нити данных (Signal-Wiring)',
        category: 'View',
        icon: <Zap className="w-4 h-4 text-cyan-400" />,
        action: toggleShowWiring,
        keywords: 'wire wiring signals нити сигналы связи',
      },
      {
        id: 'view-toggle-xray',
        title: 'Режим 2.5D X-Ray (Изометрический разрез слоев)',
        category: 'View',
        icon: <Layers className="w-4 h-4 text-cyan-400" />,
        action: toggleXrayMode,
        keywords: 'xray 2.5d 3d разрез слоев z-index',
      },
      {
        id: 'view-codelens-feature',
        title: 'Редактор кода: C# CodeLens (Ссылки, Статус тестов, Git Blame)',
        category: 'View',
        shortcut: 'Shift+F12',
        icon: <Eye className="w-4 h-4 text-blue-400" />,
        action: () => setCodeDockOpen(true),
        keywords: 'codelens references tests blame author инспектор ссылки тесты автор f7',
      },
    ];
  }, [
    setLiveRunOpen,
    setCodeDockOpen,
    setActiveLeftTab,
    setErrorListOpen,
    errorListOpen,
    setAppMode,
    exitToWelcomeHub,
    saveProject,
    setImportModalOpen,
    setZoom,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    toggleShowWiring,
    toggleXrayMode,
    isTabOrderMode,
    setTabOrderMode,
    alignSelectedNodes,
    toggleLockSelected,
    handleBeautify,
    onOpenOverlay,
  ]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase().trim();
    return commands.filter(cmd => {
      return (
        cmd.title.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q)) ||
        (cmd.keywords && cmd.keywords.toLowerCase().includes(q))
      );
    });
  }, [commands, query]);

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedCmd = filteredCommands[selectedIndex];
      if (selectedCmd) {
        selectedCmd.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-start justify-center pt-20 px-4 animate-in fade-in duration-100 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-850 bg-zinc-900/60 gap-3">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Введите команду или поиск (например: Run, F5, F7, Align, Terminal)..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none font-medium"
          />
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">ESC для выхода</span>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 divide-y divide-zinc-900/40"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              Команда «{query}» не найдена. Попробуйте поискать F5, Build, Code, Align или Terminal.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium shadow-xs'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="shrink-0">{cmd.icon}</span>
                    <span className="truncate">{cmd.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-blue-700/60 text-blue-100'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-850'
                      }`}
                    >
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                          isSelected
                            ? 'bg-white text-blue-900 shadow-xs'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {cmd.shortcut}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Legend */}
        <div className="px-4 py-2 bg-zinc-900/40 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Навигация</span>
            <span>↵ Выполнить</span>
            <span>Esc Закрыть</span>
          </div>
          <span className="text-zinc-600">Visual Studio Quick Launch (Ctrl+Q)</span>
        </div>
      </div>
    </div>
  );
};
