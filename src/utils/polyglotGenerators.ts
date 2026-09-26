import { DesignerProjectState, DesignerNode } from '../types/ast';

/**
 * Cross-Language Color Normalizer (Правка 14.1)
 * Converts SystemColors ("Control", "Window", "ActiveCaption", etc.) or ARGB to standardized HEX "#RRGGBB"
 */
export function normalizeColorToHex(colorStr?: string, defaultHex: string = '#2563EB'): string {
  if (!colorStr || !colorStr.trim() || colorStr === 'transparent') {
    return defaultHex;
  }
  const clean = colorStr.trim();
  if (clean.startsWith('#')) return clean;

  const systemColorMap: Record<string, string> = {
    Control: '#1E293B',
    ControlDark: '#0F172A',
    ControlLight: '#334155',
    Window: '#0F172A',
    WindowText: '#F8FAFC',
    ControlText: '#F8FAFC',
    Highlight: '#2563EB',
    HighlightText: '#FFFFFF',
    ButtonFace: '#2563EB',
    ActiveCaption: '#1E293B',
    InactiveCaption: '#0F172A',
  };

  if (systemColorMap[clean]) {
    return systemColorMap[clean];
  }

  // Handle rgb / rgba e.g. "rgb(37, 99, 235)"
  const rgbMatch = clean.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  return defaultHex;
}

/**
 * Generates standalone Python CustomTkinter (v5.2+) code (Правка 14.2)
 */
export const generatePythonCustomTkinter = (project: DesignerProjectState, targetFormId?: string): string => {
  const formId = targetFormId || project.activeFormId || project.rootFormId;
  const rootForm = project.nodes[formId] || project.nodes[project.rootFormId];
  if (!rootForm) return '# Error: Root form not found';

  const formName = rootForm.properties.name || 'Form1';
  const formTitle = rootForm.properties.text || formName;
  const formWidth = Math.round(rootForm.bounds.width);
  const formHeight = Math.round(rootForm.bounds.height);

  // Collect descendants for this form
  const formDescendantIds = new Set<string>();
  const collect = (pId: string) => {
    const p = project.nodes[pId];
    if (p?.childrenIds) {
      p.childrenIds.forEach(cId => {
        formDescendantIds.add(cId);
        collect(cId);
      });
    }
  };
  collect(rootForm.id);

  const childNodes = Object.values(project.nodes).filter(n => formDescendantIds.has(n.id));

  const initLines: string[] = [];
  const eventMethods: string[] = [];
  const seenHandlers = new Set<string>();

  childNodes.forEach(n => {
    const varName = `self.${pythonSanitizeName(n.properties.name)}`;
    const x = Math.round(n.bounds.x);
    const y = Math.round(n.bounds.y);
    const w = Math.round(n.bounds.width);
    const h = Math.round(n.bounds.height);
    const text = escapePythonString(n.properties.text || n.properties.name);

    initLines.push(`        # --- ${n.properties.name} (${n.type}) ---`);

    switch (n.type) {
      case 'Button': {
        const clickHandler = n.events?.Click ? pythonSanitizeName(n.events.Click) : `${pythonSanitizeName(n.properties.name)}_click`;
        const hexColor = normalizeColorToHex(n.properties.backColor, '#2563EB');
        const hoverColor = hexColor === '#2563EB' ? '#1D4ED8' : hexColor;
        initLines.push(`        ${varName} = ctk.CTkButton(self, text="${text}", width=${w}, height=${h}, fg_color="${hexColor}", hover_color="${hoverColor}", command=self.${clickHandler})`);
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);

        if (!seenHandlers.has(clickHandler)) {
          seenHandlers.add(clickHandler);
          eventMethods.push(`    def ${clickHandler}(self):\n        print(f"[EVENT] Нажата кнопка '${text}'.")`);
        }
        break;
      }
      case 'TextBox': {
        const placeholder = n.properties.placeholder ? `, placeholder_text="${escapePythonString(n.properties.placeholder)}"` : '';
        const showPass = n.properties.useSystemPasswordChar ? ', show="*"' : '';
        initLines.push(`        ${varName} = ctk.CTkEntry(self, width=${w}, height=${h}${placeholder}${showPass})`);
        if (n.properties.text) {
          initLines.push(`        ${varName}.insert(0, "${escapePythonString(n.properties.text)}")`);
        }
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);
        break;
      }
      case 'Label': {
        initLines.push(`        ${varName} = ctk.CTkLabel(self, text="${text}", font=("Segoe UI", 13))`);
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);
        break;
      }
      case 'CheckBox': {
        initLines.push(`        ${varName} = ctk.CTkCheckBox(self, text="${text}")`);
        if (n.properties.checked) {
          initLines.push(`        ${varName}.select()`);
        }
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);
        break;
      }
      case 'NumericUpDown':
      case 'TrackBar' as any: {
        const minVal = n.properties.minimum ?? 0;
        const maxVal = n.properties.maximum ?? 100;
        initLines.push(`        ${varName} = ctk.CTkSlider(self, width=${w}, height=${h}, from_=${minVal}, to=${maxVal})`);
        if (n.properties.value !== undefined) {
          initLines.push(`        ${varName}.set(${n.properties.value})`);
        }
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);
        break;
      }
      case 'RadioButton': {
        initLines.push(`        ${varName} = ctk.CTkRadioButton(self, text="${text}", value=1)`);
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);
        break;
      }
      case 'ComboBox': {
        const vals = n.properties.items && n.properties.items.length > 0
          ? n.properties.items.map(i => `"${escapePythonString(i)}"`).join(', ')
          : '"Вариант 1", "Вариант 2"';
        initLines.push(`        ${varName} = ctk.CTkComboBox(self, values=[${vals}], width=${w}, height=${h})`);
        if (n.properties.text) {
          initLines.push(`        ${varName}.set("${escapePythonString(n.properties.text)}")`);
        }
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);
        break;
      }
      case 'ProgressBar': {
        initLines.push(`        ${varName} = ctk.CTkProgressBar(self, width=${w}, height=${h})`);
        const val = ((n.properties.progressValue ?? 50) / 100).toFixed(2);
        initLines.push(`        ${varName}.set(${val})`);
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);
        break;
      }
      case 'Panel':
      case 'GroupBox': {
        initLines.push(`        ${varName} = ctk.CTkFrame(self, width=${w}, height=${h})`);
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);
        break;
      }
      case 'TabControl': {
        initLines.push(`        ${varName} = ctk.CTkTabview(self, width=${w}, height=${h})`);
        const tabs = n.properties.tabTitles || ['Вкладка 1', 'Вкладка 2'];
        tabs.forEach(t => {
          initLines.push(`        ${varName}.add("${escapePythonString(t)}")`);
        });
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);
        break;
      }
      default: {
        initLines.push(`        ${varName} = ctk.CTkFrame(self, width=${w}, height=${h})`);
        initLines.push(`        ${varName}.place(x=${x}, y=${y})`);
        break;
      }
    }
    initLines.push('');
  });

  const methodsBlock = eventMethods.length > 0
    ? eventMethods.join('\n\n')
    : `    def default_action(self):\n        print("Действие выполнено")`;

  return `# -*- coding: utf-8 -*-
# ================================================================================================
# Project:     ${project.projectName || 'MyPythonApp'}
# Author:      ${project.author || 'Александр Талентс'}
# Description: ${project.description || 'Сгенерировано в NextGen Visual Designer'}
# Target:      Python CustomTkinter v5.2+ (Dark Mode)
# ================================================================================================

import customtkinter as ctk

# Настройка глобальной темы CustomTkinter
ctk.set_appearance_mode("Dark")  # Варианты: "System", "Dark", "Light"
ctk.set_default_color_theme("blue")  # Варианты: "blue", "green", "dark-blue"


class ${formName}App(ctk.CTk):
    def __init__(self):
        super().__init__()

        # --- Конфигурация окна ---
        self.title("${escapePythonString(formTitle)}")
        self.geometry("${formWidth}x${formHeight}")
        self.resizable(True, True)

        # --- Инициализация контролов (UI-AST) ---
${initLines.join('\n')}

    # --- Обработчики событий ---
${methodsBlock}


if __name__ == "__main__":
    app = ${formName}App()
    app.mainloop()
`;
};

/**
 * Generates Web HTML5 semantic output
 */
export const generateWebHtml = (project: DesignerProjectState, targetFormId?: string): string => {
  const formId = targetFormId || project.activeFormId || project.rootFormId;
  const rootForm = project.nodes[formId] || project.nodes[project.rootFormId];
  if (!rootForm) return '<!-- Error: Root form not found -->';

  const formName = rootForm.properties.name || 'Form1';
  const formTitle = rootForm.properties.text || formName;

  const formDescendantIds = new Set<string>();
  const collect = (pId: string) => {
    const p = project.nodes[pId];
    if (p?.childrenIds) {
      p.childrenIds.forEach(cId => {
        formDescendantIds.add(cId);
        collect(cId);
      });
    }
  };
  collect(rootForm.id);

  const childNodes = Object.values(project.nodes).filter(n => formDescendantIds.has(n.id));

  const bodyElements: string[] = [];

  childNodes.forEach(n => {
    const id = n.properties.name;
    const text = escapeHtml(n.properties.text || n.properties.name);

    switch (n.type) {
      case 'Button': {
        const handler = n.events?.Click || `${id}_Click`;
        bodyElements.push(`      <button id="${id}" class="ui-button" onclick="${handler}()">${text}</button>`);
        break;
      }
      case 'TextBox': {
        const placeholder = n.properties.placeholder ? ` placeholder="${escapeHtml(n.properties.placeholder)}"` : '';
        const inputType = n.properties.useSystemPasswordChar ? 'password' : 'text';
        bodyElements.push(`      <input id="${id}" type="${inputType}" class="ui-input" value="${escapeHtml(n.properties.text || '')}"${placeholder}>`);
        break;
      }
      case 'Label': {
        bodyElements.push(`      <label id="${id}" class="ui-label">${text}</label>`);
        break;
      }
      case 'CheckBox': {
        const checked = n.properties.checked ? ' checked' : '';
        bodyElements.push(`      <label id="${id}_container" class="ui-checkbox-wrapper"><input id="${id}" type="checkbox"${checked}> <span>${text}</span></label>`);
        break;
      }
      case 'ComboBox': {
        const opts = (n.properties.items || ['Вариант 1', 'Вариант 2'])
          .map(o => `        <option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`)
          .join('\n');
        bodyElements.push(`      <select id="${id}" class="ui-select">\n${opts}\n      </select>`);
        break;
      }
      case 'ProgressBar': {
        const val = n.properties.progressValue ?? 50;
        bodyElements.push(`      <progress id="${id}" class="ui-progress" value="${val}" max="100">${val}%</progress>`);
        break;
      }
      case 'Panel':
      case 'GroupBox': {
        bodyElements.push(`      <div id="${id}" class="ui-panel"><span class="panel-header">${text}</span></div>`);
        break;
      }
      default: {
        bodyElements.push(`      <div id="${id}" class="ui-control">${text}</div>`);
        break;
      }
    }
  });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(formTitle)}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app-window" class="ui-window">
    <div class="ui-titlebar">${escapeHtml(formTitle)}</div>
    <div class="ui-content">
${bodyElements.join('\n')}
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
`;
};

/**
 * Generates Web CSS absolute positioning stylesheet
 */
export const generateWebCss = (project: DesignerProjectState, targetFormId?: string): string => {
  const formId = targetFormId || project.activeFormId || project.rootFormId;
  const rootForm = project.nodes[formId] || project.nodes[project.rootFormId];
  const formWidth = rootForm ? Math.round(rootForm.bounds.width) : 620;
  const formHeight = rootForm ? Math.round(rootForm.bounds.height) : 420;

  const formDescendantIds = new Set<string>();
  const collect = (pId: string) => {
    const p = project.nodes[pId];
    if (p?.childrenIds) {
      p.childrenIds.forEach(cId => {
        formDescendantIds.add(cId);
        collect(cId);
      });
    }
  };
  if (rootForm) collect(rootForm.id);

  const childNodes = Object.values(project.nodes).filter(n => formDescendantIds.has(n.id));

  const cssRules: string[] = [];

  cssRules.push(`/* Глобальные стили формы */
body {
  margin: 0;
  padding: 20px;
  background-color: #090D16;
  color: #F1F5F9;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.ui-window {
  position: relative;
  width: ${formWidth}px;
  height: ${formHeight}px;
  background-color: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.ui-titlebar {
  height: 32px;
  background-color: #1E293B;
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #94A3B8;
  border-b: 1px solid #334155;
}

.ui-content {
  position: relative;
  width: 100%;
  height: calc(100% - 32px);
}
`);

  childNodes.forEach(n => {
    const id = n.properties.name;
    const x = Math.round(n.bounds.x);
    const y = Math.round(n.bounds.y);
    const w = Math.round(n.bounds.width);
    const h = Math.round(n.bounds.height);
    const bg = n.properties.backColor ? `  background-color: ${n.properties.backColor};\n` : '';
    const fg = n.properties.foreColor ? `  color: ${n.properties.foreColor};\n` : '';

    if (n.type === 'CheckBox') {
      cssRules.push(`#${id}_container {\n  position: absolute;\n  left: ${x}px;\n  top: ${y}px;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 13px;\n  cursor: pointer;\n}`);
    } else {
      cssRules.push(`#${id} {\n  position: absolute;\n  left: ${x}px;\n  top: ${y}px;\n  width: ${w}px;\n  height: ${h}px;\n${bg}${fg}}`);
    }
  });

  cssRules.push(`
.ui-button {
  background-color: #2563EB;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.ui-button:hover {
  background-color: #1D4ED8;
}

.ui-input, .ui-select {
  background-color: #1E293B;
  color: #F8FAFC;
  border: 1px solid #334155;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 13px;
  box-sizing: border-box;
}

.ui-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #CBD5E1;
}

.ui-panel {
  border: 1px solid #334155;
  border-radius: 6px;
  background-color: rgba(30, 41, 59, 0.4);
}
`);

  return cssRules.join('\n\n');
};

/**
 * Generates Web JavaScript event handlers script
 */
export const generateWebJs = (project: DesignerProjectState): string => {
  const seenHandlers = new Set<string>();
  const jsFunctions: string[] = [];

  Object.values(project.nodes).forEach(n => {
    if (n.events) {
      Object.entries(n.events).forEach(([evtName, handlerName]) => {
        if (handlerName && !seenHandlers.has(handlerName)) {
          seenHandlers.add(handlerName);
          jsFunctions.push(`function ${handlerName}() {
  console.log("Событие ${evtName} вызвано для элемента ${n.properties.name}");
  alert("Вызвано действие: ${handlerName} (${n.properties.name})");
}`);
        }
      });
    }
  });

  if (jsFunctions.length === 0) {
    jsFunctions.push(`function defaultAction() {
  console.log("Действие по умолчанию выполнено");
}`);
  }

  return `// JavaScript обработчики событий (Сгенерировано из UI-AST)

document.addEventListener('DOMContentLoaded', () => {
  console.log('UI Form успешно инициализирована');
});

${jsFunctions.join('\n\n')}
`;
};

// Helper utilities
function pythonSanitizeName(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean) return 'element';
  return clean;
}

function escapePythonString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
