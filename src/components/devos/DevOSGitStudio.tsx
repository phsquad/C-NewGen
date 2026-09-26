import React, { useState, useEffect } from 'react';
import {
  DevOSGitEngine,
  GitCommitRecord,
  GitChangedFile,
  FileDiffLine,
  ShadowCheckpoint,
  MergeConflictState,
} from '../../utils/DevOSGitEngine';
import { useDesigner } from '../../context/DesignerContext';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  FolderGit2,
  Plus,
  RefreshCw,
  Send,
  UploadCloud,
  FileCode,
  CheckSquare,
  Square,
  Clock,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Key,
  Globe,
  Trash2,
  ChevronRight,
  Info,
} from 'lucide-react';

export const DevOSGitStudio: React.FC = () => {
  const { project } = useDesigner();

  // Git state
  const [currentBranch, setCurrentBranch] = useState(DevOSGitEngine.getCurrentBranch());
  const [branches, setBranches] = useState<string[]>(DevOSGitEngine.getBranches());
  const [commits, setCommits] = useState<GitCommitRecord[]>(DevOSGitEngine.getCommits());
  const [changedFiles, setChangedFiles] = useState<GitChangedFile[]>(DevOSGitEngine.getChangedFiles());
  const [selectedFilePath, setSelectedFilePath] = useState<string>('Form1.Designer.cs');

  // Form input for Commit
  const [commitMessage, setCommitMessage] = useState('Редизайн кнопки входа и стилей');
  const [authorName, setAuthorName] = useState(project.author || 'Александр');
  const [authorEmail, setAuthorEmail] = useState('sashav290@gmail.com');

  // Modal for GitHub Token & Repo Creation (Fix 23.1)
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [ghToken, setGhToken] = useState(DevOSGitEngine.getGitHubConfig().token);
  const [ghRepoName, setGhRepoName] = useState(`${project.projectName || 'MyLabApp'}-repo`);
  const [ghIsPrivate, setGhIsPrivate] = useState(false);
  const [ghStatusMessage, setGhStatusMessage] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);

  // New Branch modal
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState('');

  // Shadow Checkpoints (Fix 23.3)
  const [checkpoints, setCheckpoints] = useState<ShadowCheckpoint[]>(DevOSGitEngine.getCheckpoints());
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // Branch V: Merge & Conflict Resolver State
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [selectedMergeBranch, setSelectedMergeBranch] = useState('feature/ui-redesign');
  const [activeConflict, setActiveConflict] = useState<MergeConflictState | null>(null);
  const [conflictResolvedCode, setConflictResolvedCode] = useState('');

  const handleStartMerge = () => {
    const conflict = DevOSGitEngine.simulateBranchMerge(selectedMergeBranch, currentBranch);
    setActiveConflict(conflict);
    setConflictResolvedCode(conflict.ourCode);
    setIsMergeModalOpen(false);
  };

  const handleChoiceOurs = () => {
    if (activeConflict) setConflictResolvedCode(activeConflict.ourCode);
  };

  const handleChoiceTheirs = () => {
    if (activeConflict) setConflictResolvedCode(activeConflict.theirCode);
  };

  const handleChoiceBoth = () => {
    if (activeConflict) {
      setConflictResolvedCode(
        `${activeConflict.ourCode}\n\n// --- Combined with ${activeConflict.sourceBranch} ---\n${activeConflict.theirCode}`
      );
    }
  };

  const handleFinishMerge = () => {
    if (activeConflict) {
      DevOSGitEngine.resolveConflictCommit(activeConflict, conflictResolvedCode, authorName, authorEmail);
      setActiveConflict(null);
      refreshGitState();
    }
  };

  const selectedFile = changedFiles.find((f) => f.filepath === selectedFilePath) || changedFiles[0];

  const refreshGitState = () => {
    setCurrentBranch(DevOSGitEngine.getCurrentBranch());
    setBranches(DevOSGitEngine.getBranches());
    setCommits(DevOSGitEngine.getCommits());
    setCheckpoints(DevOSGitEngine.getCheckpoints());
  };

  // Create local commit
  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    DevOSGitEngine.createCommit(commitMessage, authorName, authorEmail);
    setCommitMessage('');
    refreshGitState();
  };

  // Toggle Staging for File
  const handleToggleFileStaging = (filepath: string) => {
    setChangedFiles((prev) =>
      prev.map((f) => (f.filepath === filepath ? { ...f, staged: !f.staged } : f))
    );
  };

  // Toggle Staging for Line (Fix 23.2 Selective Line Staging)
  const handleToggleLineStaging = (lineIndex: number) => {
    setChangedFiles((prev) =>
      prev.map((f) => {
        if (f.filepath !== selectedFilePath) return f;
        const updatedLines = f.diffLines.map((l, idx) =>
          idx === lineIndex ? { ...l, staged: !l.staged } : l
        );
        return { ...f, diffLines: updatedLines };
      })
    );
  };

  // Switch or Create Branch
  const handleSwitchBranch = (branchName: string) => {
    DevOSGitEngine.switchBranch(branchName);
    refreshGitState();
  };

  const handleCreateNewBranch = () => {
    if (newBranchInput.trim()) {
      DevOSGitEngine.createBranch(newBranchInput);
      setNewBranchInput('');
      setIsNewBranchModalOpen(false);
      refreshGitState();
    }
  };

  // 23.1 1-Click GitHub Repository Creator & Push
  const handleCreateGitHubRepo = async () => {
    if (!ghToken.trim()) {
      setGhStatusMessage('❌ Ошибка: Введите GitHub Personal Access Token');
      return;
    }

    setIsPushing(true);
    setGhStatusMessage(null);

    try {
      const result = await DevOSGitEngine.createAndPushToGitHub(ghRepoName, ghIsPrivate, ghToken);
      setGhStatusMessage(`✅ Репозиторий успешно создан и загружен на GitHub: ${result.htmlUrl}`);
      refreshGitState();
    } catch (err: any) {
      setGhStatusMessage(`❌ ${err.message || 'Ошибка подключения к GitHub API'}`);
    } finally {
      setIsPushing(false);
    }
  };

  // 23.3 Restore Shadow Checkpoint
  const handleRestoreCheckpoint = (chkId: string) => {
    const restored = DevOSGitEngine.restoreCheckpoint(chkId);
    if (restored) {
      setRestoreMessage(`Откат выполнен! Состояние проекта восстановлено до уровня "${restored.message}".`);
      refreshGitState();
      setTimeout(() => setRestoreMessage(null), 4000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-200 font-sans select-none overflow-hidden">
      {/* ── TOOLBAR HEADER ── */}
      <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Branch Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 font-mono text-xs">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <select
              value={currentBranch}
              onChange={(e) => handleSwitchBranch(e.target.value)}
              className="bg-transparent text-white font-bold border-none focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b} value={b} className="bg-zinc-900 text-white">
                  {b}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsNewBranchModalOpen(true)}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-zinc-700/60 flex items-center gap-1"
            title="Создать новую ветку"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Новая ветка</span>
          </button>

          {/* Branch V: Merge Branch Button */}
          <button
            type="button"
            onClick={() => setIsMergeModalOpen(true)}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-amber-950/60 text-amber-300 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-amber-800/60 flex items-center gap-1"
            title="Слить выбранную ветку с конфликтами"
          >
            <GitMerge className="w-3.5 h-3.5 text-amber-400" />
            <span>🔀 Слить ветку</span>
          </button>

          <button
            type="button"
            onClick={refreshGitState}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors cursor-pointer border border-zinc-700/60"
            title="Обновить статус рабочей директории"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* 23.3 Shadow Checkpoint Rollback Button */}
          <button
            type="button"
            onClick={() => handleRestoreCheckpoint(checkpoints[0]?.id || 'chk_1')}
            title="Быстрый откат состояния к теневому авто-сохранению (15 мин назад)"
            className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span>⏪ Откат (15 мин назад)</span>
          </button>
        </div>

        {/* 23.1 GitHub Direct Push Button */}
        <button
          type="button"
          onClick={() => setIsGitHubModalOpen(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          <span>🚀 PUSH НА GITHUB (1 клик)</span>
        </button>
      </div>

      {/* ── RESTORE NOTIFICATION BANNER ── */}
      {restoreMessage && (
        <div className="px-4 py-2 bg-purple-950/90 border-b border-purple-500 text-purple-200 text-xs font-mono flex items-center justify-between shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>{restoreMessage}</span>
          </div>
          <span className="text-[10px] text-purple-400 font-bold">Успешно восстановлено!</span>
        </div>
      )}

      {/* ── MAIN 3-PANEL LAYOUT OR CONFLICT RESOLVER ── */}
      {activeConflict ? (
        <div className="flex-1 flex flex-col p-4 bg-zinc-950 font-mono text-xs overflow-hidden">
          {/* Conflict Header */}
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-2xl flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-amber-200">
                  ⚠️ КОНФЛИКТ СЛИЯНИЯ В ФАЙЛЕ {activeConflict.filepath}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Слияние ветки <strong className="text-purple-400">{activeConflict.sourceBranch}</strong> в <strong className="text-blue-400">{activeConflict.targetBranch}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleChoiceBoth}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 cursor-pointer"
              >
                🤝 Объединить Обе
              </button>
              <button
                type="button"
                onClick={handleFinishMerge}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                ✅ Завершить Слияние & Закоммитить
              </button>
            </div>
          </div>

          {/* 3-Pane Interactive Grid */}
          <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden">
            {/* Left Pane: Ours / Local HEAD */}
            <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-2xl flex flex-col space-y-2 overflow-hidden">
              <div className="flex items-center justify-between border-b border-blue-800/40 pb-2">
                <span className="font-bold text-blue-300">◄ ТЕКУЩИЕ (Ours: {activeConflict.targetBranch})</span>
                <button
                  type="button"
                  onClick={handleChoiceOurs}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded cursor-pointer"
                >
                  Принять (Ours)
                </button>
              </div>
              <pre className="flex-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-blue-200 overflow-y-auto leading-relaxed">
                {activeConflict.ourCode}
              </pre>
            </div>

            {/* Middle Pane: Resolved Result Preview */}
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col space-y-2 overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-emerald-300">ИТОГОВЫЙ РЕЗУЛЬТАТ</span>
                <span className="text-[10px] text-zinc-500">Редактируемый фрагмент</span>
              </div>
              <textarea
                value={conflictResolvedCode}
                onChange={(e) => setConflictResolvedCode(e.target.value)}
                className="flex-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-emerald-300 font-mono leading-relaxed focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Right Pane: Theirs / Incoming */}
            <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-2xl flex flex-col space-y-2 overflow-hidden">
              <div className="flex items-center justify-between border-b border-purple-800/40 pb-2">
                <span className="font-bold text-purple-300">ВХОДЯЩИЕ (Theirs: {activeConflict.sourceBranch}) ►</span>
                <button
                  type="button"
                  onClick={handleChoiceTheirs}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded cursor-pointer"
                >
                  Принять (Theirs)
                </button>
              </div>
              <pre className="flex-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-purple-200 overflow-y-auto leading-relaxed">
                {activeConflict.theirCode}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: CHANGES & COMMIT CONTROL */}
        <div className="w-80 border-r border-zinc-800 bg-zinc-950 p-3.5 flex flex-col space-y-3 font-mono text-xs overflow-y-auto shrink-0">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-xs text-zinc-300 flex items-center gap-1.5">
              <FolderGit2 className="w-4 h-4 text-amber-400" />
              <span>ИЗМЕНЕНИЯ ({changedFiles.length})</span>
            </span>
            <span className="text-[10px] text-zinc-500">
              Заиндексировано: {changedFiles.filter((f) => f.staged).length}
            </span>
          </div>

          {/* Changed Files List */}
          <div className="space-y-1 flex-1 min-h-[140px] overflow-y-auto bg-zinc-900/60 p-2 rounded-xl border border-zinc-800">
            {changedFiles.map((file) => (
              <div
                key={file.filepath}
                onClick={() => setSelectedFilePath(file.filepath)}
                className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                  selectedFilePath === file.filepath
                    ? 'bg-blue-950 text-blue-200 border border-blue-500/40 font-bold'
                    : 'hover:bg-zinc-800/60 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFileStaging(file.filepath);
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    {file.staged ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </button>
                  <span className="truncate">{file.filepath}</span>
                </div>

                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    file.status === 'modified'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {file.status === 'modified' ? 'MOD' : 'NEW'}
                </span>
              </div>
            ))}
          </div>

          {/* Commit Form */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 block">📝 Сообщение коммита:</span>
            <textarea
              rows={3}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Опишите внесенные изменения..."
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono resize-none"
            />

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div>
                <span className="text-zinc-500 block">Автор:</span>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-200"
                />
              </div>
              <div>
                <span className="text-zinc-500 block">Email:</span>
                <input
                  type="text"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-200"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCommit}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <GitCommit className="w-4 h-4" />
              <span>💾 ЗАКОММИТИТЬ (Ctrl+Enter)</span>
            </button>
          </div>
        </div>

        {/* COLUMN 2 & 3: VISUAL DIFF INSPECTOR & COMMIT GRAPH */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 font-mono text-xs">
          {/* TOP HALF: VISUAL DIFF INSPECTOR (Fix 23.2) */}
          <div className="flex-1 border-b border-zinc-800 overflow-y-auto p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-xs text-blue-400 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>🔍 ВИЗУАЛЬНЫЙ DIFF INSPECTOR: {selectedFile.filepath}</span>
              </span>
              <span className="text-[10px] text-zinc-500">
                Зеленый = Добавлено (+) | Красный = Удалено (-) | Чекбокс = Выборочный стейджинг
              </span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 leading-6 overflow-x-auto space-y-0.5">
              {selectedFile.diffLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-2 rounded font-mono text-[11px] ${
                    line.type === 'added'
                      ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500'
                      : line.type === 'deleted'
                      ? 'bg-red-950/60 text-red-300 border-l-2 border-red-500 line-through opacity-80'
                      : 'text-zinc-400 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleLineStaging(idx)}
                      title="Выборочно закоммитить эту строку (Selective Line Staging)"
                      className="text-zinc-500 hover:text-white"
                    >
                      {line.staged ? (
                        <CheckSquare className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Square className="w-3 h-3 text-zinc-600" />
                      )}
                    </button>

                    <span className="w-6 text-right text-zinc-600 select-none text-[10px]">
                      {line.newLineNumber || line.oldLineNumber || ''}
                    </span>

                    <span className="font-bold select-none text-xs w-3">
                      {line.type === 'added' ? '+' : line.type === 'deleted' ? '-' : ' '}
                    </span>

                    <span>{line.content}</span>
                  </div>

                  {line.type !== 'unchanged' && (
                    <span className="text-[9px] text-zinc-500 font-bold uppercase">
                      {line.type === 'added' ? '[ДОБАВЛЕНО]' : '[УДАЛЕНО]'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM HALF: INTERACTIVE COMMIT GRAPH */}
          <div className="h-56 p-4 overflow-y-auto space-y-2.5 bg-zinc-950">
            <h4 className="font-bold text-xs text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-purple-400" />
              <span>🌳 Граф истории коммитов (Commit Tree Graph)</span>
            </h4>

            <div className="space-y-2">
              {commits.map((c, idx) => (
                <div
                  key={c.sha}
                  className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shadow-purple-500/50 shadow-md shrink-0" />
                    <span className="px-2 py-0.5 bg-zinc-800 text-purple-300 font-bold rounded text-[10px] border border-zinc-700">
                      [{c.sha}]
                    </span>
                    <span className="font-bold text-white text-xs">{c.message}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                    <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded font-bold">
                      {c.branch}
                    </span>
                    <span>Автор: {c.authorName}</span>
                    <span className="text-zinc-500">
                      {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ── MODAL 1: NEW BRANCH MODAL ── */}
      {isNewBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span>Создать новую ветку Git</span>
            </h3>

            <input
              type="text"
              value={newBranchInput}
              onChange={(e) => setNewBranchInput(e.target.value)}
              placeholder="Например: feature/sqlite-auth..."
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewBranchModalOpen(false)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-xl hover:bg-zinc-700 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateNewBranch}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Создать ветку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: MERGE BRANCH MODAL ── */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-amber-400" />
              <span>Слить ветку в {currentBranch}</span>
            </h3>

            <div>
              <label className="text-zinc-400 block mb-1 text-xs">Выберите ветку для слияния:</label>
              <select
                value={selectedMergeBranch}
                onChange={(e) => setSelectedMergeBranch(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono"
              >
                {branches
                  .filter((b) => b !== currentBranch)
                  .map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
              </select>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-amber-300">
              ⚡ При обнаружении пересечений коду автоматически включится Трехпанельный конфликт-резолвер.
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-xl hover:bg-zinc-700 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleStartMerge}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Начать слияние
              </button>
            </div>
          </div>
        </div>
      )}
      {isGitHubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-400" />
                <span>🚀 1-Click GitHub Repository Creator</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGitHubModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">
                  🔑 GitHub Personal Access Token (PAT):
                </label>
                <input
                  type="password"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx..."
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Токен сохраняется локально в зашифрованном IndexedDB хранилище DevOS.
                </span>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">📦 Название репозитория:</label>
                <input
                  type="text"
                  value={ghRepoName}
                  onChange={(e) => setGhRepoName(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ghPrivate"
                  checked={ghIsPrivate}
                  onChange={(e) => setGhIsPrivate(e.target.checked)}
                  className="rounded border-zinc-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="ghPrivate" className="text-zinc-300 cursor-pointer">
                  Приватный репозиторий (Private)
                </label>
              </div>

              {ghStatusMessage && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200">
                  {ghStatusMessage}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGitHubModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs rounded-xl hover:bg-zinc-700 cursor-pointer"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={handleCreateGitHubRepo}
                disabled={isPushing}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
              >
                {isPushing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Загрузка на GitHub (1.5s)...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Создать & Загрузить</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER STATUS BAR ── */}
      <div className="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>[Git: <strong className="text-emerald-400">ИНИЦИАЛИЗИРОВАН</strong>]</span>
          <span>[Ветка: <strong className="text-white">{currentBranch}</strong>]</span>
          <span>[Коммитов: <strong className="text-purple-300">{commits.length}</strong>]</span>
        </div>
        <div className="text-emerald-400 font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Теневые авто-сохранения: АКТИВНЫ (Каждые 15 мин)</span>
        </div>
      </div>
    </div>
  );
};
