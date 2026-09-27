import { DesignerNode, NodeProperties } from '../types/ast';

export interface StylePreset {
  id: string;
  name: string;
  category: 'Buttons' | 'Forms & Panels' | 'Inputs & Text' | 'Badges & Cards' | 'Custom';
  description?: string;
  targetControlTypes?: string[]; // e.g. ['Button'], ['TextBox'], ['all']
  isSystem?: boolean;
  createdAt: string;
  properties: {
    backColor?: string;
    foreColor?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    borderStyle?: 'None' | 'FixedSingle' | 'Fixed3D' | string;
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    flatStyle?: 'Standard' | 'Flat' | 'Popup' | 'System' | string;
    textAlign?: string;
    opacity?: number;
    customProps?: Record<string, any>;
  };
}

export const STORAGE_KEY_PRESETS = 'devos_style_presets_v1';

export const SYSTEM_STYLE_PRESETS: StylePreset[] = [
  {
    id: 'preset_orange_action',
    name: 'Orange Accent (btnCE Style)',
    category: 'Buttons',
    description: 'Фирменный оранжевый стиль кнопки калькулятора и акцентных действий',
    targetControlTypes: ['Button', 'all'],
    isSystem: true,
    createdAt: '2026-01-01',
    properties: {
      backColor: '#F97316',
      foreColor: '#FFFFFF',
      fontFamily: 'Segoe UI',
      fontSize: 9,
      fontWeight: 'Bold',
      borderRadius: 6,
      borderStyle: 'FixedSingle',
      borderWidth: 1,
      borderColor: '#EA580C',
      flatStyle: 'Flat',
    },
  },
  {
    id: 'preset_fluent_blue',
    name: 'Modern Fluent Blue',
    category: 'Buttons',
    description: 'Стандартный стиль первичных кнопок в Windows 11 / Fluent UI',
    targetControlTypes: ['Button', 'all'],
    isSystem: true,
    createdAt: '2026-01-01',
    properties: {
      backColor: '#2563EB',
      foreColor: '#FFFFFF',
      fontFamily: 'Segoe UI',
      fontSize: 9,
      fontWeight: 'SemiBold',
      borderRadius: 6,
      borderStyle: 'FixedSingle',
      borderWidth: 1,
      borderColor: '#1D4ED8',
      flatStyle: 'Flat',
    },
  },
  {
    id: 'preset_emerald_success',
    name: 'Emerald Green Success',
    category: 'Buttons',
    description: 'Зеленая кнопка подтверждения, сохранения и успешных операций',
    targetControlTypes: ['Button', 'all'],
    isSystem: true,
    createdAt: '2026-01-01',
    properties: {
      backColor: '#10B981',
      foreColor: '#FFFFFF',
      fontFamily: 'Segoe UI',
      fontSize: 9,
      fontWeight: 'Bold',
      borderRadius: 6,
      borderStyle: 'FixedSingle',
      borderWidth: 1,
      borderColor: '#059669',
      flatStyle: 'Flat',
    },
  },
  {
    id: 'preset_crimson_danger',
    name: 'Ruby Crimson Danger',
    category: 'Buttons',
    description: 'Красная кнопка удаления, отмены и деструктивных действий',
    targetControlTypes: ['Button', 'all'],
    isSystem: true,
    createdAt: '2026-01-01',
    properties: {
      backColor: '#EF4444',
      foreColor: '#FFFFFF',
      fontFamily: 'Segoe UI',
      fontSize: 9,
      fontWeight: 'Bold',
      borderRadius: 6,
      borderStyle: 'FixedSingle',
      borderWidth: 1,
      borderColor: '#DC2626',
      flatStyle: 'Flat',
    },
  },
  {
    id: 'preset_dark_slate_card',
    name: 'Dark Slate Panel / Card',
    category: 'Forms & Panels',
    description: 'Темная карточка или панель с мягкой рамкой и аккуратным контрастом',
    targetControlTypes: ['Panel', 'GroupBox', 'Form', 'all'],
    isSystem: true,
    createdAt: '2026-01-01',
    properties: {
      backColor: '#1E293B',
      foreColor: '#F8FAFC',
      fontFamily: 'Segoe UI',
      fontSize: 9,
      borderRadius: 8,
      borderStyle: 'FixedSingle',
      borderWidth: 1,
      borderColor: '#334155',
    },
  },
  {
    id: 'preset_glass_cyber_panel',
    name: 'Neon Cyber Blue Panel',
    category: 'Forms & Panels',
    description: 'Стильный неоновый блок с киберпанковской синей окантовкой',
    targetControlTypes: ['Panel', 'GroupBox', 'all'],
    isSystem: true,
    createdAt: '2026-01-01',
    properties: {
      backColor: '#0F172A',
      foreColor: '#38BDF8',
      fontFamily: 'Consolas',
      fontSize: 9,
      borderRadius: 10,
      borderStyle: 'FixedSingle',
      borderWidth: 1,
      borderColor: '#0EA5E9',
    },
  },
  {
    id: 'preset_dark_input',
    name: 'Dark Console Input Box',
    category: 'Inputs & Text',
    description: 'Темное поле ввода с моноширинным шрифтом для кода и числовых значений',
    targetControlTypes: ['TextBox', 'RichTextBox', 'ComboBox', 'NumericUpDown', 'all'],
    isSystem: true,
    createdAt: '2026-01-01',
    properties: {
      backColor: '#09090B',
      foreColor: '#22C55E',
      fontFamily: 'Consolas',
      fontSize: 9.5,
      borderRadius: 6,
      borderStyle: 'FixedSingle',
      borderWidth: 1,
      borderColor: '#27272A',
    },
  },
  {
    id: 'preset_header_title_label',
    name: 'Accent Header Title (14pt)',
    category: 'Inputs & Text',
    description: 'Крупный заголовок секции или формы с градиентным голубым свечением',
    targetControlTypes: ['Label', 'all'],
    isSystem: true,
    createdAt: '2026-01-01',
    properties: {
      backColor: 'transparent',
      foreColor: '#38BDF8',
      fontFamily: 'Segoe UI',
      fontSize: 14,
      fontWeight: 'Bold',
    },
  },
  {
    id: 'preset_amber_badge',
    name: 'Amber Warning Chip / Badge',
    category: 'Badges & Cards',
    description: 'Светящийся янтарный бейдж для статусов и уведомлений',
    targetControlTypes: ['Label', 'Button', 'all'],
    isSystem: true,
    createdAt: '2026-01-01',
    properties: {
      backColor: '#FEF3C7',
      foreColor: '#92400E',
      fontFamily: 'Segoe UI',
      fontSize: 8.5,
      fontWeight: 'Bold',
      borderRadius: 12,
      borderStyle: 'FixedSingle',
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
  },
  {
    id: 'preset_mono_brutal',
    name: 'Monochrome High-Contrast',
    category: 'Buttons',
    description: 'Бруталистский черно-белый стиль с четкими прямыми углами',
    targetControlTypes: ['Button', 'Panel', 'all'],
    isSystem: true,
    createdAt: '2026-01-01',
    properties: {
      backColor: '#000000',
      foreColor: '#FFFFFF',
      fontFamily: 'Segoe UI',
      fontSize: 9,
      fontWeight: 'Bold',
      borderRadius: 0,
      borderStyle: 'FixedSingle',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
  },
];

export class StylePresetsEngine {
  /**
   * Load all presets (System + User Custom saved in LocalStorage)
   */
  static loadAllPresets(): StylePreset[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRESETS);
      if (stored) {
        const userPresets: StylePreset[] = JSON.parse(stored);
        const userIds = new Set(userPresets.map((p) => p.id));
        const nonDuplicateSystem = SYSTEM_STYLE_PRESETS.filter((p) => !userIds.has(p.id));
        return [...userPresets, ...nonDuplicateSystem];
      }
    } catch (e) {
      console.warn('Failed to load style presets from localStorage:', e);
    }
    return [...SYSTEM_STYLE_PRESETS];
  }

  /**
   * Save a new custom style preset to localStorage
   */
  static savePreset(
    name: string,
    category: StylePreset['category'],
    node: DesignerNode,
    includeOptions: {
      colors?: boolean;
      typography?: boolean;
      borders?: boolean;
      flatStyle?: boolean;
    } = { colors: true, typography: true, borders: true, flatStyle: true }
  ): StylePreset {
    const props = node.properties || ({} as NodeProperties);
    const custom = props.customProps || {};
    const presetProps: StylePreset['properties'] = {};

    if (includeOptions.colors !== false) {
      if (props.backColor) presetProps.backColor = props.backColor;
      if (props.foreColor) presetProps.foreColor = props.foreColor;
      if (custom.opacity !== undefined) presetProps.opacity = custom.opacity;
    }

    if (includeOptions.typography !== false) {
      if (props.fontFamily) presetProps.fontFamily = props.fontFamily;
      if (props.fontSize !== undefined) presetProps.fontSize = props.fontSize;
      if (props.fontBold) presetProps.fontWeight = 'Bold';
      if (custom.textAlign) presetProps.textAlign = custom.textAlign;
    }

    if (includeOptions.borders !== false) {
      if (props.borderStyle) presetProps.borderStyle = props.borderStyle;
      if (custom.borderWidth !== undefined) presetProps.borderWidth = custom.borderWidth;
      if (custom.borderColor) presetProps.borderColor = custom.borderColor;
      if (custom.borderRadius !== undefined) presetProps.borderRadius = custom.borderRadius;
    }

    if (includeOptions.flatStyle !== false) {
      if (props.flatStyle) presetProps.flatStyle = props.flatStyle;
    }

    const newPreset: StylePreset = {
      id: `preset_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || `Preset (${props.name || node.type})`,
      category: category || 'Custom',
      targetControlTypes: [node.type, 'all'],
      isSystem: false,
      createdAt: new Date().toISOString().split('T')[0],
      properties: presetProps,
    };

    const currentPresets = this.getUserCustomPresets();
    const updated = [newPreset, ...currentPresets];
    this.saveUserPresets(updated);

    return newPreset;
  }

  /**
   * Delete a custom preset by ID
   */
  static deletePreset(presetId: string): boolean {
    const userPresets = this.getUserCustomPresets();
    const filtered = userPresets.filter((p) => p.id !== presetId);
    this.saveUserPresets(filtered);
    return true;
  }

  /**
   * Extract only user custom presets from localStorage
   */
  static getUserCustomPresets(): StylePreset[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRESETS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse user presets:', e);
    }
    return [];
  }

  /**
   * Save user presets back to localStorage
   */
  static saveUserPresets(presets: StylePreset[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
    } catch (e) {
      console.warn('Failed to save presets to localStorage:', e);
    }
  }

  /**
   * Extract partial properties from preset to apply to a target node
   */
  static getPropertiesToApply(
    preset: StylePreset,
    filter: 'all' | 'colors' | 'typography' | 'borders' = 'all'
  ): Partial<NodeProperties> {
    const p = preset.properties;
    const result: Partial<NodeProperties> = {};
    const customProps: Record<string, any> = {};

    if (filter === 'all' || filter === 'colors') {
      if (p.backColor !== undefined) result.backColor = p.backColor;
      if (p.foreColor !== undefined) result.foreColor = p.foreColor;
      if (p.opacity !== undefined) customProps.opacity = p.opacity;
    }

    if (filter === 'all' || filter === 'typography') {
      if (p.fontFamily !== undefined) result.fontFamily = p.fontFamily;
      if (p.fontSize !== undefined) result.fontSize = p.fontSize;
      if (p.fontWeight !== undefined) {
        result.fontBold = p.fontWeight === 'Bold' || p.fontWeight === 'SemiBold';
      }
      if (p.textAlign !== undefined) customProps.textAlign = p.textAlign;
    }

    if (filter === 'all' || filter === 'borders') {
      if (p.borderStyle !== undefined) {
        if (['None', 'FixedSingle', 'Fixed3D'].includes(p.borderStyle)) {
          result.borderStyle = p.borderStyle as 'None' | 'FixedSingle' | 'Fixed3D';
        }
      }
      if (p.borderWidth !== undefined) customProps.borderWidth = p.borderWidth;
      if (p.borderColor !== undefined) customProps.borderColor = p.borderColor;
      if (p.borderRadius !== undefined) customProps.borderRadius = p.borderRadius;
      if (p.flatStyle !== undefined) {
        if (['Standard', 'Flat', 'Popup', 'System'].includes(p.flatStyle)) {
          result.flatStyle = p.flatStyle as 'Standard' | 'Flat' | 'Popup' | 'System';
        }
      }
    }

    if (Object.keys(customProps).length > 0) {
      result.customProps = customProps;
    }

    return result;
  }

  /**
   * Generate C# Code snippet for applying preset
   */
  static generateCSharpSnippet(controlVarName: string, preset: StylePreset): string {
    const p = preset.properties;
    const lines: string[] = [];

    lines.push(`// Применение стиля пресета: ${preset.name}`);
    if (p.backColor) {
      lines.push(`this.${controlVarName}.BackColor = ColorTranslator.FromHtml("${p.backColor}");`);
    }
    if (p.foreColor) {
      lines.push(`this.${controlVarName}.ForeColor = ColorTranslator.FromHtml("${p.foreColor}");`);
    }
    if (p.fontFamily || p.fontSize) {
      const font = p.fontFamily || 'Segoe UI';
      const size = p.fontSize || 9;
      const style = p.fontWeight === 'Bold' ? 'FontStyle.Bold' : 'FontStyle.Regular';
      lines.push(`this.${controlVarName}.Font = new Font("${font}", ${size}f, ${style});`);
    }
    if (p.flatStyle) {
      lines.push(`this.${controlVarName}.FlatStyle = FlatStyle.${p.flatStyle};`);
    }
    if (p.borderRadius) {
      lines.push(`// Custom CornerRadius = ${p.borderRadius}px`);
    }

    return lines.join('\n');
  }

  /**
   * Export all user presets as JSON string
   */
  static exportPresetsAsJson(): string {
    const presets = this.loadAllPresets();
    return JSON.stringify(presets, null, 2);
  }

  /**
   * Import presets from JSON string
   */
  static importPresetsFromJson(jsonStr: string): number {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        const validPresets: StylePreset[] = parsed.filter(
          (p) => p && typeof p === 'object' && p.name && p.properties
        );
        const existing = this.getUserCustomPresets();
        const existingIds = new Set(existing.map((e) => e.id));
        const toAdd = validPresets.map((p) => ({
          ...p,
          id: existingIds.has(p.id) ? `preset_imported_${Date.now()}_${Math.random().toString(36).slice(2, 5)}` : p.id,
          isSystem: false,
        }));
        this.saveUserPresets([...toAdd, ...existing]);
        return toAdd.length;
      }
    } catch (e) {
      console.error('Import presets error:', e);
    }
    return 0;
  }
}
