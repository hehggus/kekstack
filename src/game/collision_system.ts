import { BoardState, Position, Tetromino } from './models';

/**
 * Direct port of CollisionSystem from tetris_engine/lib/engine/collision_system.dart
 */
export class CollisionSystem {
  hasCollision(piece: Tetromino, board: BoardState): boolean {
    for (const pos of piece.cells) {
      if (this.outOfBounds(pos, board)) return true;
      if (board.cellAt(pos.row, pos.col).filled) return true;
    }
    return false;
  }

  private outOfBounds(pos: Position, board: BoardState): boolean {
    // Columns must be strictly within board boundaries
    if (pos.col < 0 || pos.col >= board.cols) return true;
    // Row cannot penetrate below the floor
    if (pos.row >= board.rows) return true;
    // Rows above the board (row < 0) are in the hidden skyline buffer zone (permitted in Guideline)
    return false;
  }

  ghostPiece(piece: Tetromino, board: BoardState): Tetromino {
    let ghost = piece;
    while (true) {
      const dropped = ghost.copyWith({
        position: new Position(ghost.position.row + 1, ghost.position.col),
      });
      if (this.hasCollision(dropped, board)) return ghost;
      ghost = dropped;
    }
  }

  canMove(piece: Tetromino, board: BoardState, dRow: number, dCol: number): boolean {
    const moved = piece.copyWith({
      position: new Position(piece.position.row + dRow, piece.position.col + dCol),
    });
    return !this.hasCollision(moved, board);
  }

  isLockOut(piece: Tetromino): boolean {
    return piece.cells.every((p) => p.row < 0);
  }
}
