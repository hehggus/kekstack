import React from 'react';
import { Play, Trophy, Sparkles, Download } from 'lucide-react';
import { GameMode, GAME_MODES } from '../game/game_modes';
import { downloadProjectZip } from '../utils/downloadZip';

interface StartModeModalProps {
  isOpen: boolean;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  startLevel: number;
  onStartLevelChange: (lvl: number) => void;
  onStartGame: () => void;
}

export const StartModeModal: React.FC<StartModeModalProps> = ({
  isOpen,
  selectedMode,
  onSelectMode,
  startLevel,
  onStartLevelChange,
  onStartGame,
}) => {
  if (!isOpen) return null;

  const modes: GameMode[] = ['marathon', 'sprint', 'ultra', 'zen'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select Game Mode"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none animate-fade-in"
    >
      <div className="w-full max-w-xs bg-[#111116] border border-neutral-800 rounded-2xl p-6 text-white shadow-2xl space-y-5 text-center">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-semibold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> TETRIS ENGINE
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase">Select Mode</h2>
          <p className="text-xs text-neutral-400 mt-1">Choose your gameplay challenge</p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-2 gap-2 text-left">
          {modes.map((m) => {
            const cfg = GAME_MODES[m];
            const isSelected = selectedMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onSelectMode(m)}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-neutral-800/90 border-white text-white shadow-md'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">{cfg.name}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
                <span className="text-[10px] text-neutral-400 mt-1">
                  {m === 'marathon' && '150 lines'}
                  {m === 'sprint' && '40 lines speed'}
                  {m === 'ultra' && '3 min score'}
                  {m === 'zen' && 'Relaxed endless'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Starting level slider ONLY for Marathon */}
        {selectedMode === 'marathon' && (
          <div className="space-y-1.5 pt-2 text-left">
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
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        )}

        <button
          type="button"
          onClick={onStartGame}
          className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-200 active:scale-[0.98] transition cursor-pointer shadow-lg"
        >
          <Play className="w-4 h-4 fill-black" /> START GAME
        </button>

        <button
          type="button"
          onClick={downloadProjectZip}
          className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" /> СКАЧАТЬ ZIP С КОДОМ
        </button>
      </div>
    </div>
  );
};
