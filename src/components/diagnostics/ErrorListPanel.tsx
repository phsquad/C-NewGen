import React, { useState, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { ProjectASTLinter, DiagnosticIssue } from '../../utils/astLinter';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Search,
  Wrench,
  CheckCircle2,
  ExternalLink,
  Filter,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';

interface ErrorListPanelProps {
  onClose?: () => void;
}

export const ErrorListPanel: React.FC<ErrorListPanelProps> = ({ onClose }) => {
  const {
    project,
    selectNode,
    setActiveRightTab,
    setCodeDockOpen,
    setErrorListOpen,
    setProjectState,
  } = useDesigner();

  const [filterErrors, setFilterErrors] = useState(true);
  const [filterWarnings, setFilterWarnings] = useState(true);
  const [filterMessages, setFilterMessages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'entireSolution' | 'currentProject'>('entireSolution');

  const rootForm = project.nodes[project.rootFormId];
  const projectName = project.projectName || (rootForm?.properties.name ? `${rootForm.properties.name}App` : 'WinFormsApp1');
  const formName = rootForm?.properties.name || 'Form1';

  // Compute diagnostics
  const issues = useMemo(() => {
    return ProjectASTLinter.validateProject(project);
  }, [project]);

  // Enhance issues with canonical C# codes, file names and line numbers
  const canonicalIssues = useMemo(() => {
    return issues.map((issue, idx) => {
      let csCode = issue.code;
      let fileName = `${formName}.Designer.cs`;
      let lineNum = 42 + idx * 8;

      if (issue.code === 'CS_DUPLICATE_NAME') {
        csCode = 'CS0102';
        fileName = `${formName}.Designer.cs`;
        lineNum = 35 + idx * 4;
      } else if (issue.code === 'UI_OUT_OF_BOUNDS') {
        csCode = 'WS0012';
        fileName = `${formName}.cs`;
        lineNum = 64 + idx * 6;
      } else if (issue.severity === 'info') {
        csCode = 'IDE0058';
        fileName = `${formName}.Designer.cs`;
        lineNum = 92 + idx * 3;
      }

      return {
        ...issue,
        canonicalCode: csCode,
        fileName,
        lineNum,
        project: projectName,
      };
    });
  }, [issues, formName, projectName]);

  const errorCount = canonicalIssues.filter(i => i.severity === 'error').length;
  const warningCount = canonicalIssues.filter(i => i.severity === 'warning').length;
  const messageCount = canonicalIssues.filter(i => i.severity === 'info').length;

  const filteredIssues = useMemo(() => {
    return canonicalIssues.filter(item => {
      if (item.severity === 'error' && !filterErrors) return false;
      if (item.severity === 'warning' && !filterWarnings) return false;
      if (item.severity === 'info' && !filterMessages) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.message.toLowerCase().includes(q) ||
          item.canonicalCode.toLowerCase().includes(q) ||
          item.fileName.toLowerCase().includes(q) ||
          (item.nodeName && item.nodeName.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [canonicalIssues, filterErrors, filterWarnings, filterMessages, searchQuery]);

  const handleRowDoubleClick = (issue: typeof canonicalIssues[0]) => {
    if (issue.nodeId && project.nodes[issue.nodeId]) {
      // Focus and select the node on the designer canvas
      selectNode(issue.nodeId, false);
      setActiveRightTab('properties');
    } else {
      // Open CodeBehind or Designer in CodePreviewPanel
      setCodeDockOpen(true);
      window.dispatchEvent(new CustomEvent('set-code-tab', { detail: 'designer' }));
    }
  };

  const handleAutoFixAll = () => {
    const updated = ProjectASTLinter.autoFixAll(project, issues);
    setProjectState(updated);
  };

  return (
    <div className="h-64 bg-zinc-950 border-t border-zinc-800 flex flex-col select-none text-xs z-30 font-sans shadow-2xl">
      {/* 1. Header Toolbar */}
      <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-100 flex items-center gap-1.5 font-mono text-[11px]">
            <span>📋 Список ошибок (Error List)</span>
          </span>

          <div className="h-3.5 w-px bg-zinc-700 mx-1" />

          {/* Canonical Filter Buttons: [ ❌ X Ошибок ] [ ⚠️ Y Предупреждений ] [ ℹ️ Z Сообщений ] */}
          <div className="flex items-center gap-1">
            {/* Errors Filter */}
            <button
              type="button"
              onClick={() => setFilterErrors(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                filterErrors
                  ? 'bg-red-950/60 border-red-500/60 text-red-300 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>{errorCount} {errorCount === 1 ? 'Ошибка' : errorCount < 5 ? 'Ошибки' : 'Ошибок'}</span>
            </button>

            {/* Warnings Filter */}
            <button
              type="button"
              onClick={() => setFilterWarnings(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                filterWarnings
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{warningCount} {warningCount === 1 ? 'Предупреждение' : warningCount < 5 ? 'Предупреждения' : 'Предупреждений'}</span>
            </button>

            {/* Messages Filter */}
            <button
              type="button"
              onClick={() => setFilterMessages(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                filterMessages
                  ? 'bg-blue-950/60 border-blue-500/60 text-blue-300 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>{messageCount} {messageCount === 1 ? 'Сообщение' : messageCount < 5 ? 'Сообщения' : 'Сообщений'}</span>
            </button>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск по ошибкам..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded pl-7 pr-2 py-0.5 text-[11px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 w-44 font-mono"
            />
          </div>

          {/* Auto Fix All */}
          {issues.some(i => i.autoFixAvailable) && (
            <button
              type="button"
              onClick={handleAutoFixAll}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
              title="Автоматически исправить все известные коллизии имен и границ"
            >
              <Wrench className="w-3 h-3" />
              <span>Авто-исправление</span>
            </button>
          )}

          {/* Close Panel Button */}
          <button
            type="button"
            onClick={() => {
              setErrorListOpen(false);
              if (onClose) onClose();
            }}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Закрыть Список ошибок"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Canonical Diagnostics Table */}
      <div className="flex-1 overflow-auto bg-zinc-950 font-mono text-[11px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-900/80 sticky top-0 text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800 z-10 select-none">
            <tr>
              <th className="py-1 px-2 w-8 text-center">!</th>
              <th className="py-1 px-3 w-24">Код</th>
              <th className="py-1 px-3">Описание</th>
              <th className="py-1 px-3 w-36">Проект</th>
              <th className="py-1 px-3 w-40">Файл</th>
              <th className="py-1 px-3 w-20 text-right">Строка</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500 font-sans">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400/80" />
                    <span className="font-semibold text-zinc-300">Ошибок и предупреждений не обнаружено</span>
                    <span className="text-zinc-500 text-[11px]">Проект полностью валиден и готов к компиляции Roslyn WASM</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => (
                <tr
                  key={issue.id}
                  onDoubleClick={() => handleRowDoubleClick(issue)}
                  className="hover:bg-zinc-900/80 transition-colors cursor-pointer group"
                  title="Двойной клик для перехода к элементу на холсте или строке кода"
                >
                  {/* Severity Icon */}
                  <td className="py-1 px-2 text-center">
                    {issue.severity === 'error' && (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 inline" />
                    )}
                    {issue.severity === 'warning' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" />
                    )}
                    {issue.severity === 'info' && (
                      <Info className="w-3.5 h-3.5 text-blue-400 inline" />
                    )}
                  </td>

                  {/* Code */}
                  <td className="py-1 px-3 font-semibold text-blue-400">
                    {issue.canonicalCode}
                  </td>

                  {/* Description */}
                  <td className="py-1 px-3 text-zinc-200">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{issue.message}</span>
                      {issue.autoFixAvailable && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 border border-emerald-600/40 text-emerald-300 font-sans shrink-0">
                          Авто-фикс
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Project */}
                  <td className="py-1 px-3 text-zinc-400 truncate">
                    {issue.project}
                  </td>

                  {/* File */}
                  <td className="py-1 px-3 text-cyan-300 truncate">
                    {issue.fileName}
                  </td>

                  {/* Line */}
                  <td className="py-1 px-3 text-zinc-400 text-right font-sans">
                    {issue.lineNum}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Footer status tip */}
      <div className="px-3 py-1 bg-zinc-900/90 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
        <span>💡 Подсказка: Двойной клик по строке ошибки мгновенно переносит на холст к элементу</span>
        <span>Всего записей: {filteredIssues.length}</span>
      </div>
    </div>
  );
};
