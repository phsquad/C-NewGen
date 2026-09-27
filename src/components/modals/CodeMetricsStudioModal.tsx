import React, { useState, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { RoslynCodeMetrics, CodeMetricsResult } from '../../utils/RoslynCodeMetrics';
import { generateCodeBehindCs } from '../../utils/codeGenerators';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Gauge,
  BarChart2,
  TrendingDown,
  Layers,
  Sparkles,
  Download,
  X,
  ArrowRight,
  Code,
  ShieldAlert,
} from 'lucide-react';

interface CodeMetricsStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeMetricsStudioModal: React.FC<CodeMetricsStudioModalProps> = ({ isOpen, onClose }) => {
  const { project } = useDesigner();
  const [selectedMethodName, setSelectedMethodName] = useState<string | null>(null);

  // Generate code behind and analyze
  const codeBehind = useMemo(() => generateCodeBehindCs(project), [project]);
  const metrics: CodeMetricsResult = useMemo(() => RoslynCodeMetrics.analyzeCode(codeBehind), [codeBehind]);

  if (!isOpen) return null;

  const selectedMethod = metrics.methods.find((m) => m.name === selectedMethodName) || metrics.methods[0];

  const getRiskBadge = (risk: 'low' | 'medium' | 'high' | 'critical') => {
    switch (risk) {
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Low Risk (V≤5)</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Moderate (V≤10)</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">High Risk (V≤20)</span>;
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Critical Debt (V&gt;20)</span>;
    }
  };

  const getMaintainabilityColor = (mi: number) => {
    if (mi >= 80) return 'text-emerald-400';
    if (mi >= 60) return 'text-yellow-400';
    if (mi >= 40) return 'text-orange-400';
    return 'text-rose-400';
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${project.projectName || 'Form1'}_Roslyn_Metrics.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[88vh] overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Roslyn Cyclomatic Complexity & Code Debt Studio
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-normal">
                  McCabe V(G) Formula
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Математический расчет качества кода, веток ветвления и индекса сопровождаемости (SEI MI)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-4 gap-3 p-5 bg-slate-950/80 border-b border-slate-800">
          <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">Maintainability Index</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${getMaintainabilityColor(metrics.overallMaintainabilityIndex)}`}>
                {metrics.overallMaintainabilityIndex}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${metrics.overallMaintainabilityIndex >= 80 ? 'bg-emerald-500' : metrics.overallMaintainabilityIndex >= 60 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                style={{ width: `${metrics.overallMaintainabilityIndex}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">Avg Cyclomatic $V(G)$</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-indigo-400">
                {metrics.averageCyclomaticComplexity}
              </span>
              <span className="text-xs text-slate-500">Max: {metrics.maxCyclomaticComplexity}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-2">Базовый порог: ≤ 5 на метод</span>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">Lines of Code (LOC)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-cyan-400">
                {metrics.totalLinesOfCode}
              </span>
              <span className="text-xs text-slate-500">({metrics.executableLinesOfCode} исполняемых)</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-2">{metrics.methods.length} C#-методов</span>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">Технический долг</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-amber-400">
                {metrics.technicalDebtMinutes}
              </span>
              <span className="text-xs text-slate-500">мин</span>
            </div>
            <div className="mt-2">{getRiskBadge(metrics.overallRisk)}</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
          {/* Methods List */}
          <div className="col-span-5 border-r border-slate-800 overflow-y-auto p-4 space-y-2 bg-slate-950/40">
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
              <span>Методы решения ({metrics.methods.length}):</span>
              <span className="text-[10px] text-slate-500">Сортировка по $V(G)$</span>
            </div>

            {metrics.methods.map((m) => {
              const isSelected = selectedMethod?.name === m.name;
              return (
                <div
                  key={m.name}
                  onClick={() => setSelectedMethodName(m.name)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-white truncate max-w-[160px]">
                      {m.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                        $V(G) = {m.cyclomaticComplexity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{m.linesOfCode} строк (Стр {m.startLine}-{m.endLine})</span>
                    <span className={`font-mono ${getMaintainabilityColor(m.maintainabilityIndex)}`}>
                      MI: {m.maintainabilityIndex}
                    </span>
                  </div>

                  {/* Micro Visual Bar */}
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${m.cyclomaticComplexity <= 5 ? 'bg-emerald-500' : m.cyclomaticComplexity <= 10 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, m.cyclomaticComplexity * 10)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Method Detail Inspector */}
          <div className="col-span-7 p-5 overflow-y-auto space-y-4 bg-slate-900">
            {selectedMethod && (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold font-mono text-indigo-300">
                      {selectedMethod.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {selectedMethod.signature}
                    </p>
                  </div>
                  {getRiskBadge(selectedMethod.risk)}
                </div>

                {/* Method Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Цикломатическая сложность</span>
                    <span className="text-xl font-bold font-mono text-indigo-400">
                      {selectedMethod.cyclomaticComplexity}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Точки ветвления</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">
                      {selectedMethod.branchPoints.length}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Maintainability Index</span>
                    <span className={`text-xl font-bold font-mono ${getMaintainabilityColor(selectedMethod.maintainabilityIndex)}`}>
                      {selectedMethod.maintainabilityIndex}%
                    </span>
                  </div>
                </div>

                {/* Detected Branch Points */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                    Зафиксированные точки ветвления потока управления ($E - N + 2P$):
                  </h4>
                  {selectedMethod.branchPoints.length === 0 ? (
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400">
                      Прямолинейный поток выполнения (линейный код без разветвлений). Базовая сложность = 1.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {selectedMethod.branchPoints.map((bp, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-slate-950 rounded-md border border-slate-800/80 text-xs font-mono"
                        >
                          <span className="text-indigo-300">Строка {bp.line}</span>
                          <span className="text-slate-300 px-2 py-0.5 bg-slate-800 rounded text-[11px]">
                            Условный оператор: <span className="text-amber-300 font-bold">{bp.type}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-lg p-3.5">
                  <h4 className="text-xs font-bold text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Рекомендация статического анализатора Roslyn:
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedMethod.cyclomaticComplexity > 5
                      ? `Сложность $V(G) = ${selectedMethod.cyclomaticComplexity}$. Для снижения когнитивной нагрузки и предотвращения багов рекомендуется разделить метод с помощью "Extract Method" (Ctrl+R, Ctrl+M) или полиморфизма.`
                      : '✅ Данный метод имеет образцовую структуру и низкую вероятность регрессионных ошибок.'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Halstead Volume: <strong className="text-slate-200">{metrics.halsteadVolume}</strong></span>
            <span>•</span>
            <span>Сцепление классов: <strong className="text-slate-200">{metrics.classCoupling}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Экспорт отчета (JSON)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
