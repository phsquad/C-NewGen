import { DesignerNode, LayoutBounds } from '../types/ast';

export interface FormFieldBlueprint {
  id: string;
  label: string;
  type: 'TextBox' | 'PasswordBox' | 'ComboBox' | 'CheckBox' | 'DatePicker' | 'Button';
  defaultValue?: string;
  options?: string[];
}

export interface SynthesizerConfig {
  startX?: number;
  startY?: number;
  fieldWidth?: number;
  labelWidth?: number;
  rowGap?: number;
  columns?: 1 | 2;
  targetParentId: string;
}

export class OfflineFormSynthesizer {
  /**
   * Parses Quick DSL string e.g.:
   * "ФИО:str, Группа:list, Сдал:chk, Пароль:pass, Сохранить:btn, Отмена:btn"
   */
  public static parseQuickDsl(dslString: string): FormFieldBlueprint[] {
    if (!dslString || !dslString.trim()) return [];

    const tokens = dslString.split(/[,;\n]/).map(t => t.trim()).filter(Boolean);
    const blueprints: FormFieldBlueprint[] = [];

    tokens.forEach((token, idx) => {
      const parts = token.split(':').map(p => p.trim());
      const rawLabel = parts[0] || `Поле ${idx + 1}`;
      const typeCode = (parts[1] || 'str').toLowerCase();

      let type: FormFieldBlueprint['type'] = 'TextBox';
      if (['pass', 'password', 'pwd'].includes(typeCode)) {
        type = 'PasswordBox';
      } else if (['list', 'combo', 'select', 'dropdown'].includes(typeCode)) {
        type = 'ComboBox';
      } else if (['chk', 'check', 'bool', 'checkbox'].includes(typeCode)) {
        type = 'CheckBox';
      } else if (['date', 'time', 'picker', 'calendar'].includes(typeCode)) {
        type = 'DatePicker';
      } else if (['btn', 'button', 'cmd'].includes(typeCode)) {
        type = 'Button';
      }

      blueprints.push({
        id: `bp_${idx}_${Date.now()}`,
        label: rawLabel,
        type,
        defaultValue: type === 'ComboBox' ? 'Выберите из списка...' : '',
        options: type === 'ComboBox' ? ['Вариант 1', 'Вариант 2', 'Вариант 3'] : undefined,
      });
    });

    return blueprints;
  }

  /**
   * Deterministically synthesizes form nodes from blueprints without external API calls (0ms)
   */
  public static synthesizeForm(
    fields: FormFieldBlueprint[],
    config: SynthesizerConfig
  ): { newNodes: Record<string, DesignerNode>; addedIds: string[] } {
    const startX = config.startX ?? 24;
    const startY = config.startY ?? 24;
    const fieldWidth = config.fieldWidth ?? 240;
    const labelWidth = config.labelWidth ?? 110;
    const rowGap = config.rowGap ?? 12;
    const columns = config.columns ?? 1;
    const parentId = config.targetParentId;

    const newNodes: Record<string, DesignerNode> = {};
    const addedIds: string[] = [];

    let currentY = startY;
    let colIndex = 0;

    // Group non-buttons and buttons
    const inputs = fields.filter(f => f.type !== 'Button');
    const buttons = fields.filter(f => f.type === 'Button');

    inputs.forEach((field, index) => {
      const colX = startX + colIndex * (labelWidth + fieldWidth + 24);
      const fieldId = `synth_${field.type.toLowerCase()}_${Date.now()}_${index}`;

      if (field.type !== 'CheckBox') {
        // 1. Label
        const labelId = `lbl_${fieldId}`;
        const labelNode: DesignerNode = {
          id: labelId,
          type: 'Label',
          parentId,
          childrenIds: [],
          bounds: { x: colX, y: currentY + 3, width: labelWidth, height: 20 },
          properties: {
            name: `lbl_${sanitizeName(field.label)}`,
            text: `${field.label}:`,
            fontSize: 9,
            enabled: true,
            visible: true,
            locked: false,
          },
          events: {},
        };
        newNodes[labelId] = labelNode;
        addedIds.push(labelId);

        // 2. Input Control
        const inputType = field.type === 'DatePicker' ? 'DateTimePicker' : (field.type === 'PasswordBox' ? 'TextBox' : field.type);
        const inputNode: DesignerNode = {
          id: fieldId,
          type: inputType,
          parentId,
          childrenIds: [],
          bounds: { x: colX + labelWidth + 8, y: currentY, width: fieldWidth, height: 26 },
          properties: {
            name: `${getPrefix(field.type)}_${sanitizeName(field.label)}`,
            text: field.defaultValue || '',
            placeholder: field.type === 'TextBox' ? `Введите ${field.label.toLowerCase()}...` : undefined,
            useSystemPasswordChar: field.type === 'PasswordBox',
            items: field.type === 'ComboBox' ? (field.options || ['Вариант 1', 'Вариант 2']) : undefined,
            fontSize: 9,
            enabled: true,
            visible: true,
            locked: false,
          },
          events: {},
        };
        newNodes[fieldId] = inputNode;
        addedIds.push(fieldId);
      } else {
        // CheckBox
        const chkNode: DesignerNode = {
          id: fieldId,
          type: 'CheckBox',
          parentId,
          childrenIds: [],
          bounds: { x: colX + labelWidth + 8, y: currentY, width: fieldWidth, height: 24 },
          properties: {
            name: `chk_${sanitizeName(field.label)}`,
            text: field.label,
            checked: field.defaultValue === 'true',
            fontSize: 9,
            enabled: true,
            visible: true,
            locked: false,
          },
          events: {},
        };
        newNodes[fieldId] = chkNode;
        addedIds.push(fieldId);
      }

      if (columns === 1) {
        currentY += 26 + rowGap;
      } else {
        colIndex++;
        if (colIndex >= 2) {
          colIndex = 0;
          currentY += 26 + rowGap;
        }
      }
    });

    if (columns === 2 && colIndex !== 0) {
      currentY += 26 + rowGap;
    }

    // Button row at the bottom
    if (buttons.length > 0) {
      currentY += 8;
      const btnWidth = Math.max(100, Math.min(140, Math.floor((fieldWidth + labelWidth) / buttons.length) - 8));
      
      buttons.forEach((btn, bIdx) => {
        const btnId = `btn_synth_${Date.now()}_${bIdx}`;
        const btnX = startX + bIdx * (btnWidth + 12);
        
        const btnNode: DesignerNode = {
          id: btnId,
          type: 'Button',
          parentId,
          childrenIds: [],
          bounds: { x: btnX, y: currentY, width: btnWidth, height: 32 },
          properties: {
            name: `btn_${sanitizeName(btn.label)}`,
            text: btn.label,
            backColor: bIdx === 0 ? '#2563EB' : '#475569',
            foreColor: '#FFFFFF',
            fontSize: 9,
            enabled: true,
            visible: true,
            locked: false,
          },
          events: { Click: `${sanitizeName(btn.label)}Button_Click` },
        };
        newNodes[btnId] = btnNode;
        addedIds.push(btnId);
      });
    }

    return { newNodes, addedIds };
  }

  /**
   * Generates N x M matrix grid of buttons or controls (Calculator, Tic-Tac-Toe, Numpad)
   */
  public static synthesizeMatrixGrid(
    rows: number,
    cols: number,
    config: {
      startX?: number;
      startY?: number;
      cellWidth?: number;
      cellHeight?: number;
      gap?: number;
      labelsMatrix?: string[][];
      targetParentId: string;
    }
  ): { newNodes: Record<string, DesignerNode>; addedIds: string[] } {
    const startX = config.startX ?? 20;
    const startY = config.startY ?? 20;
    const cellWidth = config.cellWidth ?? 56;
    const cellHeight = config.cellHeight ?? 48;
    const gap = config.gap ?? 8;
    const parentId = config.targetParentId;

    const newNodes: Record<string, DesignerNode> = {};
    const addedIds: string[] = [];
    let tabIndexCounter = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const btnId = `btn_${r}_${c}_${Date.now()}`;
        const x = startX + c * (cellWidth + gap);
        const y = startY + r * (cellHeight + gap);

        const customText = config.labelsMatrix?.[r]?.[c] ?? `${r},${c}`;

        const btnNode: DesignerNode = {
          id: btnId,
          type: 'Button',
          parentId,
          childrenIds: [],
          bounds: { x, y, width: cellWidth, height: cellHeight },
          properties: {
            name: `btn_${r}_${c}`,
            text: customText,
            tabIndex: tabIndexCounter++,
            fontSize: 10,
            fontBold: true,
            enabled: true,
            visible: true,
            locked: false,
            backColor: ['+', '-', '*', '/', '=', 'C'].includes(customText) ? '#3B82F6' : '#1E293B',
            foreColor: '#FFFFFF',
          },
          events: { Click: `btn_${r}_${c}_Click` },
        };

        newNodes[btnId] = btnNode;
        addedIds.push(btnId);
      }
    }

    return { newNodes, addedIds };
  }

  /**
   * Layout Constraint Solver / Beautifier (Правка 13.1):
   * Clusters nodes into rows within ~16px tolerance, aligns labels and inputs, enforces 12px row gap & 6px column gap.
   */
  public static beautifyLayout(
    childrenNodes: DesignerNode[],
    gridStep: number = 8
  ): Record<string, Partial<LayoutBounds>> {
    if (!childrenNodes || childrenNodes.length === 0) return {};

    const boundsUpdates: Record<string, Partial<LayoutBounds>> = {};
    const snap = (v: number) => Math.round(v / gridStep) * gridStep;

    // 1. Initial height standardizing
    const preparedNodes = childrenNodes.map(node => {
      let h = node.bounds.height;
      if (['TextBox', 'ComboBox', 'DateTimePicker', 'NumericUpDown'].includes(node.type)) h = 26;
      if (node.type === 'Button') h = Math.max(28, node.bounds.height);
      if (node.type === 'Label') h = 20;

      return {
        id: node.id,
        type: node.type,
        x: node.bounds.x,
        y: node.bounds.y,
        w: Math.max(16, node.bounds.width),
        h,
      };
    });

    // Sort all nodes top-to-bottom
    preparedNodes.sort((a, b) => a.y - b.y);

    // 2. Group nodes into horizontal rows by Y coordinate (clustering within 16px tolerance)
    const rows: typeof preparedNodes[] = [];
    preparedNodes.forEach(node => {
      let matchedRow = rows.find(r => Math.abs(r[0].y - node.y) <= 16);
      if (matchedRow) {
        matchedRow.push(node);
      } else {
        rows.push([node]);
      }
    });

    // Sort rows top-to-bottom
    rows.sort((r1, r2) => r1[0].y - r2[0].y);

    // 3. Process each row: sort left-to-right, set Y alignment, enforce 6px gaps
    let currentY = snap(Math.min(...preparedNodes.map(n => n.y), 24));
    const defaultRowGap = 12; // 12px vertical spacing requested in 13.1
    const defaultColGap = 6;  // 6px horizontal spacing requested in 13.1

    rows.forEach(row => {
      // Sort items in row left-to-right
      row.sort((a, b) => a.x - b.x);

      let currentX = snap(row[0].x);
      let maxHeightInRow = Math.max(...row.map(item => item.h));

      row.forEach((item, idx) => {
        let alignedY = currentY;
        // Baseline alignment for Labels next to inputs
        if (item.type === 'Label' && row.some(r => r.type !== 'Label')) {
          alignedY = currentY + 3;
        }

        boundsUpdates[item.id] = {
          x: currentX,
          y: alignedY,
          width: snap(item.w),
          height: item.h,
        };

        // Advance X with 6px horizontal gap
        currentX += snap(item.w) + defaultColGap;
      });

      // Advance Y for next row with 12px vertical gap
      currentY += maxHeightInRow + defaultRowGap;
    });

    return boundsUpdates;
  }
}

function sanitizeName(label: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  };

  const str = label.toLowerCase().split('').map(c => map[c] || c).join('');
  const clean = str.replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean) return 'field';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function getPrefix(type: FormFieldBlueprint['type']): string {
  switch (type) {
    case 'PasswordBox':
    case 'TextBox': return 'txt';
    case 'ComboBox': return 'cmb';
    case 'CheckBox': return 'chk';
    case 'DatePicker': return 'dtp';
    case 'Button': return 'btn';
    default: return 'ctrl';
  }
}
