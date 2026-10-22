/**
 * Full Tetris Guideline Engine
 * Implements 7-bag randomizer, SRS wall kicks, lock delay, hold,
 * scoring, T-spin detection, combo, B2B, and ghost piece.
 */

import {
  BOARD_WIDTH,
  BOARD_VISIBLE_HEIGHT,
  BOARD_BUFFER_HEIGHT,
  BOARD_TOTAL_HEIGHT,
  TetrominoType,
  RotationState,
  TETROMINO_SHAPES,
  JLSTZ_WALL_KICKS,
  I_WALL_KICKS,
  POINTS_SINGLE,
  POINTS_DOUBLE,
  POINTS_TRIPLE,
  POINTS_TETRIS,
  POINTS_TSPIN_MINI,
  POINTS_TSPIN_SINGLE,
  POINTS_TSPIN_DOUBLE,
  POINTS_TSPIN_TRIPLE,
  B2B_MULTIPLIER,
  SOFT_DROP_POINTS,
  HARD_DROP_POINTS,
  GRAVITY_BY_LEVEL,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
} from './constants';

export type BoardCell = TetrominoType | null;
export type GameBoard = BoardCell[][];

export interface ActivePiece {
  type: TetrominoType;
  matrix: number[][];
  x: number;
  y: number;
  rotation: RotationState;
  lowestY: number;
  lockResets: number;
  lastMoveWasRotation: boolean;
  lastKickWasMiniCandidate: boolean;
}

export interface LineClearResult {
  linesCleared: number;
  clearedRowIndices: number[];
  isTetris: boolean;
  isTspin: boolean;
  isTspinMini: boolean;
  isBackToBack: boolean;
  isPerfectClear: boolean;
  combo: number;
  pointsAdded: number;
}

export type GameEvent =
  | { type: 'move'; direction: 'left' | 'right' }
  | { type: 'rotate'; direction: 'cw' | 'ccw' | '180' }
  | { type: 'softDrop' }
  | { type: 'hardDrop'; distance: number }
  | { type: 'hold'; piece: TetrominoType }
  | { type: 'lock'; piece: TetrominoType }
  | { type: 'lineClear'; result: LineClearResult }
  | { type: 'levelUp'; level: number }
  | { type: 'gameOver'; score: number; lines: number; pieceCount: number };

export interface EngineState {
  board: GameBoard;
  activePiece: ActivePiece | null;
  ghostY: number | null;
  holdPiece: TetrominoType | null;
  canHold: boolean;
  nextQueue: TetrominoType[];
  score: number;
  level: number;
  lines: number;
  pieceCount: number;
  combo: number;
  backToBack: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  lockTimer: number; // accumulated time on ground in ms
  isOnGround: boolean;
}

export class TetrisEngine {
  public state: EngineState;
  private bag: TetrominoType[] = [];
  private eventListeners: ((event: GameEvent) => void)[] = [];
  public startingLevel: number = 0;

  constructor(startingLevel: number = 0) {
    this.startingLevel = startingLevel;
    this.state = this.createInitialState(startingLevel);
    this.spawnNextPiece();
  }

  public addEventListener(listener: (event: GameEvent) => void) {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private emit(event: GameEvent) {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in event listener:', err);
      }
    }
  }

  public reset(startingLevel?: number) {
    if (startingLevel !== undefined) {
      this.startingLevel = startingLevel;
    }
    this.bag = [];
    this.state = this.createInitialState(this.startingLevel);
    this.spawnNextPiece();
  }

  private createInitialState(startingLevel: number): EngineState {
    const board: GameBoard = Array.from({ length: BOARD_TOTAL_HEIGHT }, () =>
      Array.from({ length: BOARD_WIDTH }, () => null)
    );

    const initialNext: TetrominoType[] = [];
    while (initialNext.length < 7) {
      initialNext.push(...this.generateBag());
    }

    return {
      board,
      activePiece: null,
      ghostY: null,
      holdPiece: null,
      canHold: true,
      nextQueue: initialNext,
      score: 0,
      level: startingLevel,
      lines: 0,
      pieceCount: 0,
      combo: -1,
      backToBack: false,
      isGameOver: false,
      isPaused: false,
      lockTimer: 0,
      isOnGround: false,
    };
  }

  /**
   * 7-Bag Randomizer
   */
  private generateBag(): TetrominoType[] {
    const pieces: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
  }

  private getNextFromQueue(): TetrominoType {
    if (this.state.nextQueue.length < 7) {
      this.state.nextQueue.push(...this.generateBag());
    }
    return this.state.nextQueue.shift()!;
  }

  public spawnNextPiece(): boolean {
    if (this.state.isGameOver) return false;

    const nextType = this.getNextFromQueue();
    const matrix = TETROMINO_SHAPES[nextType].map((row) => [...row]);
    const size = matrix.length;

    // Center piece at top of board (in the buffer zone: BOARD_BUFFER_HEIGHT = 4)
    // Guideline: piece appears at row 3 or 4
    const spawnX = Math.floor((BOARD_WIDTH - size) / 2);
    // Buffer is 4 rows high (0, 1, 2, 3), visible rows start at 4
    // For guideline, I and O spawn in rows 2-3 or 3-4, others in 2-3
    const spawnY = nextType === 'I' ? 2 : 2;

    const piece: ActivePiece = {
      type: nextType,
      matrix,
      x: spawnX,
      y: spawnY,
      rotation: 0,
      lowestY: spawnY,
      lockResets: 0,
      lastMoveWasRotation: false,
      lastKickWasMiniCandidate: false,
    };

    if (this.checkCollision(piece.matrix, piece.x, piece.y)) {
      // Immediate block out = Game Over
      this.state.isGameOver = true;
      this.state.activePiece = piece;
      this.emit({
        type: 'gameOver',
        score: this.state.score,
        lines: this.state.lines,
        pieceCount: this.state.pieceCount,
      });
      return false;
    }

    this.state.activePiece = piece;
    this.state.canHold = true;
    this.state.lockTimer = 0;
    this.state.isOnGround = this.checkCollision(piece.matrix, piece.x, piece.y + 1);
    this.updateGhost();
    return true;
  }

  /**
   * Check if a piece matrix at (x, y) collides with walls or existing placed blocks
   */
  public checkCollision(matrix: number[][], x: number, y: number): boolean {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const boardX = x + c;
          const boardY = y + r;

          // Wall boundaries
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_TOTAL_HEIGHT) {
            return true;
          }

          // Top boundary is open for buffer, but < 0 is out of bounds
          if (boardY < 0) {
            return true;
          }

          // Existing placed block
          if (this.state.board[boardY][boardX] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public updateGhost() {
    if (!this.state.activePiece) {
      this.state.ghostY = null;
      return;
    }
    const piece = this.state.activePiece;
    let gy = piece.y;
    while (!this.checkCollision(piece.matrix, piece.x, gy + 1)) {
      gy++;
    }
    this.state.ghostY = gy;
  }

  /**
   * Move active piece horizontally
   */
  public move(deltaX: -1 | 1): boolean {
    if (this.state.isGameOver || this.state.isPaused || !this.state.activePiece) return false;

    const piece = this.state.activePiece;
    const newX = piece.x + deltaX;

    if (!this.checkCollision(piece.matrix, newX, piece.y)) {
      piece.x = newX;
      piece.lastMoveWasRotation = false;

      // Reset lock timer if on ground and under lock reset limit
      this.handleLockDelayReset();
      this.state.isOnGround = this.checkCollision(piece.matrix, piece.x, piece.y + 1);
      this.updateGhost();
      this.emit({ type: 'move', direction: deltaX === -1 ? 'left' : 'right' });
      return true;
    }
    return false;
  }

  /**
   * Rotate matrix by 90 degrees clockwise
   */
  private rotateMatrixCW(matrix: number[][]): number[][] {
    const N = matrix.length;
    const result: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  }

  /**
   * Rotate matrix by 90 degrees counter-clockwise
   */
  private rotateMatrixCCW(matrix: number[][]): number[][] {
    const N = matrix.length;
    const result: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[N - 1 - c][r] = matrix[r][c];
      }
    }
    return result;
  }

  /**
   * Rotate matrix 180 degrees
   */
  private rotateMatrix180(matrix: number[][]): number[][] {
    return this.rotateMatrixCW(this.rotateMatrixCW(matrix));
  }

  /**
   * Rotate active piece with Super Rotation System (SRS)
   */
  public rotate(direction: 'cw' | 'ccw' | '180'): boolean {
    if (this.state.isGameOver || this.state.isPaused || !this.state.activePiece) return false;

    const piece = this.state.activePiece;
    if (piece.type === 'O') return false; // O piece doesn't need rotation

    const currentRotation = piece.rotation;
    let targetRotation: RotationState;
    let newMatrix: number[][];

    if (direction === 'cw') {
      targetRotation = ((currentRotation + 1) % 4) as RotationState;
      newMatrix = this.rotateMatrixCW(piece.matrix);
    } else if (direction === 'ccw') {
      targetRotation = ((currentRotation + 3) % 4) as RotationState;
      newMatrix = this.rotateMatrixCCW(piece.matrix);
    } else {
      targetRotation = ((currentRotation + 2) % 4) as RotationState;
      newMatrix = this.rotateMatrix180(piece.matrix);
    }

    const kickKey = `${currentRotation}->${targetRotation}`;
    const kickTable = piece.type === 'I' ? I_WALL_KICKS : JLSTZ_WALL_KICKS;
    const kicks = kickTable[kickKey] || [[0, 0]];

    for (let i = 0; i < kicks.length; i++) {
      const [kx, ky] = kicks[i];
      // Note: in standard Tetris guideline kick tables, +y is UP, so we subtract ky to move in matrix space (where +y is DOWN)
      const testX = piece.x + kx;
      const testY = piece.y - ky;

      if (!this.checkCollision(newMatrix, testX, testY)) {
        piece.matrix = newMatrix;
        piece.x = testX;
        piece.y = testY;
        piece.rotation = targetRotation;
        piece.lastMoveWasRotation = true;
        piece.lastKickWasMiniCandidate = i === kicks.length - 1; // 5th kick candidate for mini T-spin

        this.handleLockDelayReset();
        this.state.isOnGround = this.checkCollision(piece.matrix, piece.x, piece.y + 1);
        this.updateGhost();
        this.emit({ type: 'rotate', direction });
        return true;
      }
    }

    return false;
  }

  /**
   * Soft Drop (1 cell down)
   */
  public softDrop(): boolean {
    if (this.state.isGameOver || this.state.isPaused || !this.state.activePiece) return false;

    const piece = this.state.activePiece;
    if (!this.checkCollision(piece.matrix, piece.x, piece.y + 1)) {
      piece.y += 1;
      this.state.score += SOFT_DROP_POINTS;
      piece.lastMoveWasRotation = false;

      if (piece.y > piece.lowestY) {
        piece.lowestY = piece.y;
        piece.lockResets = 0;
        this.state.lockTimer = 0;
      }

      this.state.isOnGround = this.checkCollision(piece.matrix, piece.x, piece.y + 1);
      this.emit({ type: 'softDrop' });
      return true;
    } else {
      // Reached floor
      this.state.isOnGround = true;
      return false;
    }
  }

  /**
   * Hard Drop (instant drop to ghost position & immediate lock)
   */
  public hardDrop(): number {
    if (this.state.isGameOver || this.state.isPaused || !this.state.activePiece) return 0;

    const piece = this.state.activePiece;
    const startY = piece.y;
    let dropDist = 0;

    while (!this.checkCollision(piece.matrix, piece.x, piece.y + 1)) {
      piece.y += 1;
      dropDist += 1;
    }

    this.state.score += dropDist * HARD_DROP_POINTS;
    piece.lowestY = piece.y;
    this.emit({ type: 'hardDrop', distance: dropDist });
    this.lockPiece();
    return dropDist;
  }

  /**
   * Hold piece mechanism
   */
  public hold(): boolean {
    if (this.state.isGameOver || this.state.isPaused || !this.state.activePiece || !this.state.canHold) {
      return false;
    }

    const currentType = this.state.activePiece.type;

    if (this.state.holdPiece === null) {
      this.state.holdPiece = currentType;
      this.spawnNextPiece();
    } else {
      const held = this.state.holdPiece;
      this.state.holdPiece = currentType;

      const matrix = TETROMINO_SHAPES[held].map((row) => [...row]);
      const size = matrix.length;
      const spawnX = Math.floor((BOARD_WIDTH - size) / 2);
      const spawnY = held === 'I' ? 2 : 2;

      const piece: ActivePiece = {
        type: held,
        matrix,
        x: spawnX,
        y: spawnY,
        rotation: 0,
        lowestY: spawnY,
        lockResets: 0,
        lastMoveWasRotation: false,
        lastKickWasMiniCandidate: false,
      };

      if (this.checkCollision(piece.matrix, piece.x, piece.y)) {
        this.state.isGameOver = true;
        this.emit({
          type: 'gameOver',
          score: this.state.score,
          lines: this.state.lines,
          pieceCount: this.state.pieceCount,
        });
        return false;
      }

      this.state.activePiece = piece;
      this.state.lockTimer = 0;
      this.state.isOnGround = this.checkCollision(piece.matrix, piece.x, piece.y + 1);
      this.updateGhost();
    }

    this.state.canHold = false;
    this.emit({ type: 'hold', piece: currentType });
    return true;
  }

  /**
   * Handle lock delay reset on valid move or rotation
   */
  private handleLockDelayReset() {
    const piece = this.state.activePiece;
    if (!piece) return;

    if (piece.y > piece.lowestY) {
      piece.lowestY = piece.y;
      piece.lockResets = 0;
      this.state.lockTimer = 0;
    } else if (piece.lockResets < MAX_LOCK_RESETS) {
      piece.lockResets += 1;
      this.state.lockTimer = 0;
    }
  }

  /**
   * Lock active piece into the board and trigger line clear / spawn next
   */
  public lockPiece() {
    const piece = this.state.activePiece;
    if (!piece) return;

    const lockedType = piece.type;
    const isTspin = this.detectTspin(piece);
    const isTspinMini = isTspin && piece.lastKickWasMiniCandidate;

    // Stamp piece onto board
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] !== 0) {
          const bx = piece.x + c;
          const by = piece.y + r;
          if (by >= 0 && by < BOARD_TOTAL_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
            this.state.board[by][bx] = piece.type;
          }
        }
      }
    }

    this.state.pieceCount += 1;
    this.emit({ type: 'lock', piece: lockedType });

    // Check lock out (all blocks above visible area)
    const visibleStart = BOARD_BUFFER_HEIGHT;
    let hasVisibleBlock = false;
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] !== 0 && piece.y + r >= visibleStart) {
          hasVisibleBlock = true;
          break;
        }
      }
    }

    if (!hasVisibleBlock) {
      this.state.isGameOver = true;
      this.state.activePiece = null;
      this.emit({
        type: 'gameOver',
        score: this.state.score,
        lines: this.state.lines,
        pieceCount: this.state.pieceCount,
      });
      return;
    }

    // Process line clears
    this.clearLines(isTspin, isTspinMini);

    // Spawn next piece
    this.spawnNextPiece();
  }

  /**
   * Detect T-Spin using 3-corner rule
   */
  private detectTspin(piece: ActivePiece): boolean {
    if (piece.type !== 'T' || !piece.lastMoveWasRotation) return false;

    // T-piece center is at (piece.x + 1, piece.y + 1)
    const cx = piece.x + 1;
    const cy = piece.y + 1;

    // The 4 corners around T center:
    const corners = [
      [cx - 1, cy - 1], // top-left
      [cx + 1, cy - 1], // top-right
      [cx - 1, cy + 1], // bottom-left
      [cx + 1, cy + 1], // bottom-right
    ];

    let occupiedCorners = 0;
    for (const [x, y] of corners) {
      if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_TOTAL_HEIGHT) {
        occupiedCorners++;
      } else if (y >= 0 && this.state.board[y][x] !== null) {
        occupiedCorners++;
      }
    }

    return occupiedCorners >= 3;
  }

  /**
   * Clear complete rows and calculate score
   */
  private clearLines(isTspin: boolean, isTspinMini: boolean) {
    const fullRows: number[] = [];

    for (let y = BOARD_TOTAL_HEIGHT - 1; y >= 0; y--) {
      let isRowFull = true;
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (this.state.board[y][x] === null) {
          isRowFull = false;
          break;
        }
      }
      if (isRowFull) {
        fullRows.push(y);
      }
    }

    const linesCount = fullRows.length;

    if (linesCount > 0) {
      // Remove full rows and shift down
      for (const row of fullRows) {
        this.state.board.splice(row, 1);
        this.state.board.unshift(Array.from({ length: BOARD_WIDTH }, () => null));
      }

      this.state.lines += linesCount;
      const newLevel = Math.floor(this.state.lines / 10) + this.startingLevel;
      if (newLevel > this.state.level) {
        this.state.level = newLevel;
        this.emit({ type: 'levelUp', level: newLevel });
      }

      this.state.combo += 1;

      // Check perfect clear (all visible rows empty)
      let isPerfectClear = true;
      for (let y = BOARD_BUFFER_HEIGHT; y < BOARD_TOTAL_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          if (this.state.board[y][x] !== null) {
            isPerfectClear = false;
            break;
          }
        }
        if (!isPerfectClear) break;
      }

      // Calculate score points
      let basePoints = 0;
      const isTetris = linesCount === 4;
      const isDifficult = isTetris || isTspin;

      if (isTspin) {
        if (isTspinMini) {
          basePoints = POINTS_TSPIN_MINI * (this.state.level + 1);
        } else if (linesCount === 1) {
          basePoints = POINTS_TSPIN_SINGLE * (this.state.level + 1);
        } else if (linesCount === 2) {
          basePoints = POINTS_TSPIN_DOUBLE * (this.state.level + 1);
        } else if (linesCount === 3) {
          basePoints = POINTS_TSPIN_TRIPLE * (this.state.level + 1);
        }
      } else {
        if (linesCount === 1) basePoints = POINTS_SINGLE * (this.state.level + 1);
        else if (linesCount === 2) basePoints = POINTS_DOUBLE * (this.state.level + 1);
        else if (linesCount === 3) basePoints = POINTS_TRIPLE * (this.state.level + 1);
        else if (linesCount === 4) basePoints = POINTS_TETRIS * (this.state.level + 1);
      }

      let b2bBonus = false;
      if (isDifficult) {
        if (this.state.backToBack) {
          basePoints = Math.floor(basePoints * B2B_MULTIPLIER);
          b2bBonus = true;
        }
        this.state.backToBack = true;
      } else {
        this.state.backToBack = false;
      }

      // Combo bonus
      let comboBonus = 0;
      if (this.state.combo > 0) {
        comboBonus = 50 * this.state.combo * (this.state.level + 1);
      }

      // Perfect clear bonus
      let perfectClearBonus = 0;
      if (isPerfectClear) {
        if (linesCount === 1) perfectClearBonus = 800 * (this.state.level + 1);
        else if (linesCount === 2) perfectClearBonus = 1200 * (this.state.level + 1);
        else if (linesCount === 3) perfectClearBonus = 1800 * (this.state.level + 1);
        else if (linesCount === 4) perfectClearBonus = 2000 * (this.state.level + 1);
      }

      const totalAdded = basePoints + comboBonus + perfectClearBonus;
      this.state.score += totalAdded;

      const clearResult: LineClearResult = {
        linesCleared: linesCount,
        clearedRowIndices: fullRows,
        isTetris,
        isTspin,
        isTspinMini,
        isBackToBack: b2bBonus,
        isPerfectClear,
        combo: this.state.combo,
        pointsAdded: totalAdded,
      };

      this.emit({ type: 'lineClear', result: clearResult });
    } else {
      this.state.combo = -1;
    }
  }

  /**
   * Gravity tick called by game loop with delta time
   */
  public update(deltaMs: number) {
    if (this.state.isGameOver || this.state.isPaused || !this.state.activePiece) return;

    const piece = this.state.activePiece;
    const isAtBottom = this.checkCollision(piece.matrix, piece.x, piece.y + 1);
    this.state.isOnGround = isAtBottom;

    if (isAtBottom) {
      // Accumulate lock delay
      this.state.lockTimer += deltaMs;
      if (this.state.lockTimer >= LOCK_DELAY_MS) {
        this.lockPiece();
      }
    } else {
      this.state.lockTimer = 0;
    }
  }

  /**
   * Get current gravity interval for level
   */
  public getGravityInterval(): number {
    const lvl = Math.min(this.state.level, GRAVITY_BY_LEVEL.length - 1);
    return GRAVITY_BY_LEVEL[lvl];
  }
}
