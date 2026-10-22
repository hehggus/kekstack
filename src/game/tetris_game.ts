import {
  BoardState,
  Cell,
  LevelState,
  Position,
  ScoreState,
  Tetromino,
  TetrominoType,
  TSpinType,
} from './models';
import { CollisionSystem } from './collision_system';
import { RotationSystem } from './rotation_system';
import { ScoringSystem } from './scoring_system';
import { LevelSystem } from './level_system';
import { PieceManager } from './piece_manager';
import { GameMode, GAME_MODES } from './game_modes';

export interface ActionSplash {
  id: string;
  text: string;
  subText?: string;
  actionType: 'tetris' | 'tspin' | 'b2b' | 'perfectClear' | 'combo' | 'normal';
}

export type GameEvent =
  | { type: 'move'; direction: 'left' | 'right' }
  | { type: 'rotate'; direction: 'cw' | 'ccw' | '180' }
  | { type: 'softDrop' }
  | { type: 'hardDrop'; distance: number }
  | { type: 'hold'; piece: TetrominoType }
  | { type: 'spawn'; piece: TetrominoType }
  | { type: 'lock'; piece: TetrominoType; cells: Position[] }
  | {
      type: 'lineClear';
      lines: number;
      isTetris: boolean;
      isTSpin: boolean;
      isTSpinMini: boolean;
      isBackToBack: boolean;
      isPerfectClear: boolean;
      clearedIndices: number[];
      actionSplash?: ActionSplash;
    }
  | { type: 'levelUp'; level: number }
  | {
      type: 'gameOver';
      score: number;
      lines: number;
      pieceCount: number;
      isVictory?: boolean;
      mode: GameMode;
      reason?: 'blockOut' | 'lockOut' | 'timeUp' | 'goalReached';
    };

interface PendingLineClear {
  clearedBoard: BoardState;
  linesCleared: number;
  clearedIndices: number[];
  isTetris: boolean;
  tSpin: TSpinType;
  isBackToBack: boolean;
  isPerfectClear: boolean;
  actionSplash?: ActionSplash;
}

/**
 * Esports-grade precision TetrisGame following Tetris Guideline, Tetris Wiki, Hard Drop Wiki,
 * and behavior in TETR.IO, Jstris, and Apotris.
 *
 * Implements:
 * - 7-bag randomizer
 * - SRS wall kicks for CW (90°), CCW (270°), and isolated 180° (Flip)
 * - Infinity Lock Delay (500ms duration, 15 move/rotation resets on floor)
 * - Mathematical O-piece rotation and lock delay stall (Jstris style)
 * - Airborne lock delay cancellation
 * - Soft drop floor safety: soft drop on floor does NOT eat lock delay or force instant lock
 * - Block Out Game Over detection at spawn checking hidden buffer zone (skyline)
 * - Delta-Time Line Clear Delay (LCD / ARE)
 * - Action Splash metadata generation (Tetris, T-Spin, B2B, Combo, Perfect Clear)
 */
export class TetrisGame {
  public board: BoardState;
  public activePiece: Tetromino | null = null;
  public holdPiece: TetrominoType | null = null;
  public canHold: boolean = true;
  public scoreState: ScoreState;
  public levelState: LevelState;
  public pieceCount: number = 0;
  public isGameOver: boolean = false;
  public isPaused: boolean = false;
  public isVictory: boolean = false;
  public gameMode: GameMode = 'marathon';

  public collision: CollisionSystem;
  get CollisionSystem(): CollisionSystem { return this.collision; }
  public rotation: RotationSystem;
  private scoring: ScoringSystem;
  private levelSystem: LevelSystem;
  private pieceManager: PieceManager;

  // Lock Delay (Tetris Guideline Infinity Rule)
  public lockDelayDuration: number = 500;
  public maxLockResets: number = 15;
  public lockDelayTimer: number = 0;
  public lockResetCount: number = 0;
  public isLockPending: boolean = false;

  // Aliases for compatibility
  get lockDelayMs(): number { return this.lockDelayDuration; }
  set lockDelayMs(val: number) { this.lockDelayDuration = val; }
  get lockTimer(): number { return this.lockDelayTimer; }
  set lockTimer(val: number) { this.lockDelayTimer = val; }
  get lockResets(): number { return this.lockResetCount; }
  set lockResets(val: number) { this.lockResetCount = val; }

  // Line Clear Delay (LCD / ARE)
  public lineClearDelayMs: number = 250;
  public isLineClearing: boolean = false;
  public lineClearTimer: number = 0;
  public clearingRows: number[] = [];
  private pendingClear: PendingLineClear | null = null;

  private lowestRow: number = 0;
  private lastMoveWasRotation: boolean = false;
  private lastKickIndex: number = 0;

  public readonly boardRows: number = 20;
  public readonly boardCols: number = 10;

  private eventListeners: ((event: GameEvent) => void)[] = [];

  constructor(public readonly startLevel: number = 1, mode: GameMode = 'marathon') {
    this.gameMode = mode;
    this.collision = new CollisionSystem();
    this.rotation = new RotationSystem(this.collision);
    this.scoring = new ScoringSystem();
    this.levelSystem = new LevelSystem(10);
    this.pieceManager = new PieceManager();

    this.board = BoardState.empty(this.boardRows, this.boardCols);
    this.levelState = this.levelSystem.initialState(startLevel);
    this.scoreState = new ScoreState();

    this.spawnNext();
  }

  addEventListener(listener: (event: GameEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private emit(event: GameEvent): void {
    for (const l of this.eventListeners) {
      try {
        l(event);
      } catch (err) {
        console.error(err);
      }
    }
  }

  reset(startLevel: number = this.startLevel, mode?: GameMode): void {
    if (mode) this.gameMode = mode;
    this.board = BoardState.empty(this.boardRows, this.boardCols);
    this.levelState = this.levelSystem.initialState(startLevel);
    this.scoreState = new ScoreState();
    this.pieceManager = new PieceManager();
    this.activePiece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.pieceCount = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.isVictory = false;
    this.lockDelayTimer = 0;
    this.lockResetCount = 0;
    this.isLockPending = false;
    this.lowestRow = 0;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;
    this.isLineClearing = false;
    this.lineClearTimer = 0;
    this.clearingRows = [];
    this.pendingClear = null;

    this.spawnNext();
  }

  get ghostPiece(): Tetromino | null {
    if (!this.activePiece) return null;
    return this.collision.ghostPiece(this.activePiece, this.board);
  }

  get nextQueue(): TetrominoType[] {
    return this.pieceManager.peek(5);
  }

  /**
   * Spawns next piece according to Tetris Guideline:
   * - Centered horizontally
   * - In hidden rows 21 and 22 (skyline buffer rows -1 and -2), except 'I' which spawns in row 0
   * - Block Out Check: if spawn cells are occupied by locked blocks (including in buffer), game over!
   */
  spawnNext(): boolean {
    if (this.isGameOver) return false;

    const nextType = this.pieceManager.next();
    const spawned = Tetromino.spawn(nextType, this.boardCols);

    // Collision check BEFORE piece is made active / displayed
    // No automatic push-up or wall-kick: if cells are occupied, trigger Block Out Game Over!
    if (this.collision.hasCollision(spawned, this.board)) {
      if (this.gameMode === 'zen') {
        this.clearZenTopRows();
        if (this.collision.hasCollision(spawned, this.board)) {
          this.board = BoardState.empty(this.boardRows, this.boardCols);
        }
      } else {
        this.isGameOver = true;
        this.activePiece = spawned;
        this.emit({
          type: 'gameOver',
          score: this.scoreState.score,
          lines: this.levelState.linesCleared,
          pieceCount: this.pieceCount,
          isVictory: false,
          mode: this.gameMode,
          reason: 'blockOut',
        });
        return false;
      }
    }

    this.activePiece = spawned;
    this.canHold = true;
    // Reset Lock Delay parameters for the new piece
    this.lockDelayTimer = 0;
    this.lockResetCount = 0;
    this.isLockPending = false;
    this.lowestRow = spawned.position.row;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;

    this.emit({ type: 'spawn', piece: nextType });
    return true;
  }

  private clearZenTopRows(): void {
    const newGrid = this.board.grid.map((r, rowIdx) =>
      rowIdx < 8 ? Array.from({ length: this.boardCols }, () => Cell.empty()) : [...r]
    );
    this.board = new BoardState(this.boardRows, this.boardCols, newGrid);
  }

  moveLeft(): boolean {
    if (this.isGameOver || this.isPaused || !this.activePiece || this.isLineClearing) return false;
    if (this.collision.canMove(this.activePiece, this.board, 0, -1)) {
      this.activePiece = this.activePiece.copyWith({
        position: new Position(this.activePiece.position.row, this.activePiece.position.col - 1),
      });
      this.lastMoveWasRotation = false;
      this.onPieceMoved(false);
      this.emit({ type: 'move', direction: 'left' });
      return true;
    }
    return false;
  }

  moveRight(): boolean {
    if (this.isGameOver || this.isPaused || !this.activePiece || this.isLineClearing) return false;
    if (this.collision.canMove(this.activePiece, this.board, 0, 1)) {
      this.activePiece = this.activePiece.copyWith({
        position: new Position(this.activePiece.position.row, this.activePiece.position.col + 1),
      });
      this.lastMoveWasRotation = false;
      this.onPieceMoved(false);
      this.emit({ type: 'move', direction: 'right' });
      return true;
    }
    return false;
  }

  rotateCW(): boolean {
    if (this.isGameOver || this.isPaused || !this.activePiece || this.isLineClearing) return false;
    const result = this.rotation.tryRotate(this.activePiece, this.board, true);
    if (result) {
      this.activePiece = result.piece;
      this.lastMoveWasRotation = true;
      this.lastKickIndex = result.kickIndex;
      this.onPieceMoved(false);
      this.emit({ type: 'rotate', direction: 'cw' });
      return true;
    }
    return false;
  }

  rotateCCW(): boolean {
    if (this.isGameOver || this.isPaused || !this.activePiece || this.isLineClearing) return false;
    const result = this.rotation.tryRotate(this.activePiece, this.board, false);
    if (result) {
      this.activePiece = result.piece;
      this.lastMoveWasRotation = true;
      this.lastKickIndex = result.kickIndex;
      this.onPieceMoved(false);
      this.emit({ type: 'rotate', direction: 'ccw' });
      return true;
    }
    return false;
  }

  /**
   * Esports 180° Rotation (Flip)
   * Executes in a single tick with dedicated 180° SRS wall kicks.
   */
  rotate180(): boolean {
    if (this.isGameOver || this.isPaused || !this.activePiece || this.isLineClearing) return false;
    const result = this.rotation.tryRotate180(this.activePiece, this.board);
    if (result) {
      this.activePiece = result.piece;
      this.lastMoveWasRotation = true;
      this.lastKickIndex = result.kickIndex;
      this.onPieceMoved(false);
      this.emit({ type: 'rotate', direction: '180' });
      return true;
    }
    return false;
  }

  /**
   * Soft Drop (1 cell down for 1 point).
   * In Guideline / Apotris rules: if the piece is already grounded, soft drop cannot move down
   * and returns false WITHOUT eating or accelerating the 500ms lockDelayTimer.
   */
  softDrop(): boolean {
    if (this.isGameOver || this.isPaused || !this.activePiece || this.isLineClearing) return false;
    if (this.collision.canMove(this.activePiece, this.board, 1, 0)) {
      this.activePiece = this.activePiece.copyWith({
        position: new Position(this.activePiece.position.row + 1, this.activePiece.position.col),
      });
      this.scoreState = this.scoring.onSoftDrop(this.scoreState, 1);
      this.lastMoveWasRotation = false;
      this.onPieceMoved(true);
      this.emit({ type: 'softDrop' });
      return true;
    } else {
      // Resting on floor or blocks: downward movement from soft drop is ignored;
      // Lock delay timer is NOT consumed by soft drop!
      return false;
    }
  }

  /**
   * Hard Drop (instant drop to ghost position + immediate lock).
   */
  hardDrop(): number {
    if (this.isGameOver || this.isPaused || !this.activePiece || this.isLineClearing) return 0;

    const ghost = this.ghostPiece!;
    const distance = ghost.position.row - this.activePiece.position.row;

    this.activePiece = ghost;
    this.scoreState = this.scoring.onHardDrop(this.scoreState, distance);
    this.emit({ type: 'hardDrop', distance });
    this.lockActivePiece();
    return distance;
  }

  hold(): boolean {
    if (this.isGameOver || this.isPaused || !this.activePiece || !this.canHold || this.isLineClearing) return false;

    const currentType = this.activePiece.type;

    if (this.holdPiece === null) {
      this.holdPiece = currentType;
      this.spawnNext();
    } else {
      const toSpawn = this.holdPiece;
      this.holdPiece = currentType;
      const spawned = Tetromino.spawn(toSpawn, this.boardCols);

      if (this.collision.hasCollision(spawned, this.board)) {
        if (this.gameMode === 'zen') {
          this.clearZenTopRows();
        } else {
          this.isGameOver = true;
          this.emit({
            type: 'gameOver',
            score: this.scoreState.score,
            lines: this.levelState.linesCleared,
            pieceCount: this.pieceCount,
            isVictory: false,
            mode: this.gameMode,
            reason: 'blockOut',
          });
          return false;
        }
      }

      this.activePiece = spawned;
      this.lockDelayTimer = 0;
      this.lockResetCount = 0;
      this.isLockPending = false;
      this.lowestRow = spawned.position.row;
      this.lastMoveWasRotation = false;
      this.lastKickIndex = 0;
      this.emit({ type: 'spawn', piece: toSpawn });
    }

    this.canHold = false;
    this.emit({ type: 'hold', piece: currentType });
    return true;
  }

  /**
   * Handles lock delay bookkeeping after any valid move or rotation (Apotris / Guideline Infinity Rule).
   * Successful moves/rotations on the floor reset lockDelayTimer up to maxLockResets times.
   */
  private onPieceMoved(isVerticalMove: boolean = false): void {
    if (!this.activePiece) return;

    // 1. Reaching a new lowest row gives fresh set of resets and resets lock timer
    if (this.activePiece.position.row > this.lowestRow) {
      this.lowestRow = this.activePiece.position.row;
      this.lockResetCount = 0;
      this.lockDelayTimer = 0;
    }

    // 2. If piece is airborne (has space below), cancel lock delay countdown
    if (!this.isGrounded) {
      this.isLockPending = false;
      this.lockDelayTimer = 0;
      return;
    }

    // 3. Piece IS ON THE FLOOR / BLOCKS:
    this.isLockPending = true;
    if (!isVerticalMove) {
      // Horizontal move or rotation on floor resets lockDelayTimer back to 0 up to maxLockResets
      if (this.lockResetCount < this.maxLockResets) {
        this.lockDelayTimer = 0;
        this.lockResetCount++;
      }
    }
    // If isVerticalMove is true, lockDelayTimer is untouched and NOT reduced!
  }

  lockActivePiece(): boolean {
    if (!this.activePiece || this.isLineClearing) return false;

    const piece = this.activePiece;
    const lockedCells = [...piece.cells];
    const tSpin = this.lastMoveWasRotation
      ? this.rotation.detectTSpin(piece, this.board, this.lastKickIndex)
      : TSpinType.none;

    const prevB2B = this.scoreState.backToBack;
    const newBoard = this.board.withPieceLocked(piece);
    const { board: clearedBoard, linesCleared, clearedIndices } = newBoard.clearLines();

    this.pieceCount++;
    this.emit({ type: 'lock', piece: piece.type, cells: lockedCells });

    // Reset lock delay state upon locking
    this.lockDelayTimer = 0;
    this.lockResetCount = 0;
    this.isLockPending = false;

    // Check lock out (all blocks above visible area)
    if (this.collision.isLockOut(piece)) {
      if (this.gameMode === 'zen') {
        this.clearZenTopRows();
      } else {
        this.isGameOver = true;
        this.activePiece = null;
        this.emit({
          type: 'gameOver',
          score: this.scoreState.score,
          lines: this.levelState.linesCleared,
          pieceCount: this.pieceCount,
          isVictory: false,
          mode: this.gameMode,
          reason: 'lockOut',
        });
        return true;
      }
    }

    // Determine Difficult clear (Tetris or T-Spin with lines)
    const isTetris = linesCleared === 4;
    const isTSpin = tSpin !== TSpinType.none;
    const isTSpinMini = tSpin === TSpinType.mini;
    const isDifficult = isTetris || isTSpin;
    const isBackToBack = isDifficult && prevB2B;
    const perfectClear = clearedBoard.isCompletelyEmpty && linesCleared > 0;

    // Compile Action Splash metadata
    let actionSplash: ActionSplash | undefined = undefined;
    if (linesCleared > 0 || isTSpin) {
      const splashId = `${Date.now()}_${Math.random()}`;
      if (perfectClear) {
        actionSplash = {
          id: splashId,
          text: 'PERFECT CLEAR',
          actionType: 'perfectClear',
        };
      } else if (isTSpin) {
        let text = 'T-SPIN';
        if (isTSpinMini) text = linesCleared > 0 ? `T-SPIN MINI ${linesCleared === 2 ? 'DOUBLE' : 'SINGLE'}` : 'T-SPIN MINI';
        else if (linesCleared === 3) text = 'T-SPIN TRIPLE';
        else if (linesCleared === 2) text = 'T-SPIN DOUBLE';
        else if (linesCleared === 1) text = 'T-SPIN SINGLE';

        actionSplash = {
          id: splashId,
          text: isBackToBack ? `B2B ${text}` : text,
          subText: isBackToBack ? 'BACK-TO-BACK' : undefined,
          actionType: isBackToBack ? 'b2b' : 'tspin',
        };
      } else if (isTetris) {
        actionSplash = {
          id: splashId,
          text: isBackToBack ? 'B2B TETRIS' : 'TETRIS',
          subText: isBackToBack ? 'BACK-TO-BACK' : undefined,
          actionType: isBackToBack ? 'b2b' : 'tetris',
        };
      } else if (this.scoreState.combo >= 2) {
        actionSplash = {
          id: splashId,
          text: `COMBO x${this.scoreState.combo + 1}`,
          actionType: 'combo',
        };
      }
    }

    if (linesCleared > 0) {
      if (this.lineClearDelayMs > 0) {
        // Enter Line Clear Delay (LCD / ARE)
        // Keep activePiece stamped on board while full rows flash
        this.board = newBoard;
        this.activePiece = null;
        this.isLineClearing = true;
        this.lineClearTimer = this.lineClearDelayMs;
        this.clearingRows = [...clearedIndices];
        this.pendingClear = {
          clearedBoard,
          linesCleared,
          clearedIndices,
          isTetris,
          tSpin,
          isBackToBack,
          isPerfectClear: perfectClear,
          actionSplash,
        };
        return true;
      } else {
        // Instant line clear without delay
        this.resolveLineClear({
          clearedBoard,
          linesCleared,
          clearedIndices,
          isTetris,
          tSpin,
          isBackToBack,
          isPerfectClear: perfectClear,
          actionSplash,
        });
        return true;
      }
    } else {
      // 0 lines cleared (piece locked without clearing lines, e.g. T-Spin 0)
      this.board = newBoard;
      this.scoreState = this.scoring.onLinesCleared(
        this.scoreState,
        0,
        this.levelState.level,
        tSpin,
        false
      );
      this.spawnNext();
      return true;
    }
  }

  private resolveLineClear(data: PendingLineClear): void {
    const {
      clearedBoard,
      linesCleared,
      clearedIndices,
      isTetris,
      tSpin,
      isBackToBack,
      isPerfectClear,
      actionSplash,
    } = data;

    this.board = clearedBoard;
    this.clearingRows = [];

    // Scoring & Leveling
    this.scoreState = this.scoring.onLinesCleared(
      this.scoreState,
      linesCleared,
      this.levelState.level,
      tSpin,
      isPerfectClear
    );

    const prevLevel = this.levelState.level;
    this.levelState = this.levelSystem.onLinesCleared(this.levelState, linesCleared);
    if (this.levelState.level > prevLevel) {
      this.emit({ type: 'levelUp', level: this.levelState.level });
    }

    this.emit({
      type: 'lineClear',
      lines: linesCleared,
      isTetris,
      isTSpin: tSpin !== TSpinType.none,
      isTSpinMini: tSpin === TSpinType.mini,
      isBackToBack,
      isPerfectClear,
      clearedIndices,
      actionSplash,
    });

    // Check Sprint goal (40 lines)
    if (this.gameMode === 'sprint' && this.levelState.linesCleared >= 40) {
      this.isGameOver = true;
      this.isVictory = true;
      this.emit({
        type: 'gameOver',
        score: this.scoreState.score,
        lines: this.levelState.linesCleared,
        pieceCount: this.pieceCount,
        isVictory: true,
        mode: this.gameMode,
        reason: 'goalReached',
      });
      return;
    }

    // Check Marathon goal (150 lines)
    if (this.gameMode === 'marathon' && this.levelState.linesCleared >= 150) {
      this.isGameOver = true;
      this.isVictory = true;
      this.emit({
        type: 'gameOver',
        score: this.scoreState.score,
        lines: this.levelState.linesCleared,
        pieceCount: this.pieceCount,
        isVictory: true,
        mode: this.gameMode,
        reason: 'goalReached',
      });
      return;
    }

    this.spawnNext();
  }

  endDueToTimeUp(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isVictory = true;
    this.emit({
      type: 'gameOver',
      score: this.scoreState.score,
      lines: this.levelState.linesCleared,
      pieceCount: this.pieceCount,
      isVictory: true,
      mode: this.gameMode,
      reason: 'timeUp',
    });
  }

  /**
   * Main game tick: processes line clear delay and lock delay.
   * Completely separated from gravity & soft drop (Apotris style).
   */
  update(deltaMs: number): void {
    if (this.isGameOver || this.isPaused) return;

    // 1. Process Line Clear Delay (LCD / ARE)
    if (this.isLineClearing) {
      this.lineClearTimer -= deltaMs;
      if (this.lineClearTimer <= 0) {
        this.isLineClearing = false;
        if (this.pendingClear) {
          const clearData = this.pendingClear;
          this.pendingClear = null;
          this.resolveLineClear(clearData);
        }
      }
      return; // Do not process gravity or lock delay while lines are dissolving
    }

    if (!this.activePiece) return;

    // 2. Process Independent Lock Delay (when piece is grounded)
    if (this.isGrounded) {
      this.isLockPending = true;
      this.lockDelayTimer += deltaMs;
      if (this.lockDelayTimer >= this.lockDelayDuration) {
        this.lockActivePiece();
      }
    } else {
      this.isLockPending = false;
      this.lockDelayTimer = 0;
    }
  }

  checkCollision(direction: 'down' | 'left' | 'right'): boolean {
    if (!this.activePiece) return true;
    const dRow = direction === 'down' ? 1 : 0;
    const dCol = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
    return !this.collision.canMove(this.activePiece, this.board, dRow, dCol);
  }

  get isGrounded(): boolean {
    if (!this.activePiece) return false;
    return !this.collision.canMove(this.activePiece, this.board, 1, 0);
  }
}
