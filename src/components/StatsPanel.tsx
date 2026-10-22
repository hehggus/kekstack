import React from 'react';
import { GameMode, GAME_MODES } from '../game/game_modes';

interface StatsPanelProps {
  score: number;
  level: number;
  lines: number;
  pieceCount: number;
  timeMs: number;
  gameMode?: GameMode;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  score,
  level,
  lines,
  pieceCount,
  timeMs,
  gameMode = 'marathon',
}) => {
  // Ultra mode counts DOWN from 3:00.00 (180,000 ms)
  let displayMs = timeMs;
  if (gameMode === 'ultra') {
    displayMs = Math.max(0, 180000 - timeMs);
  }

  const totalSeconds = displayMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((displayMs % 1000) / 10);

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

  const modeConfig = GAME_MODES[gameMode] || GAME_MODES.marathon;

  return (
    <div className="flex flex-col items-center sm:items-start text-center sm:text-left select-none space-y-4 font-sans">
      {/* SCORE */}
      <div className="flex flex-col items-center sm:items-start">
        <span className="text-white text-2xl sm:text-3xl font-bold tracking-tight leading-none">
          {score}
        </span>
        <span className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase mt-1">
          SCORE
        </span>
      </div>

      {/* LEVEL & LINE */}
      <div className="flex flex-col items-center sm:items-start">
        <span className="text-white text-xs sm:text-sm font-semibold tracking-wide">
          Lv. {level}
        </span>
        <span className="text-white text-2xl sm:text-3xl font-bold tracking-tight leading-none mt-1">
          {gameMode === 'sprint' ? `${lines}/40` : lines}
        </span>
        <span className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase mt-1">
          LINE
        </span>
      </div>

      {/* PIECE COUNT */}
      <div className="flex flex-col items-center sm:items-start">
        <span className="text-white text-2xl sm:text-3xl font-bold tracking-tight leading-none">
          {pieceCount}
        </span>
        <span className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase mt-1">
          PIECE
        </span>
      </div>

      {/* TIMER & MODE LABEL (MARATHON / SPRINT / ULTRA / ZEN) */}
      <div className="flex flex-col items-center sm:items-start pt-1">
        <span className="text-white text-base sm:text-lg font-mono font-bold tracking-tight border-b-2 border-white/90 pb-0.5 leading-none">
          {formattedTime}
        </span>
        <span className="text-white text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase mt-1">
          {modeConfig.label}
        </span>
      </div>
    </div>
  );
};
