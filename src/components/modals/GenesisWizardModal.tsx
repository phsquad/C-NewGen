import React, { useState, useEffect } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  Sparkles,
  X,
  Code2,
  User,
  FileText,
  Boxes,
  CheckCircle2,
  ArrowRight,
  Monitor,
  Terminal,
  Globe,
  LayoutTemplate,
  Rocket,
  Lock,
  Calculator,
  Layout,
  LayoutGrid,
} from 'lucide-react';

interface GenesisWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GenesisWizardModal: React.FC<GenesisWizardModalProps> = ({ isOpen, onClose }) => {
  const { project, setProjectState, applyQuickTemplate } = useDesigner();

  // Compute a default project name like Проект_26_09_2026
  const getFormattedDate = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}_${month}_${year}`;
  };

  const defaultProjectName = `Проект_${getFormattedDate()}`;

  const [projectName, setProjectName] = useState(defaultProjectName);
  const [namespace, setNamespace] = useState('University.Mathematics.Lab1');
  const [author, setAuthor] = useState('Александр Талентс');
  const [description, setDescription] = useState(
    'Программа расчета определителей матриц и СЛАУ'
  );
  const [polyglotTarget, setPolyglotTarget] = useState<'winforms' | 'python' | 'web'>('winforms');
  const [selectedPreset, setSelectedPreset] = useState<'empty' | 'login' | 'calc' | 'dashboard'>('empty');

  // Sync state if project parameters change
  useEffect(() => {
    if (project) {
      if (project.projectName && project.projectName !== 'WinFormsApp1') {
        setProjectName(project.projectName);
      }
      if (project.namespace) setNamespace(project.namespace);
      if (project.author) setAuthor(project.author);
      if (project.description) setDescription(project.description);
      if (project.polyglotTarget) setPolyglotTarget(project.polyglotTarget);
    }
  }, [project]);

  if (!isOpen) return null;

  const handleCreateProject = () => {
    // 1. Update project metadata
    const nextState = JSON.parse(JSON.stringify(project));
    nextState.projectName = projectName.trim() || 'MyWinFormsApp';
    nextState.namespace = namespace.trim() || 'MyUniversityApp';
    nextState.author = author.trim() || 'Разработчик';
    nextState.description = description.trim() || 'Проект визульно спроектирован в NextGen Designer';
    nextState.polyglotTarget = polyglotTarget;

    setProjectState(nextState);

    // 2. Apply chosen template preset
    if (selectedPreset !== 'empty') {
      applyQuickTemplate(selectedPreset as any);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] modal-overlay bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative z-[100000] modal-card bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col select-none max-h-[95vh] border-b-2 border-b-blue-600">
        {/* Header Bar */}
        <div className="p-4 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2 tracking-wide font-sans">
                <span>🚀 СОЗДАНИЕ НОВОГО ПРОЕКТА / GENESIS WIZARD</span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                Задайте имя, пространство имен, автора и выберите платформу
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: Metadata Inputs */}
          <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800/60">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Boxes className="w-3.5 h-3.5 text-blue-400" />
              <span>1. МЕТАДАННЫЕ ПРОЕКТА</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Название проекта (ProjectName):
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="MatrixCalculatorApp"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Пространство имен (Namespace):
                </label>
                <input
                  type="text"
                  value={namespace}
                  onChange={e => setNamespace(e.target.value)}
                  placeholder="University.Mathematics.Lab1"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Автор / Разработчик:
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="Александр Талентс"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Описание / Назначение:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Программа расчета определителей матриц"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Target Language & Stack */}
          <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800/60">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>2. ВЫБОР ЦЕЛЕВОГО ЯЗЫКА И ПЛАТФОРМЫ</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              {/* Option A: C# WinForms */}
              <button
                type="button"
                onClick={() => setPolyglotTarget('winforms')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  polyglotTarget === 'winforms'
                    ? 'bg-blue-600/10 border-blue-500 text-blue-200 ring-1 ring-blue-500/40'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-1.5">
                  <Monitor className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span>C# .NET 8/9</span>
                </div>
                <p className="text-[10px] leading-relaxed text-zinc-400">
                  WinForms + Avalonia UI. Чистая компиляция в Visual Studio.
                </p>
              </button>

              {/* Option B: Python CustomTkinter */}
              <button
                type="button"
                onClick={() => setPolyglotTarget('python')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  polyglotTarget === 'python'
                    ? 'bg-amber-600/10 border-amber-500 text-amber-200 ring-1 ring-amber-500/40'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-1.5">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Python Modern GUI</span>
                </div>
                <p className="text-[10px] leading-relaxed text-zinc-400">
                  CustomTkinter (v5.2). Темная тема и плавная кроссплатформенность.
                </p>
              </button>

              {/* Option C: Web Standalone */}
              <button
                type="button"
                onClick={() => setPolyglotTarget('web')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  polyglotTarget === 'web'
                    ? 'bg-cyan-600/10 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/40'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Web HTML5 / CSS</span>
                </div>
                <p className="text-[10px] leading-relaxed text-zinc-400">
                  Автономный веб-сайт (index.html, styles.css, app.js).
                </p>
              </button>
            </div>
          </div>

          {/* Section 3: Starting Template Preset */}
          <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800/60">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />
              <span>3. НАЧАЛЬНЫЙ ШАБЛОН ФОРМЫ (PRESET)</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 pt-1">
              {/* Option 1: Empty */}
              <button
                type="button"
                onClick={() => setSelectedPreset('empty')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-[11px] font-semibold ${
                  selectedPreset === 'empty'
                    ? 'bg-zinc-800 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Layout className="w-4 h-4 text-blue-400" />
                <span>Чистый холст</span>
              </button>

              {/* Option 2: Login */}
              <button
                type="button"
                onClick={() => setSelectedPreset('login')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-[11px] font-semibold ${
                  selectedPreset === 'login'
                    ? 'bg-zinc-800 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Вход / Логин</span>
              </button>

              {/* Option 3: Calculator */}
              <button
                type="button"
                onClick={() => setSelectedPreset('calc')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-[11px] font-semibold ${
                  selectedPreset === 'calc'
                    ? 'bg-zinc-800 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Калькулятор</span>
              </button>

              {/* Option 4: Dashboard */}
              <button
                type="button"
                onClick={() => setSelectedPreset('dashboard')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-[11px] font-semibold ${
                  selectedPreset === 'dashboard'
                    ? 'bg-zinc-800 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-pink-400" />
                <span>Дашборд</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 py-2 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium rounded-lg text-xs transition-all cursor-pointer"
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={handleCreateProject}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-blue-500/10 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>🚀 СОЗДАТЬ И НАЧАТЬ РАБОТУ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
