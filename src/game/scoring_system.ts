import { ScoreState, TSpinType } from './models';

/**
 * Direct port of ScoringSystem from tetris_engine/lib/engine/scoring_system.dart
 */
export class ScoringSystem {
  onLinesCleared(
    state: ScoreState,
    linesCleared: number,
    level: number,
    tSpin: TSpinType = TSpinType.none,
    perfectClear: boolean = false
  ): ScoreState {
    if (linesCleared === 0) {
      // A T-Spin with no lines still scores, but ends any combo
      return state.copyWith({
        score: state.score + this.tSpinPoints(tSpin, 0) * level,
        combo: 0,
      });
    }

    const difficult = linesCleared === 4 || tSpin !== TSpinType.none;
    const b2b = difficult && state.backToBack;

    let base =
      (tSpin === TSpinType.none ? this.basePoints(linesCleared) : this.tSpinPoints(tSpin, linesCleared)) *
      level;

    if (b2b) base = Math.floor(base * 1.5);

    let comboBonus = 0;
    if (state.combo > 0) comboBonus = 50 * state.combo * level;

    let pcBonus = 0;
    if (perfectClear) {
      pcBonus =
        (linesCleared === 4 && b2b ? 3200 : this.perfectClearPoints(linesCleared)) * level;
    }

    return state.copyWith({
      score: state.score + base + comboBonus + pcBonus,
      combo: state.combo + 1,
      backToBack: difficult,
    });
  }

  onSoftDrop(state: ScoreState, cells: number): ScoreState {
    return state.copyWith({ score: state.score + cells });
  }

  onHardDrop(state: ScoreState, cells: number): ScoreState {
    return state.copyWith({ score: state.score + cells * 2 });
  }

  private basePoints(lines: number): number {
    switch (lines) {
      case 1:
        return 100;
      case 2:
        return 300;
      case 3:
        return 500;
      case 4:
        return 800;
      default:
        return 0;
    }
  }

  private tSpinPoints(tSpin: TSpinType, lines: number): number {
    switch (tSpin) {
      case TSpinType.none:
        return 0;
      case TSpinType.mini:
        switch (lines) {
          case 0:
            return 100;
          case 1:
            return 200;
          default:
            return 400;
        }
      case TSpinType.full:
        switch (lines) {
          case 0:
            return 400;
          case 1:
            return 800;
          case 2:
            return 1200;
          default:
            return 1600;
        }
    }
  }

  private perfectClearPoints(lines: number): number {
    switch (lines) {
      case 1:
        return 800;
      case 2:
        return 1200;
      case 3:
        return 1800;
      case 4:
        return 2000;
      default:
        return 0;
    }
  }
}
