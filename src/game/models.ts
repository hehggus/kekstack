/**
 * Faithful TypeScript port of tetris_engine models
 * (Position, TetrominoType, TSpinType, Tetromino, BoardState, LevelState, ScoreState)
 * Strictly adhering to Tetris Guideline & Super Rotation System (SRS).
 */

export enum TetrominoType {
  I = 0,
  O = 1,
  T = 2,
  S = 3,
  Z = 4,
  J = 5,
  L = 6,
}

export const TETROMINO_TYPE_NAMES: Record<TetrominoType, string> = {
  [TetrominoType.I]: 'I',
  [TetrominoType.O]: 'O',
  [TetrominoType.T]: 'T',
  [TetrominoType.S]: 'S',
  [TetrominoType.Z]: 'Z',
  [TetrominoType.J]: 'J',
  [TetrominoType.L]: 'L',
};

export enum TSpinType {
  none = 'none',
  mini = 'mini',
  full = 'full',
}

export class Position {
  constructor(public readonly row: number, public readonly col: number) {}

  equals(other: Position): boolean {
    return this.row === other.row && this.col === other.col;
  }
}

/**
 * Super Rotation System (SRS) Shape Matrices
 *
 * Each tetromino rotation state (0, 1, 2, 3) is a 4-cell coordinate list relative to piece origin.
 *
 * For "O" (Cube):
 * To strictly follow competitive guidelines (Jstris/TETR.IO/Apotris) and enable in-place O-Spin
 * lock delay stalls on the floor, the 4 coordinates across rotation states 0, 1, 2, 3 are mathematically
 * unique, representing the 90° clockwise rotation of the 2x2 matrix around its center (0.5, 0.5):
 * State 0: (0,0), (0,1), (1,0), (1,1)
 * State 1: (0,1), (1,1), (0,0), (1,0)
 * State 2: (1,1), (1,0), (0,1), (0,0)
 * State 3: (1,0), (0,0), (1,1), (0,1)
 */
export const SHAPES: Record<TetrominoType, Position[][]> = {
  [TetrominoType.I]: [
    // 0: Horizontal bar on 2nd row of 4x4 matrix
    [new Position(1, 0), new Position(1, 1), new Position(1, 2), new Position(1, 3)],
    // 1: Vertical column on 3rd col of 4x4 matrix
    [new Position(0, 2), new Position(1, 2), new Position(2, 2), new Position(3, 2)],
    // 2: Horizontal bar on 3rd row of 4x4 matrix
    [new Position(2, 0), new Position(2, 1), new Position(2, 2), new Position(2, 3)],
    // 3: Vertical column on 2nd col of 4x4 matrix
    [new Position(0, 1), new Position(1, 1), new Position(2, 1), new Position(3, 1)],
  ],
  [TetrominoType.O]: [
    // State 0 (Spawn / North)
    [new Position(0, 0), new Position(0, 1), new Position(1, 0), new Position(1, 1)],
    // State 1 (East / 90° CW rotation around 2x2 matrix center (0.5, 0.5))
    [new Position(0, 1), new Position(1, 1), new Position(0, 0), new Position(1, 0)],
    // State 2 (South / 180° rotation)
    [new Position(1, 1), new Position(1, 0), new Position(0, 1), new Position(0, 0)],
    // State 3 (West / 270° CW rotation)
    [new Position(1, 0), new Position(0, 0), new Position(1, 1), new Position(0, 1)],
  ],
  [TetrominoType.T]: [
    // 0: Spawn (pointing up)
    [new Position(0, 1), new Position(1, 0), new Position(1, 1), new Position(1, 2)],
    // 1: 90° CW (pointing right)
    [new Position(0, 1), new Position(1, 1), new Position(1, 2), new Position(2, 1)],
    // 2: 180° (pointing down)
    [new Position(1, 0), new Position(1, 1), new Position(1, 2), new Position(2, 1)],
    // 3: 270° CW / 90° CCW (pointing left)
    [new Position(0, 1), new Position(1, 0), new Position(1, 1), new Position(2, 1)],
  ],
  [TetrominoType.S]: [
    // 0: Spawn
    [new Position(0, 1), new Position(0, 2), new Position(1, 0), new Position(1, 1)],
    // 1: 90° CW
    [new Position(0, 1), new Position(1, 1), new Position(1, 2), new Position(2, 2)],
    // 2: 180°
    [new Position(1, 1), new Position(1, 2), new Position(2, 0), new Position(2, 1)],
    // 3: 270° CW
    [new Position(0, 0), new Position(1, 0), new Position(1, 1), new Position(2, 1)],
  ],
  [TetrominoType.Z]: [
    // 0: Spawn
    [new Position(0, 0), new Position(0, 1), new Position(1, 1), new Position(1, 2)],
    // 1: 90° CW
    [new Position(0, 2), new Position(1, 1), new Position(1, 2), new Position(2, 1)],
    // 2: 180°
    [new Position(1, 0), new Position(1, 1), new Position(2, 1), new Position(2, 2)],
    // 3: 270° CW
    [new Position(0, 1), new Position(1, 0), new Position(1, 1), new Position(2, 0)],
  ],
  [TetrominoType.J]: [
    // 0: Spawn
    [new Position(0, 0), new Position(1, 0), new Position(1, 1), new Position(1, 2)],
    // 1: 90° CW
    [new Position(0, 1), new Position(0, 2), new Position(1, 1), new Position(2, 1)],
    // 2: 180°
    [new Position(1, 0), new Position(1, 1), new Position(1, 2), new Position(2, 2)],
    // 3: 270° CW
    [new Position(0, 1), new Position(1, 1), new Position(2, 0), new Position(2, 1)],
  ],
  [TetrominoType.L]: [
    // 0: Spawn
    [new Position(0, 2), new Position(1, 0), new Position(1, 1), new Position(1, 2)],
    // 1: 90° CW
    [new Position(0, 1), new Position(1, 1), new Position(2, 1), new Position(2, 2)],
    // 2: 180°
    [new Position(1, 0), new Position(1, 1), new Position(1, 2), new Position(2, 0)],
    // 3: 270° CW
    [new Position(0, 0), new Position(0, 1), new Position(1, 1), new Position(2, 1)],
  ],
};

export class Tetromino {
  constructor(
    public readonly type: TetrominoType,
    public readonly rotation: number = 0,
    public readonly position: Position
  ) {}

  copyWith(updates: { type?: TetrominoType; rotation?: number; position?: Position }): Tetromino {
    return new Tetromino(
      updates.type ?? this.type,
      updates.rotation ?? this.rotation,
      updates.position ?? this.position
    );
  }

  get cells(): Position[] {
    const shape = SHAPES[this.type][this.rotation % 4];
    return shape.map((p) => new Position(this.position.row + p.row, this.position.col + p.col));
  }

  rotatedCW(): Tetromino {
    return this.copyWith({ rotation: (this.rotation + 1) % 4 });
  }

  rotatedCCW(): Tetromino {
    return this.copyWith({ rotation: (this.rotation + 3) % 4 });
  }

  rotated180(): Tetromino {
    return this.copyWith({ rotation: (this.rotation + 2) % 4 });
  }

  static spawn(type: TetrominoType, boardCols: number = 10): Tetromino {
    // Tetris Guideline Spawning:
    // 1. Centered horizontally: X indices 3–5 (I occupies 3–6, O occupies 4–5, others occupy 3–5).
    // 2. Vertically in hidden rows 21 and 22 (row -1 and row -2 above visible row 0).
    //    Exception: "I" (line) spawns horizontally in the 20th row (row 0).
    if (type === TetrominoType.I) {
      // Shape rotation 0 has blocks at row 1, cols 0..3
      // With position.row = -1, cells are at row 0 (20th row) and cols 3, 4, 5, 6
      return new Tetromino(type, 0, new Position(-1, 3));
    }

    if (type === TetrominoType.O) {
      // Shape rotation 0 has blocks at rows 0..1, cols 0..1
      // With position.row = -2, cells are at row -2 (22nd row), -1 (21st row) and cols 4, 5
      return new Tetromino(type, 0, new Position(-2, 4));
    }

    // T, S, Z, J, L: 3-wide
    // Shape rotation 0 has blocks at row 0 and row 1, cols 0..2
    // With position.row = -2, row 0 -> -2 (22nd row), row 1 -> -1 (21st row), cols 3..5
    return new Tetromino(type, 0, new Position(-2, 3));
  }
}

export class Cell {
  constructor(public readonly filled: boolean, public readonly type: TetrominoType | null) {}

  static empty(): Cell {
    return new Cell(false, null);
  }

  static of(type: TetrominoType): Cell {
    return new Cell(true, type);
  }
}

export class BoardState {
  public readonly buffer: Map<string, Cell>;

  constructor(
    public readonly rows: number,
    public readonly cols: number,
    public readonly grid: Cell[][],
    buffer?: Map<string, Cell>
  ) {
    this.buffer = buffer ?? new Map();
  }

  static empty(rows: number = 20, cols: number = 10): BoardState {
    const grid: Cell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Cell.empty())
    );
    return new BoardState(rows, cols, grid, new Map());
  }

  cellAt(row: number, col: number): Cell {
    if (col < 0 || col >= this.cols) {
      return Cell.empty();
    }
    if (row >= 0 && row < this.rows) {
      return this.grid[row][col];
    }
    if (row < 0) {
      return this.buffer.get(`${row},${col}`) ?? Cell.empty();
    }
    return Cell.empty();
  }

  withPieceLocked(piece: Tetromino): BoardState {
    const newGrid = this.grid.map((r) => [...r]);
    const newBuffer = new Map(this.buffer);

    for (const pos of piece.cells) {
      if (pos.col >= 0 && pos.col < this.cols) {
        if (pos.row >= 0 && pos.row < this.rows) {
          newGrid[pos.row][pos.col] = Cell.of(piece.type);
        } else if (pos.row < 0) {
          newBuffer.set(`${pos.row},${pos.col}`, Cell.of(piece.type));
        }
      }
    }
    return new BoardState(this.rows, this.cols, newGrid, newBuffer);
  }

  clearLines(): { board: BoardState; linesCleared: number; clearedIndices: number[] } {
    const remainingRows: Cell[][] = [];
    const clearedIndices: number[] = [];

    for (let r = 0; r < this.rows; r++) {
      const isFull = this.grid[r].every((cell) => cell.filled);
      if (isFull) {
        clearedIndices.push(r);
      } else {
        remainingRows.push(this.grid[r]);
      }
    }

    const linesCleared = clearedIndices.length;
    if (linesCleared === 0) {
      return { board: this, linesCleared: 0, clearedIndices: [] };
    }

    const newRows: Cell[][] = [];
    for (let i = 0; i < linesCleared; i++) {
      newRows.push(Array.from({ length: this.cols }, () => Cell.empty()));
    }
    const finalGrid = [...newRows, ...remainingRows];

    return {
      board: new BoardState(this.rows, this.cols, finalGrid, new Map(this.buffer)),
      linesCleared,
      clearedIndices,
    };
  }

  get isCompletelyEmpty(): boolean {
    return this.grid.every((row) => row.every((c) => !c.filled));
  }
}

export class LevelState {
  constructor(
    public readonly level: number = 1,
    public readonly linesCleared: number = 0,
    public readonly linesUntilNextLevel: number = 10
  ) {}

  copyWith(updates: { level?: number; linesCleared?: number; linesUntilNextLevel?: number }): LevelState {
    return new LevelState(
      updates.level ?? this.level,
      updates.linesCleared ?? this.linesCleared,
      updates.linesUntilNextLevel ?? this.linesUntilNextLevel
    );
  }

  get gravityMs(): number {
    const base = 1000;
    const reduction = (this.level - 1) * 80;
    return Math.max(50, Math.min(base, base - reduction));
  }
}

export class ScoreState {
  constructor(
    public readonly score: number = 0,
    public readonly combo: number = 0,
    public readonly backToBack: boolean = false
  ) {}

  copyWith(updates: { score?: number; combo?: number; backToBack?: boolean }): ScoreState {
    return new ScoreState(
      updates.score ?? this.score,
      updates.combo ?? this.combo,
      updates.backToBack ?? this.backToBack
    );
  }
}
