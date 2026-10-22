import { TetrominoType } from './models';

/**
 * Direct port of PieceManager from tetris_engine/lib/engine/piece_manager.dart
 * Uses standard 7-bag randomizer.
 */
export class PieceManager {
  private bag: TetrominoType[] = [];

  next(): TetrominoType {
    if (this.bag.length === 0) {
      this.refill();
    }
    return this.bag.shift()!;
  }

  peek(count: number): TetrominoType[] {
    while (this.bag.length < count) {
      this.refill();
    }
    return this.bag.slice(0, count);
  }

  seed(types: TetrominoType[]): void {
    this.bag = [...types];
  }

  private refill(): void {
    const batch: TetrominoType[] = [
      TetrominoType.I,
      TetrominoType.O,
      TetrominoType.T,
      TetrominoType.S,
      TetrominoType.Z,
      TetrominoType.J,
      TetrominoType.L,
    ];

    // Fisher-Yates shuffle
    for (let i = batch.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [batch[i], batch[j]] = [batch[j], batch[i]];
    }

    this.bag.push(...batch);
  }
}
