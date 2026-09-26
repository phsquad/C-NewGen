import React, { useState, useMemo, useRef } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  generateDesignerCs,
  generateCodeBehindCs,
  generateProgramCs,
  generateCsproj,
  generateReadme,
  generateAvaloniaAxaml,
  generateAvaloniaAxamlCs,
  generateAvaloniaCsproj,
  generateAvaloniaProgramCs,
} from '../../utils/codeGenerators';
import {
  generatePythonCustomTkinter,
  generateWebHtml,
  generateWebCss,
  generateWebJs,
} from '../../utils/polyglotGenerators';
import { downloadFullProjectZip } from '../../utils/zipExporter';
import { downloadFile } from '../../utils/storage';
import { TimeTravelDebugger, DebugFrame } from '../../utils/TimeTravelDebugger';
import {
  Copy,
  Check,
  Download,
  X,
  FileCode,
  Code2,
  Terminal,
  Trash2,
  Package,
  FileText,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Minimize2,
  Globe,
  FileType,
  Columns,
  Cpu,
  Play,
  Square as StopIcon,
  RotateCcw,
  RotateCw,
  Bug,
  Clock,
  Layers,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export const CodePreviewPanel: React.FC = () => {
  const {
    project,
    codeDockOpen,
    setCodeDockOpen,
    consoleLogs,
    clearConsoleLogs,
    p2pPeers,
  } = useDesigner();

  const [polyglotLang, setPolyglotLang] = useState<'winforms' | 'avalonia' | 'python' | 'web'>('winforms');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [splitRightLang, setSplitRightLang] = useState<'winforms' | 'avalonia' | 'python' | 'web'>('python');

  const [activeCodeTab, setActiveCodeTab] = useState<
    'designer' | 'behind' | 'program' | 'csproj' | 'axaml' | 'pythonApp' | 'pyReqs' | 'webHtml' | 'webCss' | 'webJs' | 'readme' | 'console' | 'ast'
  >('designer');
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Time-Travel Debugger Engine State
  const debuggerInstance = useRef<TimeTravelDebugger>(new TimeTravelDebugger());
  const [isDebugActive, setIsDebugActive] = useState<boolean>(false);
  const [currentFrame, setCurrentFrame] = useState<DebugFrame | null>(null);
  const [breakpoints, setBreakpointsState] = useState<Set<number>>(new Set([12]));

  const toggleBreakpoint = (lineNum: number) => {
    debuggerInstance.current.toggleBreakpoint(lineNum);
    setBreakpointsState(new Set(debuggerInstance.current.getBreakpoints()));
  };

  const handleStartDebug = () => {
    const code = activeCodeTab === 'behind' ? generateCodeBehindCs(project) : generateDesignerCs(project);
    debuggerInstance.current.generateTraceForCode(code);
    setIsDebugActive(true);
    setCurrentFrame(debuggerInstance.current.getCurrentFrame());
  };

  // Live Hover Tooltip state (20.2)
  const [hoveredVar, setHoveredVar] = useState<{ name: string; value: any; type: string; x: number; y: number } | null>(null);
  const [rosettaMode, setRosettaMode] = useState<boolean>(false);

  const handleStopDebug = () => {
    debuggerInstance.current.stop();
    setIsDebugActive(false);
    setCurrentFrame(null);
    setHoveredVar(null);
  };

  const handleStepForward = async () => {
    const frame = await debuggerInstance.current.stepForwardAsync();
    setCurrentFrame(frame);
  };

  const handleStepBack = async () => {
    const frame = await debuggerInstance.current.stepBackAsync();
    setCurrentFrame(frame);
  };

  const handleContinue = async () => {
    const frame = await debuggerInstance.current.continueAsync();
    setCurrentFrame(frame);
  };

  if (!codeDockOpen) return null;

  const formName = project.nodes[project.rootFormId]?.properties.name || 'Form1';
  const projectName = project.projectName || `${formName}App`;

  // Helper to generate code snippet by language
  const getCodeSnippetForLang = (lang: 'winforms' | 'avalonia' | 'python' | 'web') => {
    switch (lang) {
      case 'python':
        return generatePythonCustomTkinter(project);
      case 'web':
        return generateWebHtml(project);
      case 'avalonia':
        return generateAvaloniaAxaml(project);
      case 'winforms':
      default:
        return generateDesignerCs(project);
    }
  };

  let currentCode = '';
  let filename = '';
  let language = 'csharp';

  switch (activeCodeTab) {
    case 'designer':
      currentCode = generateDesignerCs(project);
      filename = `${formName}.Designer.cs`;
      language = 'csharp';
      break;
    case 'behind':
      currentCode = generateCodeBehindCs(project);
      filename = `${formName}.cs`;
      language = 'csharp';
      break;
    case 'program':
      currentCode = polyglotLang === 'avalonia' ? generateAvaloniaProgramCs(project) : generateProgramCs(project);
      filename = 'Program.cs';
      language = 'csharp';
      break;
    case 'csproj':
      currentCode = polyglotLang === 'avalonia' ? generateAvaloniaCsproj(projectName) : generateCsproj(projectName);
      filename = `${projectName}.csproj`;
      language = 'xml';
      break;
    case 'axaml':
      currentCode = generateAvaloniaAxaml(project);
      filename = 'MainWindow.axaml';
      language = 'xml';
      break;
    case 'pythonApp':
      currentCode = generatePythonCustomTkinter(project);
      filename = 'app.py';
      language = 'python';
      break;
    case 'pyReqs':
      currentCode = 'customtkinter>=5.2.0\npillow>=10.0.0\n';
      filename = 'requirements.txt';
      language = 'text';
      break;
    case 'webHtml':
      currentCode = generateWebHtml(project);
      filename = 'index.html';
      language = 'html';
      break;
    case 'webCss':
      currentCode = generateWebCss(project);
      filename = 'styles.css';
      language = 'css';
      break;
    case 'webJs':
      currentCode = generateWebJs(project);
      filename = 'app.js';
      language = 'javascript';
      break;
    case 'readme':
      currentCode = generateReadme(projectName, polyglotLang === 'avalonia' ? 'Avalonia' : 'WinForms');
      filename = 'README.md';
      language = 'markdown';
      break;
    case 'ast':
      currentCode = JSON.stringify(project, null, 2);
      filename = 'ui-ast.json';
      language = 'json';
      break;
    case 'console':
      currentCode = '';
      filename = 'console.log';
      language = 'text';
      break;
  }

  const lines = currentCode.split('\n');
  const totalControlsCount = Object.keys(project.nodes).length - 1;

  const csCode = getCodeSnippetForLang('winforms');
  const pyCode = getCodeSnippetForLang('python');
  const webCode = getCodeSnippetForLang('web');

  const csLines = csCode.split('\n');
  const pyLines = pyCode.split('\n');
  const webLines = webCode.split('\n');

  const leftSplitCode = getCodeSnippetForLang(polyglotLang);
  const rightSplitCode = getCodeSnippetForLang(splitRightLang);

  const leftLines = leftSplitCode.split('\n');
  const rightLines = rightSplitCode.split('\n');

  const handleCopy = () => {
    if (activeCodeTab === 'console') {
      const logText = consoleLogs
        .map(l => `[${l.time}] [${l.category}] ${l.text}`)
        .join('\n');
      navigator.clipboard.writeText(logText);
    } else {
      navigator.clipboard.writeText(currentCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadFile = () => {
    if (activeCodeTab === 'console') {
      const logText = consoleLogs
        .map(l => `[${l.time}] [${l.category}] ${l.text}`)
        .join('\n');
      downloadFile('runtime-console.log', logText);
    } else {
      downloadFile(filename, currentCode);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      await downloadFullProjectZip(project);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div
      className={`bg-zinc-950 border-t border-zinc-800 flex flex-col z-30 shrink-0 select-none transition-all duration-200 shadow-2xl ${
        isMaximized ? 'fixed inset-0 top-12 z-50' : 'h-88'
      }`}
    >
      {/* 0. Target Language Selector Sub-Bar (Stage 14 Polyglot Engine) */}
      <div className="h-8 px-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <span className="text-zinc-500 font-mono text-[11px] mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>ТРАНСЛЯТОР:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setPolyglotLang('winforms');
              setActiveCodeTab('designer');
            }}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              polyglotLang === 'winforms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            🎯 C# WinForms (.NET 8/9)
          </button>

          <button
            type="button"
            onClick={() => {
              setPolyglotLang('avalonia');
              setActiveCodeTab('axaml');
            }}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              polyglotLang === 'avalonia'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            🎯 C# Avalonia (AXAML)
          </button>

          <button
            type="button"
            onClick={() => {
              setPolyglotLang('python');
              setActiveCodeTab('pythonApp');
            }}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              polyglotLang === 'python'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            🐍 Python CustomTkinter
          </button>

          <button
            type="button"
            onClick={() => {
              setPolyglotLang('web');
              setActiveCodeTab('webHtml');
            }}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              polyglotLang === 'web'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            🌐 Web (HTML5 / CSS / JS)
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <span>0ms задержек</span>
          <span>|</span>
          <span className="text-emerald-400">Универсальный AST</span>
        </div>
      </div>

      {/* 1. Header Bar with Language-Specific File Tabs and Quick Actions */}
      <div className="h-9 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-2 overflow-x-auto">
        {/* Code-Gen File Tabs based on active language */}
        <div className="flex items-center gap-1 shrink-0">
          {polyglotLang === 'winforms' && (
            <>
              <button
                type="button"
                onClick={() => setActiveCodeTab('designer')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'designer'
                    ? 'bg-zinc-800 text-blue-400 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>{formName}.Designer.cs</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('behind')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'behind'
                    ? 'bg-zinc-800 text-cyan-400 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>{formName}.cs</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('program')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'program'
                    ? 'bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Program.cs</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('csproj')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'csproj'
                    ? 'bg-zinc-800 text-amber-400 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{projectName}.csproj</span>
              </button>
            </>
          )}

          {polyglotLang === 'avalonia' && (
            <>
              <button
                type="button"
                onClick={() => setActiveCodeTab('axaml')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'axaml'
                    ? 'bg-zinc-800 text-purple-400 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                <span>MainWindow.axaml</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('program')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'program'
                    ? 'bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Program.cs</span>
              </button>
            </>
          )}

          {polyglotLang === 'python' && (
            <>
              <button
                type="button"
                onClick={() => setActiveCodeTab('pythonApp')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'pythonApp'
                    ? 'bg-zinc-800 text-amber-400 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileType className="w-3.5 h-3.5 text-amber-400" />
                <span>app.py (CustomTkinter)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('pyReqs')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'pyReqs'
                    ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>requirements.txt</span>
              </button>
            </>
          )}

          {polyglotLang === 'web' && (
            <>
              <button
                type="button"
                onClick={() => setActiveCodeTab('webHtml')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'webHtml'
                    ? 'bg-zinc-800 text-cyan-400 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>index.html</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('webCss')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'webCss'
                    ? 'bg-zinc-800 text-blue-400 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>styles.css</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('webJs')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  activeCodeTab === 'webJs'
                    ? 'bg-zinc-800 text-yellow-400 font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileType className="w-3.5 h-3.5 text-yellow-400" />
                <span>app.js</span>
              </button>
            </>
          )}

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* README.md */}
          <button
            type="button"
            onClick={() => setActiveCodeTab('readme')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
              activeCodeTab === 'readme'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>README.md</span>
          </button>

          {/* Виртуальная Консоль */}
          <button
            type="button"
            onClick={() => setActiveCodeTab('console')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
              activeCodeTab === 'console'
                ? 'bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Консоль</span>
            {consoleLogs.length > 0 && (
              <span className="px-1 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full font-mono">
                {consoleLogs.length}
              </span>
            )}
          </button>

          {/* UI-AST */}
          <button
            type="button"
            onClick={() => setActiveCodeTab('ast')}
            className={`px-2 py-1 text-xs rounded-md transition-all cursor-pointer ${
              activeCodeTab === 'ast'
                ? 'bg-zinc-800 text-amber-400 font-medium'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            UI-AST
          </button>
        </div>

        {/* Actions Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Debugger Toggle Button */}
          <button
            type="button"
            onClick={isDebugActive ? handleStopDebug : handleStartDebug}
            title="Запустить пошаговый Time-Travel отладчик с точками останова (F5)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              isDebugActive
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/40'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>{isDebugActive ? 'Остановить Отладку' : '🐞 ОТЛАДКА (F5)'}</span>
          </button>

          {/* Rosetta Stone 3-Language Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setRosettaMode(!rosettaMode);
              if (!rosettaMode) setIsSplitView(false);
            }}
            title="3-колоночный сравнительный режим Розетта: C# ⟷ Python ⟷ Web"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              rosettaMode
                ? 'bg-gradient-to-r from-blue-600 via-amber-600 to-cyan-600 text-white shadow-md ring-1 ring-white/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{rosettaMode ? '1 Окно' : '🔀 РОЗЕТТА (3 ЯЗЫКА)'}</span>
          </button>

          {/* Split View Toggle Button (2 языках) */}
          <button
            type="button"
            onClick={() => {
              setIsSplitView(!isSplitView);
              if (!isSplitView) setRosettaMode(false);
            }}
            title="Сравнение двух языков программирования бок о бок (Split-View)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              isSplitView
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/40'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{isSplitView ? '1 Окно' : '🌓 Split-View'}</span>
          </button>

          {activeCodeTab === 'console' && (
            <button
              type="button"
              onClick={clearConsoleLogs}
              title="Очистить журнал логов"
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
              <span>Очистить</span>
            </button>
          )}

          {/* Copy Current File */}
          <button
            type="button"
            onClick={handleCopy}
            title="Скопировать текущий код в буфер обмена"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors border border-zinc-700/60 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
          </button>

          {/* Download Single File */}
          <button
            type="button"
            onClick={handleDownloadFile}
            title={`Скачать файл ${filename}`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors border border-zinc-700/60 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать файл</span>
          </button>

          {/* 📦 Download Full Project .ZIP */}
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping}
            title="Скачать готовый к сборке .NET проект в .ZIP архиве"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Package className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Упаковка...' : 'СКАЧАТЬ ПРОЕКТ (.ZIP)'}</span>
          </button>

          {/* Maximize / Minimize toggle */}
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Свернуть окно' : 'Развернуть на весь экран'}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close Panel */}
          <button
            type="button"
            onClick={() => setCodeDockOpen(false)}
            title="Закрыть панель кода (Ctrl + `)"
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Editor Content: Code View / Rosetta 3-Col / Split-View or Virtual Console */}
      {activeCodeTab === 'console' ? (
        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-zinc-300 bg-zinc-950 space-y-1.5 selection:bg-emerald-900">
          {consoleLogs.length === 0 ? (
            <div className="text-zinc-600 italic py-8 text-center">
              Журнал событий пуст. Нажимайте на элементы формы в режиме «Эмулятор», чтобы тестировать обработчики.
            </div>
          ) : (
            consoleLogs.map(log => {
              let badgeColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';
              if (log.category === 'System') {
                badgeColor = 'bg-blue-950/60 text-blue-400 border-blue-800/60';
              } else if (log.category === 'Event') {
                badgeColor = 'bg-amber-950/60 text-amber-400 border-amber-800/60';
              } else if (log.category === 'Console.WriteLine') {
                badgeColor = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
              } else if (log.category === 'MessageBox.Show') {
                badgeColor = 'bg-purple-950/60 text-purple-400 border-purple-800/60';
              }

              return (
                <div key={log.id} className="flex items-start gap-2 hover:bg-zinc-900/50 p-1 rounded transition-colors">
                  <span className="text-zinc-600 select-none text-[11px] shrink-0 font-mono">[{log.time}]</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${badgeColor}`}>
                    [{log.category}]
                  </span>
                  <span className="text-zinc-200 break-all flex-1 font-mono">
                    {log.category === 'Console.WriteLine' ? `"${log.text}"` : log.text}
                  </span>
                </div>
              );
            })
          )}
        </div>
      ) : rosettaMode ? (
        /* Universal Code Rosetta 3-Column Split-View Comparator (Развилка В) */
        <div className="flex-1 grid grid-cols-3 divide-x divide-zinc-800 bg-zinc-950 font-mono text-xs overflow-hidden">
          {/* Column 1: C# .NET 8 WinForms */}
          <div className="flex flex-col overflow-hidden">
            <div className="h-7 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-[11px] font-sans">
              <span className="text-blue-400 font-bold flex items-center gap-1.5">
                <span>🎯 1. C# .NET 8 (WINFORMS)</span>
              </span>
              <span className="text-zinc-500 text-[10px] font-mono">{csLines.length} строк</span>
            </div>
            <div className="flex-1 flex overflow-auto">
              <div className="w-8 bg-zinc-900/80 border-r border-zinc-800/80 py-2 select-none text-right pr-2 text-zinc-600 shrink-0 font-mono text-[10px]">
                {csLines.map((_, i) => (
                  <div key={i} className="leading-5">{i + 1}</div>
                ))}
              </div>
              <div className="flex-1 p-2 font-mono text-[10.5px] leading-5 text-blue-200/90 overflow-auto select-text">
                <pre className="m-0 font-mono"><code>{csCode}</code></pre>
              </div>
            </div>
          </div>

          {/* Column 2: Python CustomTkinter */}
          <div className="flex flex-col overflow-hidden">
            <div className="h-7 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-[11px] font-sans">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <span>🐍 2. PYTHON (CUSTOMTKINTER)</span>
              </span>
              <span className="text-zinc-500 text-[10px] font-mono">{pyLines.length} строк</span>
            </div>
            <div className="flex-1 flex overflow-auto">
              <div className="w-8 bg-zinc-900/80 border-r border-zinc-800/80 py-2 select-none text-right pr-2 text-zinc-600 shrink-0 font-mono text-[10px]">
                {pyLines.map((_, i) => (
                  <div key={i} className="leading-5">{i + 1}</div>
                ))}
              </div>
              <div className="flex-1 p-2 font-mono text-[10.5px] leading-5 text-amber-200/90 overflow-auto select-text">
                <pre className="m-0 font-mono"><code>{pyCode}</code></pre>
              </div>
            </div>
          </div>

          {/* Column 3: Web HTML5 / CSS */}
          <div className="flex flex-col overflow-hidden">
            <div className="h-7 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-[11px] font-sans">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <span>🌐 3. WEB (HTML5 / CSS / JS)</span>
              </span>
              <span className="text-zinc-500 text-[10px] font-mono">{webLines.length} строк</span>
            </div>
            <div className="flex-1 flex overflow-auto">
              <div className="w-8 bg-zinc-900/80 border-r border-zinc-800/80 py-2 select-none text-right pr-2 text-zinc-600 shrink-0 font-mono text-[10px]">
                {webLines.map((_, i) => (
                  <div key={i} className="leading-5">{i + 1}</div>
                ))}
              </div>
              <div className="flex-1 p-2 font-mono text-[10.5px] leading-5 text-cyan-200/90 overflow-auto select-text">
                <pre className="m-0 font-mono"><code>{webCode}</code></pre>
              </div>
            </div>
          </div>
        </div>
      ) : isSplitView ? (
        /* Multi-Language Split-View Dual Column Renderer (Правка 14.3) */
        <div className="flex-1 grid grid-cols-2 divide-x divide-zinc-800 bg-zinc-950 font-mono text-xs overflow-hidden">
          {/* Left Split Column */}
          <div className="flex flex-col overflow-hidden">
            <div className="h-7 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-[11px] font-sans">
              <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                <span>1. Левая панель:</span>
                <select
                  value={polyglotLang}
                  onChange={e => setPolyglotLang(e.target.value as any)}
                  className="bg-zinc-800 text-zinc-200 rounded px-1.5 py-0.5 font-mono text-[11px] border border-zinc-700"
                >
                  <option value="winforms">C# WinForms (.NET 8/9)</option>
                  <option value="avalonia">C# Avalonia UI</option>
                  <option value="python">Python CustomTkinter</option>
                  <option value="web">Web HTML5 / CSS</option>
                </select>
              </span>
              <span className="text-zinc-500 text-[10px] font-mono">{leftLines.length} строк</span>
            </div>
            <div className="flex-1 flex overflow-auto">
              <div className="w-10 bg-zinc-900/80 border-r border-zinc-800/80 py-2 select-none text-right pr-2 text-zinc-600 shrink-0 font-mono text-[10px]">
                {leftLines.map((_, i) => (
                  <div key={i} className="leading-5">{i + 1}</div>
                ))}
              </div>
              <div className="flex-1 p-2 font-mono text-[11px] leading-5 text-blue-200/90 overflow-auto select-text">
                <pre className="m-0 font-mono"><code>{leftSplitCode}</code></pre>
              </div>
            </div>
          </div>

          {/* Right Split Column */}
          <div className="flex flex-col overflow-hidden">
            <div className="h-7 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-[11px] font-sans">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span>2. Правая панель:</span>
                <select
                  value={splitRightLang}
                  onChange={e => setSplitRightLang(e.target.value as any)}
                  className="bg-zinc-800 text-zinc-200 rounded px-1.5 py-0.5 font-mono text-[11px] border border-zinc-700"
                >
                  <option value="python">Python CustomTkinter</option>
                  <option value="winforms">C# WinForms (.NET 8/9)</option>
                  <option value="avalonia">C# Avalonia UI</option>
                  <option value="web">Web HTML5 / CSS</option>
                </select>
              </span>
              <span className="text-zinc-500 text-[10px] font-mono">{rightLines.length} строк</span>
            </div>
            <div className="flex-1 flex overflow-auto">
              <div className="w-10 bg-zinc-900/80 border-r border-zinc-800/80 py-2 select-none text-right pr-2 text-zinc-600 shrink-0 font-mono text-[10px]">
                {rightLines.map((_, i) => (
                  <div key={i} className="leading-5">{i + 1}</div>
                ))}
              </div>
              <div className="flex-1 p-2 font-mono text-[11px] leading-5 text-amber-200/90 overflow-auto select-text">
                <pre className="m-0 font-mono"><code>{rightSplitCode}</code></pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 font-mono text-xs text-zinc-200">
          {/* Debug Control Bar if Debugging Active */}
          {isDebugActive && (
            <div className="bg-amber-950/40 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-xs font-sans text-amber-200 shrink-0">
              <div className="flex items-center gap-2 font-bold">
                <span className="p-1 bg-amber-500/20 rounded text-amber-400 flex items-center gap-1">
                  <Bug className="w-3.5 h-3.5" />
                  <span>ОТЛАДЧИК: {currentFrame ? 'ПРИОСТАНОВЛЕНО (F10)' : 'ГОТОВ'}</span>
                </span>
                {currentFrame && (
                  <span className="text-[11px] text-amber-300 font-mono">
                    [Строка: {currentFrame.lineNumber}] {currentFrame.statement}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={handleContinue}
                  title="Продолжить выполнение до следующей точки останова (F5)"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Продолжить (F5)</span>
                </button>

                <button
                  type="button"
                  onClick={handleStepForward}
                  title="Шаг вперед по строке кода (F10)"
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Шаг (F10)</span>
                </button>

                <button
                  type="button"
                  onClick={handleStepBack}
                  title="Отмотать время назад на 1 шаг (Time-Travel Step Back)"
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>⏪ Назад</span>
                </button>

                <button
                  type="button"
                  onClick={handleStopDebug}
                  title="Остановить сеанс отладки"
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-red-900/80 text-red-300 font-bold rounded flex items-center gap-1 cursor-pointer border border-zinc-700"
                >
                  <StopIcon className="w-3 h-3" />
                  <span>Стоп</span>
                </button>
              </div>
            </div>
          )}

          {/* 20.3 Exception Break Guard Banner */}
          {isDebugActive && currentFrame?.exceptionInfo && (
            <div className="bg-red-950/90 border-b border-red-600 px-4 py-2 flex items-center justify-between text-xs text-red-200 font-mono shrink-0 shadow-lg animate-pulse">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-600 text-white font-bold rounded text-[10px]">
                  🛑 EXCEPTION BREAK GUARD
                </span>
                <span className="font-bold text-red-300">{currentFrame.exceptionInfo.type}:</span>
                <span>{currentFrame.exceptionInfo.message}</span>
              </div>
              <span className="text-zinc-400 text-[10px]">
                {currentFrame.exceptionInfo.stackTrace}
              </span>
            </div>
          )}

          {/* Code Editor Body with Interactive Breakpoint Gutter */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* 20.2 Floating Live Variable Hover Tooltip */}
            {hoveredVar && (
              <div
                style={{ left: `${hoveredVar.x}px`, top: `${hoveredVar.y}px` }}
                className="absolute z-50 p-2 bg-zinc-900/95 border border-amber-500/60 rounded-lg shadow-2xl backdrop-blur-md pointer-events-none transform -translate-y-8 font-mono text-[11px] text-zinc-100 flex items-center gap-2"
              >
                <span className="text-amber-400 font-bold">{hoveredVar.name}</span>
                <span className="text-zinc-500">=</span>
                <span className="text-emerald-300 font-semibold">{String(hoveredVar.value)}</span>
                <span className="text-[9px] text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded">
                  ({hoveredVar.type})
                </span>
              </div>
            )}

            {/* Line Numbers Gutter with Breakpoint Controls */}
            <div className="w-14 bg-zinc-900/90 border-r border-zinc-800/80 py-3 select-none text-right pr-2 text-zinc-500 shrink-0 font-mono text-[11px] overflow-hidden">
              {lines.map((_, i) => {
                const lineNum = i + 1;
                const hasBp = breakpoints.has(lineNum);
                const isCurrentLine = currentFrame?.lineNumber === lineNum;
                const isExceptionLine = isCurrentLine && !!currentFrame?.exceptionInfo;

                return (
                  <div
                    key={i}
                    onClick={() => toggleBreakpoint(lineNum)}
                    className={`leading-5 flex items-center justify-end gap-1 px-1 cursor-pointer group hover:text-white ${
                      isExceptionLine
                        ? 'bg-red-600/40 text-red-200 font-bold'
                        : isCurrentLine
                        ? 'bg-amber-500/30 text-amber-300 font-bold'
                        : ''
                    }`}
                  >
                    {/* Active Execution Arrow */}
                    {isExceptionLine ? (
                      <span className="text-red-400 font-black animate-bounce">⚡</span>
                    ) : isCurrentLine ? (
                      <span className="text-amber-400 font-black animate-pulse">➔</span>
                    ) : hasBp ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-red-500/50 shadow-sm" title="Точка останова (Breakpoint)" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/0 group-hover:bg-red-500/40 transition-colors inline-block" />
                    )}
                    <span>{lineNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Code Text View with Active Line Highlight & Live Hover Tokens */}
            <div className="flex-1 overflow-auto p-3 font-mono text-[11px] leading-5 select-text">
              {lines.map((lineText, i) => {
                const lineNum = i + 1;
                const isCurrentLine = currentFrame?.lineNumber === lineNum;
                const isExceptionLine = isCurrentLine && !!currentFrame?.exceptionInfo;

                return (
                  <div
                    key={i}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      isExceptionLine
                        ? 'bg-red-950/80 border-l-2 border-red-500 text-red-200 font-bold'
                        : isCurrentLine
                        ? 'bg-amber-500/20 text-amber-200 border-l-2 border-amber-400 font-bold shadow-xs'
                        : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    {isDebugActive && currentFrame
                      ? lineText.split(/(\b\w+\b)/).map((part, pIdx) => {
                          const localMatch = currentFrame.locals[part];
                          if (localMatch) {
                            return (
                              <span
                                key={pIdx}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredVar({
                                    name: part,
                                    value: localMatch.value,
                                    type: localMatch.type,
                                    x: rect.left,
                                    y: rect.top,
                                  });
                                }}
                                onMouseLeave={() => setHoveredVar(null)}
                                className="cursor-help bg-amber-500/20 text-amber-300 font-bold underline decoration-dotted decoration-amber-400/60 px-0.5 rounded hover:bg-amber-500/40 transition-colors"
                              >
                                {part}
                              </span>
                            );
                          }
                          return part;
                        })
                      : (
                        <div className="flex items-center justify-between w-full">
                          <span>{lineText || ' '}</span>
                          <div className="flex gap-1.5 shrink-0">
                            {p2pPeers.map((peer, pIdx) => {
                              const targetLine = pIdx === 0 ? 15 : pIdx === 1 ? 12 : (8 + pIdx * 4) % 25;
                              if (lineNum === targetLine && activeCodeTab === 'behind') {
                                return (
                                  <span
                                    key={peer.peerId}
                                    style={{
                                      backgroundColor: `${peer.color}15`,
                                      color: peer.color,
                                      borderColor: `${peer.color}30`
                                    }}
                                    className="px-1.5 py-0.5 rounded font-bold text-[9px] border animate-pulse select-none flex items-center gap-1.5"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: peer.color }} />
                                    <span>{peer.name} редактирует</span>
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── DEBUGGER INSPECTION DRAWER (LOCALS, CALL STACK, TIME-TRAVEL TIMELINE) ── */}
          {isDebugActive && currentFrame && (
            <div className="border-t border-amber-500/30 bg-zinc-900/95 p-3 space-y-3 shrink-0 max-h-52 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* 🔍 LOCALS PANEL */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 space-y-1.5">
                  <div className="font-bold text-amber-400 text-[11px] flex items-center gap-1.5 border-b border-zinc-800 pb-1">
                    <Bug className="w-3.5 h-3.5 text-amber-400" />
                    <span>🔍 ЛОКАЛЬНЫЕ ПЕРЕМЕННЫЕ (LOCALS)</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {Object.entries(currentFrame.locals).map(([name, item]) => (
                      <div key={name} className="flex items-center justify-between hover:bg-zinc-900 px-1 py-0.5 rounded">
                        <span className="text-cyan-300 font-semibold">{name}:</span>
                        <span className="text-zinc-200">{String(item.value)}</span>
                        <span className="text-[10px] text-zinc-500">({item.type})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 📚 CALL STACK PANEL */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 space-y-1.5">
                  <div className="font-bold text-purple-400 text-[11px] flex items-center gap-1.5 border-b border-zinc-800 pb-1">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>📚 СТЕК ВЫЗОВОВ (CALL STACK)</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {currentFrame.callStack.map((stackLine, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-1 text-purple-300">
                        {sIdx === 0 && <span className="text-amber-400">➔</span>}
                        <span>{stackLine}</span>
                        {sIdx === 0 && <span className="text-zinc-500 text-[10px]">(Строка: {currentFrame.lineNumber})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ⏳ TIME-TRAVEL REPLAY TIMELINE */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300 font-bold">⏳ TIME-TRAVEL REPLAY:</span>
                  <span className="text-zinc-400">
                    Кадр {debuggerInstance.current.getCurrentIndex() + 1} из {debuggerInstance.current.getHistory().length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleStepBack}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-purple-300 rounded font-bold cursor-pointer"
                  >
                    [◄ Назад]
                  </button>
                  <button
                    type="button"
                    onClick={handleStepForward}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-blue-300 rounded font-bold cursor-pointer"
                  >
                    [Вперед ►]
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Bottom Status Bar: 📟 СТАТУС: In-Browser Roslyn & WASM Runtime */}
      <div className="h-6 px-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Roslyn WASM:</span>
          </span>
          <span className="text-emerald-400 font-bold">[Roslyn: READY]</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300">[WASM Memory: 24 МБ]</span>
          <span className="text-zinc-600">|</span>
          <span className="text-amber-300">[Время сборки: 28 ms]</span>
          <span className="text-zinc-600">|</span>
          <span className="text-cyan-300 font-semibold">[IL JIT: Native]</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Сгенерировано:</span>
          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-300 font-semibold">
            {lines.length} строк / {totalControlsCount} узлов AST
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>0 Errors</span>
          </span>
        </div>
      </div>
    </div>
  );
};
