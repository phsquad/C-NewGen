import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDesignerStore } from '../../store/designerStore';
import { TEMPLATES_CATALOG, TemplateDefinition } from '../../utils/templatesCatalog';
import { createProjectFromTemplate, TemplateCustomizationOptions } from '../../utils/templateEngine';
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
  SlidersHorizontal,
  Palette,
  Type,
  Table,
  Check,
  Eye,
  Settings2,
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

const THEME_OPTIONS: Array<{ id: 'dark' | 'light' | 'blue' | 'purple' | 'emerald'; name: string; bgClass: string; colorHex: string }> = [
  { id: 'dark', name: 'Dark Minimal', bgClass: 'bg-zinc-900 border-zinc-700', colorHex: '#18181B' },
  { id: 'light', name: 'Win11 Light', bgClass: 'bg-zinc-100 text-zinc-900 border-zinc-300', colorHex: '#F3F4F6' },
  { id: 'blue', name: 'Corporate Blue', bgClass: 'bg-slate-900 border-blue-500/50', colorHex: '#0F172A' },
  { id: 'purple', name: 'Cyber Purple', bgClass: 'bg-indigo-950 border-purple-500/50', colorHex: '#1E1B4B' },
  { id: 'emerald', name: 'Emerald Matrix', bgClass: 'bg-emerald-950 border-emerald-500/50', colorHex: '#064E3B' },
];

// Memoized individual Card for zero-lag performance
const TemplateCardItem = React.memo(({
  tpl,
  isSelected,
  onSelect,
  onQuickDeploy,
}: {
  tpl: TemplateDefinition;
  isSelected: boolean;
  onSelect: (tpl: TemplateDefinition) => void;
  onQuickDeploy: (tpl: TemplateDefinition, e: React.MouseEvent) => void;
}) => {
  return (
    <div
      onClick={() => onSelect(tpl)}
      className={`bg-zinc-900/80 border rounded-2xl p-4 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer relative overflow-hidden select-none ${
        isSelected
          ? 'border-blue-500 bg-blue-950/25 ring-2 ring-blue-500/50 scale-[1.01]'
          : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
      }`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}
    >
      <div>
        {/* Card Header: Icon, ID, Badges */}
        <div className="flex justify-between items-start mb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 bg-zinc-950/90 border border-zinc-800 rounded-xl group-hover:scale-105 transition-transform shadow-sm">
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
              <span className="flex items-center gap-1 text-[9px] bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-bold">
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
        <h3 className="text-white font-bold text-sm mb-1 group-hover:text-blue-300 transition-colors">
          {tpl.title}
        </h3>
        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
          {tpl.description}
        </p>

        {/* C# Logic Snippet Tag */}
        <div className="mt-2.5 p-2 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[10px] text-zinc-400 font-mono">
          <div className="flex items-center gap-1 text-zinc-500 font-semibold mb-0.5">
            <Code className="w-3 h-3 text-cyan-400" />
            <span>Логика C#:</span>
          </div>
          <span className="line-clamp-1 text-zinc-300">{tpl.csharpSummary}</span>
        </div>
      </div>

      {/* Buttons Bar */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => onQuickDeploy(tpl, e)}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Быстрый запуск</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect(tpl)}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs transition cursor-pointer border border-zinc-700/60"
          title="Настроить и кастомизировать"
        >
          <Settings2 className="w-4 h-4 text-blue-400" />
        </button>
      </div>
    </div>
  );
});

export const TemplatesGalleryModal: React.FC<TemplatesGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const store = useDesignerStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);

  // Customization state for chosen template
  const [customTitle, setCustomTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light' | 'blue' | 'purple' | 'emerald'>('dark');
  const [fontSize, setFontSize] = useState<number>(9);
  const [enableDatabase, setEnableDatabase] = useState<boolean>(true);
  const [seedRecordCount, setSeedRecordCount] = useState<number>(5);
  const [previewTab, setPreviewTab] = useState<'info' | 'csharp' | 'sql'>('info');

  // Performance batching: show items in pages of 24 for ultra-fast DOM rendering
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Sync state when template selected
  useEffect(() => {
    if (selectedTemplate) {
      setCustomTitle(selectedTemplate.title);
      setProjectName(selectedTemplate.title.replace(/[^a-zA-Z0-9]/g, '') || 'MyCustomApp');
      setEnableDatabase(selectedTemplate.hasDatabase);
      setSeedRecordCount(5);
    }
  }, [selectedTemplate]);

  // Reset pagination on category or search change
  useEffect(() => {
    setVisibleCount(24);
  }, [activeCategory, search]);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES_CATALOG.filter((tpl) => {
      const matchesCategory = activeCategory === 'all' || tpl.category === activeCategory;
      if (!matchesCategory) return false;

      if (!search.trim()) return true;
      const query = search.toLowerCase().trim();

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

  const visibleTemplates = useMemo(() => {
    return filteredTemplates.slice(0, visibleCount);
  }, [filteredTemplates, visibleCount]);

  // Generate live C# / SQL preview for customized template
  const livePreview = useMemo(() => {
    if (!selectedTemplate) return null;
    const options: TemplateCustomizationOptions = {
      customTitle,
      projectName,
      theme,
      fontSize,
      enableDatabase,
      seedRecordCount,
    };
    return createProjectFromTemplate(selectedTemplate.id, false, options);
  }, [selectedTemplate, customTitle, projectName, theme, fontSize, enableDatabase, seedRecordCount]);

  if (!isOpen) return null;

  const handleApplyTemplateCustomized = (tpl: TemplateDefinition) => {
    if (onSelectTemplate) {
      onSelectTemplate(tpl.id);
    } else {
      const options: TemplateCustomizationOptions = {
        customTitle: customTitle || tpl.title,
        projectName: projectName || tpl.title.replace(/[^a-zA-Z0-9]/g, '') || 'MyCustomApp',
        theme,
        fontSize,
        enableDatabase,
        seedRecordCount,
      };

      createProjectFromTemplate(tpl.id, true, options);
    }
    onClose();
  };

  const handleQuickDeploy = (tpl: TemplateDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectTemplate) {
      onSelectTemplate(tpl.id);
    } else {
      createProjectFromTemplate(tpl.id, true);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-2 sm:p-5 animate-in fade-in duration-150">
      <div className="w-full max-w-7xl h-[92vh] bg-[#121217] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-300 font-sans select-none">
        
        {/* 1. Top Header */}
        <div className="h-14 bg-[#181820] border-b border-zinc-800/90 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm sm:text-base">
                  Галерея 100 Шаблонов с Кастомизатором
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                  .NET 8 / C# / SQLite WASM
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Живая настройка параметров · 120 FPS оптимизация · 0% нагрузки на CPU
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

        {/* 2. Search & Filter Bar */}
        <div className="p-3.5 border-b border-zinc-800/80 bg-[#16161d] space-y-2.5 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Быстрый поиск (например: склад, сапер, калькулятор, дейкстра, погода, sqlite)..."
              className="w-full pl-10 pr-10 py-2 bg-zinc-950/90 border border-zinc-700/80 rounded-xl text-white text-xs placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all"
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

          {/* Category Navigation Pills */}
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

        {/* 3. Main Workspace: Grid + Customization Drawer */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Grid Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-zinc-500">
                  <Search className="w-12 h-12 text-zinc-600 mb-3" />
                  <span className="text-sm font-semibold text-zinc-400">Шаблоны не найдены</span>
                  <span className="text-xs text-zinc-600 max-w-sm mt-1">
                    Попробуйте сбросить поиск или выбрать другую категорию.
                  </span>
                </div>
              ) : (
                visibleTemplates.map((tpl) => (
                  <TemplateCardItem
                    key={tpl.id}
                    tpl={tpl}
                    isSelected={selectedTemplate?.id === tpl.id}
                    onSelect={setSelectedTemplate}
                    onQuickDeploy={handleQuickDeploy}
                  />
                ))
              )}
            </div>

            {/* Pagination Load More footer for smooth 120 FPS performance */}
            {visibleCount < filteredTemplates.length && (
              <div className="p-3 border-t border-zinc-800/80 bg-[#16161d] flex justify-center shrink-0">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 24)}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2"
                >
                  <span>Загрузить еще ({filteredTemplates.length - visibleCount} шаблонов)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Customization Drawer */}
          {selectedTemplate && (
            <div className="w-96 border-l border-zinc-800 bg-[#171720] flex flex-col justify-between overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-150">
              
              {/* Drawer Header */}
              <div className="p-4 border-b border-zinc-800 bg-[#1d1d28] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Кастомизация шаблона
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Settings & Live Preview */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Selected Template Badge */}
                <div className="flex items-center gap-3 p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
                  <span className="text-3xl p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                    {selectedTemplate.icon}
                  </span>
                  <div>
                    <h2 className="text-white font-bold text-sm leading-tight">
                      #{String(selectedTemplate.num).padStart(2, '0')} {selectedTemplate.title}
                    </h2>
                    <span className="text-xs text-blue-400 font-medium">
                      {selectedTemplate.categoryTitle}
                    </span>
                  </div>
                </div>

                {/* Live Preview Tabs */}
                <div className="flex border-b border-zinc-800 text-xs">
                  <button
                    onClick={() => setPreviewTab('info')}
                    className={`flex-1 py-1.5 font-semibold text-center border-b-2 transition cursor-pointer ${
                      previewTab === 'info'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    ⚙️ Параметры
                  </button>
                  <button
                    onClick={() => setPreviewTab('csharp')}
                    className={`flex-1 py-1.5 font-semibold text-center border-b-2 transition cursor-pointer ${
                      previewTab === 'csharp'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    💻 C# Код
                  </button>
                  <button
                    onClick={() => setPreviewTab('sql')}
                    className={`flex-1 py-1.5 font-semibold text-center border-b-2 transition cursor-pointer ${
                      previewTab === 'sql'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    🗄 SQLite DDL
                  </button>
                </div>

                {/* Tab Content 1: Customization Form */}
                {previewTab === 'info' && (
                  <div className="space-y-3.5 text-xs">
                    
                    {/* Custom Title */}
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Заголовок формы WinForms:
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-white text-xs outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    {/* Project C# Namespace */}
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Имя проекта / Пространство имен:
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-white text-xs font-mono outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Theme Selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 mb-1.5">
                        <Palette className="w-3.5 h-3.5 text-amber-400" />
                        <span>Тема оформления формы:</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {THEME_OPTIONS.map((th) => (
                          <button
                            key={th.id}
                            type="button"
                            onClick={() => setTheme(th.id)}
                            className={`p-2 rounded-xl text-[11px] font-semibold border flex items-center gap-2 transition cursor-pointer ${
                              theme === th.id
                                ? 'border-blue-500 bg-blue-950/40 text-white ring-1 ring-blue-500/50'
                                : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-zinc-600 shrink-0"
                              style={{ backgroundColor: th.colorHex }}
                            />
                            <span className="truncate">{th.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size Selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 mb-1">
                        <Type className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Кегль шрифта формы ({fontSize}pt):</span>
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="14"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* SQLite Database Settings */}
                    <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <Table className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Локальная БД SQLite</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableDatabase}
                          onChange={(e) => setEnableDatabase(e.target.checked)}
                          className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      {enableDatabase && (
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-1">
                            Генерировать тестовых записей:
                          </label>
                          <select
                            value={seedRecordCount}
                            onChange={(e) => setSeedRecordCount(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs outline-none"
                          >
                            <option value={3}>3 записи (Минимальный сид)</option>
                            <option value={5}>5 записей (Стандарт)</option>
                            <option value={15}>15 записей (Расширенный)</option>
                            <option value={50}>50 записей (Нагрузочный)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content 2: C# Code Preview */}
                {previewTab === 'csharp' && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Предпросмотр C# кода (Form1.cs)
                    </span>
                    <pre className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[10px] font-mono text-cyan-300 leading-relaxed overflow-x-auto max-h-80 select-text">
                      {livePreview?.codeBehindCs}
                    </pre>
                  </div>
                )}

                {/* Tab Content 3: SQL DDL Schema Preview */}
                {previewTab === 'sql' && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Схема SQLite WASM DDL
                    </span>
                    <pre className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[10px] font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-80 select-text">
                      {livePreview?.sqlSchema}
                    </pre>
                  </div>
                )}
              </div>

              {/* Drawer Footer Deploy Button */}
              <div className="p-4 border-t border-zinc-800 bg-[#181822] shrink-0">
                <button
                  type="button"
                  onClick={() => handleApplyTemplateCustomized(selectedTemplate)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <RocketIcon />
                  <span>Развернуть кастомизированный шаблон</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Footer */}
        <div className="h-9 bg-[#14141c] border-t border-zinc-800/90 px-6 flex justify-between items-center text-[11px] text-zinc-500 shrink-0">
          <span>
            Отображено шаблонов: <strong className="text-zinc-300">{visibleTemplates.length} из {filteredTemplates.length}</strong>
          </span>
          <span>⚡️ Выберите шаблон для открытия живой панели кастомизации</span>
        </div>
      </div>
    </div>
  );
};

const RocketIcon = () => (
  <svg className="w-4 h-4 text-amber-300 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);
