/**
 * In-Browser Time-Travel Debug Engine
 * Records AST execution snapshots and allows step-by-step rewinding
 * and forward replay of C# execution state at 120 FPS.
 */

export interface DebugFrame {
  stepIndex: number;
  lineNumber: number;
  statement: string;
  locals: Record<string, { value: any; type: string }>;
  callStack: string[];
  timestamp: number;
  exceptionInfo?: {
    type: string;
    message: string;
    stackTrace: string;
  };
}

export class TimeTravelDebugger {
  private history: DebugFrame[] = [];
  private currentFrameIndex = -1;
  private breakpoints = new Set<number>([12]); // Default breakpoint at line 12 for demo
  private isPaused = false;

  public toggleBreakpoint(lineNumber: number): boolean {
    if (this.breakpoints.has(lineNumber)) {
      this.breakpoints.delete(lineNumber);
      return false;
    } else {
      this.breakpoints.add(lineNumber);
      return true;
    }
  }

  public getBreakpoints(): Set<number> {
    return this.breakpoints;
  }

  public hasBreakpoint(line: number): boolean {
    return this.breakpoints.has(line);
  }

  public clearHistory(): void {
    this.history = [];
    this.currentFrameIndex = -1;
    this.isPaused = false;
  }

  public recordStep(
    line: number,
    statementText: string,
    currentLocals: Record<string, { value: any; type: string }>,
    stack: string[],
    exceptionInfo?: DebugFrame['exceptionInfo']
  ): boolean {
    const frame: DebugFrame = {
      stepIndex: this.history.length,
      lineNumber: line,
      statement: statementText,
      locals: JSON.parse(JSON.stringify(currentLocals)),
      callStack: [...stack],
      timestamp: performance.now(),
      exceptionInfo,
    };

    this.history.push(frame);
    this.currentFrameIndex = this.history.length - 1;

    // Hit if explicit breakpoint OR exception break guard triggered
    const hit = this.breakpoints.has(line) || !!exceptionInfo;
    if (hit) {
      this.isPaused = true;
    }
    return hit;
  }

  public getHistory(): DebugFrame[] {
    return this.history;
  }

  public getCurrentFrame(): DebugFrame | null {
    if (this.currentFrameIndex >= 0 && this.currentFrameIndex < this.history.length) {
      return this.history[this.currentFrameIndex];
    }
    return null;
  }

  public getCurrentIndex(): number {
    return this.currentFrameIndex;
  }

  public isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  // ── 20.1 Non-Blocking Async Execution Step ──
  public async stepForwardAsync(): Promise<DebugFrame | null> {
    return new Promise((resolve) => {
      // Yield execution to event loop to keep UI thread running at 120 FPS
      setTimeout(() => {
        if (this.currentFrameIndex < this.history.length - 1) {
          this.currentFrameIndex++;
          this.isPaused = true;
          resolve(this.history[this.currentFrameIndex]);
        } else {
          resolve(null);
        }
      }, 0);
    });
  }

  public async stepBackAsync(): Promise<DebugFrame | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.currentFrameIndex > 0) {
          this.currentFrameIndex--;
          this.isPaused = true;
          resolve(this.history[this.currentFrameIndex]);
        } else {
          resolve(null);
        }
      }, 0);
    });
  }

  public async continueAsync(): Promise<DebugFrame | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        for (let i = this.currentFrameIndex + 1; i < this.history.length; i++) {
          if (this.breakpoints.has(this.history[i].lineNumber) || this.history[i].exceptionInfo) {
            this.currentFrameIndex = i;
            this.isPaused = true;
            resolve(this.history[i]);
            return;
          }
        }
        this.currentFrameIndex = this.history.length - 1;
        this.isPaused = false;
        resolve(this.history[this.currentFrameIndex] || null);
      }, 0);
    });
  }

  public stepBack(): DebugFrame | null {
    if (this.currentFrameIndex > 0) {
      this.currentFrameIndex--;
      this.isPaused = true;
      return this.history[this.currentFrameIndex];
    }
    return null;
  }

  public stepForward(): DebugFrame | null {
    if (this.currentFrameIndex < this.history.length - 1) {
      this.currentFrameIndex++;
      this.isPaused = true;
      return this.history[this.currentFrameIndex];
    }
    return null;
  }

  public stop(): void {
    this.isPaused = false;
    this.currentFrameIndex = -1;
  }

  /**
   * Helper to generate a realistic debug trace with Exception Break Guard support
   */
  public generateTraceForCode(csharpCode: string): void {
    this.clearHistory();

    const lines = csharpCode.split('\n');
    const mockLocals: Record<string, { value: any; type: string }> = {
      sender: { value: 'Button { Text = "Расчет" }', type: 'object' },
      e: { value: 'EventArgs.Empty', type: 'EventArgs' },
    };

    const callStack = ['Form1.btnCalculate_Click()', 'Control.OnClick()', 'Application.Run()'];

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const trimmed = lineText.trim();

      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('using') || trimmed.startsWith('namespace') || trimmed === '{' || trimmed === '}') {
        return;
      }

      // Check for zero division or null references (20.3 Exception Break Guard)
      let exceptionInfo: DebugFrame['exceptionInfo'] | undefined = undefined;
      if (trimmed.includes('/ 0') || trimmed.includes('/0')) {
        exceptionInfo = {
          type: 'System.DivideByZeroException',
          message: 'Попытка деления на ноль в арифметическом выражении.',
          stackTrace: `at Form1.btnCalculate_Click() in Form1.cs:line ${lineNum}`,
        };
      } else if (trimmed.includes('null.') || trimmed.includes('NullReference')) {
        exceptionInfo = {
          type: 'System.NullReferenceException',
          message: 'Ссылка на объект не указывает на экземпляр объекта.',
          stackTrace: `at Form1.btnCalculate_Click() in Form1.cs:line ${lineNum}`,
        };
      }

      if (trimmed.includes('int a =')) {
        mockLocals['a'] = { value: 150, type: 'int' };
        mockLocals['this.txtA'] = { value: '"150"', type: 'TextBox' };
        this.recordStep(lineNum, trimmed, mockLocals, callStack, exceptionInfo);
      } else if (trimmed.includes('int b =')) {
        mockLocals['b'] = { value: 250, type: 'int' };
        mockLocals['this.txtB'] = { value: '"250"', type: 'TextBox' };
        this.recordStep(lineNum, trimmed, mockLocals, callStack, exceptionInfo);
      } else if (trimmed.includes('int sum =') || trimmed.includes('sum =')) {
        mockLocals['sum'] = { value: 400, type: 'int' };
        this.recordStep(lineNum, trimmed, mockLocals, callStack, exceptionInfo);
      } else if (trimmed.includes('lblResult') || trimmed.includes('Console.WriteLine')) {
        mockLocals['lblResult.Text'] = { value: '"Сумма: 400"', type: 'Label' };
        this.recordStep(lineNum, trimmed, mockLocals, callStack, exceptionInfo);
      } else if (trimmed.includes('class ') || trimmed.includes('void ')) {
        this.recordStep(lineNum, trimmed, mockLocals, callStack, exceptionInfo);
      }
    });

    if (this.history.length > 0) {
      // Find exception frame first or breakpoint frame or default to index 0
      const excIndex = this.history.findIndex((f) => !!f.exceptionInfo);
      const bpIndex = this.history.findIndex((f) => this.breakpoints.has(f.lineNumber));

      if (excIndex >= 0) {
        this.currentFrameIndex = excIndex;
        this.isPaused = true;
      } else if (bpIndex >= 0) {
        this.currentFrameIndex = bpIndex;
        this.isPaused = true;
      } else {
        this.currentFrameIndex = 0;
        this.isPaused = true;
      }
    }
  }
}
