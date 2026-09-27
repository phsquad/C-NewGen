import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  generateDesignerCs,
  generateCodeBehindCs,
  generateProgramCs,
  generateCsproj,
  generateReadme,
} from '../../utils/codeGenerators';
import { generatePythonCustomTkinter, generateWebHtml } from '../../utils/polyglotGenerators';
import { ProjectASTLinter } from '../../utils/astLinter';
import { downloadFullProjectZip } from '../../utils/zipExporter';
import { downloadFile } from '../../utils/storage';
import {
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  X,
  Play,
  Copy,
  Check,
  Download,
  Terminal as TerminalIcon,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Cpu,
  Layers,
  Sparkles,
  Wrench,
  Search,
  FolderTree,
  Folder,
  FileCode,
  FileText,
  Boxes,
  Package,
  Settings,
  GitBranch,
  GitFork,
  ArrowRight,
  RotateCcw,
  Square as StopIcon,
  Code2,
  Lightbulb,
  CheckCircle2,
  ArrowDownToLine,
  Sliders,
  Database,
} from 'lucide-react';

export const DualModeCodeIDE: React.FC = () => {
  const {
    project,
    codeDockOpen,
    setCodeDockOpen,
    consoleLogs,
    clearConsoleLogs,
    addConsoleLog,
    selectNode,
    setActiveRightTab,
    isTabOrderMode,
    activeFormId,
    getAllForms,
    setActiveFormId,
  } = useDesigner();

  // Mode: 'docked' (quick-dock at canvas bottom) or 'standalone' (fullscreen DevOS window)
  const [editorMode, setEditorMode] = useState<'docked' | 'standalone'>('docked');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dockHeight, setDockHeight] = useState(230);
  const [isResizing, setIsResizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Active File Tab
  const [activeTab, setActiveTab] = useState<string>('Form1.cs');

  // Breadcrumbs current method
  const [selectedMethod, setSelectedMethod] = useState<string>('btnSubmit_Click');
  const [breadcrumbsDropdown, setBreadcrumbsDropdown] = useState<'class' | 'method' | null>(null);

  // Standalone Activity Bar Tab ('files' | 'search' | 'git' | 'debug' | 'packages' | 'settings')
  const [activityTab, setActivityTab] = useState<'files' | 'search' | 'git' | 'debug' | 'packages' | 'settings'>('files');

  // Tool Windows Tab ('errors' | 'terminal' | 'output' | 'debug')
  const [toolWindowTab, setToolWindowTab] = useState<'errors' | 'terminal' | 'output' | 'debug'>('terminal');

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<Array<{ text: string; type: 'cmd' | 'output' | 'error' | 'success' }>>([
    { text: '$ dotnet --version', type: 'cmd' },
    { text: '8.0.204 (x64)', type: 'output' },
    { text: '$ dotnet build', type: 'cmd' },
    { text: '[Roslyn] Сборка решения выполнена успешно за 0.04 сек. 0 ошибок, 0 предупреждений.', type: 'success' },
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  // Breakpoints line numbers
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set([14]));

  // Folded line blocks
  const [foldedBlocks, setFoldedBlocks] = useState<Set<number>>(new Set());

  // Cursor position
  const [cursorPos, setCursorPos] = useState({ line: 14, col: 24 });

  // Custom user file overrides (stores live edits so typing doesn't revert)
  const [customFileOverrides, setCustomFileOverrides] = useState<Record<string, string>>({});
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const rootForm = project.nodes[project.rootFormId];
  const formName = (activeFormId && project.nodes[activeFormId]?.properties.name) || rootForm?.properties.name || 'Form1';
  const projectName = project.projectName || `${formName}App`;

  // Pre-generate standard files
  const generatedFiles = useMemo(() => {
    return {
      [`${formName}.cs`]: {
        name: `${formName}.cs`,
        lang: 'csharp',
        code: generateCodeBehindCs(project, activeFormId),
      },
      [`${formName}.Designer.cs`]: {
        name: `${formName}.Designer.cs`,
        lang: 'csharp',
        code: generateDesignerCs(project, activeFormId),
      },
      'Program.cs': {
        name: 'Program.cs',
        lang: 'csharp',
        code: generateProgramCs(project),
      },
      [`${projectName}.csproj`]: {
        name: `${projectName}.csproj`,
        lang: 'xml',
        code: generateCsproj(projectName),
      },
      'app.py': {
        name: 'app.py',
        lang: 'python',
        code: generatePythonCustomTkinter(project),
      },
      'schema.sql': {
        name: 'schema.sql',
        lang: 'sql',
        code: `-- SQLite Schema for ${projectName}\nCREATE TABLE IF NOT EXISTS Users (\n    Id INTEGER PRIMARY KEY AUTOINCREMENT,\n    Username TEXT NOT NULL UNIQUE,\n    PasswordHash TEXT NOT NULL,\n    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nINSERT INTO Users (Username, PasswordHash) VALUES ('admin', 'sha256_hash_root');\n`,
      },
      'README.md': {
        name: 'README.md',
        lang: 'markdown',
        code: generateReadme(projectName, 'WinForms'),
      },
    };
  }, [project, activeFormId, formName, projectName]);

  // Current active file code (custom override or generated)
  const currentFileContent = useMemo(() => {
    if (customFileOverrides[activeTab] !== undefined) {
      return customFileOverrides[activeTab];
    }
    const gen = generatedFiles[activeTab as keyof typeof generatedFiles];
    return gen ? gen.code : '';
  }, [customFileOverrides, generatedFiles, activeTab]);

  const activeLang = generatedFiles[activeTab as keyof typeof generatedFiles]?.lang || 'csharp';

  // Compute Linter issues
  const lintIssues = useMemo(() => {
    return ProjectASTLinter.validateProject(project);
  }, [project]);

  const errorCount = lintIssues.filter(i => i.severity === 'error').length;
  const warningCount = lintIssues.filter(i => i.severity === 'warning').length;

  // Handle Hotkey: Ctrl + ` or Ctrl + ~ to toggle dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === '~' || e.code === 'Backquote')) {
        e.preventDefault();
        setCodeDockOpen(!codeDockOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [codeDockOpen, setCodeDockOpen]);

  // Resizable Splitter Logic for Mode 1
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY - 28; // minus status bar
      if (newHeight >= 160 && newHeight <= 600) {
        setDockHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Listen for external open-file requests from Solution Explorer
  useEffect(() => {
    const handleSetCodeTab = (e: any) => {
      const tabDetail = e.detail;
      setCodeDockOpen(true);
      if (tabDetail === 'designer') setActiveTab(`${formName}.Designer.cs`);
      else if (tabDetail === 'behind') setActiveTab(`${formName}.cs`);
      else if (tabDetail === 'program') setActiveTab('Program.cs');
      else if (tabDetail === 'csproj') setActiveTab(`${projectName}.csproj`);
      else if (tabDetail === 'readme') setActiveTab('README.md');
      else if (tabDetail === 'pythonApp') setActiveTab('app.py');
    };
    window.addEventListener('set-code-tab', handleSetCodeTab);
    return () => window.removeEventListener('set-code-tab', handleSetCodeTab);
  }, [formName, projectName, setCodeDockOpen]);

  // Breakpoints
  const toggleBreakpoint = (lineNum: number) => {
    setBreakpoints(prev => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  // Code Folding
  const toggleFoldBlock = (lineNum: number) => {
    setFoldedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  // Text changes handler with dirty state
  const handleTextChange = (newText: string) => {
    setCustomFileOverrides(prev => ({ ...prev, [activeTab]: newText }));
    setDirtyFiles(prev => new Set(prev).add(activeTab));
  };

  // Format code (indentation cleanup)
  const handleFormatCode = () => {
    const formatted = currentFileContent
      .split('\n')
      .map(l => l.replace(/\t/g, '    '))
      .join('\n');
    handleTextChange(formatted);
    addConsoleLog('System', `Файл ${activeTab} успешно отформатирован по стандарту C#`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    downloadFile(activeTab, currentFileContent);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      await downloadFullProjectZip(project);
    } finally {
      setIsZipping(false);
    }
  };

  // Terminal commands execution simulation
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const nextHistory = [...terminalHistory, { text: `$ ${cmd}`, type: 'cmd' as const }];

    if (cmd === 'clear' || cmd === 'cls') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    }

    if (cmd === 'dotnet build' || cmd === 'build') {
      nextHistory.push({
        text: `MSBuild version 17.8.3+195e4a5a3 for .NET\n  Определение проектов для восстановления...\n  Все проекты актуальны для восстановления.\n  ${projectName} -> bin/Debug/net8.0-windows/${projectName}.dll\nСборка успешно завершена. 0 ошибок, 0 предупреждений. Затрачено: 0.08 сек.`,
        type: 'success',
      });
    } else if (cmd === 'dotnet run' || cmd === 'run') {
      nextHistory.push({
        text: `[Roslyn JIT] Запуск '${projectName}' (Windows Forms Core 8.0). Окно инициализировано.`,
        type: 'output',
      });
      window.dispatchEvent(new CustomEvent('open-live-run'));
    } else if (cmd.startsWith('python')) {
      nextHistory.push({
        text: `[Python 3.11] Инициализация CustomTkinter GUI engine... Окно запущено.`,
        type: 'output',
      });
    } else if (cmd.startsWith('git status')) {
      nextHistory.push({
        text: `On branch main\nChanges not staged for commit:\n  modified:   ${activeTab}\n\nno changes added to commit (use "git add")`,
        type: 'output',
      });
    } else {
      nextHistory.push({
        text: `Команда '${cmd}' выполнена успешно.`,
        type: 'output',
      });
    }

    setTerminalHistory(nextHistory);
    setTerminalInput('');
  };

  // Syntax Highlighting parser (JetBrains Mono / VS Code Dark Style)
  const renderHighlightedLine = (line: string) => {
    // Basic tokenizer for C# / Python keywords, strings, comments
    const commentMatch = line.match(/^(\s*)(\/\/.*)$/);
    if (commentMatch) {
      return (
        <>
          <span>{commentMatch[1]}</span>
          <span className="text-[#6A9955] italic">{commentMatch[2]}</span>
        </>
      );
    }

    // Replace keywords, strings, types with colored spans
    const tokens = line.split(/(".*?"|'.*?'|\b(?:public|private|protected|class|namespace|partial|void|string|int|decimal|bool|var|new|return|if|else|using|static|readonly|override|async|await|def|import|from|SELECT|FROM|WHERE|INSERT|INTO|CREATE|TABLE)\b)/g);

    return (
      <>
        {tokens.map((token, i) => {
          if (!token) return null;
          if (token.startsWith('"') || token.startsWith("'")) {
            return <span key={i} className="text-[#CE9178]">{token}</span>;
          }
          if (['public', 'private', 'protected', 'partial', 'void', 'namespace', 'class', 'static', 'using', 'def', 'import', 'from', 'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'CREATE', 'TABLE'].includes(token)) {
            return <span key={i} className="text-[#569CD6] font-semibold">{token}</span>;
          }
          if (['return', 'if', 'else', 'new', 'var', 'async', 'await'].includes(token)) {
            return <span key={i} className="text-[#C586C0] font-semibold">{token}</span>;
          }
          if (['string', 'int', 'bool', 'decimal', 'object', 'Form', 'Button', 'TextBox', 'EventArgs'].includes(token)) {
            return <span key={i} className="text-[#4EC9B0]">{token}</span>;
          }
          return <span key={i}>{token}</span>;
        })}
      </>
    );
  };

  const lines = currentFileContent.split('\n');

  if (!codeDockOpen && editorMode === 'docked') {
    return null;
  }

  // =========================================================================
  // РЕЖИМ 1: КОМПАКТНЫЙ НИЖНИЙ ДОК (COMPACT QUICK-DOCK)
  // =========================================================================
  if (editorMode === 'docked') {
    return (
      <div
        style={{ height: isCollapsed ? '32px' : `${dockHeight}px` }}
        className="w-full bg-[#18181F] border-t border-zinc-800 flex flex-col z-30 select-none shadow-2xl relative shrink-0 transition-[height] duration-75"
      >
        {/* Resizable Splitter Bar */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize hover:bg-blue-500/50 transition-colors z-40 flex items-center justify-center group"
          title="Потяните для изменения высоты дока (160px - 500px)"
        >
          <div className="w-16 h-1 bg-zinc-600 rounded-full group-hover:bg-blue-400 transition-colors" />
        </div>

        {/* 1. Dock Header Tab Bar */}
        <div className="h-8 bg-[#1F1F27] border-b border-zinc-800 flex items-center justify-between px-2 gap-2 shrink-0">
          {/* File Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto min-w-0">
            {Object.keys(generatedFiles).map(fileName => {
              const isActive = activeTab === fileName;
              const isDirty = dirtyFiles.has(fileName);
              return (
                <button
                  key={fileName}
                  onClick={() => {
                    setActiveTab(fileName);
                    setIsCollapsed(false);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-t flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border-t-2 ${
                    isActive
                      ? 'bg-[#1E1E24] text-white font-medium border-blue-500 shadow-sm'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <span>{fileName.endsWith('.cs') ? '📄' : fileName.endsWith('.py') ? '🐍' : fileName.endsWith('.sql') ? '🗄' : '⚙️'}</span>
                  <span>{fileName}</span>
                  {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Несохраненные изменения" />}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Right Toolbar */}
          <div className="flex items-center gap-1 text-xs shrink-0">
            {/* Format Code */}
            <button
              type="button"
              onClick={handleFormatCode}
              className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded flex items-center gap-1 text-[11px] cursor-pointer"
              title="Форматировать код (Alt+Shift+F)"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Формат</span>
            </button>

            {/* Copy */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded flex items-center gap-1 text-[11px] cursor-pointer"
              title="Копировать в буфер"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Pop-Out to Standalone Window [ ↗ В ОКНО ] */}
            <button
              type="button"
              onClick={() => setEditorMode('standalone')}
              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer shadow-xs ml-1"
              title="Открепить в полноценную автономную студию IDE (Visual Studio Standalone Pro)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>В ОКНО</span>
            </button>

            {/* Collapse/Expand toggle */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded text-xs cursor-pointer"
              title={isCollapsed ? 'Развернуть док' : 'Свернуть док в полоску'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 rotate-90" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Close Dock */}
            <button
              type="button"
              onClick={() => setCodeDockOpen(false)}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded text-xs cursor-pointer"
              title="Закрыть (Ctrl + `)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Dock Body Editor */}
        {!isCollapsed && (
          <div className="flex-1 flex overflow-hidden font-mono text-xs text-zinc-200 relative bg-[#1E1E24]">
            {/* Gutter: Line Numbers & Breakpoints */}
            <div className="w-12 bg-[#18181F] border-r border-zinc-800/80 py-2 select-none text-right pr-2 text-zinc-500 shrink-0 text-[11px] font-mono overflow-hidden">
              {lines.map((_, i) => {
                const lineNum = i + 1;
                const hasBp = breakpoints.has(lineNum);
                return (
                  <div
                    key={i}
                    onClick={() => toggleBreakpoint(lineNum)}
                    className="leading-5 flex items-center justify-end gap-1 px-1 cursor-pointer group hover:text-white"
                  >
                    {hasBp ? (
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-sm" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-red-500/0 group-hover:bg-red-500/40 inline-block" />
                    )}
                    <span>{lineNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Interactive Code Text Area & Display */}
            <div className="flex-1 relative overflow-auto p-2">
              <textarea
                ref={textareaRef}
                value={currentFileContent}
                onChange={e => handleTextChange(e.target.value)}
                onClick={e => {
                  const target = e.target as HTMLTextAreaElement;
                  const textBefore = target.value.substring(0, target.selectionStart);
                  const l = textBefore.split('\n').length;
                  const c = textBefore.length - textBefore.lastIndexOf('\n');
                  setCursorPos({ line: l, col: c });
                }}
                onKeyUp={e => {
                  const target = e.target as HTMLTextAreaElement;
                  const textBefore = target.value.substring(0, target.selectionStart);
                  const l = textBefore.split('\n').length;
                  const c = textBefore.length - textBefore.lastIndexOf('\n');
                  setCursorPos({ line: l, col: c });
                }}
                spellCheck={false}
                className="w-full h-full bg-transparent text-zinc-200 font-mono text-[12px] leading-5 resize-none focus:outline-none border-none selection:bg-blue-600/40 whitespace-pre tab-4"
                style={{ tabSize: 4 }}
              />
            </div>
          </div>
        )}

        {/* 3. Dock Compact Status Bar */}
        <div className="h-6 bg-[#18181F] border-t border-zinc-800/80 px-3 flex items-center justify-between text-[10.5px] font-mono text-zinc-400 select-none shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 font-bold">● [C# .NET 8 / WinForms]</span>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-400">Синхронизация с холстом: 0 ms</span>
            <span className="text-zinc-600">|</span>
            <span className={errorCount > 0 ? 'text-red-400 font-semibold' : 'text-zinc-400'}>
              Ошибок: {errorCount}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            <span className="text-zinc-600">|</span>
            <span>Spaces: 4</span>
            <span className="text-zinc-600">|</span>
            <span>UTF-8</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // РЕЖИМ 2: ПОЛНОЦЕННАЯ АВТОНОМНАЯ IDE В ОТДЕЛЬНОМ ОКНЕ (STANDALONE STUDIO PRO)
  // =========================================================================
  return (
    <div className="fixed inset-3 bg-[#18181F] border border-zinc-700/80 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 font-sans">
      {/* 1. Window Frame Titlebar */}
      <div className="h-9 bg-[#1F1F27] border-b border-zinc-800 flex items-center justify-between px-3 select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-black text-sm">⚡️</span>
          <span className="text-zinc-100 font-bold text-xs font-mono">
            DEV-OS: NEXTGEN CODE STUDIO PRO — "{projectName}.sln"
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-mono">
            .NET 8.0 SDK
          </span>
        </div>

        {/* Window Window Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditorMode('docked')}
            className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded flex items-center gap-1 text-[11px] font-medium transition cursor-pointer"
            title="Свернуть в нижний док холста с сохранением всех данных"
          >
            <span>↙</span>
            <span>Свернуть в док</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorMode('docked')}
            className="p-1 hover:bg-red-600 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Закрыть окно IDE"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Menu Bar (Файл, Правка, Выделение, Вид, Переход, Сборка...) */}
      <div className="h-7 bg-[#1C1C24] border-b border-zinc-800/80 flex items-center px-3 gap-3 text-xs text-zinc-300 select-none shrink-0 font-sans">
        <span className="hover:text-white cursor-pointer transition">Файл</span>
        <span className="hover:text-white cursor-pointer transition">Правка</span>
        <span className="hover:text-white cursor-pointer transition">Выделение</span>
        <span className="hover:text-white cursor-pointer transition">Вид</span>
        <span className="hover:text-white cursor-pointer transition">Переход</span>
        <span className="hover:text-white cursor-pointer transition" onClick={() => handleTerminalSubmit({ preventDefault: () => {} } as any)}>Сборка</span>
        <span className="hover:text-white cursor-pointer transition">Выполнить</span>
        <span className="hover:text-white cursor-pointer transition">Терминал</span>
        <span className="hover:text-white cursor-pointer transition">Справка</span>
      </div>

      {/* 3. Main Studio Workspace: Activity Bar + Side Panel + Editor + Minimap */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3.1 Left Activity Bar (44px) */}
        <div className="w-11 bg-[#141419] border-r border-zinc-800 flex flex-col justify-between py-2 text-zinc-400 select-none shrink-0 items-center">
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => setActivityTab('files')}
              title="Проводник решения (Explorer)"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activityTab === 'files' ? 'text-blue-400 bg-zinc-800/80' : 'hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <FolderTree className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActivityTab('search')}
              title="Поиск по файлам (Search)"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activityTab === 'search' ? 'text-blue-400 bg-zinc-800/80' : 'hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActivityTab('git')}
              title="Контроль версий Git"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activityTab === 'git' ? 'text-emerald-400 bg-zinc-800/80' : 'hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <GitFork className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActivityTab('debug')}
              title="Отладка и контрольные точки"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activityTab === 'debug' ? 'text-amber-400 bg-zinc-800/80' : 'hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <Bug className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActivityTab('packages')}
              title="Пакеты NuGet"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activityTab === 'packages' ? 'text-purple-400 bg-zinc-800/80' : 'hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <Package className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActivityTab('settings')}
            title="Параметры IDE"
            className="p-2 hover:text-white hover:bg-zinc-800/40 rounded-lg cursor-pointer transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* 3.2 Side Explorer Panel (240px) */}
        <div className="w-60 bg-[#16161D] border-r border-zinc-800 flex flex-col overflow-hidden text-xs text-zinc-300 select-none shrink-0 font-mono">
          <div className="p-2.5 border-b border-zinc-800 bg-[#18181F] flex items-center justify-between font-bold text-[11px] text-zinc-400 uppercase tracking-wider">
            <span>🗂 Проводник: {projectName}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1 py-1">
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{projectName} (.NET 8.0)</span>
            </div>

            <div className="pl-4 space-y-0.5">
              <div className="flex items-center gap-1.5 py-0.5 text-zinc-400">
                <Folder className="w-3 h-3 text-amber-400" />
                <span>Properties</span>
              </div>
              <div className="flex items-center gap-1.5 py-0.5 text-zinc-400">
                <Boxes className="w-3 h-3 text-purple-400" />
                <span>Dependencies</span>
              </div>

              {/* Form Files with Canonical Nesting */}
              <div className="pt-1">
                <div
                  onClick={() => setActiveTab(`${formName}.cs`)}
                  className={`px-1.5 py-1 rounded cursor-pointer flex items-center justify-between transition-colors ${
                    activeTab === `${formName}.cs` ? 'bg-blue-600/20 text-blue-300 font-semibold' : 'hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>{formName}.cs</span>
                  </div>
                  {dirtyFiles.has(`${formName}.cs`) && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </div>

                <div className="pl-4 space-y-0.5 border-l border-zinc-800/60 ml-2 my-0.5">
                  <div
                    onClick={() => setActiveTab(`${formName}.Designer.cs`)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1.5 text-[11px] transition-colors ${
                      activeTab === `${formName}.Designer.cs` ? 'bg-blue-600/20 text-cyan-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <FileCode className="w-3 h-3 text-cyan-400" />
                    <span>{formName}.Designer.cs</span>
                  </div>
                  <div
                    onClick={() => setActiveTab('README.md')}
                    className="px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  >
                    <FileText className="w-3 h-3 text-amber-400" />
                    <span>{formName}.resx</span>
                  </div>
                </div>
              </div>

              {/* Standalone Project Files */}
              <div
                onClick={() => setActiveTab('Program.cs')}
                className={`px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1.5 transition-colors ${
                  activeTab === 'Program.cs' ? 'bg-blue-600/20 text-emerald-300 font-semibold' : 'hover:bg-zinc-800/60'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Program.cs</span>
              </div>

              <div
                onClick={() => setActiveTab(`${projectName}.csproj`)}
                className={`px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1.5 transition-colors ${
                  activeTab === `${projectName}.csproj` ? 'bg-blue-600/20 text-amber-300 font-semibold' : 'hover:bg-zinc-800/60'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>{projectName}.csproj</span>
              </div>

              <div
                onClick={() => setActiveTab('app.py')}
                className={`px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1.5 transition-colors ${
                  activeTab === 'app.py' ? 'bg-blue-600/20 text-amber-300 font-semibold' : 'hover:bg-zinc-800/60'
                }`}
              >
                <span>🐍</span>
                <span>app.py</span>
              </div>

              <div
                onClick={() => setActiveTab('schema.sql')}
                className={`px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1.5 transition-colors ${
                  activeTab === 'schema.sql' ? 'bg-blue-600/20 text-cyan-300 font-semibold' : 'hover:bg-zinc-800/60'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>schema.sql</span>
              </div>
            </div>
          </div>

          <div className="p-2 border-t border-zinc-800 bg-[#141419] text-[10px] text-zinc-500">
            <span>● Git: main (up-to-date)</span>
          </div>
        </div>

        {/* 3.3 Center: Breadcrumbs + Main Code Editor + Minimap */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1E1E24]">
          {/* File Tabs Strip */}
          <div className="h-9 bg-[#1F1F27] border-b border-zinc-800 flex items-center justify-between px-2 overflow-x-auto select-none shrink-0">
            <div className="flex items-center gap-1">
              {Object.keys(generatedFiles).map(fileName => {
                const isActive = activeTab === fileName;
                const isDirty = dirtyFiles.has(fileName);
                return (
                  <button
                    key={fileName}
                    onClick={() => setActiveTab(fileName)}
                    className={`px-3 py-1 text-xs font-mono rounded-t flex items-center gap-2 transition cursor-pointer border-t-2 ${
                      isActive
                        ? 'bg-[#1E1E24] text-white font-medium border-blue-500 shadow-sm'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <span>{fileName.endsWith('.cs') ? '📄' : fileName.endsWith('.py') ? '🐍' : '🗄'}</span>
                    <span>{fileName}</span>
                    {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleFormatCode}
                className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded text-xs flex items-center gap-1 cursor-pointer"
                title="Форматировать (Alt+Shift+F)"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Формат</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded text-xs cursor-pointer"
                title="Копировать"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer"
              >
                {isZipping ? '...' : '.ZIP'}
              </button>
            </div>
          </div>

          {/* Breadcrumbs Navigation Bar (Интерактивные хлебные крошки) */}
          <div className="h-7 bg-[#1C1C24] border-b border-zinc-800/80 px-3 flex items-center text-[11px] font-mono text-zinc-400 gap-1.5 select-none shrink-0 relative">
            <span className="hover:text-zinc-200 cursor-pointer">{projectName}</span>
            <span>›</span>
            <span className="hover:text-zinc-200 cursor-pointer">Forms</span>
            <span>›</span>
            <span className="hover:text-zinc-200 cursor-pointer font-semibold text-zinc-300">{activeTab}</span>
            <span>›</span>
            <span
              onClick={() => setBreadcrumbsDropdown(breadcrumbsDropdown === 'class' ? null : 'class')}
              className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>{formName}</span>
              <ChevronDown className="w-3 h-3" />
            </span>
            <span>›</span>
            <span
              onClick={() => setBreadcrumbsDropdown(breadcrumbsDropdown === 'method' ? null : 'method')}
              className="text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>⚡️ {selectedMethod}</span>
              <ChevronDown className="w-3 h-3" />
            </span>

            {/* Methods dropdown picker */}
            {breadcrumbsDropdown === 'method' && (
              <div className="absolute top-7 left-56 w-60 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
                {['InitializeComponent()', 'btnSubmit_Click(...)', 'Form1_Load(...)', 'txtLogin_TextChanged(...)'].map(m => (
                  <div
                    key={m}
                    onClick={() => {
                      setSelectedMethod(m.replace(/\(.*\)/, ''));
                      setBreadcrumbsDropdown(null);
                    }}
                    className="px-3 py-1.5 hover:bg-blue-600 hover:text-white cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-amber-400">⚡️</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Code Editor Body + Minimap */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Gutter: Breakpoints, Line Numbers, Git Status, Folding, Lightbulb */}
            <div className="w-16 bg-[#18181F] border-r border-zinc-800/80 py-2 select-none text-right pr-2 text-zinc-500 shrink-0 text-[11px] font-mono overflow-hidden">
              {lines.map((line, i) => {
                const lineNum = i + 1;
                const hasBp = breakpoints.has(lineNum);
                const isFoldable = line.includes('{') || line.includes('class ') || line.includes('void ');
                const isFolded = foldedBlocks.has(lineNum);
                const isChanged = i % 8 === 2; // mock git decoration

                return (
                  <div
                    key={i}
                    className="leading-5 flex items-center justify-end gap-1 px-1 cursor-pointer group hover:text-white relative"
                  >
                    {/* Git decoration bar */}
                    {isChanged && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500" />}

                    {/* Breakpoint */}
                    <span
                      onClick={() => toggleBreakpoint(lineNum)}
                      title="Точка останова"
                      className="cursor-pointer"
                    >
                      {hasBp ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/0 group-hover:bg-red-500/40 inline-block" />
                      )}
                    </span>

                    {/* Code Folding Arrow */}
                    {isFoldable ? (
                      <span
                        onClick={() => toggleFoldBlock(lineNum)}
                        className="text-[9px] text-zinc-600 hover:text-zinc-300 w-2.5 text-center cursor-pointer"
                      >
                        {isFolded ? '►' : '▼'}
                      </span>
                    ) : (
                      <span className="w-2.5" />
                    )}

                    {/* Line number */}
                    <span className="text-zinc-500 group-hover:text-zinc-200">{lineNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Editor Textarea with syntax rendering */}
            <div className="flex-1 relative overflow-auto p-2 bg-[#1E1E24]">
              <textarea
                value={currentFileContent}
                onChange={e => handleTextChange(e.target.value)}
                onClick={e => {
                  const target = e.target as HTMLTextAreaElement;
                  const textBefore = target.value.substring(0, target.selectionStart);
                  const l = textBefore.split('\n').length;
                  const c = textBefore.length - textBefore.lastIndexOf('\n');
                  setCursorPos({ line: l, col: c });
                }}
                onKeyUp={e => {
                  const target = e.target as HTMLTextAreaElement;
                  const textBefore = target.value.substring(0, target.selectionStart);
                  const l = textBefore.split('\n').length;
                  const c = textBefore.length - textBefore.lastIndexOf('\n');
                  setCursorPos({ line: l, col: c });
                }}
                spellCheck={false}
                className="w-full h-full bg-transparent text-zinc-200 font-mono text-[13px] leading-5 resize-none focus:outline-none border-none selection:bg-blue-600/40 whitespace-pre"
                style={{ tabSize: 4 }}
              />
            </div>

            {/* 3.4 Interactive Minimap (Правая часть окна) */}
            <div className="w-28 bg-[#18181F]/90 border-l border-zinc-800/80 p-1 select-none overflow-hidden text-[3px] leading-[4px] font-mono text-zinc-500 relative shrink-0 hidden md:block">
              {/* Lens viewport indicator */}
              <div
                style={{ top: `${(cursorPos.line / Math.max(lines.length, 1)) * 80}%` }}
                className="absolute left-0 right-0 h-10 bg-blue-500/10 border-y border-blue-500/30 pointer-events-none transition-all duration-75"
              />
              <div className="opacity-70 pointer-events-none">
                {lines.slice(0, 80).map((l, i) => (
                  <div key={i} className="truncate text-zinc-500">
                    {l.trim().slice(0, 30)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Bottom Tool Windows (Tool Window Tabs: Ошибки, Терминал, Вывод, Консоль отладки) */}
          <div className="h-44 bg-[#141419] border-t border-zinc-800 flex flex-col shrink-0 select-none">
            {/* Tool Window Headers */}
            <div className="h-7 bg-[#1A1A22] border-b border-zinc-800 flex items-center justify-between px-3 text-xs">
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setToolWindowTab('errors')}
                  className={`px-2.5 py-0.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
                    toolWindowTab === 'errors' ? 'bg-[#141419] text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <AlertCircle className={`w-3.5 h-3.5 ${errorCount > 0 ? 'text-red-400' : 'text-zinc-500'}`} />
                  <span>Список ошибок ({errorCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolWindowTab('terminal')}
                  className={`px-2.5 py-0.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
                    toolWindowTab === 'terminal' ? 'bg-[#141419] text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Терминал (CLI)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolWindowTab('output')}
                  className={`px-2.5 py-0.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
                    toolWindowTab === 'output' ? 'bg-[#141419] text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Вывод сборки (Roslyn)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolWindowTab('debug')}
                  className={`px-2.5 py-0.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
                    toolWindowTab === 'debug' ? 'bg-[#141419] text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5 text-amber-400" />
                  <span>Консоль отладки</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <span>PowerShell Core 7 / bash</span>
              </div>
            </div>

            {/* Tool Window Body */}
            <div className="flex-1 overflow-auto p-2 font-mono text-xs text-zinc-300">
              {/* Terminal Tab */}
              {toolWindowTab === 'terminal' && (
                <div className="h-full flex flex-col justify-between">
                  <div className="space-y-1 overflow-y-auto">
                    {terminalHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className={
                          item.type === 'cmd'
                            ? 'text-cyan-300 font-bold'
                            : item.type === 'success'
                            ? 'text-emerald-400'
                            : item.type === 'error'
                            ? 'text-red-400'
                            : 'text-zinc-300 whitespace-pre-wrap'
                        }
                      >
                        {item.text}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                    <span className="text-cyan-400 font-bold">$</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={e => setTerminalInput(e.target.value)}
                      placeholder="Введите команду (dotnet run, dotnet build, python app.py, clear)..."
                      className="flex-1 bg-transparent border-none text-zinc-200 focus:outline-none font-mono text-xs"
                    />
                  </form>
                </div>
              )}

              {/* Errors Tab */}
              {toolWindowTab === 'errors' && (
                <div className="space-y-1">
                  {lintIssues.length === 0 ? (
                    <div className="text-emerald-400 flex items-center gap-1.5 py-4 justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>0 ошибок, 0 предупреждений. Проект компилируется без замечаний.</span>
                    </div>
                  ) : (
                    lintIssues.map(issue => (
                      <div
                        key={issue.id}
                        onClick={() => issue.nodeId && selectNode(issue.nodeId)}
                        className="flex items-center gap-2 p-1 hover:bg-zinc-800/60 rounded cursor-pointer"
                      >
                        {issue.severity === 'error' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="text-blue-400 font-semibold">{issue.code}</span>
                        <span className="text-zinc-200">{issue.message}</span>
                        <span className="text-zinc-500 ml-auto">{formName}.cs</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Output Tab */}
              {toolWindowTab === 'output' && (
                <div className="space-y-1 text-zinc-400 whitespace-pre-wrap">
                  <div>[Roslyn Compiler Engine] Инициализация компиляции проекта {projectName}...</div>
                  <div>Успешная генерация сборки {projectName}.dll (версия 1.0.0.0).</div>
                  <div className="text-emerald-400">Сборка: Успешно (0 ошибок, 0 предупреждений).</div>
                </div>
              )}

              {/* Debug Console Tab */}
              {toolWindowTab === 'debug' && (
                <div className="space-y-1 text-zinc-300">
                  {consoleLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-2">
                      <span className="text-zinc-600">[{log.time}]</span>
                      <span className="text-amber-400 font-semibold">[{log.category}]</span>
                      <span>{log.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Standalone Bottom Status Bar (VS Code Canonical Status) */}
      <div className="h-6 bg-[#007ACC] text-white text-[11px] font-mono px-3 flex items-center justify-between select-none shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold">
            <GitBranch className="w-3 h-3" />
            <span>main</span>
          </span>
          <span className="opacity-80">|</span>
          <span className="flex items-center gap-1">
            <span>❌ {errorCount}</span>
            <span>⚠️ {warningCount}</span>
          </span>
          <span className="opacity-80">|</span>
          <span>● Roslyn In-Memory Compiler [READY]</span>
        </div>

        <div className="flex items-center gap-4">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Spaces: 4</span>
          <span>UTF-8</span>
          <span>CRLF</span>
          <span>C# 12 (.NET 8.0)</span>
          <span className="font-bold">120 FPS</span>
        </div>
      </div>
    </div>
  );
};
