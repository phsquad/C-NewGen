import React, { useState, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  ResxLocalizationEngine,
  ResxResourceEntry,
  SUPPORTED_LOCALES,
} from '../../utils/ResxLocalizationEngine';
import {
  Globe,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Code2,
  FileCode,
  Sparkles,
  Eye,
  X,
  Layers,
  Search,
} from 'lucide-react';

interface ResxStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResxStudioModal: React.FC<ResxStudioModalProps> = ({ isOpen, onClose }) => {
  const { project, setProjectState, addConsoleLog } = useDesigner();

  const [resources, setResources] = useState<ResxResourceEntry[]>(() =>
    ResxLocalizationEngine.extractFromProject(project)
  );

  const [activeCulture, setActiveCulture] = useState<string>('ru-RU');
  const [activeView, setActiveView] = useState<'grid' | 'code' | 'xml'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewApplied, setPreviewApplied] = useState(false);

  // New key inputs
  const [newKey, setNewKey] = useState('');
  const [newDefaultVal, setNewDefaultVal] = useState('');
  const [newComment, setNewComment] = useState('');

  if (!isOpen) return null;

  const filteredResources = resources.filter(
    (r) =>
      r.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.comment && r.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
      Object.values(r.values).some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    const cleanKey = newKey.trim().replace(/[^a-zA-Z0-9_]/g, '_');

    const entry: ResxResourceEntry = {
      id: `res-custom-${Date.now()}`,
      key: cleanKey,
      comment: newComment.trim(),
      type: 'string',
      values: {
        default: newDefaultVal || cleanKey,
        'ru-RU': newDefaultVal || cleanKey,
        'de-DE': newDefaultVal || cleanKey,
      },
    };

    setResources((prev) => [...prev, entry]);
    setNewKey('');
    setNewDefaultVal('');
    setNewComment('');
  };

  const handleUpdateValue = (id: string, culture: string, val: string) => {
    setResources((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            values: {
              ...item.values,
              [culture]: val,
            },
          };
        }
        return item;
      })
    );
  };

  const handleDeleteKey = (id: string) => {
    setResources((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyToCanvas = (culture: string) => {
    const updatedNodes = ResxLocalizationEngine.applyLocalizationToNodes(
      project.nodes,
      resources,
      culture
    );
    setProjectState({ ...project, nodes: updatedNodes });
    addConsoleLog(
      'System',
      `[Resx Studio] Языковой пакет '${culture}' успешно применен к элементам формы на холсте!`
    );
    setPreviewApplied(true);
    setTimeout(() => setPreviewApplied(false), 2000);
  };

  const generatedDesignerCs = ResxLocalizationEngine.generateDesignerCs(
    project.namespace || project.projectName || 'MyApplication',
    resources
  );

  const generatedXml = ResxLocalizationEngine.generateResxXml(resources, activeCulture);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Roslyn .resx Resource & Localization Studio
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-normal">
                  Multi-Language Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Управление ресурсами строк, локализация интерфейса и автогенерация Resources.Designer.cs
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

        {/* Action & Tab Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('grid')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeView === 'grid'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Таблица ресурсов ({resources.length})
            </button>
            <button
              onClick={() => setActiveView('code')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeView === 'code'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Resources.Designer.cs
            </button>
            <button
              onClick={() => setActiveView('xml')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeView === 'xml'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Файл .resx (XML)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Предпросмотр локали на холсте:</span>
            <select
              value={activeCulture}
              onChange={(e) => {
                setActiveCulture(e.target.value);
                handleApplyToCanvas(e.target.value);
              }}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-md px-2.5 py-1.5 focus:outline-none"
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.flag} {loc.name}
                </option>
              ))}
            </select>
            {previewApplied && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Применено!
              </span>
            )}
          </div>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeView === 'grid' && (
            <div className="space-y-4">
              {/* Add resource bar */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-12 gap-3 items-end">
                <div className="col-span-3">
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    Ключ ресурса (Key):
                  </label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="e.g. btnSave_Tooltip"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
                <div className="col-span-4">
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    Значение по умолчанию (Default en-US):
                  </label>
                  <input
                    type="text"
                    value={newDefaultVal}
                    onChange={(e) => setNewDefaultVal(e.target.value)}
                    placeholder="Save current file"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    Комментарий для переводчиков:
                  </label>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Подсказка для кнопки"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    onClick={handleAddKey}
                    disabled={!newKey.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs py-2 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Добавить
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по ключу, переводу или комментарию..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Resource Table */}
              <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="p-3">Ключ ресурса</th>
                      <th className="p-3">🇺🇸 Default (en-US)</th>
                      <th className="p-3">🇷🇺 Русский (ru-RU)</th>
                      <th className="p-3">🇩🇪 Deutsch (de-DE)</th>
                      <th className="p-3">Комментарий</th>
                      <th className="p-3 text-center">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredResources.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-blue-300">{res.key}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={res.values['default'] || ''}
                            onChange={(e) => handleUpdateValue(res.id, 'default', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={res.values['ru-RU'] || ''}
                            onChange={(e) => handleUpdateValue(res.id, 'ru-RU', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-emerald-300 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={res.values['de-DE'] || ''}
                            onChange={(e) => handleUpdateValue(res.id, 'de-DE', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-amber-300 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] truncate max-w-[150px]">
                          {res.comment || '—'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteKey(res.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Автоматически сгенерированный строго типизированный C#-класс доступа к ресурсам:
                </span>
                <button
                  onClick={() => handleCopyCode(generatedDesignerCs)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Скопировано!' : 'Копировать C#'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300 overflow-x-auto max-h-[500px]">
                {generatedDesignerCs}
              </pre>
            </div>
          )}

          {activeView === 'xml' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Стандартный файл разметки ресурсов .resx XML ({activeCulture}):
                </span>
                <button
                  onClick={() => handleCopyCode(generatedXml)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Скопировано!' : 'Копировать XML'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-200 overflow-x-auto max-h-[500px]">
                {generatedXml}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Всего ключей в проекте: <strong className="text-white">{resources.length}</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleApplyToCanvas(activeCulture)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Eye className="w-4 h-4" />
              Применить перевод к элементам холста
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
