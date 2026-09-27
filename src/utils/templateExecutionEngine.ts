import { DesignerNode, DesignerProjectState } from '../types/ast';
import { executeActionStepsInSandbox } from './actionSandboxRunner';
import { ActionFlow } from '../types/actions';
import { MinesweeperEngine } from './MinesweeperEngine';

export interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: string | null;
  waitingForOperand: boolean;
  history: string;
}

export interface SimulationResult {
  updatedNodes: Record<string, DesignerNode>;
  logEntry?: {
    controlName: string;
    eventName: string;
    handlerName: string;
    message: string;
    details?: string;
  };
  notification?: {
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
  };
  navigationTargetFormId?: string;
  downloadPayload?: {
    filename: string;
    content: string;
    mimeType: string;
  };
}

/**
 * Intelligent Simulation Engine that executes real functional logic for all templates
 * and user-designed forms without generic mock popups.
 */
export class TemplateExecutionEngine {
  private minesweeper: MinesweeperEngine | null = null;
  private calcState: CalculatorState = {
    display: '0',
    previousValue: null,
    operation: null,
    waitingForOperand: false,
    history: '',
  };

  public getCalcState(): CalculatorState {
    return { ...this.calcState };
  }

  public resetCalcState(initialDisplay = '0') {
    this.calcState = {
      display: initialDisplay,
      previousValue: null,
      operation: null,
      waitingForOperand: false,
      history: '',
    };
  }

  /**
   * Main dispatch method for all control interaction events
   */
  public async executeEvent(
    eventName: string,
    handlerName: string,
    controlName: string,
    currentNodes: Record<string, DesignerNode>,
    project: DesignerProjectState,
    eventPayload?: any
  ): Promise<SimulationResult> {
    const nodes = JSON.parse(JSON.stringify(currentNodes)) as Record<string, DesignerNode>;
    const targetNode = Object.values(nodes).find(
      n => n.properties.name === controlName || n.id === controlName
    );

    // 1. Check if user has defined a custom No-Code Action Flow for this trigger
    const actionFlows: ActionFlow[] = (project as any).actionFlows || [];
    const matchedFlow = actionFlows.find(
      f =>
        (f.triggerNodeId === targetNode?.id || f.triggerNodeId === controlName) &&
        f.triggerEvent.toLowerCase() === eventName.toLowerCase()
    );

    if (matchedFlow && matchedFlow.steps.length > 0) {
      let logMsg = `Выполнение цепочки действий (${matchedFlow.steps.length} шагов)...`;
      const updateNodeProps = (id: string, props: any) => {
        if (nodes[id]) {
          nodes[id].properties = { ...nodes[id].properties, ...props };
        }
      };

      await executeActionStepsInSandbox(matchedFlow.steps, {
        nodes,
        updateNodeProperties: updateNodeProps,
        addConsoleLog: (cat, text) => {
          logMsg += `\n[${cat}] ${text}`;
        },
      });

      return {
        updatedNodes: nodes,
        logEntry: {
          controlName,
          eventName,
          handlerName,
          message: `⚡️ Выполнен No-Code Action Flow: ${matchedFlow.steps.length} шагов`,
          details: logMsg,
        },
      };
    }

    // 2. Intelligent Domain Handlers based on form and control context
    const formTitle = (project.projectName || '').toLowerCase();
    const btnText = (targetNode?.properties.text || '').trim();
    const nodeName = (targetNode?.properties.name || controlName).toLowerCase();

    // === DOMAIN S: MINESWEEPER / GAME ENGINE ===
    const isMinesweeperContext =
      formTitle.includes('сапер') ||
      formTitle.includes('minesweeper') ||
      formTitle.includes('игра') ||
      formTitle.includes('game') ||
      nodeName.includes('startgame') ||
      nodeName.includes('mines') ||
      btnText.includes('ИГР') ||
      btnText.includes('Сапер') ||
      btnText.includes('Начать') ||
      btnText.includes('Старт');

    if (isMinesweeperContext && eventName === 'Click') {
      if (!this.minesweeper) {
        this.minesweeper = new MinesweeperEngine();
      } else if (nodeName.includes('start') || btnText.includes('ИГР') || btnText.includes('Старт') || btnText.includes('Перезапуск')) {
        this.minesweeper.initGame();
      }

      const logMessage = `🎮 [MinesweeperEngine] Сгенерировано поле 9x9 (81 ячейка). Очки: ${this.minesweeper.score}, Жизни: ${this.minesweeper.lives}`;

      Object.values(nodes).forEach(node => {
        if (node.properties.name === 'lblStatus' || node.properties.name === 'lblScore' || node.type === 'Label') {
          if (node.properties.text?.includes('СЧЕТ') || node.properties.name === 'lblStatus') {
            node.properties.text = `🏆 СЧЕТ: ${this.minesweeper!.score} | ❤️ ЖИЗНИ: ${this.minesweeper!.lives} | 🚩 МИН: ${this.minesweeper!.totalMines - this.minesweeper!.flagsPlaced}`;
          }
        }
      });

      return {
        updatedNodes: nodes,
        logEntry: {
          controlName,
          eventName,
          handlerName,
          message: logMessage,
          details: `MinesweeperEngine.openCell(); // Score: ${this.minesweeper.score}, Lives: ${this.minesweeper.lives}`,
        },
        notification: {
          type: 'success',
          title: 'Сапер (Live Sandbox Engine)',
          message: `Счет: ${this.minesweeper.score} | Жизни: ${this.minesweeper.lives} | Флаги: ${this.minesweeper.flagsPlaced}/10`,
        },
      };
    }

    // === DOMAIN A: CALCULATOR TEMPLATE ===
    const isCalculatorContext =
      formTitle.includes('calc') ||
      formTitle.includes('калькулятор') ||
      !!Object.values(nodes).find(n => n.properties.name === 'txtDisplay' || n.properties.name === 'lblDisplay') ||
      nodeName.startsWith('btn') && (['0','1','2','3','4','5','6','7','8','9','add','sub','mul','div','eq','c','ce','dot','neg','back'].some(s => nodeName.includes(s)));

    if (isCalculatorContext && eventName === 'Click') {
      return this.handleCalculatorClick(targetNode, btnText, nodeName, nodes, handlerName);
    }

    // === DOMAIN B: LOGIN / AUTHENTICATION TEMPLATE ===
    const isAuthContext =
      formTitle.includes('login') ||
      formTitle.includes('авториз') ||
      formTitle.includes('auth') ||
      nodeName.includes('login') ||
      nodeName.includes('submit') ||
      btnText.includes('Войти') ||
      btnText.includes('Авториз') ||
      btnText.includes('Вход');

    if (isAuthContext && eventName === 'Click') {
      return this.handleAuthClick(targetNode, btnText, nodeName, nodes, project, handlerName);
    }

    // === DOMAIN C: WAREHOUSE / INVENTORY CRUD TEMPLATE ===
    const isWarehouseCrud =
      formTitle.includes('ware') ||
      formTitle.includes('склад') ||
      formTitle.includes('crud') ||
      formTitle.includes('order') ||
      nodeName.includes('item') ||
      nodeName.includes('order') ||
      btnText.includes('Добавить') ||
      btnText.includes('Удалить') ||
      btnText.includes('Поиск') ||
      btnText.includes('Экспорт') ||
      btnText.includes('Очистить');

    if (isWarehouseCrud) {
      return this.handleWarehouseCrud(eventName, targetNode, btnText, nodeName, nodes, handlerName, eventPayload);
    }

    // === DOMAIN D: DASHBOARD & TELEMETRY TEMPLATE ===
    const isDashboard =
      formTitle.includes('dash') ||
      formTitle.includes('монитор') ||
      formTitle.includes('kpi') ||
      nodeName.includes('refresh') ||
      nodeName.includes('period') ||
      btnText.includes('Обновить') ||
      btnText.includes('День') ||
      btnText.includes('Неделя') ||
      btnText.includes('Месяц');

    if (isDashboard) {
      return this.handleDashboard(eventName, targetNode, btnText, nodeName, nodes, handlerName);
    }

    // === DOMAIN E: MULTI-FORM NAVIGATION ===
    if (eventName === 'Click' && (btnText.includes('Открыть форму') || btnText.includes('Form2') || nodeName.includes('openform'))) {
      const allForms = Object.values(nodes).filter(n => n.type === 'Form');
      const targetForm = allForms.find(f => f.id !== project.rootFormId) || allForms[1];
      if (targetForm) {
        return {
          updatedNodes: nodes,
          navigationTargetFormId: targetForm.id,
          logEntry: {
            controlName,
            eventName,
            handlerName,
            message: `🗔 Form2.ShowDialog() — Переход на форму «${targetForm.properties.name || 'Form2'}»`,
            details: `new ${targetForm.properties.name || 'Form2'}().ShowDialog(this);`,
          },
          notification: {
            type: 'info',
            title: 'Переход между окнами',
            message: `Открыто окно: ${targetForm.properties.text || targetForm.properties.name}`,
          },
        };
      }
    }

    // === DEFAULT INTERACTIVE FALLBACK (Clean C# output without mock dialogs) ===
    let cleanMessage = `Событие ${handlerName}() выполнено.`;
    if (eventName === 'Click') {
      cleanMessage = `Вызов: ${handlerName}(sender, EventArgs.Empty) ➔ Button "${btnText || controlName}"`;
    } else if (eventName === 'TextChanged') {
      cleanMessage = `Свойство Text обновлено: "${eventPayload?.text || ''}"`;
    } else if (eventName === 'CheckedChanged') {
      cleanMessage = `Свойство Checked = ${eventPayload?.checked ? 'true' : 'false'}`;
    }

    return {
      updatedNodes: nodes,
      logEntry: {
        controlName,
        eventName,
        handlerName,
        message: cleanMessage,
        details: `Console.WriteLine($"[C# Event] {controlName}_{eventName} fired at {new Date().toLocaleTimeString()}");`,
      },
    };
  }

  /**
   * Real Calculator Execution: evaluates math expressions and updates display
   */
  private handleCalculatorClick(
    targetNode: DesignerNode | undefined,
    btnText: string,
    nodeName: string,
    nodes: Record<string, DesignerNode>,
    handlerName: string
  ): SimulationResult {
    const displayNode = Object.values(nodes).find(
      n => n.properties.name === 'txtDisplay' || n.properties.name === 'lblDisplay' || n.id === 'txtDisplay'
    );

    let displayVal = displayNode?.properties.text ?? this.calcState.display;
    if (displayVal === undefined || displayVal === null || displayVal === '') {
      displayVal = '0';
    }

    let inputSymbol = btnText || '';
    if (!inputSymbol) {
      if (nodeName === 'btneq') inputSymbol = '=';
      else if (nodeName === 'btnadd') inputSymbol = '+';
      else if (nodeName === 'btnsub') inputSymbol = '-';
      else if (nodeName === 'btnmul') inputSymbol = '*';
      else if (nodeName === 'btndiv') inputSymbol = '/';
      else if (nodeName === 'btnc') inputSymbol = 'C';
      else if (nodeName === 'btnce') inputSymbol = 'CE';
      else if (nodeName === 'btndot') inputSymbol = '.';
      else if (nodeName === 'btnneg') inputSymbol = '±';
      else if (nodeName === 'btnback') inputSymbol = '⌫';
      else if (nodeName.match(/^btn\d$/)) inputSymbol = nodeName.replace('btn', '');
    }

    let logMessage = '';
    let csharpCode = '';

    if (inputSymbol === 'C') {
      // Clear All
      this.resetCalcState('0');
      displayVal = '0';
      logMessage = 'Очистка калькулятора (C) ➔ 0';
      csharpCode = `_display = "0"; _accumulator = 0; _op = null;`;
    } else if (inputSymbol === 'CE') {
      // Clear Entry
      this.calcState.display = '0';
      displayVal = '0';
      logMessage = 'Очистка текущего ввода (CE) ➔ 0';
      csharpCode = `txtDisplay.Text = "0";`;
    } else if (inputSymbol === '⌫' || inputSymbol === 'Back' || nodeName.includes('back')) {
      // Backspace
      if (displayVal.length > 1 && displayVal !== '0') {
        displayVal = displayVal.slice(0, -1);
      } else {
        displayVal = '0';
      }
      this.calcState.display = displayVal;
      logMessage = `Удален последний символ ➔ ${displayVal}`;
      csharpCode = `txtDisplay.Text = txtDisplay.Text.Length > 1 ? txtDisplay.Text[..^1] : "0";`;
    } else if (inputSymbol === '±' || nodeName.includes('neg')) {
      // Negate
      if (displayVal !== '0') {
        if (displayVal.startsWith('-')) {
          displayVal = displayVal.substring(1);
        } else {
          displayVal = '-' + displayVal;
        }
        this.calcState.display = displayVal;
        logMessage = `Инверсия знака ± ➔ ${displayVal}`;
        csharpCode = `txtDisplay.Text = (-double.Parse(txtDisplay.Text)).ToString();`;
      }
    } else if (inputSymbol === '.' || inputSymbol === ',') {
      // Dot decimal
      if (this.calcState.waitingForOperand) {
        displayVal = '0.';
        this.calcState.waitingForOperand = false;
      } else if (!displayVal.includes('.')) {
        displayVal += '.';
      }
      this.calcState.display = displayVal;
      logMessage = `Добавлена десятичная точка ➔ ${displayVal}`;
    } else if (/^[0-9]$/.test(inputSymbol)) {
      // Digit 0-9
      if (displayVal === '0' || this.calcState.waitingForOperand) {
        displayVal = inputSymbol;
        this.calcState.waitingForOperand = false;
      } else {
        displayVal += inputSymbol;
      }
      this.calcState.display = displayVal;
      logMessage = `Ввод цифры '${inputSymbol}' ➔ Текущее значение: ${displayVal}`;
      csharpCode = `txtDisplay.Text += "${inputSymbol}";`;
    } else if (['+', '-', '*', '/', '%', '^'].includes(inputSymbol)) {
      // Arithmetic Operator
      const curNum = parseFloat(displayVal) || 0;
      if (this.calcState.previousValue !== null && this.calcState.operation && !this.calcState.waitingForOperand) {
        // Evaluate previous chain
        const evaluated = this.compute(this.calcState.previousValue, curNum, this.calcState.operation);
        displayVal = evaluated.toString();
        this.calcState.previousValue = evaluated;
      } else {
        this.calcState.previousValue = curNum;
      }
      this.calcState.operation = inputSymbol;
      this.calcState.waitingForOperand = true;
      this.calcState.history = `${this.calcState.previousValue} ${inputSymbol}`;
      logMessage = `Операция [ ${inputSymbol} ] с числом ${this.calcState.previousValue}`;
      csharpCode = `_accumulator = double.Parse(txtDisplay.Text); _op = "${inputSymbol}";`;
    } else if (inputSymbol === '=' || nodeName.includes('eq')) {
      // Equals Calculation
      const curNum = parseFloat(displayVal) || 0;
      if (this.calcState.previousValue !== null && this.calcState.operation) {
        const op = this.calcState.operation;
        const prev = this.calcState.previousValue;
        const result = this.compute(prev, curNum, op);
        const formulaStr = `${prev} ${op} ${curNum} = ${result}`;

        displayVal = result.toString();
        this.calcState.display = displayVal;
        this.calcState.previousValue = null;
        this.calcState.operation = null;
        this.calcState.waitingForOperand = true;

        logMessage = `✨ Результат вычисления: ${formulaStr}`;
        csharpCode = `// C# Execution Result\ndouble result = Calculate(${prev}, ${curNum}, "${op}");\ntxtDisplay.Text = result.ToString();\nConsole.WriteLine($"Result: {result}");`;
      } else {
        logMessage = `Калькулятор: текущее число ${displayVal}`;
      }
    }

    // Update the display node in nodes
    if (displayNode && nodes[displayNode.id]) {
      nodes[displayNode.id].properties = {
        ...nodes[displayNode.id].properties,
        text: displayVal,
      };
    }

    return {
      updatedNodes: nodes,
      logEntry: {
        controlName: targetNode?.properties.name || 'btnCalculator',
        eventName: 'Click',
        handlerName,
        message: logMessage,
        details: csharpCode,
      },
    };
  }

  private compute(a: number, b: number, op: string): number {
    let res = 0;
    switch (op) {
      case '+': res = a + b; break;
      case '-': res = a - b; break;
      case '*': res = a * b; break;
      case '/': res = b !== 0 ? a / b : 0; break;
      case '%': res = a % b; break;
      case '^': res = Math.pow(a, b); break;
      default: res = b; break;
    }
    // Round to avoid floating point precision artifacts (e.g. 0.1 + 0.2 = 0.30000000000000004)
    return Math.round(res * 10000000000) / 10000000000;
  }

  /**
   * Real Authentication Execution
   */
  private handleAuthClick(
    targetNode: DesignerNode | undefined,
    btnText: string,
    nodeName: string,
    nodes: Record<string, DesignerNode>,
    project: DesignerProjectState,
    handlerName: string
  ): SimulationResult {
    // Find username & password fields
    const userNode = Object.values(nodes).find(
      n => n.properties.name === 'txtUsername' || n.properties.name === 'txtUser' || n.id === 'txtUser'
    );
    const passNode = Object.values(nodes).find(
      n => n.properties.name === 'txtPassword' || n.properties.name === 'txtPass' || n.id === 'txtPass'
    );

    const username = userNode?.properties.text?.trim() || '';
    const password = passNode?.properties.text?.trim() || '';

    if (btnText.includes('Отмена') || nodeName.includes('cancel')) {
      if (userNode) nodes[userNode.id].properties.text = '';
      if (passNode) nodes[passNode.id].properties.text = '';

      return {
        updatedNodes: nodes,
        logEntry: {
          controlName: targetNode?.properties.name || 'btnCancel',
          eventName: 'Click',
          handlerName,
          message: '❌ Вход в систему отменен пользователем. Поля очищены.',
          details: 'this.DialogResult = DialogResult.Cancel;\nthis.Close();',
        },
      };
    }

    // Validation
    if (!username || !password) {
      return {
        updatedNodes: nodes,
        notification: {
          type: 'warning',
          title: 'Ошибка валидации',
          message: 'Пожалуйста, заполните логин и пароль для входа в систему!',
        },
        logEntry: {
          controlName: targetNode?.properties.name || 'btnSubmit',
          eventName: 'Click',
          handlerName,
          message: '⚠️ Ошибка валидации: Имя пользователя или пароль не указаны.',
          details: 'throw new ArgumentException("Login and password are required.");',
        },
      };
    }

    // Successful real login simulation
    const allForms = Object.values(nodes).filter(n => n.type === 'Form');
    const nextForm = allForms.find(f => f.id !== project.rootFormId);

    return {
      updatedNodes: nodes,
      navigationTargetFormId: nextForm?.id,
      notification: {
        type: 'success',
        title: 'Успешная авторизация',
        message: `Добро пожаловать в систему, ${username}! Сессия активна (Роль: Администратор).`,
      },
      logEntry: {
        controlName: targetNode?.properties.name || 'btnSubmit',
        eventName: 'Click',
        handlerName,
        message: `✅ Успешная авторизация пользователя «${username}» (UID: usr_78a19b)`,
        details: `// SQLite / Identity Provider check\nvar user = await _authService.ValidateUserAsync("${username}", "••••••••");\nif (user != null) {\n    UserSession.Current = new UserSession(user.Id, "${username}", "Admin");\n    new MainForm().Show();\n    this.Hide();\n}`,
      },
    };
  }

  /**
   * Real Warehouse / CRUD Inventory Execution
   */
  private handleWarehouseCrud(
    eventName: string,
    targetNode: DesignerNode | undefined,
    btnText: string,
    nodeName: string,
    nodes: Record<string, DesignerNode>,
    handlerName: string,
    eventPayload?: any
  ): SimulationResult {
    // Find DataGridView or ListBox
    const gridNode = Object.values(nodes).find(n => n.type === 'DataGridView') ||
      Object.values(nodes).find(n => n.properties.name?.toLowerCase().includes('grid') || n.properties.name?.toLowerCase().includes('table'));

    const nameInput = Object.values(nodes).find(n => n.properties.name?.toLowerCase().includes('itemname') || n.properties.name?.toLowerCase().includes('title') || n.properties.name?.toLowerCase().includes('name'));
    const qtyInput = Object.values(nodes).find(n => n.properties.name?.toLowerCase().includes('qty') || n.properties.name?.toLowerCase().includes('count'));
    const priceInput = Object.values(nodes).find(n => n.properties.name?.toLowerCase().includes('price') || n.properties.name?.toLowerCase().includes('cost'));
    const totalLabel = Object.values(nodes).find(n => n.properties.name?.toLowerCase().includes('total') || n.properties.text?.includes('Всего') || n.properties.text?.includes('Итого'));

    let currentRows: (string | number)[][] = (gridNode?.properties.rows as any) || [
      ['1', 'Ноутбук ASUS ROG Strix 16"', '14 шт.', '135 000 ₽', 'В наличии'],
      ['2', 'Монитор 27" 4K IPS Ultra', '26 шт.', '36 500 ₽', 'В наличии'],
      ['3', 'Механическая клавиатура RGB', '48 шт.', '8 900 ₽', 'В наличии'],
      ['4', 'SSD NVMe M.2 2TB Samsung', '11 шт.', '15 400 ₽', 'Мало'],
      ['5', 'Видеокарта RTX 4080 16GB', '6 шт.', '119 000 ₽', 'В наличии'],
    ];

    if (eventName === 'Click' && (btnText.includes('Добавить') || nodeName.includes('add'))) {
      const newItemName = nameInput?.properties.text?.trim() || `Новый товар #${currentRows.length + 1}`;
      const newQty = qtyInput?.properties.text?.trim() || '10 шт.';
      const newPrice = priceInput?.properties.text?.trim() || '4 500 ₽';
      const newId = (currentRows.length + 1).toString();

      currentRows = [...currentRows, [newId, newItemName, newQty.includes('шт') ? newQty : `${newQty} шт.`, newPrice.includes('₽') ? newPrice : `${newPrice} ₽`, 'В наличии']];

      if (gridNode && nodes[gridNode.id]) {
        nodes[gridNode.id].properties.rows = currentRows;
      }
      if (nameInput && nodes[nameInput.id]) nodes[nameInput.id].properties.text = '';
      if (qtyInput && nodes[qtyInput.id]) nodes[qtyInput.id].properties.text = '';
      if (priceInput && nodes[priceInput.id]) nodes[priceInput.id].properties.text = '';
      if (totalLabel && nodes[totalLabel.id]) {
        nodes[totalLabel.id].properties.text = `Всего позиций: ${currentRows.length} шт. (Актуально)`;
      }

      return {
        updatedNodes: nodes,
        notification: {
          type: 'success',
          title: 'Товар добавлен',
          message: `Товар «${newItemName}» успешно записан в базу данных SQLite!`,
        },
        logEntry: {
          controlName: targetNode?.properties.name || 'btnAddItem',
          eventName: 'Click',
          handlerName,
          message: `📦 [SQLite INSERT] Запись #${newId} «${newItemName}» добавлена в таблицу товаров`,
          details: `using var db = new SQLiteConnection(DbPath);\nawait db.ExecuteAsync("INSERT INTO Products (Name, Qty, Price) VALUES (@Name, @Qty, @Price)", new { Name = "${newItemName}", Qty = "${newQty}", Price = "${newPrice}" });\ndgvInventory.DataSource = await db.Table<Product>().ToListAsync();`,
        },
      };
    }

    if (eventName === 'Click' && (btnText.includes('Удалить') || nodeName.includes('delete') || nodeName.includes('remove'))) {
      if (currentRows.length > 0) {
        const removed = currentRows.pop();
        if (gridNode && nodes[gridNode.id]) {
          nodes[gridNode.id].properties.rows = currentRows;
        }
        if (totalLabel && nodes[totalLabel.id]) {
          nodes[totalLabel.id].properties.text = `Всего позиций: ${currentRows.length} шт.`;
        }

        return {
          updatedNodes: nodes,
          notification: {
            type: 'info',
            title: 'Товар удален',
            message: `Запись «${removed ? removed[1] : 'Товар'}» удалена из складского учета.`,
          },
          logEntry: {
            controlName: targetNode?.properties.name || 'btnDeleteItem',
            eventName: 'Click',
            handlerName,
            message: `🗑 [SQLite DELETE] Удален товар: ${removed ? removed[1] : 'Item'}`,
            details: `await db.ExecuteAsync("DELETE FROM Products WHERE Id = @Id", new { Id = ${removed ? removed[0] : 1} });`,
          },
        };
      }
    }

    if (eventName === 'Click' && (btnText.includes('Экспорт') || nodeName.includes('export') || btnText.includes('CSV'))) {
      const csvContent = 'ID,Наименование,Количество,Цена,Статус\n' + currentRows.map(r => r.join(',')).join('\n');
      return {
        updatedNodes: nodes,
        downloadPayload: {
          filename: `warehouse_inventory_${new Date().toISOString().slice(0,10)}.csv`,
          content: csvContent,
          mimeType: 'text/csv',
        },
        notification: {
          type: 'success',
          title: 'Экспорт CSV завершен',
          message: `Сформирован файл отчета с ${currentRows.length} записями!`,
        },
        logEntry: {
          controlName: targetNode?.properties.name || 'btnExport',
          eventName: 'Click',
          handlerName,
          message: `💾 Экспортировано ${currentRows.length} записей в CSV файл`,
          details: `File.WriteAllLines("inventory_export.csv", rows.Select(r => string.Join(",", r)));`,
        },
      };
    }

    // Default search or field update
    return {
      updatedNodes: nodes,
      logEntry: {
        controlName: targetNode?.properties.name || 'WarehouseControl',
        eventName,
        handlerName,
        message: `Обновление складского представления: ${handlerName}()`,
        details: `dgvInventory.Refresh();`,
      },
    };
  }

  /**
   * Real Dashboard / KPI Telemetry Execution
   */
  private handleDashboard(
    eventName: string,
    targetNode: DesignerNode | undefined,
    btnText: string,
    nodeName: string,
    nodes: Record<string, DesignerNode>,
    handlerName: string
  ): SimulationResult {
    // Randomize telemetry metrics
    const cpuVal = Math.floor(Math.random() * 35) + 25;
    const ramVal = (Math.random() * 2 + 3.8).toFixed(1);
    const rpsVal = Math.floor(Math.random() * 450) + 1200;
    const usersOnline = Math.floor(Math.random() * 80) + 420;

    Object.values(nodes).forEach(n => {
      if (n.type === 'ProgressBar') {
        nodes[n.id].properties.progressValue = cpuVal;
      }
      if (n.properties.text?.includes('CPU') || n.properties.name?.toLowerCase().includes('cpu')) {
        nodes[n.id].properties.text = `CPU Load: ${cpuVal}% (8 Cores)`;
      }
      if (n.properties.text?.includes('RAM') || n.properties.name?.toLowerCase().includes('ram')) {
        nodes[n.id].properties.text = `RAM: ${ramVal} GB / 16.0 GB`;
      }
      if (n.properties.name?.toLowerCase().includes('rps') || n.properties.text?.includes('RPS')) {
        nodes[n.id].properties.text = `RPS: ${rpsVal} req/sec`;
      }
      if (n.properties.name?.toLowerCase().includes('online') || n.properties.text?.includes('Пользоват')) {
        nodes[n.id].properties.text = `Онлайн: ${usersOnline} сессий`;
      }
    });

    return {
      updatedNodes: nodes,
      notification: {
        type: 'info',
        title: 'Телеметрия обновлена',
        message: `Метрики системы актуализированы: CPU ${cpuVal}%, RAM ${ramVal} GB, ${rpsVal} RPS`,
      },
      logEntry: {
        controlName: targetNode?.properties.name || 'DashboardControl',
        eventName,
        handlerName,
        message: `📊 [Telemetry Update] CPU: ${cpuVal}% | RAM: ${ramVal}GB | RPS: ${rpsVal} | Users: ${usersOnline}`,
        details: `var metrics = await PerformanceCounterService.GetLiveSystemMetricsAsync();\nprogressBarCpu.Value = metrics.CpuPercent;\nlblStatus.Text = metrics.ToString();`,
      },
    };
  }
}

export const templateEngine = new TemplateExecutionEngine();
