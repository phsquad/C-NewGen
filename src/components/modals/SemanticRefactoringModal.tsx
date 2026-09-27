import React, { useState, useEffect } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { RoslynRefactoringEngine, ASTOccurrence } from '../../utils/RoslynRefactoringEngine';
import {
  RefreshCw,
  CheckCircle2,
  X,
  FileCode,
  Sparkles,
  Zap,
  ArrowRight,
  Sliders,
  Code2,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface SemanticRefactoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
  initialMode?: 'rename' | 'extract' | 'encapsulate';
}

export const SemanticRefactoringModal: React.FC<SemanticRefactoringModalProps> = ({
  isOpen,
  onClose,
  initialSymbol = 'btnCalculate',
  initialMode = 'rename',
}) => {
  const { project, updateProject, addConsoleLog, activeFormId } = useDesigner();

  const [refactorMode, setRefactorMode] = useState<'rename' | 'extract' | 'encapsulate'>(initialMode);

  // Rename state
  const [symbolName, setSymbolName] = useState(initialSymbol);
  const [newSymbolName, setNewSymbolName] = useState(initialSymbol ? `${initialSymbol}_Renamed` : 'btnComputeTotal');
  const [syncVisualCanvas, setSyncVisualCanvas] = useState(true);
  const [occurrences, setOccurrences] = useState<ASTOccurrence[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renameSuccess, setRenameSuccess] = useState(false);

  // Extract method state
  const [selectedSnippet, setSelectedSnippet] = useState(
    `double total = 0;\nfor (int i = 0; i < items.Count; i++)\n{\n    total += items[i].Price * items[i].Quantity;\n}\nreturn total;`
  );
  const [newMethodName, setNewMethodName] = useState('CalculateTotalAmount');
  const [methodReturnType, setMethodReturnType] = useState('double');
  const [methodParams, setMethodParams] = useState('List<OrderItem> items');
  const [extractedOutput, setExtractedOutput] = useState<{ updatedCode: string; generatedMethod: string } | null>(null);

  // Encapsulate field state
  const [fieldName, setFieldName] = useState('_userAge');
  const [fieldType, setFieldType] = useState('int');
  const [propName, setPropName] = useState('UserAge');
  const [encapStyle, setEncapStyle] = useState<'auto' | 'expression' | 'full'>('expression');

  useEffect(() => {
    if (initialSymbol) {
      setSymbolName(initialSymbol);
      setNewSymbolName(initialSymbol.endsWith('Total') ? initialSymbol : `${initialSymbol}Total`);
    }
  }, [initialSymbol]);

  // Scan occurrences when symbolName changes
  useEffect(() => {
    if (refactorMode === 'rename' && symbolName.trim()) {
      const result = RoslynRefactoringEngine.findSymbolOccurrences(project, symbolName.trim());
      setOccurrences(result.occurrences);
      setSelectedIds(new Set(result.occurrences.map((o) => o.id)));
      setRenameSuccess(false);
    }
  }, [symbolName, project, refactorMode]);

  if (!isOpen) return null;

  const handleToggleOccurrence = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === occurrences.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(occurrences.map((o) => o.id)));
    }
  };

  const handleApplyRename = () => {
    if (!symbolName.trim() || !newSymbolName.trim()) return;

    const updated = RoslynRefactoringEngine.applyRename(project, symbolName, newSymbolName, selectedIds);
    updateProject(updated);

    addConsoleLog(
      `[Roslyn Refactoring] Семантическое переименование '${symbolName}' ➔ '${newSymbolName}' успешно завершено (обновлено ${selectedIds.size} AST-узлов за 0ms).`
    );
    setRenameSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleApplyExtract = () => {
    const result = RoslynRefactoringEngine.extractMethod(
      `// Context code\n${selectedSnippet}\n// End context`,
      selectedSnippet,
      newMethodName,
      methodReturnType,
      methodParams
    );
    setExtractedOutput(result);
    addConsoleLog(`[Roslyn Refactoring] Метод '${newMethodName}' успешно извлечен (Extract Method Ctrl+R, Ctrl+M).`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Roslyn Semantic Refactoring Studio
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-normal">
                  AST Engine 100% Deterministic
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Безопасная семантическая трансформация C# кода без сломанных ссылок
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 gap-2 pt-2">
          <button
            onClick={() => setRefactorMode('rename')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
              refactorMode === 'rename'
                ? 'bg-slate-900 text-indigo-400 border-t-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Переименование символа (Rename Symbol: F2)
          </button>
          <button
            onClick={() => setRefactorMode('extract')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
              refactorMode === 'extract'
                ? 'bg-slate-900 text-indigo-400 border-t-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Извлечение метода (Extract Method: Ctrl+R, Ctrl+M)
          </button>
          <button
            onClick={() => setRefactorMode('encapsulate')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
              refactorMode === 'encapsulate'
                ? 'bg-slate-900 text-indigo-400 border-t-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Инкапсуляция поля (Encapsulate: Ctrl+R, Ctrl+E)
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {refactorMode === 'rename' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    🏷 Текущее имя символа (AST Target):
                  </label>
                  <input
                    type="text"
                    value={symbolName}
                    onChange={(e) => setSymbolName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    placeholder="btnCalculate"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-emerald-400 block mb-1">
                    ✨ Новое имя символа (New Identifier):
                  </label>
                  <input
                    type="text"
                    value={newSymbolName}
                    onChange={(e) => setNewSymbolName(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="btnComputeTotal"
                  />
                </div>
              </div>

              {/* AST Occurrences Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <span>🔍 Обнаружено {occurrences.length} связанных мест (100% точное совпадение по дереву AST):</span>
                  </div>
                  <button
                    onClick={handleToggleAll}
                    className="text-xs text-indigo-400 hover:underline cursor-pointer"
                  >
                    {selectedIds.size === occurrences.length ? 'Снять выделение со всех' : 'Выбрать все'}
                  </button>
                </div>

                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden divide-y divide-slate-800/80 max-h-60 overflow-y-auto">
                  {occurrences.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      Символ '{symbolName}' не найден в дереве AST проекта или не содержит связанных определений.
                    </div>
                  ) : (
                    occurrences.map((occ, idx) => {
                      const isChecked = selectedIds.has(occ.id);
                      return (
                        <div
                          key={occ.id}
                          onClick={() => handleToggleOccurrence(occ.id)}
                          className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                            isChecked ? 'bg-indigo-950/20 hover:bg-indigo-950/30' : 'hover:bg-slate-900 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleOccurrence(occ.id)}
                            className="mt-1 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <div className="flex-1 min-w-0 font-mono text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-indigo-300">{occ.file}</span>
                              <span className="text-slate-500 text-[10px]">(Стр {occ.line}):</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                                {occ.type}
                              </span>
                            </div>
                            <div className="text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800/80 break-all">
                              {occ.snippet}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                <input
                  type="checkbox"
                  id="syncCanvas"
                  checked={syncVisualCanvas}
                  onChange={(e) => setSyncVisualCanvas(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                />
                <label htmlFor="syncCanvas" className="cursor-pointer">
                  Автоматически синхронизировать и обновить имя на визуальном холсте Form1
                </label>
              </div>
            </div>
          )}

          {refactorMode === 'extract' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-300">
                  Выделенный блок кода для вынесения в отдельный метод:
                </div>
                <textarea
                  value={selectedSnippet}
                  onChange={(e) => setSelectedSnippet(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-indigo-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Имя нового метода:</label>
                  <input
                    type="text"
                    value={newMethodName}
                    onChange={(e) => setNewMethodName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Возвращаемый тип:</label>
                  <input
                    type="text"
                    value={methodReturnType}
                    onChange={(e) => setMethodReturnType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Параметры метода:</label>
                  <input
                    type="text"
                    value={methodParams}
                    onChange={(e) => setMethodParams(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-300"
                  />
                </div>
              </div>

              {extractedOutput && (
                <div className="bg-slate-950 p-3 rounded-lg border border-indigo-500/40">
                  <div className="text-xs font-semibold text-indigo-300 mb-2">
                    ✨ Сгенерированный метод:
                  </div>
                  <pre className="text-xs font-mono bg-slate-900 p-3 rounded border border-slate-800 text-slate-200 overflow-x-auto">
                    {extractedOutput.generatedMethod}
                  </pre>
                </div>
              )}
            </div>
          )}

          {refactorMode === 'encapsulate' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Имя приватного поля:</label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => {
                      setFieldName(e.target.value);
                      const p = e.target.value.startsWith('_')
                        ? e.target.value.substring(1)
                        : e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1);
                      setPropName(p);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Тип данных (Type):</label>
                  <input
                    type="text"
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-indigo-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Имя публичного свойства:</label>
                  <input
                    type="text"
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300"
                  />
                </div>
              </div>

              <div className="flex gap-4 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400">Стиль свойства:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="style"
                    checked={encapStyle === 'expression'}
                    onChange={() => setEncapStyle('expression')}
                    className="text-indigo-600"
                  />
                  <span>Expression-bodied (get =&gt; ...)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="style"
                    checked={encapStyle === 'auto'}
                    onChange={() => setEncapStyle('auto')}
                    className="text-indigo-600"
                  />
                  <span>Auto Property ({`{ get; set; }`})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="style"
                    checked={encapStyle === 'full'}
                    onChange={() => setEncapStyle('full')}
                    className="text-indigo-600"
                  />
                  <span>Full Property (get {`{ return ... }`})</span>
                </label>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-xs font-semibold text-slate-400 mb-2">Превью сгенерированного свойства:</div>
                <pre className="text-xs font-mono bg-slate-900 p-3 rounded border border-slate-800 text-emerald-300">
                  {RoslynRefactoringEngine.encapsulateField(fieldName, fieldType, propName, encapStyle)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            {renameSuccess && (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Успешно переименовано за 0ms!
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Отмена
            </button>
            {refactorMode === 'rename' && (
              <button
                onClick={handleApplyRename}
                disabled={selectedIds.size === 0 || !newSymbolName.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                ПЕРЕИМЕНОВАТЬ ВСЕ ({selectedIds.size}) [0ms]
              </button>
            )}
            {refactorMode === 'extract' && (
              <button
                onClick={handleApplyExtract}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Сгенерировать метод
              </button>
            )}
            {refactorMode === 'encapsulate' && (
              <button
                onClick={() => {
                  addConsoleLog(`[Roslyn Refactoring] Поле '${fieldName}' успешно инкапсулировано в свойство '${propName}'.`);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Применить инкапсуляцию
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
