/**
 * Unified GameSettings Interface & Persistence
 * Adheres strictly to Tetris Guideline specifications:
 * - DAS (Delayed Auto Shift): Default ~167 ms (10 frames @ 60 FPS)
 * - ARR (Auto Repeat Rate): Default ~33 ms (2 frames @ 60 FPS), 0 ms for instant
 * - SDF (Soft Drop Factor): Default 20.0x gravity multiplier
 * - DCD (DAS Cut Delay): Default 33 ms (~2 frames @ 60 FPS)
 * - LCD (Line Clear Delay / ARE): Default 250 ms
 */

export interface GameSettings {
  // Handling (Delta-Time input tuning)
  dasDelayMs: number;     // Initial delay before auto-repeat begins (ms)
  arrRateMs: number;      // Auto-repeat rate interval (ms). 0 = Instant shift to wall.
  softDropFactor: number; // Multiplier dividing gravity interval during soft drop
  dcdDelayMs: number;     // DAS Cut Delay after hard-drop (ms, 0 - 100, default 33)

  // Lock Delay (Infinity Rule)
  lockDelayDuration: number; // Base lock delay in ms (0 - 2000 ms, default 500)
  maxLockResets: number;     // Max lock timer resets per piece on floor (0 - 30, default 15)

  // Technical Line Clear Delay (ARE / LCD)
  lineClearDelayMs: number;  // Line clear freeze delay in ms (0 - 500 ms, default 250)

  // Visuals & Board Style
  showGhost: boolean;
  showGhostOutline: boolean;
  ghostOpacity: number;
  showStackOutline: boolean;
  neonGlow: boolean;
  neonIntensity: number;
  gridStyle: 'lines' | 'checkerboard';
  gridOpacity: number;

  // Audio & Haptics
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  // Handling defaults (Tetris Guideline: 10 frames DAS, 2 frames ARR @ 60 FPS, 20x SDF, 33ms DCD)
  dasDelayMs: 167,
  arrRateMs: 33,
  softDropFactor: 20,
  dcdDelayMs: 33,

  // Lock delay defaults (Tetris Guideline Infinity Rule: 500 ms, 15 resets)
  lockDelayDuration: 500,
  maxLockResets: 15,

  // Technical Line Clear Delay (ARE / LCD default 250ms)
  lineClearDelayMs: 250,

  // Visual defaults
  showGhost: true,
  showGhostOutline: true,
  ghostOpacity: 0.2,
  showStackOutline: true,
  neonGlow: true,
  neonIntensity: 0.5,
  gridStyle: 'lines',
  gridOpacity: 0.25,

  // Audio & haptics defaults
  soundEnabled: true,
  hapticsEnabled: true,
};

export const SETTINGS_STORAGE_KEY = 'tetris_game_settings_v3';

export function loadGameSettings(): GameSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_GAME_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem('tetris_game_settings_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_GAME_SETTINGS,
        ...parsed,
        // Ensure numeric fields are valid numbers within safe bounds
        dasDelayMs: typeof parsed.dasDelayMs === 'number' && !isNaN(parsed.dasDelayMs)
          ? Math.max(30, Math.min(500, parsed.dasDelayMs))
          : DEFAULT_GAME_SETTINGS.dasDelayMs,
        arrRateMs: typeof parsed.arrRateMs === 'number' && !isNaN(parsed.arrRateMs)
          ? Math.max(0, Math.min(200, parsed.arrRateMs))
          : DEFAULT_GAME_SETTINGS.arrRateMs,
        softDropFactor: typeof parsed.softDropFactor === 'number' && !isNaN(parsed.softDropFactor)
          ? Math.max(1, Math.min(100, parsed.softDropFactor))
          : DEFAULT_GAME_SETTINGS.softDropFactor,
        dcdDelayMs: typeof parsed.dcdDelayMs === 'number' && !isNaN(parsed.dcdDelayMs)
          ? Math.max(0, Math.min(200, parsed.dcdDelayMs))
          : DEFAULT_GAME_SETTINGS.dcdDelayMs,
        lockDelayDuration: typeof parsed.lockDelayDuration === 'number' && !isNaN(parsed.lockDelayDuration)
          ? Math.max(0, Math.min(2000, parsed.lockDelayDuration))
          : DEFAULT_GAME_SETTINGS.lockDelayDuration,
        maxLockResets: typeof parsed.maxLockResets === 'number' && !isNaN(parsed.maxLockResets)
          ? Math.max(0, Math.min(30, Math.round(parsed.maxLockResets)))
          : DEFAULT_GAME_SETTINGS.maxLockResets,
        lineClearDelayMs: typeof parsed.lineClearDelayMs === 'number' && !isNaN(parsed.lineClearDelayMs)
          ? Math.max(0, Math.min(1000, parsed.lineClearDelayMs))
          : DEFAULT_GAME_SETTINGS.lineClearDelayMs,
      };
    }
  } catch (err) {
    console.warn('Failed to load settings from storage:', err);
  }
  return { ...DEFAULT_GAME_SETTINGS };
}

export function saveGameSettings(settings: GameSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to persist settings:', err);
  }
}
