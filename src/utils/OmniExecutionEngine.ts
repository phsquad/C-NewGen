// =========================================================================
// OmniExecutionEngine — Universal C# & No-Code Virtual Runtime Engine
// =========================================================================

export interface VirtualControlProxy {
  name: string;
  type: string;
  text: string;
  visible: boolean;
  enabled: boolean;
  backColor: string;
  foreColor: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RuntimeFormState {
  formId: string;
  title: string;
  controls: Record<string, VirtualControlProxy>;
  variables: Record<string, any>;
  activeTimers: Record<string, number>;
}

export class OmniExecutionEngine {
  /**
   * Initializes virtual reactive context for form from UI-AST nodes
   */
  public static createFormRuntimeState(formId: string, formNodes: Record<string, any>): RuntimeFormState {
    const root = formNodes[formId] || Object.values(formNodes).find((n: any) => n.type === 'Form') || { properties: { text: 'Form1' } };
    const state: RuntimeFormState = {
      formId,
      title: root?.properties?.text || root?.properties?.name || 'Form1',
      controls: {},
      variables: {},
      activeTimers: {},
    };

    Object.values(formNodes).forEach((node: any) => {
      if (node && node.type !== 'Form') {
        const name = node.properties?.name || node.id;
        state.controls[name] = {
          name,
          type: node.type || 'Button',
          text: node.properties?.text !== undefined ? String(node.properties.text) : '',
          visible: node.properties?.visible !== false,
          enabled: node.properties?.enabled !== false,
          backColor: node.properties?.backColor || '#2563eb',
          foreColor: node.properties?.foreColor || '#ffffff',
          x: node.bounds?.x ?? 20,
          y: node.bounds?.y ?? 20,
          width: node.bounds?.width ?? 120,
          height: node.bounds?.height ?? 36,
        };
      }
    });

    return state;
  }

  /**
   * Executes user C# source code instructions in real time
   */
  public static executeUserCSharpMethod(
    methodSourceCode: string,
    state: RuntimeFormState,
    spawnModalFormCallback: (targetFormName: string) => void,
    showAlertCallback: (title: string, message: string) => void,
    addLog: (msg: string) => void
  ): RuntimeFormState {
    const updatedState: RuntimeFormState = {
      ...state,
      controls: JSON.parse(JSON.stringify(state.controls)),
      variables: { ...state.variables },
    };

    // Extract method body
    const firstBrace = methodSourceCode.indexOf('{');
    const lastBrace = methodSourceCode.lastIndexOf('}');
    const body =
      firstBrace !== -1 && lastBrace !== -1
        ? methodSourceCode.slice(firstBrace + 1, lastBrace)
        : methodSourceCode;

    // Parse lines
    const lines = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('//'));

    lines.forEach((line) => {
      try {
        // 1. MessageBox.Show("Text", "Title")
        const msgMatch = line.match(/MessageBox\.Show\s*\(\s*["']([^"']*)["'](?:\s*,\s*["']([^"']*)["'])?/i);
        if (msgMatch) {
          const msg = msgMatch[1];
          const title = msgMatch[2] || 'Сообщение';
          addLog(`💬 [MessageBox] ${title}: "${msg}"`);
          showAlertCallback(title, msg);
          return;
        }

        // 2. Open form: new Form2().Show() / ShowDialog()
        const openFormMatch = line.match(/new\s+([a-zA-Z0-9_]+)\s*\(\s*\)\.(Show|ShowDialog)\s*\(\s*\)/i);
        if (openFormMatch) {
          const formName = openFormMatch[1];
          addLog(`🗔 [Window Engine] Открытие окна: ${formName}`);
          spawnModalFormCallback(formName);
          return;
        }

        // 3. Property assignment: this.btnSubmit.Text = "Войти"
        const propAssignMatch = line.match(/(?:this\.)?([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*=\s*(.+);/i);
        if (propAssignMatch) {
          const ctrlName = propAssignMatch[1];
          const propName = propAssignMatch[2].toLowerCase();
          let rawValue = propAssignMatch[3].trim();

          const targetCtrl = updatedState.controls[ctrlName];
          if (targetCtrl) {
            if (
              (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
              (rawValue.startsWith("'") && rawValue.endsWith("'"))
            ) {
              rawValue = rawValue.slice(1, -1);
            } else if (rawValue === 'true' || rawValue === 'false') {
              const boolVal = rawValue === 'true';
              if (propName === 'visible') targetCtrl.visible = boolVal;
              if (propName === 'enabled') targetCtrl.enabled = boolVal;
              addLog(`⚡️ [C# Prop] ${ctrlName}.${propName} = ${boolVal}`);
              return;
            } else {
              rawValue = this.evaluateExpression(rawValue, updatedState);
            }

            if (propName === 'text') targetCtrl.text = String(rawValue);
            if (propName === 'visible') targetCtrl.visible = Boolean(rawValue);
            if (propName === 'enabled') targetCtrl.enabled = Boolean(rawValue);
            if (propName === 'backcolor') targetCtrl.backColor = String(rawValue);
            if (propName === 'forecolor') targetCtrl.foreColor = String(rawValue);

            addLog(`⚡️ [C# Runtime] ${ctrlName}.${propName} = "${rawValue}" (UI обновлен вживую)`);
          }
          return;
        }

        // 4. Clear fields: this.txtLogin.Clear();
        const clearMatch = line.match(/(?:this\.)?([a-zA-Z0-9_]+)\.Clear\s*\(\s*\);/i);
        if (clearMatch) {
          const ctrlName = clearMatch[1];
          if (updatedState.controls[ctrlName]) {
            updatedState.controls[ctrlName].text = '';
            addLog(`🧹 [C# Action] ${ctrlName}.Clear() ──► Поле очищено`);
          }
          return;
        }

        // 5. Close form: this.Close();
        if (line.includes('Close()') || line.includes('this.Close()')) {
          addLog(`🚪 [C# Action] this.Close() ──► Форма закрыта`);
          showAlertCallback('Событие C#', 'Форма была закрыта методом this.Close()');
          return;
        }
      } catch (err: any) {
        addLog(`❌ [C# Runtime Error] Ошибка в строке '${line}': ${err.message}`);
      }
    });

    return updatedState;
  }

  /**
   * Evaluates expressions and extracts property values
   */
  private static evaluateExpression(expr: string, state: RuntimeFormState): any {
    let evaluated = expr;

    Object.keys(state.controls).forEach((ctrlName) => {
      const textVal = state.controls[ctrlName].text;
      const regex = new RegExp(`(?:this\\.)?${ctrlName}\\.Text`, 'g');
      evaluated = evaluated.replace(regex, `'${textVal}'`);
    });

    evaluated = evaluated.replace(/int\.Parse\s*\(([^)]+)\)/g, 'Number($1)');
    evaluated = evaluated.replace(/double\.Parse\s*\(([^)]+)\)/g, 'Number($1)');

    try {
      return Function(`'use strict'; return (${evaluated})`)();
    } catch {
      return expr.replace(/['";]/g, '');
    }
  }
}
