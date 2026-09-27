import React, { useState, useEffect, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import {
  StylePresetsEngine,
  StylePreset,
  SYSTEM_STYLE_PRESETS,
} from '../../utils/stylePresetsEngine';
import {
  Sparkles,
  Plus,
  Save,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  Palette,
  Type,
  Square,
  FileCode,
  Download,
  Upload,
  RefreshCw,
  Layers,
  ChevronDown,
  Tag,
  CheckCircle2,
} from 'lucide-react';

export const PresetsTabContent: React.FC = () => {
  const {
    selectedNode,
    selectedNodes,
    project,
    updateNodeProperties,
    updateMultipleNodesProperties,
    addConsoleLog,
    beginTransaction,
    commitTransaction,
  } = useDesigner();

  // Active target node (fallback to active/root form if none selected)
  const targetNode =
    selectedNode ||
    (selectedNodes.length > 0 ? selectedNodes[0] : null) ||
    project.nodes[project.activeFormId] ||
    project.nodes[project.rootFormId] ||
    null;

  const targetName = targetNode?.properties?.name || 'Control';
  const targetType = targetNode?.type || 'Button';

  // Presets state
  const [presets, setPresets] = useState<StylePreset[]>(() => StylePresetsEngine.loadAllPresets());
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyUserCustom, setOnlyUserCustom] = useState<boolean>(false);

  // Save new preset form state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetCategory, setNewPresetCategory] = useState<StylePreset['category']>('Buttons');
  const [includeColors, setIncludeColors] = useState<boolean>(true);
  const [includeTypography, setIncludeTypography] = useState<boolean>(true);
  const [includeBorders, setIncludeBorders] = useState<boolean>(true);
  const [includeFlatStyle, setIncludeFlatStyle] = useState<boolean>(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Applied flash feedback
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Reload presets on mount and when storage updates
  const reloadPresets = () => {
    setPresets(StylePresetsEngine.loadAllPresets());
  };

  useEffect(() => {
    if (isCreating && targetNode) {
      setNewPresetName(`Стиль ${targetName}`);
      if (['Panel', 'GroupBox', 'Form'].includes(targetNode.type)) {
        setNewPresetCategory('Forms & Panels');
      } else if (['TextBox', 'RichTextBox', 'Label', 'ComboBox'].includes(targetNode.type)) {
        setNewPresetCategory('Inputs & Text');
      } else {
        setNewPresetCategory('Buttons');
      }
    }
  }, [isCreating, targetName, targetNode]);

  // Filtered Presets
  const filteredPresets = useMemo(() => {
    return presets.filter((p) => {
      if (onlyUserCustom && p.isSystem) return false;
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [presets, activeCategory, searchQuery, onlyUserCustom]);

  // Apply Preset to current selection
  const handleApplyPreset = (
    preset: StylePreset,
    filter: 'all' | 'colors' | 'typography' | 'borders' = 'all'
  ) => {
    const propsToApply = StylePresetsEngine.getPropertiesToApply(preset, filter);

    beginTransaction();
    if (selectedNodes.length > 1) {
      const nodeIds = selectedNodes.map((n) => n.id);
      updateMultipleNodesProperties(nodeIds, propsToApply);
      commitTransaction(`Применение стиля "${preset.name}" к ${nodeIds.length} элементам`);
      addConsoleLog(
        'System',
        `Стиль "${preset.name}" применен к ${nodeIds.length} элементам (${filter === 'all' ? 'полный' : filter}).`
      );
    } else if (targetNode) {
      updateNodeProperties(targetNode.id, propsToApply);
      commitTransaction(`Применение стиля "${preset.name}" к ${targetName}`);
      addConsoleLog(
        'System',
        `Стиль "${preset.name}" успешно применен к элементу ${targetName} (${filter === 'all' ? 'все свойства' : filter}).`
      );
    }

    setAppliedPresetId(preset.id);
    setTimeout(() => setAppliedPresetId(null), 1500);
  };

  // Save current control style
  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNode) return;

    const saved = StylePresetsEngine.savePreset(newPresetName, newPresetCategory, targetNode, {
      colors: includeColors,
      typography: includeTypography,
      borders: includeBorders,
      flatStyle: includeFlatStyle,
    });

    reloadPresets();
    setIsCreating(false);
    setSaveSuccessMsg(`Пресет "${saved.name}" успешно сохранен в LocalStorage!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);

    addConsoleLog(
      'System',
      `Пользовательский стиль "${saved.name}" сохранен в браузере (LocalStorage).`
    );
  };

  // Delete preset
  const handleDeletePreset = (id: string, name: string) => {
    StylePresetsEngine.deletePreset(id);
    reloadPresets();
    addConsoleLog('System', `Пресет "${name}" удален из LocalStorage.`);
  };

  // Copy C# code
  const handleCopyCSharpCode = (preset: StylePreset) => {
    const code = StylePresetsEngine.generateCSharpSnippet(targetName, preset);
    navigator.clipboard.writeText(code);
    setCopiedCodeId(preset.id);
    setTimeout(() => setCopiedCodeId(null), 2000);
    addConsoleLog('System', `C# код стиля "${preset.name}" скопирован в буфер.`);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = StylePresetsEngine.exportPresetsAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DevOS_Style_Presets_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addConsoleLog('System', 'Коллекция пресетов стилей экспортирована в JSON.');
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const count = StylePresetsEngine.importPresetsFromJson(text);
        reloadPresets();
        addConsoleLog('System', `Импортировано ${count} пресетов стилей из файла.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs text-zinc-300 font-sans select-none bg-zinc-900/90">
      {/* 1. Header Banner & "Save Current As Preset" trigger */}
      <div className="p-3 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/40 border-b border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white text-xs">Пресеты стилей (Presets)</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
            LocalStorage
          </span>
        </div>

        {/* Action Button: Save Current Control As Preset */}
        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Сохранить стиль ({targetName}) как пресет...</span>
          </button>
        ) : (
          /* Inline Creation Form */
          <form
            onSubmit={handleSaveCurrentAsPreset}
            className="p-3 bg-zinc-950 border border-purple-500/40 rounded-xl space-y-3 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5 text-purple-400" />
                Новый пресет из {targetName}
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
              >
                ✕ Отмена
              </button>
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 font-semibold">Название пресета:</label>
              <input
                type="text"
                required
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Например: Orange Action Button"
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-purple-500 rounded px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 font-semibold">Категория:</label>
              <select
                value={newPresetCategory}
                onChange={(e) => setNewPresetCategory(e.target.value as StylePreset['category'])}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white outline-none"
              >
                <option value="Buttons">🔘 Кнопки (Buttons)</option>
                <option value="Forms & Panels">🗔 Формы и панели (Forms & Panels)</option>
                <option value="Inputs & Text">📝 Поля ввода и текст (Inputs & Text)</option>
                <option value="Badges & Cards">🏷 Бейджи и карточки (Badges & Cards)</option>
                <option value="Custom">✨ Пользовательские (Custom)</option>
              </select>
            </div>

            {/* Inclusions checkboxes */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Включить в пресет:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={includeColors}
                    onChange={(e) => setIncludeColors(e.target.checked)}
                    className="accent-purple-600 rounded"
                  />
                  <span>Цвета (Back/Fore)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={includeTypography}
                    onChange={(e) => setIncludeTypography(e.target.checked)}
                    className="accent-purple-600 rounded"
                  />
                  <span>Шрифт и размер</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={includeBorders}
                    onChange={(e) => setIncludeBorders(e.target.checked)}
                    className="accent-purple-600 rounded"
                  />
                  <span>Рамки и радиус</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={includeFlatStyle}
                    onChange={(e) => setIncludeFlatStyle(e.target.checked)}
                    className="accent-purple-600 rounded"
                  />
                  <span>FlatStyle стиль</span>
                </label>
              </div>
            </div>

            {/* Save Submit Button */}
            <button
              type="submit"
              className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Сохранить в LocalStorage</span>
            </button>
          </form>
        )}

        {/* Success toast banner */}
        {saveSuccessMsg && (
          <div className="p-2 bg-emerald-600/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-[11px] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Search & Category Filters */}
      <div className="p-2.5 border-b border-zinc-800 bg-zinc-950/60 space-y-2 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Поиск пресета (Orange, Fluent, Dark...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-md pl-8 pr-3 py-1 text-xs text-zinc-200 outline-none placeholder-zinc-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setOnlyUserCustom(false);
            }}
            className={`px-2 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer ${
              activeCategory === 'all' && !onlyUserCustom
                ? 'bg-purple-600 text-white font-semibold'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Все ({presets.length})
          </button>
          <button
            type="button"
            onClick={() => setOnlyUserCustom((prev) => !prev)}
            className={`px-2 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
              onlyUserCustom
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>★ Мои пресеты</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('Buttons');
              setOnlyUserCustom(false);
            }}
            className={`px-2 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer ${
              activeCategory === 'Buttons' && !onlyUserCustom
                ? 'bg-purple-600 text-white font-semibold'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Кнопки
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('Forms & Panels');
              setOnlyUserCustom(false);
            }}
            className={`px-2 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer ${
              activeCategory === 'Forms & Panels' && !onlyUserCustom
                ? 'bg-purple-600 text-white font-semibold'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Панели
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('Inputs & Text');
              setOnlyUserCustom(false);
            }}
            className={`px-2 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer ${
              activeCategory === 'Inputs & Text' && !onlyUserCustom
                ? 'bg-purple-600 text-white font-semibold'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Текст
          </button>
        </div>
      </div>

      {/* 3. Presets Cards Grid / List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {filteredPresets.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 space-y-2">
            <Palette className="w-8 h-8 mx-auto text-zinc-600 opacity-50" />
            <p className="text-xs font-medium">Пресеты не найдены</p>
            <p className="text-[11px] text-zinc-600">
              Попробуйте изменить запрос поиска или сохраните текущий стиль в пресеты.
            </p>
          </div>
        ) : (
          filteredPresets.map((preset) => {
            const p = preset.properties;
            const isApplied = appliedPresetId === preset.id;
            const isCopied = copiedCodeId === preset.id;

            return (
              <div
                key={preset.id}
                className={`p-3 rounded-xl border transition-all ${
                  isApplied
                    ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/20'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white text-xs">{preset.name}</span>
                      {preset.isSystem ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                          System
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                          Пользовательский
                        </span>
                      )}
                    </div>
                    {preset.description && (
                      <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                        {preset.description}
                      </p>
                    )}
                  </div>

                  {/* Right actions (Copy C#, Delete if custom) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyCSharpCode(preset)}
                      title="Копировать C# код применения стиля"
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-purple-300 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5" />}
                    </button>
                    {!preset.isSystem && (
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(preset.id, preset.name)}
                        title="Удалить пресет из LocalStorage"
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual Swatch / Live Element Preview */}
                <div className="mt-2.5 p-2 bg-zinc-900 rounded-lg border border-zinc-800/80 flex items-center justify-between gap-3">
                  {/* Swatch rendering the exact style */}
                  <div
                    style={{
                      backgroundColor: p.backColor || '#2563EB',
                      color: p.foreColor || '#FFFFFF',
                      fontFamily: p.fontFamily || 'Segoe UI',
                      fontSize: `${Math.min(12, Math.max(9, p.fontSize || 9))}px`,
                      fontWeight: p.fontWeight === 'Bold' ? 'bold' : 'normal',
                      borderRadius: `${p.borderRadius !== undefined ? p.borderRadius : 6}px`,
                      borderColor: p.borderColor || 'transparent',
                      borderWidth: `${p.borderWidth || 1}px`,
                      borderStyle: p.borderStyle ? p.borderStyle.toLowerCase() : 'solid',
                    }}
                    className="px-3 py-1.5 shadow-sm truncate max-w-[150px] text-center shrink-0 flex items-center justify-center font-sans select-none"
                  >
                    {targetName || 'Sample'}
                  </div>

                  {/* Property Specs Pill List */}
                  <div className="text-[10px] font-mono text-zinc-400 flex flex-col items-end gap-0.5 truncate">
                    {p.backColor && (
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-zinc-700 shrink-0"
                          style={{ backgroundColor: p.backColor }}
                        />
                        <span>{p.backColor}</span>
                      </div>
                    )}
                    {p.fontFamily && (
                      <span className="text-zinc-500 truncate">
                        {p.fontFamily}, {p.fontSize || 9}pt
                      </span>
                    )}
                    {p.borderRadius !== undefined && (
                      <span className="text-zinc-500">Radius: {p.borderRadius}px</span>
                    )}
                  </div>
                </div>

                {/* Apply Buttons Bar */}
                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset, 'all')}
                    className="flex-1 py-1 px-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-purple-600/20"
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Применено!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {selectedNodes.length > 1
                            ? `Применить ко всем (${selectedNodes.length})`
                            : `Применить к ${targetName}`}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Selective Apply: Colors only */}
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset, 'colors')}
                    title="Применить только цвета (BackColor / ForeColor)"
                    className="py-1 px-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-[10px] font-semibold transition-colors cursor-pointer border border-zinc-700/60"
                  >
                    Цвета
                  </button>

                  {/* Selective Apply: Font only */}
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset, 'typography')}
                    title="Применить только шрифт и типографику"
                    className="py-1 px-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-[10px] font-semibold transition-colors cursor-pointer border border-zinc-700/60"
                  >
                    Шрифт
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Footer Utilities (Export / Import Presets) */}
      <div className="p-2.5 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Всего: {presets.length} стилей</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            title="Экспортировать пресеты в JSON"
            className="flex items-center gap-1 hover:text-purple-300 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Экспорт</span>
          </button>
          <span className="text-zinc-700">|</span>
          <label
            title="Импортировать пресеты из JSON"
            className="flex items-center gap-1 hover:text-purple-300 transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>Импорт</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
