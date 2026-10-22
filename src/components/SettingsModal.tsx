import React from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Smartphone,
  Eye,
  Sparkles,
  Box,
  Trophy,
  Grid,
  Layers,
  Gauge,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { GameMode, GAME_MODES } from '../game/game_modes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Game Mode
  gameMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  startLevel: number;
  onStartLevelChange: (lvl: number) => void;
  // Handling (DAS / ARR / SDF)
  dasDelayMs: number;
  onDasDelayChange: (ms: number) => void;
  arrRateMs: number;
  onArrRateChange: (ms: number) => void;
  softDropFactor: number;
  onSoftDropFactorChange: (factor: number) => void;
  onResetHandlingDefaults: () => void;
  // Lock Delay (Infinity Rule)
  lockDelayDuration: number;
  onLockDelayChange: (ms: number) => void;
  maxLockResets: number;
  onMaxLockResetsChange: (resets: number) => void;
  // DCD & Line Clear Delay
  dcdDelayMs?: number;
  onDcdDelayChange?: (ms: number) => void;
  lineClearDelayMs?: number;
  onLineClearDelayChange?: (ms: number) => void;
  // Audio & Haptics
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  // Visuals & Ghost
  showGhost: boolean;
  onToggleGhost: () => void;
  showGhostOutline: boolean;
  onToggleGhostOutline: () => void;
  ghostOpacity: number;
  onGhostOpacityChange: (opacity: number) => void;
  showStackOutline: boolean;
  onToggleStackOutline: () => void;
  gridStyle: 'lines' | 'checkerboard';
  onGridStyleChange: (style: 'lines' | 'checkerboard') => void;
  gridOpacity: number;
  onGridOpacityChange: (opacity: number) => void;
  neonGlow: boolean;
  onToggleNeonGlow: () => void;
  neonIntensity: number;
  onNeonIntensityChange: (intensity: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  gameMode,
  onSelectMode,
  startLevel,
  onStartLevelChange,
  dasDelayMs,
  onDasDelayChange,
  arrRateMs,
  onArrRateChange,
  softDropFactor,
  onSoftDropFactorChange,
  onResetHandlingDefaults,
  lockDelayDuration,
  onLockDelayChange,
  maxLockResets,
  onMaxLockResetsChange,
  dcdDelayMs,
  onDcdDelayChange,
  lineClearDelayMs,
  onLineClearDelayChange,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  showGhost,
  onToggleGhost,
  showGhostOutline,
  onToggleGhostOutline,
  ghostOpacity,
  onGhostOpacityChange,
  showStackOutline,
  onToggleStackOutline,
  gridStyle,
  onGridStyleChange,
  gridOpacity,
  onGridOpacityChange,
  neonGlow,
  onToggleNeonGlow,
  neonIntensity,
  onNeonIntensityChange,
}) => {
  if (!isOpen) return null;

  const modes: GameMode[] = ['marathon', 'sprint', 'ultra', 'zen'];

  // Helper calculation for 60 FPS frame equivalents
  const dasFrames60 = Math.round((dasDelayMs / 1000) * 60);
  const arrFrames60 = arrRateMs === 0 ? 0 : Math.round((arrRateMs / 1000) * 60);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm select-none animate-fade-in"
    >
      <div className="w-full max-w-sm sm:max-w-md bg-[#121217] border border-neutral-800 rounded-2xl p-4 sm:p-5 text-white shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neutral-400" />
            <h2 className="text-base font-bold tracking-tight uppercase">Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Handling Section (DAS / ARR / SDF) */}
        <div className="space-y-3 p-3 bg-neutral-900/70 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white uppercase tracking-wider">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Handling (DAS / ARR / SDF)</span>
            </div>
            <button
              type="button"
              onClick={onResetHandlingDefaults}
              aria-label="Reset handling defaults"
              className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition cursor-pointer px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Default</span>
            </button>
          </div>

          <p className="text-[11px] text-neutral-400 leading-tight">
            Delta-Time precision: movement is FPS-independent and identical on 60Hz and 120Hz screens.
          </p>

          {/* Quick Handling Presets */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                onDasDelayChange(167);
                onArrRateChange(33);
                onSoftDropFactorChange(20);
              }}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer text-center ${
                dasDelayMs === 167 && arrRateMs === 33 && softDropFactor === 20
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              Guideline
              <span className="block text-[9px] font-normal text-neutral-400">167 / 33 / 20x</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onDasDelayChange(133);
                onArrRateChange(16);
                onSoftDropFactorChange(30);
              }}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer text-center ${
                dasDelayMs === 133 && arrRateMs === 16 && softDropFactor === 30
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              Fast
              <span className="block text-[9px] font-normal text-neutral-400">133 / 16 / 30x</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onDasDelayChange(100);
                onArrRateChange(0);
                onSoftDropFactorChange(40);
              }}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer text-center ${
                dasDelayMs === 100 && arrRateMs === 0 && softDropFactor === 40
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              Instant 0-ARR
              <span className="block text-[9px] font-normal text-neutral-400">100 / 0 / 40x</span>
            </button>
          </div>

          {/* DAS Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex flex-col">
                <span className="text-neutral-200 font-medium">DAS (Delayed Auto Shift)</span>
                <span className="text-[10px] text-neutral-400">Initial hold delay before repeating</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-400 font-mono font-bold text-xs whitespace-nowrap">
                {dasDelayMs} ms ({dasFrames60}f)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="1"
              value={dasDelayMs}
              onChange={(e) => onDasDelayChange(Number(e.target.value))}
              aria-label="DAS Delayed Auto Shift in milliseconds"
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* ARR Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex flex-col">
                <span className="text-neutral-200 font-medium">ARR (Auto Repeat Rate)</span>
                <span className="text-[10px] text-neutral-400">Interval between repeat shifts (0 = Instant)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-400 font-mono font-bold text-xs whitespace-nowrap">
                {arrRateMs === 0 ? '0 ms (Instant)' : `${arrRateMs} ms (${arrFrames60}f)`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={arrRateMs}
              onChange={(e) => onArrRateChange(Number(e.target.value))}
              aria-label="ARR Auto Repeat Rate in milliseconds"
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Soft Drop Factor Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex flex-col">
                <span className="text-neutral-200 font-medium">SDF (Soft Drop Factor)</span>
                <span className="text-[10px] text-neutral-400">Divides base gravity when holding Down</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-400 font-mono font-bold text-xs whitespace-nowrap">
                {softDropFactor.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={softDropFactor}
              onChange={(e) => onSoftDropFactorChange(Number(e.target.value))}
              aria-label="Soft Drop Factor multiplier"
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* DCD (DAS Cut Delay) Slider */}
          {dcdDelayMs !== undefined && onDcdDelayChange && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex flex-col">
                  <span className="text-neutral-200 font-medium">DCD (DAS Cut Delay)</span>
                  <span className="text-[10px] text-neutral-400">DAS freeze after hard drop to prevent misdrops</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-400 font-mono font-bold text-xs whitespace-nowrap">
                  {dcdDelayMs} ms
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={dcdDelayMs}
                onChange={(e) => onDcdDelayChange(Number(e.target.value))}
                aria-label="DAS Cut Delay in milliseconds"
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          )}
        </div>

        {/* Lock Delay (Infinity Rule) Section */}
        <div className="space-y-3 p-3 bg-neutral-900/70 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white uppercase tracking-wider">
              <Timer className="w-4 h-4 text-cyan-400" />
              <span>Lock Delay (Infinity Rule)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onLockDelayChange(500);
                onMaxLockResetsChange(15);
              }}
              aria-label="Reset lock delay defaults"
              className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition cursor-pointer px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Default</span>
            </button>
          </div>

          <p className="text-[11px] text-neutral-400 leading-tight">
            Apotris / Guideline Infinity Rule: soft drop never cuts lock delay; floor moves/rotations reset countdown up to limit.
          </p>

          {/* Quick Lock Delay Presets */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                onLockDelayChange(500);
                onMaxLockResetsChange(15);
              }}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer text-center ${
                lockDelayDuration === 500 && maxLockResets === 15
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              Guideline
              <span className="block text-[9px] font-normal text-neutral-400">500ms / 15</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onLockDelayChange(1000);
                onMaxLockResetsChange(20);
              }}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer text-center ${
                lockDelayDuration === 1000 && maxLockResets === 20
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              Forgiving
              <span className="block text-[9px] font-normal text-neutral-400">1000ms / 20</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onLockDelayChange(0);
                onMaxLockResetsChange(0);
              }}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer text-center ${
                lockDelayDuration === 0 && maxLockResets === 0
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              Instant 0ms
              <span className="block text-[9px] font-normal text-neutral-400">0ms / 0</span>
            </button>
          </div>

          {/* Lock Delay Duration Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex flex-col">
                <span className="text-neutral-200 font-medium">Lock Delay Duration</span>
                <span className="text-[10px] text-neutral-400">Time grounded before locking</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold text-xs whitespace-nowrap">
                {lockDelayDuration} ms
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="25"
              value={lockDelayDuration}
              onChange={(e) => onLockDelayChange(Number(e.target.value))}
              aria-label="Lock Delay Duration in milliseconds"
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Max Lock Resets Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex flex-col">
                <span className="text-neutral-200 font-medium">Max Lock Resets</span>
                <span className="text-[10px] text-neutral-400">Floor shifts / rotations allowed</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold text-xs whitespace-nowrap">
                {maxLockResets} resets
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={maxLockResets}
              onChange={(e) => onMaxLockResetsChange(Number(e.target.value))}
              aria-label="Max Lock Resets"
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Line Clear Delay (ARE / LCD) Slider */}
          {lineClearDelayMs !== undefined && onLineClearDelayChange && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex flex-col">
                  <span className="text-neutral-200 font-medium">Line Clear Delay (LCD)</span>
                  <span className="text-[10px] text-neutral-400">Freeze pause while completed rows dissolve</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold text-xs whitespace-nowrap">
                  {lineClearDelayMs} ms
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="25"
                value={lineClearDelayMs}
                onChange={(e) => onLineClearDelayChange(Number(e.target.value))}
                aria-label="Line Clear Delay in milliseconds"
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          )}
        </div>

        {/* Game Mode Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Game Mode</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((m) => {
              const cfg = GAME_MODES[m];
              const isSelected = gameMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectMode(m)}
                  className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-neutral-800 border-white text-white shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs font-bold uppercase">{cfg.name}</span>
                  <span className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                    {m === 'marathon' && '150 lines'}
                    {m === 'sprint' && '40 lines speed'}
                    {m === 'ultra' && '3 min score'}
                    {m === 'zen' && 'Endless practice'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Starting Level - ONLY displayed for Marathon mode */}
        {gameMode === 'marathon' && (
          <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-neutral-300">Starting Level</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-white font-mono font-bold text-xs">
                Lv. {startLevel}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={startLevel}
              onChange={(e) => onStartLevelChange(Number(e.target.value))}
              aria-label="Starting Level"
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        )}

        {/* Visuals & Neon Glow */}
        <div className="space-y-3 pt-2 border-t border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Visual Effects</span>
          </div>

          {/* Neon Glow Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col">
              <span className="text-xs text-neutral-200 font-medium">Neon Glow</span>
              <span className="text-[10px] text-neutral-400">Subtle luminous aura on blocks & edges</span>
            </div>
            <button
              type="button"
              onClick={onToggleNeonGlow}
              aria-label="Toggle neon glow"
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                neonGlow ? 'bg-cyan-400' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  neonGlow ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Neon Glow Intensity Slider */}
          {neonGlow && (
            <div className="space-y-1.5 pl-1">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-neutral-300">Glow Intensity</span>
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-300 font-mono font-bold text-xs">
                  {Math.round(neonIntensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={Math.round(neonIntensity * 100)}
                onChange={(e) => onNeonIntensityChange(Number(e.target.value) / 100)}
                aria-label="Neon Glow Intensity"
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          )}
        </div>

        {/* Matrix Grid Style (Lines vs Checkerboard) */}
        <div className="space-y-2 pt-2 border-t border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <Grid className="w-3.5 h-3.5 text-neutral-400" />
            <span>Matrix Grid Style</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onGridStyleChange('lines')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                gridStyle === 'lines'
                  ? 'bg-neutral-800 border-white text-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              Classic Lines
            </button>
            <button
              type="button"
              onClick={() => onGridStyleChange('checkerboard')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                gridStyle === 'checkerboard'
                  ? 'bg-neutral-800 border-white text-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              Checkerboard
            </button>
          </div>
        </div>

        {/* Grid Opacity Slider */}
        <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-neutral-300">Grid Opacity</span>
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-white font-mono font-bold text-xs">
              {Math.round(gridOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(gridOpacity * 100)}
            onChange={(e) => onGridOpacityChange(Number(e.target.value) / 100)}
            aria-label="Grid Opacity"
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* Ghost & Outlines Section */}
        <div className="space-y-3 pt-2 border-t border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>Ghost & Contours</span>
          </div>

          {/* Ghost Piece Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-neutral-300" />
              <div className="flex flex-col">
                <span className="text-xs text-neutral-200 font-medium">Ghost Piece</span>
                <span className="text-[10px] text-neutral-400">Projection at the bottom</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleGhost}
              aria-label="Toggle ghost piece"
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                showGhost ? 'bg-white' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  showGhost ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Ghost Opacity Slider */}
          {showGhost && (
            <div className="space-y-1.5 pl-6">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-neutral-300">Ghost Opacity</span>
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-white font-mono font-bold text-xs">
                  {Math.round(ghostOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={Math.round(ghostOpacity * 100)}
                onChange={(e) => onGhostOpacityChange(Number(e.target.value) / 100)}
                aria-label="Ghost Opacity"
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          )}

          {/* Ghost Outline Toggle */}
          {showGhost && (
            <div className="flex items-center justify-between py-1 pl-6">
              <div className="flex flex-col">
                <span className="text-xs text-neutral-200 font-medium">Ghost Contour</span>
                <span className="text-[10px] text-neutral-400">Thin outline around ghost shape</span>
              </div>
              <button
                type="button"
                onClick={onToggleGhostOutline}
                aria-label="Toggle ghost outline"
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  showGhostOutline ? 'bg-white' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    showGhostOutline ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Stack Outline Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-neutral-300" />
              <div className="flex flex-col">
                <span className="text-xs text-neutral-200 font-medium">Stack Contour</span>
                <span className="text-[10px] text-neutral-400">Thin white outline around locked blocks</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleStackOutline}
              aria-label="Toggle stack outline"
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                showStackOutline ? 'bg-white' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  showStackOutline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Audio & Haptics */}
        <div className="space-y-2 pt-2 border-t border-neutral-800/80">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              )}
              <span className="text-xs text-neutral-200 font-medium">Sound Effects</span>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              aria-label="Toggle sound"
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                soundEnabled ? 'bg-white' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Android Vibration Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-neutral-300" />
              <span className="text-xs text-neutral-200 font-medium">Vibration (Haptics)</span>
            </div>
            <button
              type="button"
              onClick={onToggleHaptics}
              aria-label="Toggle haptics"
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                hapticsEnabled ? 'bg-white' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
