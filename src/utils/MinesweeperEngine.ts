// =========================================================================
// Live Minesweeper Game Engine for NextGen Sandbox
// =========================================================================

export interface CellState {
  x: number;
  y: number;
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export class MinesweeperEngine {
  public rows = 9;
  public cols = 9;
  public totalMines = 10;
  public grid: CellState[][] = [];
  public isGameOver = false;
  public isWin = false;
  public score = 0;
  public lives = 3;
  public flagsPlaced = 0;

  constructor() {
    this.initGame();
  }

  // 1. Инициализация поля 9x9 и расстановка 10 мин
  public initGame(): void {
    this.grid = [];
    this.isGameOver = false;
    this.isWin = false;
    this.score = 0;
    this.lives = 3;
    this.flagsPlaced = 0;

    // Создаем пустую сетку 9x9
    for (let y = 0; y < this.rows; y++) {
      const row: CellState[] = [];
      for (let x = 0; x < this.cols; x++) {
        row.push({ x, y, isMine: false, isOpen: false, isFlagged: false, neighborMines: 0 });
      }
      this.grid.push(row);
    }

    // Случайно расставляем 10 мин
    let placed = 0;
    while (placed < this.totalMines) {
      const rx = Math.floor(Math.random() * this.cols);
      const ry = Math.floor(Math.random() * this.rows);
      if (!this.grid[ry][rx].isMine) {
        this.grid[ry][rx].isMine = true;
        placed++;
      }
    }

    // Рассчитываем числа вокруг мин
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!this.grid[y][x].isMine) {
          this.grid[y][x].neighborMines = this.countNeighborMines(x, y);
        }
      }
    }
  }

  private countNeighborMines(cx: number, cy: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
          if (this.grid[ny][nx].isMine) count++;
        }
      }
    }
    return count;
  }

  // 2. Открытие ячейки (Левый клик)
  public openCell(x: number, y: number, logCallback: (msg: string) => void): void {
    if (this.isGameOver || this.isWin) return;
    const cell = this.grid[y][x];
    if (cell.isOpen || cell.isFlagged) return;

    cell.isOpen = true;

    // Попадание на мину
    if (cell.isMine) {
      this.lives--;
      logCallback(`💥 БУМ! Попадание на мину в (${x + 1}, ${y + 1})! Осталось жизней: ${this.lives}`);

      if (this.lives <= 0) {
        this.isGameOver = true;
        this.revealAllMines();
        logCallback('❌ Игра окончена! Вы потратили все жизни.');
      }
      return;
    }

    // Начисление очков
    this.score += 10;
    logCallback(`✔ Ячейка (${x + 1}, ${y + 1}) открыта. Мин рядом: ${cell.neighborMines}. Счет: ${this.score}`);

    // Рекурсивное открытие пустых ячеек (Zero cascade)
    if (cell.neighborMines === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
            this.openCell(nx, ny, () => {});
          }
        }
      }
    }

    this.checkWinCondition(logCallback);
  }

  // 3. Установка флажка (Правый клик)
  public toggleFlag(x: number, y: number, logCallback: (msg: string) => void): void {
    if (this.isGameOver || this.isWin) return;
    const cell = this.grid[y][x];
    if (cell.isOpen) return;

    cell.isFlagged = !cell.isFlagged;
    this.flagsPlaced += cell.isFlagged ? 1 : -1;
    logCallback(`🚩 Флажок ${cell.isFlagged ? 'поставлен' : 'снят'} на (${x + 1}, ${y + 1}).`);
  }

  private revealAllMines(): void {
    this.grid.forEach((row) =>
      row.forEach((cell) => {
        if (cell.isMine) cell.isOpen = true;
      })
    );
  }

  private checkWinCondition(logCallback: (msg: string) => void): void {
    let unOpenedSafeCells = 0;
    this.grid.forEach((row) =>
      row.forEach((cell) => {
        if (!cell.isMine && !cell.isOpen) unOpenedSafeCells++;
      })
    );

    if (unOpenedSafeCells === 0) {
      this.isWin = true;
      logCallback('🎉 ПОБЕДА! Все безопасные ячейки очищены!');
    }
  }
}
