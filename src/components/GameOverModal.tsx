import React from 'react';
import { RotateCcw, Trophy, Award, CheckCircle2 } from 'lucide-react';
import { GameMode, GAME_MODES } from '../game/game_modes';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  lines: number;
  level: number;
  pieceCount: number;
  timeMs: number;
  isVictory?: boolean;
  gameMode?: GameMode;
  onRestart: () => void;
}

interface HighScoreEntry {
  score: number;
  lines: number;
  level: number;
  date: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  lines,
  level,
  pieceCount,
  timeMs,
  isVictory = false,
  gameMode = 'marathon',
  onRestart,
}) => {
  if (!isOpen) return null;

  const totalSeconds = timeMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((timeMs % 1000) / 10);
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

  const modeConfig = GAME_MODES[gameMode] || GAME_MODES.marathon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game Over"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none"
    >
      <div className="w-full max-w-xs bg-[#111115] border border-neutral-700/80 rounded-2xl p-6 text-center shadow-2xl space-y-4">
        <div className="space-y-1">
          {isVictory ? (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-4 h-4" /> Goal Completed!
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-1">
              {modeConfig.name} Mode
            </div>
          )}
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase">
            {isVictory ? 'Victory!' : 'Game Over'}
          </h2>
          <p className="text-xs text-neutral-400">
            {isVictory ? 'Congratulations on finishing the run!' : 'Great attempt! Here is your summary'}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-[#181820] border border-[#2b2b38] rounded-xl p-4 space-y-3">
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{score}</div>
            <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">Final Score</div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-left">
            <div>
              <div className="text-neutral-400 text-[10px] uppercase">Lines</div>
              <div className="text-white text-sm font-bold">{lines}</div>
            </div>
            <div>
              <div className="text-neutral-400 text-[10px] uppercase">Level</div>
              <div className="text-white text-sm font-bold">{level}</div>
            </div>
            <div>
              <div className="text-neutral-400 text-[10px] uppercase">Pieces</div>
              <div className="text-white text-sm font-bold">{pieceCount}</div>
            </div>
          </div>

          <div className="pt-1 text-center">
            <span className="text-xs font-mono text-neutral-300">Time: {timeStr}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-200 active:scale-[0.98] transition cursor-pointer shadow-lg"
          >
            <RotateCcw className="w-4 h-4" /> PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
};
