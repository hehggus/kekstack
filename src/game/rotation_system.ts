import { BoardState, Position, Tetromino, TetrominoType, TSpinType } from './models';
import { CollisionSystem } from './collision_system';

/**
 * Super Rotation System (SRS) implementation
 * - CW (90°) and CCW (270°) standard SRS wall kick tables
 * - 180° rotation (Flip) with competitive wall kicks (TETR.IO / Jstris standard)
 * - T-Spin & T-Spin Mini detection via the 3-corner rule and pointing-side protrusion tests
 */
export class RotationSystem {
  constructor(private readonly collision: CollisionSystem) {}

  rotateCW(piece: Tetromino, board: BoardState): Tetromino | null {
    return this.tryRotate(piece, board, true)?.piece ?? null;
  }

  rotateCCW(piece: Tetromino, board: BoardState): Tetromino | null {
    return this.tryRotate(piece, board, false)?.piece ?? null;
  }

  rotate180(piece: Tetromino, board: BoardState): Tetromino | null {
    return this.tryRotate180(piece, board)?.piece ?? null;
  }

  tryRotate(
    piece: Tetromino,
    board: BoardState,
    clockwise: boolean
  ): { piece: Tetromino; kickIndex: number } | null {
    const rotated = clockwise ? piece.rotatedCW() : piece.rotatedCCW();
    const kicks = this.getKicks(piece.type, piece.rotation, clockwise);

    for (let i = 0; i < kicks.length; i++) {
      const kicked = rotated.copyWith({
        position: new Position(
          rotated.position.row + kicks[i].row,
          rotated.position.col + kicks[i].col
        ),
      });
      if (!this.collision.hasCollision(kicked, board)) {
        return { piece: kicked, kickIndex: i };
      }
    }
    return null;
  }

  tryRotate180(
    piece: Tetromino,
    board: BoardState
  ): { piece: Tetromino; kickIndex: number } | null {
    const rotated = piece.rotated180();
    const kicks = this.get180Kicks(piece.type, piece.rotation);

    for (let i = 0; i < kicks.length; i++) {
      const kicked = rotated.copyWith({
        position: new Position(
          rotated.position.row + kicks[i].row,
          rotated.position.col + kicks[i].col
        ),
      });
      if (!this.collision.hasCollision(kicked, board)) {
        return { piece: kicked, kickIndex: i };
      }
    }
    return null;
  }

  /**
   * Guideline 3-Corner Rule for T-Spin Detection
   * Evaluates the 4 corners of the 3x3 T-bounding box around center (1, 1).
   *
   * A corner is considered occupied if:
   * - It is out of board bounds (floor or left/right walls), OR
   * - It is occupied by an existing filled cell on the board (or buffer zone).
   *
   * If at least 3 corners are occupied:
   * - If both corners on the pointing side (front corners) are occupied: FULL T-Spin.
   * - If one front corner is open, but rotation used the 5th kick (kickIndex === 4): FULL T-Spin.
   * - Otherwise: T-Spin Mini.
   */
  detectTSpin(piece: Tetromino, board: BoardState, kickIndex: number = 0): TSpinType {
    if (piece.type !== TetrominoType.T) return TSpinType.none;

    const occupied = (dr: number, dc: number): boolean => {
      const r = piece.position.row + dr;
      const c = piece.position.col + dc;
      if (r < 0) {
        // Upper skyline buffer: occupied only if an existing block is locked there
        return board.cellAt(r, c).filled;
      }
      if (r >= board.rows || c < 0 || c >= board.cols) {
        // Board floor or side walls count as solid obstacles
        return true;
      }
      return board.cellAt(r, c).filled;
    };

    const topLeft = occupied(0, 0);
    const topRight = occupied(0, 2);
    const bottomLeft = occupied(2, 0);
    const bottomRight = occupied(2, 2);

    const count = [topLeft, topRight, bottomLeft, bottomRight].filter(Boolean).length;
    if (count < 3) return TSpinType.none;

    let frontA: boolean;
    let frontB: boolean;

    switch (piece.rotation % 4) {
      case 0: // Pointing Up (protrusion at top)
        frontA = topLeft;
        frontB = topRight;
        break;
      case 1: // Pointing Right
        frontA = topRight;
        frontB = bottomRight;
        break;
      case 2: // Pointing Down
        frontA = bottomLeft;
        frontB = bottomRight;
        break;
      default: // Pointing Left (3)
        frontA = topLeft;
        frontB = bottomLeft;
        break;
    }

    // Guideline rule: if both front corners are occupied, or if the 5th kick (test 5, index 4) was used:
    if ((frontA && frontB) || kickIndex === 4) {
      return TSpinType.full;
    }
    return TSpinType.mini;
  }

  private getKicks(type: TetrominoType, fromRotation: number, cw: boolean): Position[] {
    if (type === TetrominoType.I) return this.iKicks(fromRotation, cw);
    if (type === TetrominoType.O) return [new Position(0, 0)];
    return this.jlstzKicks(fromRotation, cw);
  }

  private get180Kicks(type: TetrominoType, fromRotation: number): Position[] {
    if (type === TetrominoType.O) return [new Position(0, 0)];
    if (type === TetrominoType.I) return this.i180Kicks(fromRotation);
    return this.jlstz180Kicks(fromRotation);
  }

  // Standard SRS 90° CW/CCW kick data for J, L, S, T, Z
  private jlstzKicks(from: number, cw: boolean): Position[] {
    const data: Record<string, Position[]> = {
      '0→1': [new Position(0, 0), new Position(0, -1), new Position(1, -1), new Position(-2, 0), new Position(-2, -1)],
      '1→0': [new Position(0, 0), new Position(0, 1), new Position(-1, 1), new Position(2, 0), new Position(2, 1)],
      '1→2': [new Position(0, 0), new Position(0, 1), new Position(-1, 1), new Position(2, 0), new Position(2, 1)],
      '2→1': [new Position(0, 0), new Position(0, -1), new Position(1, -1), new Position(-2, 0), new Position(-2, -1)],
      '2→3': [new Position(0, 0), new Position(0, 1), new Position(1, 1), new Position(-2, 0), new Position(-2, 1)],
      '3→2': [new Position(0, 0), new Position(0, -1), new Position(-1, -1), new Position(2, 0), new Position(2, -1)],
      '3→0': [new Position(0, 0), new Position(0, -1), new Position(-1, -1), new Position(2, 0), new Position(2, -1)],
      '0→3': [new Position(0, 0), new Position(0, 1), new Position(1, 1), new Position(-2, 0), new Position(-2, 1)],
    };
    const to = cw ? (from + 1) % 4 : (from + 3) % 4;
    return data[`${from}→${to}`] ?? [new Position(0, 0)];
  }

  // Standard SRS 90° CW/CCW kick data for I
  private iKicks(from: number, cw: boolean): Position[] {
    const data: Record<string, Position[]> = {
      '0→1': [new Position(0, 0), new Position(0, -2), new Position(0, 1), new Position(1, -2), new Position(-2, 1)],
      '1→0': [new Position(0, 0), new Position(0, 2), new Position(0, -1), new Position(-1, 2), new Position(2, -1)],
      '1→2': [new Position(0, 0), new Position(0, -1), new Position(0, 2), new Position(-2, -1), new Position(1, 2)],
      '2→1': [new Position(0, 0), new Position(0, 1), new Position(0, -2), new Position(2, 1), new Position(-1, -2)],
      '2→3': [new Position(0, 0), new Position(0, 2), new Position(0, -1), new Position(-1, 2), new Position(2, -1)],
      '3→2': [new Position(0, 0), new Position(0, -2), new Position(0, 1), new Position(1, -2), new Position(-2, 1)],
      '3→0': [new Position(0, 0), new Position(0, 1), new Position(0, -2), new Position(2, 1), new Position(-1, -2)],
      '0→3': [new Position(0, 0), new Position(0, -1), new Position(0, 2), new Position(-2, -1), new Position(1, 2)],
    };
    const to = cw ? (from + 1) % 4 : (from + 3) % 4;
    return data[`${from}→${to}`] ?? [new Position(0, 0)];
  }

  // Competitive 180° kick data for J, L, S, T, Z (TETR.IO / Jstris standard)
  private jlstz180Kicks(from: number): Position[] {
    const data: Record<string, Position[]> = {
      // 0→2: (0,0), up 1, up 1 right 1, up 1 left 1, right 1, left 1
      '0→2': [
        new Position(0, 0),
        new Position(-1, 0),
        new Position(-1, 1),
        new Position(-1, -1),
        new Position(0, 1),
        new Position(0, -1),
      ],
      // 2→0: (0,0), down 1, down 1 left 1, down 1 right 1, left 1, right 1
      '2→0': [
        new Position(0, 0),
        new Position(1, 0),
        new Position(1, -1),
        new Position(1, 1),
        new Position(0, -1),
        new Position(0, 1),
      ],
      // 1→3: (0,0), right 1, up 2 right 1, up 1 right 1, up 2, up 1
      '1→3': [
        new Position(0, 0),
        new Position(0, 1),
        new Position(-2, 1),
        new Position(-1, 1),
        new Position(-2, 0),
        new Position(-1, 0),
      ],
      // 3→1: (0,0), left 1, up 2 left 1, up 1 left 1, up 2, up 1
      '3→1': [
        new Position(0, 0),
        new Position(0, -1),
        new Position(-2, -1),
        new Position(-1, -1),
        new Position(-2, 0),
        new Position(-1, 0),
      ],
    };
    const to = (from + 2) % 4;
    return data[`${from}→${to}`] ?? [new Position(0, 0)];
  }

  // Competitive 180° kick data for I
  private i180Kicks(from: number): Position[] {
    const data: Record<string, Position[]> = {
      '0→2': [
        new Position(0, 0),
        new Position(-1, 0),
        new Position(1, 0),
        new Position(0, -1),
        new Position(0, 1),
      ],
      '2→0': [
        new Position(0, 0),
        new Position(1, 0),
        new Position(-1, 0),
        new Position(0, 1),
        new Position(0, -1),
      ],
      '1→3': [
        new Position(0, 0),
        new Position(0, 1),
        new Position(0, -1),
        new Position(-1, 0),
        new Position(1, 0),
      ],
      '3→1': [
        new Position(0, 0),
        new Position(0, -1),
        new Position(0, 1),
        new Position(1, 0),
        new Position(-1, 0),
      ],
    };
    const to = (from + 2) % 4;
    return data[`${from}→${to}`] ?? [new Position(0, 0)];
  }
}
