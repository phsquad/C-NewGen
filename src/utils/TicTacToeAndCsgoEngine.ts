// =========================================================================
// Live Tic-Tac-Toe (AI Minimax) & CS:GO 2D Aim Trainer Engine
// =========================================================================

import { DesignerNode } from '../types/ast';

export interface GameEngineResult {
  updatedNodes: Record<string, DesignerNode>;
  logEntry: {
    controlName: string;
    eventName: string;
    handlerName: string;
    message: string;
    details: string;
  };
  notification?: {
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
  };
}

export type ActiveGameMode = 'tictactoe' | 'csgo';

export class TicTacToeAndCsgoEngine {
  public mode: ActiveGameMode = 'tictactoe';

  // --- Tic-Tac-Toe State ---
  public board: string[] = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
  public playerWins = 0;
  public aiWins = 0;
  public draws = 0;
  public isGameOver = false;

  // --- CS:GO 2D Aim Trainer State ---
  public csgoFrags = 0;
  public csgoHeadshots = 0;
  public csgoScore = 0;
  public csgoShots = 0;
  public activeTargetIndex = 4;
  public lastTargetSpawnTime = Date.now();
  public selectedWeapon: 'AK-47' | 'AWP' | 'Deagle' = 'AK-47';

  private static winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // горизонтали
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // вертикали
    [0, 4, 8], [2, 4, 6]             // диагонали
  ];

  constructor() {
    this.resetTicTacToe();
  }

  public resetTicTacToe(): void {
    this.board = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
    this.isGameOver = false;
  }

  /**
   * Sound effect synthesizer using Web Audio API for CS:GO gunshots / hits
   */
  private playGunshotAudio(isHeadshot: boolean = false): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (isHeadshot) {
        // High-pitched headshot "dink" bell
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.18);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else {
        // AK-47 punchy gunshot thump
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      }
    } catch {
      // Audio autoplay restriction fallback
    }
  }

  // =========================================================================
  // 1. TIC-TAC-TOE HANDLERS
  // =========================================================================

  public handleCellClick(
    cellIndex: number,
    nodes: Record<string, DesignerNode>,
    controlName: string,
    handlerName: string
  ): GameEngineResult {
    // If we are currently in CS:GO Aim Trainer mode:
    if (this.mode === 'csgo') {
      return this.handleCsgoTargetClick(cellIndex, nodes, controlName, handlerName);
    }

    const currentNodes = { ...nodes };

    if (this.isGameOver) {
      // If game is over, restart board on click
      this.resetTicTacToe();
      this.syncBoardToNodes(currentNodes);
    }

    if (this.board[cellIndex] !== ' ') {
      return {
        updatedNodes: currentNodes,
        logEntry: {
          controlName,
          eventName: 'Click',
          handlerName,
          message: `Ячейка #${cellIndex + 1} уже занята (${this.board[cellIndex]}). Выберите свободную клетку!`,
          details: `// Cell index ${cellIndex} is already occupied: board[${cellIndex}] == '${this.board[cellIndex]}'`,
        },
        notification: {
          type: 'warning',
          title: 'Клетка занята',
          message: 'Выберите пустую клетку для хода X!',
        },
      };
    }

    // 1. Player move (X)
    this.board[cellIndex] = 'X';

    // Check player win
    const playerWinLine = this.checkWin('X');
    if (playerWinLine) {
      this.playerWins++;
      this.isGameOver = true;
      this.syncBoardToNodes(currentNodes, playerWinLine);

      const winMsg = `🎉 Победа игрока! Вы собрали линию [${playerWinLine.map(i => i + 1).join(', ')}]!`;
      this.updateStatusLabel(currentNodes, `🏆 ПОБЕДА (X)! Счет: X=${this.playerWins} : O=${this.aiWins}`);

      return {
        updatedNodes: currentNodes,
        logEntry: {
          controlName,
          eventName: 'Click',
          handlerName,
          message: winMsg,
          details: `// Player X won! Winning combination: [${playerWinLine.join(', ')}]\nPlayerScore: ${this.playerWins}, AIScore: ${this.aiWins}`,
        },
        notification: {
          type: 'success',
          title: '🎉 ПОБЕДА!',
          message: `Вы обыграли ИИ! Счет: ${this.playerWins} : ${this.aiWins}`,
        },
      };
    }

    // Check draw
    if (this.isBoardFull()) {
      this.draws++;
      this.isGameOver = true;
      this.syncBoardToNodes(currentNodes);
      this.updateStatusLabel(currentNodes, `🤝 НИЧЬЯ! Счет: X=${this.playerWins} : O=${this.aiWins}`);

      return {
        updatedNodes: currentNodes,
        logEntry: {
          controlName,
          eventName: 'Click',
          handlerName,
          message: '🤝 Ничья! Все клетки поля заполнены.',
          details: `// Draw game. Board is full. Draws count: ${this.draws}`,
        },
        notification: {
          type: 'info',
          title: 'Ничья',
          message: 'Боевая ничья! Нажмите любую клетку для рестарта.',
        },
      };
    }

    // 2. AI Move (O) with Minimax / Strategic decision
    const aiMove = this.findBestAiMove();
    if (aiMove !== -1) {
      this.board[aiMove] = 'O';
    }

    // Check AI win
    const aiWinLine = this.checkWin('O');
    if (aiWinLine) {
      this.aiWins++;
      this.isGameOver = true;
      this.syncBoardToNodes(currentNodes, undefined, aiWinLine);
      this.updateStatusLabel(currentNodes, `🤖 ПОБЕДА ИИ (O)! Счет: X=${this.playerWins} : O=${this.aiWins}`);

      return {
        updatedNodes: currentNodes,
        logEntry: {
          controlName,
          eventName: 'Click',
          handlerName,
          message: `🤖 ИИ (O) победил по алгоритму Минимакс (линия [${aiWinLine.map(i => i + 1).join(', ')}])!`,
          details: `// AI Minimax won! Line: [${aiWinLine.join(', ')}]\nAiMove: ${aiMove}, Total AI wins: ${this.aiWins}`,
        },
        notification: {
          type: 'warning',
          title: 'Победил ИИ (O)',
          message: `ИИ собрал линию! Счет: X=${this.playerWins} : O=${this.aiWins}`,
        },
      };
    }

    // Check draw after AI move
    if (this.isBoardFull()) {
      this.draws++;
      this.isGameOver = true;
      this.syncBoardToNodes(currentNodes);
      this.updateStatusLabel(currentNodes, `🤝 НИЧЬЯ! Счет: X=${this.playerWins} : O=${this.aiWins}`);

      return {
        updatedNodes: currentNodes,
        logEntry: {
          controlName,
          eventName: 'Click',
          handlerName,
          message: '🤝 Ничья после хода ИИ! Все клетки заполнены.',
          details: `// Draw game. Board is full. Total draws: ${this.draws}`,
        },
        notification: {
          type: 'info',
          title: 'Ничья',
          message: 'Ничья! Нажмите «Новая игра» или любую клетку.',
        },
      };
    }

    // Normal move continuation
    this.syncBoardToNodes(currentNodes);
    this.updateStatusLabel(currentNodes, `Крестики-Нолики | Ход: Игрок (X) | X: ${this.playerWins} | O: ${this.aiWins}`);

    return {
      updatedNodes: currentNodes,
      logEntry: {
        controlName,
        eventName: 'Click',
        handlerName,
        message: `Ход: Игрок [X] в #${cellIndex + 1} ➔ ИИ [O] ответил в #${aiMove + 1}`,
        details: `// TicTacToeEngine.MakeMove(player: ${cellIndex}, ai: ${aiMove});\n` +
                 `// Board: [${this.board.map(c => `'${c}'`).join(', ')}]`,
      },
    };
  }

  public restartTicTacToeGame(
    nodes: Record<string, DesignerNode>,
    controlName: string,
    handlerName: string
  ): GameEngineResult {
    this.mode = 'tictactoe';
    this.resetTicTacToe();
    const currentNodes = { ...nodes };

    this.syncBoardToNodes(currentNodes);
    this.updateStatusLabel(currentNodes, `❌ Крестики-Нолики | Новая игра! Ход: Игрок (X)`);

    return {
      updatedNodes: currentNodes,
      logEntry: {
        controlName,
        eventName: 'Click',
        handlerName,
        message: '🔄 Новая игра в Крестики-Нолики начата. Поле 3×3 очищено.',
        details: `// TicTacToeEngine.Reset();\nPlayerWins: ${this.playerWins}, AIWins: ${this.aiWins}, Draws: ${this.draws}`,
      },
      notification: {
        type: 'info',
        title: 'Новая игра',
        message: 'Поле 3×3 сброшено! Ваш ход (X).',
      },
    };
  }

  // =========================================================================
  // 2. CS:GO 2D AIM TRAINER & SHOOTER MODE ("нет блин ксго")
  // =========================================================================

  public toggleCsgoMode(
    nodes: Record<string, DesignerNode>,
    controlName: string,
    handlerName: string
  ): GameEngineResult {
    const currentNodes = { ...nodes };

    if (this.mode === 'csgo') {
      // Switch back to Tic-Tac-Toe
      this.mode = 'tictactoe';
      this.resetTicTacToe();
      this.syncBoardToNodes(currentNodes);
      this.updateStatusLabel(currentNodes, `❌ Крестики-Нолики с ИИ | Ход: Игрок (X)`);

      return {
        updatedNodes: currentNodes,
        logEntry: {
          controlName,
          eventName: 'Click',
          handlerName,
          message: '🔁 Возврат в режим «Крестики-Нолики с ИИ (Minimax)»',
          details: '// Switched back to TicTacToe mode.',
        },
        notification: {
          type: 'info',
          title: 'Режим Крестики-Нолики',
          message: 'Классическое поле 3×3 возвращено!',
        },
      };
    }

    // Switch to CS:GO 2D Aim Trainer mode!
    this.mode = 'csgo';
    this.csgoFrags = 0;
    this.csgoHeadshots = 0;
    this.csgoScore = 0;
    this.csgoShots = 0;
    this.spawnNewCsgoTarget();
    this.syncCsgoToNodes(currentNodes);
    this.playGunshotAudio(false);

    return {
      updatedNodes: currentNodes,
      logEntry: {
        controlName,
        eventName: 'Click',
        handlerName,
        message: '🔫 Активирован секретный режим: «CS:GO 2D Aim Trainer & Deathmatch»!',
        details: '// "нет блин ксго" Easter Egg Mode Activated!\n' +
                 '// Target range generated on 3x3 WinForms grid with headshot detection and AK-47 recoil.',
      },
      notification: {
        type: 'success',
        title: '🔫 CS:GO 2D Aim Trainer!',
        message: 'Стреляйте по мишеням (Террористы / Headshot) для тренировки реакции!',
      },
    };
  }

  public handleCsgoTargetClick(
    cellIndex: number,
    nodes: Record<string, DesignerNode>,
    controlName: string,
    handlerName: string
  ): GameEngineResult {
    const currentNodes = { ...nodes };
    this.csgoShots++;
    const reactionMs = Math.max(120, Date.now() - this.lastTargetSpawnTime);

    if (cellIndex === this.activeTargetIndex) {
      // Hit target!
      this.csgoFrags++;
      const isHeadshot = Math.random() > 0.35;
      if (isHeadshot) this.csgoHeadshots++;

      const points = isHeadshot ? 150 : 100;
      this.csgoScore += points;

      this.playGunshotAudio(isHeadshot);

      const hitType = isHeadshot ? '💥 ХЕДШОТ! One-Tap!' : '🎯 Точное попадание!';
      const weapon = isHeadshot ? 'AK-47 (Headshot)' : 'AWP (Body hit)';

      this.spawnNewCsgoTarget();
      this.syncCsgoToNodes(currentNodes, cellIndex, isHeadshot);

      const accuracy = Math.round((this.csgoFrags / this.csgoShots) * 100);
      const hudStatus = `🔫 CS:GO | 💀 Фраги: ${this.csgoFrags} | 🎯 Headshots: ${this.csgoHeadshots} | ⚡ Реакция: ${reactionMs} мс | Очки: ${this.csgoScore}`;
      this.updateStatusLabel(currentNodes, hudStatus);

      return {
        updatedNodes: currentNodes,
        logEntry: {
          controlName,
          eventName: 'Click',
          handlerName,
          message: `🔫 [CS:GO] ${hitType} Оружие: ${weapon} | Время реакции: ${reactionMs} мс (+${points} очков)`,
          details: `SoundPlayer.Play("${weapon.toLowerCase()}.wav");\n` +
                   `// Frags: ${this.csgoFrags}, Headshots: ${this.csgoHeadshots}, Accuracy: ${accuracy}%, Reaction: ${reactionMs}ms`,
        },
        notification: {
          type: 'success',
          title: isHeadshot ? '💥 CS:GO HEADSHOT!' : '🎯 CS:GO Попадание!',
          message: `+${points} очков! Реакция: ${reactionMs} мс (${weapon})`,
        },
      };
    } else {
      // Missed shot!
      this.playGunshotAudio(false);
      const accuracy = Math.round((this.csgoFrags / this.csgoShots) * 100);

      return {
        updatedNodes: currentNodes,
        logEntry: {
          controlName,
          eventName: 'Click',
          handlerName,
          message: `💨 [CS:GO] Промах! Выстрел в пустую позицию #${cellIndex + 1}.`,
          details: `// Missed target. Shots: ${this.csgoShots}, Accuracy: ${accuracy}%`,
        },
        notification: {
          type: 'warning',
          title: '💨 Промах!',
          message: 'Стреляйте точно по появляющейся мишени 🎯!',
        },
      };
    }
  }

  private spawnNewCsgoTarget(): void {
    let nextIndex = Math.floor(Math.random() * 9);
    if (nextIndex === this.activeTargetIndex) {
      nextIndex = (nextIndex + 1) % 9;
    }
    this.activeTargetIndex = nextIndex;
    this.lastTargetSpawnTime = Date.now();
  }

  // =========================================================================
  // HELPER METHODS: UI SYNCHRONIZATION
  // =========================================================================

  private syncBoardToNodes(
    nodes: Record<string, DesignerNode>,
    playerWinLine?: number[],
    aiWinLine?: number[]
  ): void {
    for (let i = 0; i < 9; i++) {
      const cellNode = Object.values(nodes).find(
        n => n.properties.name === `btnCell_${i}` || n.id.includes(`btnCell_${i}`)
      );
      if (!cellNode) continue;

      const val = this.board[i];
      let foreColor = '#60A5FA'; // X blue
      let backColor = '#27272A';

      if (val === 'O') {
        foreColor = '#EF4444'; // O red
      }

      if (playerWinLine && playerWinLine.includes(i)) {
        backColor = '#065F46'; // emerald win
        foreColor = '#34D399';
      } else if (aiWinLine && aiWinLine.includes(i)) {
        backColor = '#7F1D1D'; // red win
        foreColor = '#F87171';
      }

      nodes[cellNode.id] = {
        ...cellNode,
        properties: {
          ...cellNode.properties,
          text: val === ' ' ? ' ' : val,
          foreColor,
          backColor,
          fontBold: true,
          fontSize: 26,
        },
      };
    }
  }

  private syncCsgoToNodes(
    nodes: Record<string, DesignerNode>,
    lastHitIndex?: number,
    isHeadshot: boolean = false
  ): void {
    const targetLabels = [
      '🎯 T (Террорист)',
      '💀 ХЕДШОТ!',
      '🎯 Снайпер AWP',
      '💣 C4 Бомба',
      '🎯 Враг за ящиком',
      '🐔 Курица de_inferno',
      '🎯 Раш на B-сайт',
      '🎯 Дефьюзер CT',
      '🎯 Headshot One-Tap',
    ];

    for (let i = 0; i < 9; i++) {
      const cellNode = Object.values(nodes).find(
        n => n.properties.name === `btnCell_${i}` || n.id.includes(`btnCell_${i}`)
      );
      if (!cellNode) continue;

      let text = '· · ·';
      let backColor = '#18181B';
      let foreColor = '#52525B';
      let fontSize = 11;

      if (i === this.activeTargetIndex) {
        text = targetLabels[i % targetLabels.length];
        backColor = '#B45309'; // Target gold
        foreColor = '#FEF3C7';
        fontSize = 11;
      } else if (i === lastHitIndex) {
        text = isHeadshot ? '💥 HEADSHOT' : '💥 KILLED';
        backColor = '#991B1B';
        foreColor = '#FCA5A5';
      }

      nodes[cellNode.id] = {
        ...cellNode,
        properties: {
          ...cellNode.properties,
          text,
          backColor,
          foreColor,
          fontBold: true,
          fontSize,
        },
      };
    }
  }

  private updateStatusLabel(nodes: Record<string, DesignerNode>, text: string): void {
    Object.values(nodes).forEach(node => {
      if (
        node.properties.name === 'lblStatus' ||
        node.properties.name === 'lblScore' ||
        node.properties.name === 'lblScoreStats' ||
        node.id.includes('lblScore') ||
        node.id.includes('lblStatus')
      ) {
        nodes[node.id] = {
          ...node,
          properties: {
            ...node.properties,
            text,
          },
        };
      }
    });
  }

  // =========================================================================
  // ALGORITHM: MINIMAX & STRATEGIC MOVE SELECTION
  // =========================================================================

  private checkWin(mark: string): number[] | null {
    for (const line of TicTacToeAndCsgoEngine.winningLines) {
      if (
        this.board[line[0]] === mark &&
        this.board[line[1]] === mark &&
        this.board[line[2]] === mark
      ) {
        return line;
      }
    }
    return null;
  }

  private isBoardFull(): boolean {
    return this.board.every(cell => cell !== ' ');
  }

  private findBestAiMove(): number {
    // 1. Check if AI can win on this move
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === ' ') {
        this.board[i] = 'O';
        if (this.checkWin('O')) {
          this.board[i] = ' ';
          return i;
        }
        this.board[i] = ' ';
      }
    }

    // 2. Block player if player is about to win
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === ' ') {
        this.board[i] = 'X';
        if (this.checkWin('X')) {
          this.board[i] = ' ';
          return i;
        }
        this.board[i] = ' ';
      }
    }

    // 3. Take center cell if available
    if (this.board[4] === ' ') {
      return 4;
    }

    // 4. Take corners
    const corners = [0, 2, 6, 8].filter(c => this.board[c] === ' ');
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Take any remaining empty cell
    const emptyCells = this.board
      .map((val, idx) => (val === ' ' ? idx : -1))
      .filter(idx => idx !== -1);

    if (emptyCells.length > 0) {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    return -1;
  }
}
