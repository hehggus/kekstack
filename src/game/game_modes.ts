/**
 * Game Modes following Tetris Guideline & Hard Drop Wiki specifications:
 * - Marathon: 150 lines progression (or endless)
 * - Sprint: 40 lines time attack as fast as possible
 * - Ultra: 3 minutes (180s) score attack
 * - Zen: Relaxing endless mode without game-over pressure
 */

export type GameMode = 'marathon' | 'sprint' | 'ultra' | 'zen';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  label: string;
  description: string;
  targetLines?: number;
  timeLimitMs?: number; // for Ultra: 3 minutes = 180,000ms
  allowGameOver: boolean;
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  marathon: {
    id: 'marathon',
    name: 'Marathon',
    label: 'MARATHON',
    description: '150 lines standard level progression with increasing gravity.',
    targetLines: 150,
    allowGameOver: true,
  },
  sprint: {
    id: 'sprint',
    name: 'Sprint',
    label: 'SPRINT',
    description: 'Clear 40 lines as fast as possible. Pure speed test.',
    targetLines: 40,
    allowGameOver: true,
  },
  ultra: {
    id: 'ultra',
    name: 'Ultra',
    label: 'ULTRA',
    description: 'Score attack: get the highest score in 3 minutes.',
    timeLimitMs: 180000, // 3:00.00
    allowGameOver: true,
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    label: 'ZEN',
    description: 'Relaxed endless play. Practice without top-out pressure.',
    allowGameOver: false,
  },
};
