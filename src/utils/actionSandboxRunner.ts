import { ActionStep } from '../types/actions';
import { ACTIONS_REGISTRY } from './actionRegistry';

export interface ActionExecutionContext {
  nodes: Record<string, any>;
  updateNodeProperties: (id: string, props: any) => void;
  addConsoleLog: (cat: any, text: string, details?: string) => void;
  setMessageBoxModal?: (modal: { isOpen: boolean; title: string; text: string } | null) => void;
  allForms?: any[];
  setActiveFormId?: (id: string) => void;
}

/**
 * Executes a sequence of ActionSteps live in the browser sandbox / state emulator
 */
export async function executeActionStepsInSandbox(
  steps: ActionStep[],
  ctx: ActionExecutionContext
): Promise<boolean> {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const actDef = ACTIONS_REGISTRY.find(a => a.num === step.actionNum || a.id === step.actionId);
    const p = step.params || {};

    ctx.addConsoleLog('Runtime', `⚡️ [Экшен #${step.actionNum}] ${actDef?.title || step.actionId}: Выполнение...`);

    switch (step.actionNum) {
      // 1. Open Form
      case 1: {
        const form = p.targetForm || 'Form2';
        if (ctx.setActiveFormId && ctx.allForms) {
          const target = ctx.allForms.find((f: any) => f.properties.name === form || f.id === form);
          if (target) {
            ctx.setActiveFormId(target.id);
            ctx.addConsoleLog('Runtime', `Переключение на форму: ${form}`);
          }
        }
        break;
      }

      // 2. Close Form
      case 2:
        ctx.addConsoleLog('Runtime', `Закрытие текущей формы`);
        break;

      // 11. Set Text
      case 11: {
        const ctrlId = findNodeIdByName(p.targetControl, ctx.nodes);
        if (ctrlId) {
          ctx.updateNodeProperties(ctrlId, { text: p.textValue || '' });
          ctx.addConsoleLog('Runtime', `Изменен текст '${p.targetControl}' на "${p.textValue}"`);
        }
        break;
      }

      // 12. Clear Input
      case 12: {
        const ctrlId = findNodeIdByName(p.targetControl, ctx.nodes);
        if (ctrlId) {
          ctx.updateNodeProperties(ctrlId, { text: '' });
          ctx.addConsoleLog('Runtime', `Очищено поле '${p.targetControl}'`);
        }
        break;
      }

      // 13. Set Enabled
      case 13: {
        const ctrlId = findNodeIdByName(p.targetControl, ctx.nodes);
        if (ctrlId) {
          const current = ctx.nodes[ctrlId]?.properties.enabled ?? true;
          const next = p.state === 'toggle' ? !current : p.state === 'true';
          ctx.updateNodeProperties(ctrlId, { enabled: next });
          ctx.addConsoleLog('Runtime', `Элемент '${p.targetControl}' Enabled = ${next}`);
        }
        break;
      }

      // 14. Set Visible
      case 14: {
        const ctrlId = findNodeIdByName(p.targetControl, ctx.nodes);
        if (ctrlId) {
          const current = ctx.nodes[ctrlId]?.properties.visible ?? true;
          const next = p.state === 'toggle' ? !current : p.state === 'true';
          ctx.updateNodeProperties(ctrlId, { visible: next });
          ctx.addConsoleLog('Runtime', `Элемент '${p.targetControl}' Visible = ${next}`);
        }
        break;
      }

      // 15. Set BackColor
      case 15: {
        const ctrlId = findNodeIdByName(p.targetControl, ctx.nodes);
        if (ctrlId) {
          ctx.updateNodeProperties(ctrlId, { backColor: p.color || '#2563EB' });
          ctx.addConsoleLog('Runtime', `Цвет фона '${p.targetControl}' изменен на ${p.color}`);
        }
        break;
      }

      // 16. Set ForeColor
      case 16: {
        const ctrlId = findNodeIdByName(p.targetControl, ctx.nodes);
        if (ctrlId) {
          ctx.updateNodeProperties(ctrlId, { foreColor: p.color || '#EF4444' });
          ctx.addConsoleLog('Runtime', `Цвет текста '${p.targetControl}' изменен на ${p.color}`);
        }
        break;
      }

      // 20. Set ProgressBar
      case 20: {
        const ctrlId = findNodeIdByName(p.targetControl, ctx.nodes);
        if (ctrlId) {
          ctx.updateNodeProperties(ctrlId, { progressValue: Number(p.val ?? 100) });
          ctx.addConsoleLog('Runtime', `ProgressBar '${p.targetControl}' установлен в ${p.val}%`);
        }
        break;
      }

      // 21. MessageBox
      case 21:
        if (ctx.setMessageBoxModal) {
          ctx.setMessageBoxModal({
            isOpen: true,
            title: p.title || 'Информация',
            text: p.text || 'Сообщение',
          });
        }
        ctx.addConsoleLog('Runtime', `MessageBox: [${p.title}] "${p.text}"`);
        break;

      // 22. Confirm Dialog
      case 22: {
        const confirmed = window.confirm(`${p.title || 'Подтверждение'}\n\n${p.question || 'Продолжить?'}`);
        if (confirmed && step.thenBranch) {
          await executeActionStepsInSandbox(step.thenBranch, ctx);
        } else if (!confirmed && step.elseBranch) {
          await executeActionStepsInSandbox(step.elseBranch, ctx);
        }
        break;
      }

      // 32. Increment Counter
      case 32: {
        const ctrlId = findNodeIdByName(p.targetControl, ctx.nodes);
        if (ctrlId) {
          const curText = ctx.nodes[ctrlId]?.properties.text || '0';
          const curNum = parseInt(curText, 10) || 0;
          const nextNum = curNum + (Number(p.step) || 1);
          ctx.updateNodeProperties(ctrlId, { text: nextNum.toString() });
          ctx.addConsoleLog('Runtime', `Счетчик '${p.targetControl}' = ${nextNum}`);
        }
        break;
      }

      // 33. If / Else Condition
      case 33: {
        const ctrlId = findNodeIdByName(p.sourceControl, ctx.nodes);
        const actualVal = ctrlId ? (ctx.nodes[ctrlId]?.properties.text || '') : '';
        const compareVal = p.compareValue || '';
        const op = p.operator || '==';

        let isMatch = false;
        if (op === '==') isMatch = actualVal.trim() === compareVal.trim();
        else if (op === '!=') isMatch = actualVal.trim() !== compareVal.trim();
        else if (op === 'contains') isMatch = actualVal.includes(compareVal);
        else if (op === '>') isMatch = parseFloat(actualVal) > parseFloat(compareVal);
        else if (op === '>=') isMatch = parseFloat(actualVal) >= parseFloat(compareVal);
        else if (op === '<') isMatch = parseFloat(actualVal) < parseFloat(compareVal);
        else if (op === '<=') isMatch = parseFloat(actualVal) <= parseFloat(compareVal);

        ctx.addConsoleLog('Runtime', `Условие: "${actualVal}" ${op} "${compareVal}" ➔ ${isMatch ? '✅ ИСТИНА (УСПЕХ)' : '❌ ЛОЖЬ (ОШИБКА)'}`);

        if (isMatch && step.thenBranch) {
          await executeActionStepsInSandbox(step.thenBranch, ctx);
        } else if (!isMatch && step.elseBranch) {
          await executeActionStepsInSandbox(step.elseBranch, ctx);
        }
        break;
      }

      // 34. Math Calculation
      case 34: {
        const idA = findNodeIdByName(p.inputA, ctx.nodes);
        const idB = findNodeIdByName(p.inputB, ctx.nodes);
        const idRes = findNodeIdByName(p.targetResult, ctx.nodes);

        const valA = parseFloat(idA ? ctx.nodes[idA]?.properties.text : '0') || 0;
        const valB = parseFloat(idB ? ctx.nodes[idB]?.properties.text : '0') || 0;
        let res = 0;
        const op = p.op || '+';
        if (op === '+') res = valA + valB;
        else if (op === '-') res = valA - valB;
        else if (op === '*') res = valA * valB;
        else if (op === '/') res = valB !== 0 ? valA / valB : 0;
        else if (op === '%') res = valA % valB;
        else if (op === '^') res = Math.pow(valA, valB);

        if (idRes) {
          ctx.updateNodeProperties(idRes, { text: res.toString() });
          ctx.addConsoleLog('Runtime', `Математический расчет: ${valA} ${op} ${valB} = ${res}`);
        }
        break;
      }

      // 35. Random
      case 35: {
        const ctrlId = findNodeIdByName(p.targetControl, ctx.nodes);
        const min = Number(p.minVal) || 1;
        const max = Number(p.maxVal) || 100;
        const rnd = Math.floor(Math.random() * (max - min + 1)) + min;
        if (ctrlId) {
          ctx.updateNodeProperties(ctrlId, { text: rnd.toString() });
          ctx.addConsoleLog('Runtime', `Случайное число: ${rnd} в диапазоне [${min}..${max}]`);
        }
        break;
      }

      // 63. Delay Wait
      case 63: {
        const delay = Number(p.delayMs) || 1000;
        ctx.addConsoleLog('Runtime', `Задержка: ожидание ${delay} мс...`);
        await new Promise(res => setTimeout(res, Math.min(delay, 3000)));
        break;
      }

      // 64. Show Current Time
      case 64: {
        const ctrlId = findNodeIdByName(p.targetControl, ctx.nodes);
        const now = new Date().toLocaleTimeString();
        if (ctrlId) {
          ctx.updateNodeProperties(ctrlId, { text: now });
          ctx.addConsoleLog('Runtime', `Время обновлено: ${now}`);
        }
        break;
      }

      // 71. Add List Item
      case 71: {
        const listId = findNodeIdByName(p.targetControl, ctx.nodes);
        const srcId = findNodeIdByName(p.sourceControl, ctx.nodes);
        const itemText = srcId ? ctx.nodes[srcId]?.properties.text : 'Новый элемент';
        if (listId && itemText) {
          const curItems = ctx.nodes[listId]?.properties.items || [];
          ctx.updateNodeProperties(listId, { items: [...curItems, itemText] });
          ctx.addConsoleLog('Runtime', `Добавлен элемент в список '${p.targetControl}': "${itemText}"`);
        }
        break;
      }

      default:
        ctx.addConsoleLog('Runtime', `Выполнен экшен #${step.actionNum}: ${actDef?.title || 'Ok'}`);
        break;
    }
  }

  return true;
}

function findNodeIdByName(name: string | undefined, nodes: Record<string, any>): string | null {
  if (!name) return null;
  if (nodes[name]) return name;
  const found = Object.values(nodes).find((n: any) => n.properties?.name === name || n.id === name);
  return found ? found.id : null;
}
