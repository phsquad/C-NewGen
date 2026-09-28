// =========================================================================
// OmniExecutionEngine — Universal C# & No-Code Virtual Runtime Engine
// In-browser C# AST translator & reactive WinForms Scope Proxy
// =========================================================================

import { sqliteEngine } from './sqliteWasmEngine';

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
  value?: number;
  items?: string[];
  dataSource?: any[];
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
          value: Number(node.properties?.value ?? 0),
          items: Array.isArray(node.properties?.items) ? [...node.properties.items] : [],
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

    // Extract method body inside outermost braces
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
          const title = msgMatch[2] || 'Информация';
          addLog(`💬 [MessageBox.Show] ${title}: "${msg}"`);
          showAlertCallback(title, msg);
          return;
        }

        // 2. Open form: new Form2().Show() / ShowDialog()
        const openFormMatch = line.match(/new\s+([a-zA-Z0-9_]+)\s*\(\s*\)\.(Show|ShowDialog)\s*\(\s*\)/i);
        if (openFormMatch) {
          const formName = openFormMatch[1];
          addLog(`🗔 [Window Manager] Открытие формы: ${formName}`);
          spawnModalFormCallback(formName);
          return;
        }

        // 3. Clear fields: this.txtLogin.Clear();
        const clearMatch = line.match(/(?:this\.)?([a-zA-Z0-9_]+)\.Clear\s*\(\s*\);/i);
        if (clearMatch) {
          const ctrlName = clearMatch[1];
          if (updatedState.controls[ctrlName]) {
            updatedState.controls[ctrlName].text = '';
            addLog(`🧹 [C#] ${ctrlName}.Clear() ──► Поле очищено`);
          }
          return;
        }

        // 4. ListBox / ComboBox Items.Add("...")
        const listAddMatch = line.match(/(?:this\.)?([a-zA-Z0-9_]+)\.Items\.Add\s*\(\s*(.+?)\s*\);/i);
        if (listAddMatch) {
          const ctrlName = listAddMatch[1];
          const rawItem = listAddMatch[2].trim();
          const itemVal = this.evaluateExpression(rawItem, updatedState);
          const targetCtrl = updatedState.controls[ctrlName];
          if (targetCtrl) {
            targetCtrl.items = targetCtrl.items || [];
            targetCtrl.items.push(String(itemVal));
            addLog(`📋 [C#] ${ctrlName}.Items.Add("${itemVal}")`);
          }
          return;
        }

        // 5. ProgressBar / TrackBar Value increment or assignment: this.progressBar1.Value += 10;
        const valIncMatch = line.match(/(?:this\.)?([a-zA-Z0-9_]+)\.Value\s*(\+=|-=|=)\s*(.+);/i);
        if (valIncMatch) {
          const ctrlName = valIncMatch[1];
          const op = valIncMatch[2];
          const valExpr = this.evaluateExpression(valIncMatch[3].trim(), updatedState);
          const targetCtrl = updatedState.controls[ctrlName];
          if (targetCtrl) {
            const num = Number(valExpr) || 0;
            if (op === '+=') targetCtrl.value = Math.min(100, (targetCtrl.value || 0) + num);
            else if (op === '-=') targetCtrl.value = Math.max(0, (targetCtrl.value || 0) - num);
            else targetCtrl.value = Math.max(0, Math.min(100, num));
            addLog(`📊 [C#] ${ctrlName}.Value = ${targetCtrl.value}`);
          }
          return;
        }

        // 6. SQLite database operations: db.Execute("...") or dataGridView1.DataSource = ...
        if (line.includes('db.Execute') || line.includes('SQLiteConnection')) {
          try {
            const sqlMatch = line.match(/["'](SELECT|INSERT|UPDATE|DELETE|CREATE)[^"']*["']/i);
            if (sqlMatch) {
              const query = sqlMatch[0].replace(/['"]/g, '');
              const res = sqliteEngine.execute(query);
              addLog(`🗄 [SQLite WASM] Выполнен запрос: "${query}" (${res.timeMs} ms)`);
            }
          } catch (e: any) {
            addLog(`❌ [SQLite Error] ${e.message}`);
          }
          return;
        }

        // 7. Property assignment: this.btnSubmit.Text = "..." / this.label1.BackColor = Color.Red;
        const propAssignMatch = line.match(/(?:this\.)?([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*=\s*(.+);/i);
        if (propAssignMatch) {
          const ctrlName = propAssignMatch[1];
          const propName = propAssignMatch[2].toLowerCase();
          let rawValue = propAssignMatch[3].trim();

          const targetCtrl = updatedState.controls[ctrlName];
          if (targetCtrl) {
            // Colors: Color.Red / ColorTranslator.FromHtml("#...")
            if (propName === 'backcolor' || propName === 'forecolor') {
              const parsedColor = this.parseColorExpression(rawValue);
              if (propName === 'backcolor') targetCtrl.backColor = parsedColor;
              if (propName === 'forecolor') targetCtrl.foreColor = parsedColor;
              addLog(`🎨 [C# Color] ${ctrlName}.${propName} = ${parsedColor}`);
              return;
            }

            if (rawValue === 'true' || rawValue === 'false') {
              const boolVal = rawValue === 'true';
              if (propName === 'visible') targetCtrl.visible = boolVal;
              if (propName === 'enabled') targetCtrl.enabled = boolVal;
              addLog(`⚡️ [C# Prop] ${ctrlName}.${propName} = ${boolVal}`);
              return;
            }

            rawValue = this.evaluateExpression(rawValue, updatedState);

            if (propName === 'text') targetCtrl.text = String(rawValue);
            if (propName === 'visible') targetCtrl.visible = Boolean(rawValue);
            if (propName === 'enabled') targetCtrl.enabled = Boolean(rawValue);

            addLog(`⚡️ [C# Runtime] ${ctrlName}.${propName} = "${rawValue}" (Живое обновление UI)`);
          }
          return;
        }

        // 8. Close form: this.Close();
        if (line.includes('Close()') || line.includes('this.Close()')) {
          addLog(`🚪 [C# Action] this.Close() ──► Форма закрыта`);
          showAlertCallback('Событие C#', 'Форма закрыта методом this.Close()');
          return;
        }
      } catch (err: any) {
        addLog(`❌ [C# Runtime Error] Ошибка в '${line}': ${err.message}`);
      }
    });

    return updatedState;
  }

  private static parseColorExpression(expr: string): string {
    const clean = expr.trim();
    if (clean.includes('FromHtml')) {
      const m = clean.match(/FromHtml\s*\(\s*["']([^"']+)["']\s*\)/i);
      if (m) return m[1];
    }
    if (clean.includes('Color.Red')) return '#EF4444';
    if (clean.includes('Color.Green')) return '#10B981';
    if (clean.includes('Color.Blue')) return '#2563EB';
    if (clean.includes('Color.Yellow')) return '#F59E0B';
    if (clean.includes('Color.White')) return '#FFFFFF';
    if (clean.includes('Color.Black')) return '#09090B';
    if (clean.includes('Color.FromArgb')) {
      const m = clean.match(/FromArgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
      if (m) {
        return `rgb(${m[1]}, ${m[2]}, ${m[3]})`;
      }
    }
    return clean.replace(/['";]/g, '');
  }

  /**
   * Evaluates expressions and extracts property values
   */
  private static evaluateExpression(expr: string, state: RuntimeFormState): any {
    let evaluated = expr.trim();

    // Random.Shared.Next(1, 100) or new Random().Next(1, 100)
    const randomMatch = evaluated.match(/(?:new\s+Random\(\)\.Next|Random\.Shared\.Next)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (randomMatch) {
      const min = parseInt(randomMatch[1], 10);
      const max = parseInt(randomMatch[2], 10);
      const rnd = Math.floor(Math.random() * (max - min)) + min;
      evaluated = evaluated.replace(randomMatch[0], String(rnd));
    }

    // Replace control text properties: this.txtA.Text -> value
    Object.keys(state.controls).forEach((ctrlName) => {
      const textVal = state.controls[ctrlName].text;
      const regex = new RegExp(`(?:this\\.)?${ctrlName}\\.Text`, 'g');
      evaluated = evaluated.replace(regex, `'${textVal.replace(/'/g, "\\'")}'`);
    });

    // DateTime.Now
    evaluated = evaluated.replace(/DateTime\.Now\.ToString\s*\([^)]*\)/gi, `'${new Date().toLocaleTimeString()}'`);
    evaluated = evaluated.replace(/DateTime\.Now/gi, `'${new Date().toISOString()}'`);

    // Number parsing: int.Parse(...) / double.Parse(...)
    evaluated = evaluated.replace(/int\.Parse\s*\(([^)]+)\)/g, 'Number($1)');
    evaluated = evaluated.replace(/double\.Parse\s*\(([^)]+)\)/g, 'Number($1)');
    evaluated = evaluated.replace(/\.ToString\s*\(\s*\)/g, '');

    try {
      return Function(`'use strict'; return (${evaluated})`)();
    } catch {
      return expr.replace(/['";]/g, '');
    }
  }
}
