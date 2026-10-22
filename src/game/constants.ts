/**
 * Tetris Guideline Constants & Tetromino Data
 * Following Tetris Guideline specifications & tetris_engine
 */

export const BOARD_WIDTH = 10;
export const BOARD_VISIBLE_HEIGHT = 20;
export const BOARD_BUFFER_HEIGHT = 4;
export const BOARD_TOTAL_HEIGHT = BOARD_VISIBLE_HEIGHT + BOARD_BUFFER_HEIGHT; // 24

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface TetrominoDef {
  type: TetrominoType;
  color: string;
  glowColor: string;
  borderColor: string;
  // Matrix for rotation state 0 (Spawn)
  matrix: number[][];
  spawnX: number;
  spawnY: number;
}

// Colors matching the screenshot and modern arcade aesthetic
export const TETROMINO_COLORS: Record<TetrominoType, { fill: string; border: string; glow: string; shadow: string }> = {
  I: {
    fill: '#20c997', // Teal / Cyan matching screenshot
    border: '#38d9a9',
    glow: 'rgba(32, 201, 151, 0.4)',
    shadow: '#0ca678'
  },
  J: {
    fill: '#228be6', // Royal blue
    border: '#4dabf7',
    glow: 'rgba(34, 139, 230, 0.4)',
    shadow: '#1971c2'
  },
  L: {
    fill: '#f76707', // Orange matching screenshot
    border: '#ff922b',
    glow: 'rgba(247, 103, 7, 0.4)',
    shadow: '#d9480f'
  },
  O: {
    fill: '#fcc419', // Yellow matching screenshot
    border: '#ffe066',
    glow: 'rgba(252, 196, 25, 0.4)',
    shadow: '#fab005'
  },
  S: {
    fill: '#82c91e', // Lime green matching screenshot
    border: '#a9e34b',
    glow: 'rgba(130, 201, 30, 0.4)',
    shadow: '#66a80f'
  },
  T: {
    fill: '#7950f2', // Purple / Violet matching screenshot
    border: '#9775fa',
    glow: 'rgba(121, 80, 242, 0.4)',
    shadow: '#5f3dc4'
  },
  Z: {
    fill: '#fa5252', // Red / Coral matching screenshot
    border: '#ff8787',
    glow: 'rgba(250, 82, 82, 0.4)',
    shadow: '#e03131'
  }
};

// 4x4 or 3x3 matrices in SRS spawn orientation (State 0)
export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
};

// SRS Wall Kick offsets [rotationFrom_to_rotationTo] -> list of [dx, dy] tests
// Coordinate system: x increases right (+1), y increases down (+1) in matrix indices
export type RotationState = 0 | 1 | 2 | 3;

// JLSTZ SRS kick table
export const JLSTZ_WALL_KICKS: Record<string, [number, number][]> = {
  '0->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1->0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1->2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2->3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3->2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3->0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0->3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  // 180 kicks
  '0->2': [[0, 0], [0, -1], [1, -1], [-1, -1], [1, 0], [-1, 0]],
  '2->0': [[0, 0], [0, 1], [-1, 1], [1, 1], [-1, 0], [1, 0]],
  '1->3': [[0, 0], [1, 0], [1, 2], [1, 1], [0, 2], [0, 1]],
  '3->1': [[0, 0], [-1, 0], [-1, 2], [-1, 1], [0, 2], [0, 1]]
};

// I SRS kick table
export const I_WALL_KICKS: Record<string, [number, number][]> = {
  '0->1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1->0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1->2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2->1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2->3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3->2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3->0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0->3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  // 180 kicks
  '0->2': [[0, 0], [-1, 0], [1, 0], [0, 1]],
  '2->0': [[0, 0], [1, 0], [-1, 0], [0, -1]],
  '1->3': [[0, 0], [0, 1], [0, -1], [1, 0]],
  '3->1': [[0, 0], [0, -1], [0, 1], [-1, 0]]
};

// Scoring constants (Tetris Guideline Standard)
export const POINTS_SINGLE = 100;
export const POINTS_DOUBLE = 300;
export const POINTS_TRIPLE = 500;
export const POINTS_TETRIS = 800;
export const POINTS_TSPIN_MINI = 100;
export const POINTS_TSPIN_SINGLE = 800;
export const POINTS_TSPIN_DOUBLE = 1200;
export const POINTS_TSPIN_TRIPLE = 1600;
export const B2B_MULTIPLIER = 1.5;
export const SOFT_DROP_POINTS = 1;
export const HARD_DROP_POINTS = 2;

// Gravity drop intervals (milliseconds per line) by level
export const GRAVITY_BY_LEVEL: number[] = [
  1000, // Lv 0
  800,  // Lv 1
  650,  // Lv 2
  500,  // Lv 3
  400,  // Lv 4
  320,  // Lv 5
  250,  // Lv 6
  190,  // Lv 7
  140,  // Lv 8
  100,  // Lv 9
  80,   // Lv 10
  60,   // Lv 11
  45,   // Lv 12
  35,   // Lv 13
  25,   // Lv 14
  18,   // Lv 15+
];

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const DEFAULT_DAS_MS = 160;
export const DEFAULT_ARR_MS = 35;
