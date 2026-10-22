import { LevelState } from './models';

/**
 * Direct port of LevelSystem from tetris_engine/lib/engine/level_system.dart
 */
export class LevelSystem {
  constructor(public readonly linesPerLevel: number = 10) {
    if (linesPerLevel <= 0) {
      throw new Error('linesPerLevel must be positive');
    }
  }

  initialState(startLevel: number = 1): LevelState {
    return new LevelState(startLevel, 0, this.linesPerLevel);
  }

  onLinesCleared(state: LevelState, linesCleared: number): LevelState {
    if (linesCleared === 0) return state;

    let level = state.level;
    let until = state.linesUntilNextLevel - linesCleared;
    while (until <= 0) {
      level++;
      until += this.linesPerLevel;
    }

    return new LevelState(level, state.linesCleared + linesCleared, until);
  }
}
