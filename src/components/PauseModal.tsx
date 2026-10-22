import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Smartphone, Settings, Trophy, X, Download } from 'lucide-react';
import { GameMode, GAME_MODES } from '../game/game_modes';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { downloadProjectZip } from '../utils/downloadZip';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  gameMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  gameMode,
  onSelectMode,
}) => {
  const { isInstallable, install } = usePWAInstall();
  if (!isOpen) return null;

  const modes: GameMode[] = ['marathon', 'sprint', 'ultra', 'zen'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pause Menu"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in"
    >
      <div className="w-full max-w-xs bg-[#111116] border border-neutral-800 rounded-2xl p-6 text-white shadow-2xl space-y-4 text-center">
        <h2 className="text-2xl font-extrabold tracking-wider text-white uppercase">PAUSED</h2>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-white text-black font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-200 active:scale-[0.98] transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" /> RESUME
          </button>

          {isInstallable && (
            <button
              type="button"
              onClick={install}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer shadow-lg"
            >
              <Smartphone className="w-4 h-4" /> INSTALL ON ANDROID
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-neutral-800 text-white font-semibold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-700 active:scale-[0.98] transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> RESTART
          </button>

          <button
            type="button"
            onClick={downloadProjectZip}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-950/60 border border-cyan-500/60 hover:bg-cyan-900/70 text-cyan-300 font-bold text-xs tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4 text-cyan-400" /> СКАЧАТЬ ZIP С КОДОМ
          </button>
        </div>

        {/* Quick Mode Switcher */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-1.5 text-left">
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
            Game Mode
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {modes.map((m) => {
              const isSelected = gameMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectMode(m)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold uppercase border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-neutral-800 border-white text-white'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span>{GAME_MODES[m].name}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio / Haptic / Settings toggles */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between px-1">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-neutral-500" />}
          </button>

          {/* Vibration Toggle */}
          <button
            type="button"
            onClick={onToggleHaptics}
            aria-label="Toggle haptics"
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <Smartphone className={`w-5 h-5 ${hapticsEnabled ? 'text-emerald-400' : 'text-neutral-500'}`} />
          </button>

          {/* Full Settings Modal */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
