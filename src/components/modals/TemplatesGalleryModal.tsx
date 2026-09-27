import React, { useState, useMemo } from 'react';
import { TEMPLATES_CATALOG, TemplateDefinition } from '../../utils/templatesCatalog';
import { createProjectFromTemplate, TemplateCustomizationOptions } from '../../utils/templateEngine';
import { useDesignerStore } from '../../store/designerStore';
import {
  Search,
  Sparkles,
  Database,
  Code,
  SlidersHorizontal,
  Palette,
  X,
  Check,
  Rocket,
  Layers,
  Box,
} from 'lucide-react';

interface TemplatesGalleryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelectTemplate?: (templateId: string) => void;
  onApplyTemplate?: (templateId: string, customConfig: any) => void;
}

const CATEGORIES = [
  { id: 'all', title: '⭐ Все (100)' },
  { id: 'business', title: '💼 Бизнес и Склад' },
  { id: 'education', title: '🎓 Учеба / Лабы' },
  { id: 'tools', title: '🛠 Системные' },
  { id: 'games', title: '🎮 Игры / Аркады' },
  { id: 'network', title: '🌐 Сети / API' },
  { id: 'text', title: '📝 Текст / Редакторы' },
  { id: 'media', title: '🎬 Медиа / Аудио' },
  { id: 'security', title: '🔒 Безопасность' },
  { id: 'automation', title: '🤖 Автоматизация' },
  { id: 'iot', title: '⚡️ Инженерия / IoT' },
];

export const TemplatesGalleryModal: React.FC<TemplatesGalleryModalProps> = ({
  isOpen = true,
  onClose,
  onSelectTemplate,
  onApplyTemplate,
}) => {
  const store = useDesignerStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(TEMPLATES_CATALOG[0]);

  // Customizable project settings
  const [projectName, setProjectName] = useState(
    selectedTemplate.title.replace(/[^a-zA-Z0-9]/g, '') || 'MyWarehouseApp'
  );
  const [authorName, setAuthorName] = useState('Александр Талентс');
  const [namespaceName, setNamespaceName] = useState('University.Projects');
  const [includeSqlite, setIncludeSqlite] = useState(selectedTemplate.hasDatabase);
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light' | 'blue' | 'purple' | 'emerald'>('dark');

  const filteredTemplates = useMemo(() => {
    return TEMPLATES_CATALOG.filter((t) => {
      const matchesCat = activeCategory === 'all' || t.category === activeCategory;
      if (!matchesCat) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();

      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.csharpSummary.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        String(t.num) === q
      );
    });
  }, [activeCategory, search]);

  const handleSelectTemplateCard = (tpl: TemplateDefinition) => {
    setSelectedTemplate(tpl);
    setProjectName(tpl.title.replace(/[^a-zA-Z0-9]/g, '') || 'MyCustomApp');
    setIncludeSqlite(tpl.hasDatabase);
  };

  const handleCreate = () => {
    const customConfig: TemplateCustomizationOptions = {
      projectName,
      authorName,
      namespaceName,
      customTitle: selectedTemplate.title,
      theme: selectedTheme,
      enableDatabase: selectedTemplate.hasDatabase ? includeSqlite : false,
      seedRecordCount: 5,
    };

    if (onApplyTemplate) {
      onApplyTemplate(selectedTemplate.id, customConfig);
    } else if (onSelectTemplate) {
      onSelectTemplate(selectedTemplate.id);
    } else {
      createProjectFromTemplate(selectedTemplate.id, true, customConfig);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="w-[1180px] h-[740px] max-h-[92vh] bg-[#16161c] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-300 font-sans">
        
        {/* 1. Window Header */}
        <div className="h-13 bg-[#1f1f27] border-b border-zinc-800 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-lg">🌟</span>
            <div>
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <span>Галерея 100 Шаблонов с Кастомизатором</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  .NET 8 / C# / SQLite
                </span>
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                120 FPS скролл • Двухпанельный кастомизатор • 100% рабочий C# код
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg p-1.5 transition text-sm font-bold cursor-pointer"
            title="Закрыть (Esc)"
          >
            ✕
          </button>
        </div>

        {/* 2. Search & Category Filters Bar */}
        <div className="p-3.5 bg-[#121217] border-b border-zinc-800 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Быстрый поиск (например: склад, сапер, калькулятор, дейкстра, погода, sqlite)..."
              className="w-full pl-10 pr-8 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-medium"
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

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/50'
                    : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* 3. TWO-PANEL WORKSPACE LAYER (Left Catalog 58%, Right Customizer 42%) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANEL: Scrollable Catalog Cards List (58% width) */}
          <div className="w-[58%] border-r border-zinc-800/90 p-4 overflow-y-auto space-y-2.5 bg-[#121217]/60 scrollbar-thin">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Найдено шаблонов: {filteredTemplates.length} из 100
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Клик по карточке — открыть параметры</span>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 space-y-2">
                <Search className="w-10 h-10 text-zinc-600" />
                <span className="text-xs font-semibold text-zinc-400">Шаблоны не найдены</span>
                <span className="text-[11px] text-zinc-600 max-w-xs">
                  Попробуйте изменить поисковый запрос или выберите другую категорию.
                </span>
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplate.id === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplateCard(tpl)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-600/10 ring-1 ring-blue-500/40'
                        : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800/90 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <span className="text-2xl p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 shrink-0">
                      {tpl.icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-mono font-bold text-blue-400">
                            #{String(tpl.num).padStart(2, '0')}
                          </span>
                          <h3 className="font-bold text-xs text-white truncate">{tpl.title}</h3>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {tpl.hasDatabase && (
                            <span className="text-[9px] bg-emerald-950/90 text-emerald-400 border border-emerald-700/60 px-1.5 py-0.2 rounded font-bold font-mono">
                              SQLite
                            </span>
                          )}
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-mono">
                            {tpl.controlsCount} элем.
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-1.5">
                        {tpl.description}
                      </p>

                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono truncate">
                        <Code className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{tpl.csharpSummary}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT PANEL: Live Customizer for Selected Template (42% width) */}
          <div className="flex-1 p-5 bg-[#16161c] flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="space-y-4">
              
              {/* Selected Template Badge */}
              <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-center gap-3.5 shadow-md">
                <span className="text-3xl p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 shrink-0">
                  {selectedTemplate.icon}
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono font-bold text-blue-400 block">
                    ШАБЛОН #{String(selectedTemplate.num).padStart(2, '0')}
                  </span>
                  <h3 className="text-white font-bold text-sm leading-tight truncate">
                    {selectedTemplate.title}
                  </h3>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    {selectedTemplate.categoryTitle}
                  </span>
                </div>
              </div>

              {/* Customization Input Fields */}
              <div className="space-y-3.5 text-xs">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  ⚙️ Параметры вашего проекта
                </span>

                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                    Имя проекта (ProjectName):
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-white text-xs font-mono outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                    Пространство имен (Namespace):
                  </label>
                  <input
                    type="text"
                    value={namespaceName}
                    onChange={(e) => setNamespaceName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-white text-xs font-mono outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                    Автор / Разработчик:
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-white text-xs outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1.5 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Тема оформления формы:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'dark', name: 'Dark Minimal', color: '#18181B' },
                      { id: 'light', name: 'Win11 Light', color: '#F3F4F6' },
                      { id: 'blue', name: 'Corporate Blue', color: '#0F172A' },
                      { id: 'emerald', name: 'Emerald Matrix', color: '#064E3B' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setSelectedTheme(th.id as any)}
                        className={`p-2 rounded-xl text-[11px] font-semibold border flex items-center gap-2 transition cursor-pointer ${
                          selectedTheme === th.id
                            ? 'border-blue-500 bg-blue-950/40 text-white ring-1 ring-blue-500/50'
                            : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-zinc-600 shrink-0"
                          style={{ backgroundColor: th.color }}
                        />
                        <span className="truncate">{th.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTemplate.hasDatabase && (
                  <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
                    <label className="flex items-center gap-2.5 cursor-pointer text-zinc-200 font-semibold text-xs">
                      <input
                        type="checkbox"
                        checked={includeSqlite}
                        onChange={(e) => setIncludeSqlite(e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      />
                      <span>Создать базу данных SQLite ({selectedTemplate.dbTableName})</span>
                    </label>
                    <p className="text-[10px] text-zinc-400 pl-6">
                      Генерирует DDL схему таблицы и предзаполняет 5 тестовых записей.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Deploy Action Button */}
            <div className="pt-4 border-t border-zinc-800/90 mt-4">
              <button
                type="button"
                onClick={handleCreate}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
              >
                <span>🚀</span>
                <span>Создать проект с этими параметрами</span>
              </button>
            </div>

          </div>

        </div>

        {/* 4. Footer */}
        <div className="h-8 bg-[#121217] border-t border-zinc-800 px-6 flex justify-between items-center text-[11px] text-zinc-500 shrink-0">
          <span>Отображено шаблонов: <strong className="text-zinc-300">{filteredTemplates.length} из 100</strong></span>
          <span>⚡️ Выберите шаблон слева для открытия живой панели кастомизации</span>
        </div>

      </div>
    </div>
  );
};
