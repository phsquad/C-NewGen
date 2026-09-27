import React, { useState, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { TEMPLATES_CATALOG, TemplateDefinition, instantiateTemplateProject } from '../../utils/templatesCatalog';
import {
  Search,
  Sparkles,
  Database,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle,
  FolderPlus,
  Zap,
  Code,
  Box,
  Cpu,
  Shield,
  Gamepad2,
  Globe,
  FileText,
  Video,
  Wrench,
  GraduationCap,
  Briefcase,
  X,
} from 'lucide-react';

interface TemplatesGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (templateId: string) => void;
}

const CATEGORIES = [
  { id: 'all', title: '⭐ Все (100)', icon: Sparkles, count: 100 },
  { id: 'business', title: '💼 Бизнес и Склад', icon: Briefcase, count: 10 },
  { id: 'education', title: '🎓 Учеба / Лабы', icon: GraduationCap, count: 10 },
  { id: 'tools', title: '🛠 Системные', icon: Wrench, count: 10 },
  { id: 'media', title: '🎬 Медиа / Аудио', icon: Video, count: 10 },
  { id: 'network', title: '🌐 Сети / API', icon: Globe, count: 10 },
  { id: 'text', title: '📝 Текст / Редакторы', icon: FileText, count: 10 },
  { id: 'games', title: '🎮 Игры / Аркады', icon: Gamepad2, count: 10 },
  { id: 'security', title: '🔒 Безопасность', icon: Shield, count: 10 },
  { id: 'automation', title: '🤖 Автоматизация', icon: Cpu, count: 10 },
  { id: 'iot', title: '⚡️ Инженерия / IoT', icon: Zap, count: 10 },
];

export const TemplatesGalleryModal: React.FC<TemplatesGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const { setProjectState, addConsoleLog, commitTransaction, setAppMode } = useDesigner();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES_CATALOG.filter((tpl) => {
      const matchesCategory = activeCategory === 'all' || tpl.category === activeCategory;
      if (!matchesCategory) return false;

      if (!search.trim()) return true;
      const query = search.toLowerCase();

      return (
        tpl.title.toLowerCase().includes(query) ||
        tpl.description.toLowerCase().includes(query) ||
        tpl.csharpSummary.toLowerCase().includes(query) ||
        tpl.tags.some((t) => t.toLowerCase().includes(query)) ||
        tpl.categoryTitle.toLowerCase().includes(query) ||
        String(tpl.num) === query
      );
    });
  }, [activeCategory, search]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: TemplateDefinition) => {
    if (onSelectTemplate) {
      onSelectTemplate(tpl.id);
    } else {
      const newState = instantiateTemplateProject(tpl.id);
      setProjectState(newState);
      addConsoleLog('System', `Создан проект по шаблону #${tpl.num}: "${tpl.title}" (.NET 8 WinForms).`);
      commitTransaction(`Создание проекта: ${tpl.title}`);
      setAppMode('designer');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-6xl h-[88vh] bg-[#141419] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-300 font-sans select-none">
        {/* 1. Header */}
        <div className="h-14 bg-[#1e1e26] border-b border-zinc-800 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm sm:text-base">
                  Галерея 100 Готовых Шаблонов Приложений
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                  .NET 8 / C#
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                10 категорий · 100% рабочий C# код · Базы данных SQLite · Мгновенный запуск
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Закрыть (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Search Bar & Category Navigation Rail */}
        <div className="p-4 border-b border-zinc-800/90 bg-[#181820] space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Поиск по 100 шаблонам (например: калькулятор, склад, сапер, график, погода, sqlite, дейкстра)..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-white text-xs placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Badges Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/50 scale-102'
                      : 'bg-zinc-900/90 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{cat.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Main Catalog Grid & Preview Drawer */}
        <div className="flex-1 flex overflow-hidden">
          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                <Search className="w-12 h-12 text-zinc-600 mb-3" />
                <span className="text-sm font-semibold text-zinc-400">Шаблоны не найдены</span>
                <span className="text-xs text-zinc-600 max-w-sm mt-1">
                  Попробуйте изменить поисковый запрос или выберите другую категорию.
                </span>
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`bg-zinc-900/80 border rounded-2xl p-4 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/15 ring-1 ring-blue-500/50'
                        : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      {/* Card Header: Icon, ID, Badges */}
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl p-2 bg-zinc-950/80 border border-zinc-800 rounded-xl group-hover:scale-110 transition-transform select-none shadow-sm">
                            {tpl.icon}
                          </span>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-blue-400 block">
                              #{String(tpl.num).padStart(2, '0')}
                            </span>
                            <span className="text-[11px] font-medium text-zinc-400 block">
                              {tpl.categoryTitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {tpl.hasDatabase && (
                            <span className="flex items-center gap-1 text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-bold">
                              <Database className="w-2.5 h-2.5" />
                              <span>SQLite</span>
                            </span>
                          )}
                          <span className="text-[9px] bg-zinc-800/90 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                            {tpl.controlsCount} контролов
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-white font-bold text-sm mb-1.5 group-hover:text-blue-300 transition-colors">
                        {tpl.title}
                      </h3>
                      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>

                      {/* C# Logic Snippet Tag */}
                      <div className="mt-2.5 p-2 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[10px] text-zinc-400 font-mono">
                        <div className="flex items-center gap-1 text-zinc-500 font-semibold mb-0.5">
                          <Code className="w-3 h-3 text-cyan-400" />
                          <span>Логика C#:</span>
                        </div>
                        <span className="line-clamp-1 text-zinc-300">{tpl.csharpSummary}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyTemplate(tpl);
                      }}
                      className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Создать проект в 1 клик</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. Selected Template Sidebar Details Drawer */}
          {selectedTemplate && (
            <div className="w-80 border-l border-zinc-800 bg-[#1a1a24] p-5 flex flex-col justify-between overflow-y-auto hidden lg:flex animate-in slide-in-from-right-4 duration-150">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Паспорт шаблона #{String(selectedTemplate.num).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-zinc-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2.5 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-md">
                    {selectedTemplate.icon}
                  </span>
                  <div>
                    <h2 className="text-white font-bold text-base leading-tight">
                      {selectedTemplate.title}
                    </h2>
                    <span className="text-xs text-blue-400 font-medium">
                      {selectedTemplate.categoryTitle}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Описание
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {selectedTemplate.description}
                  </p>
                </div>

                {/* Included UI Controls List */}
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Включенные компоненты ({selectedTemplate.controlsCount})
                  </h4>
                  <div className="space-y-1">
                    {selectedTemplate.controlsList.map((ctrl, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-1.5 bg-zinc-900/80 rounded-lg text-xs text-zinc-300 border border-zinc-800"
                      >
                        <Box className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{ctrl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* C# Logic & Database */}
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Бизнес-логика C# .NET 8
                  </h4>
                  <p className="text-xs text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 leading-relaxed">
                    {selectedTemplate.csharpSummary}
                  </p>
                </div>

                {selectedTemplate.hasDatabase && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Локальная SQLite база</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      Таблица: <strong className="text-white">{selectedTemplate.dbTableName}</strong> с тестовыми данными.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleApplyTemplate(selectedTemplate)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>🚀</span>
                <span>Развернуть шаблон на холсте</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Footer */}
        <div className="h-10 bg-[#16161e] border-t border-zinc-800 px-6 flex justify-between items-center text-[11px] text-zinc-500 shrink-0">
          <span>Найдено шаблонов: <strong className="text-zinc-300">{filteredTemplates.length} из 100</strong></span>
          <span>Двойной клик по карточке — мгновенный запуск</span>
        </div>
      </div>
    </div>
  );
};
