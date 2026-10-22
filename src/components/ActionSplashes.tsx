import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActionSplash } from '../game/tetris_game';

interface ActionSplashesProps {
  splashes: ActionSplash[];
}

export const ActionSplashes: React.FC<ActionSplashesProps> = ({ splashes }) => {
  return (
    <div
      aria-live="polite"
      className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center overflow-visible select-none"
    >
      <AnimatePresence mode="popLayout">
        {splashes.map((splash) => {
          let colorClass = 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]';

          switch (splash.actionType) {
            case 'tetris':
              // Vibrant Cyan / Teal neon glow
              colorClass = 'text-cyan-300 drop-shadow-[0_0_16px_rgba(34,211,238,0.9)]';
              break;
            case 'tspin':
              // Electric Purple neon glow
              colorClass = 'text-purple-300 drop-shadow-[0_0_18px_rgba(192,132,252,0.95)]';
              break;
            case 'b2b':
              // Radiant Gold pulsing glow
              colorClass = 'text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.95)]';
              break;
            case 'perfectClear':
              // Iridescent Emerald / White glow
              colorClass = 'text-emerald-300 drop-shadow-[0_0_22px_rgba(52,211,153,1)]';
              break;
            case 'combo':
              // Azure Blue glow
              colorClass = 'text-sky-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.85)]';
              break;
          }

          return (
            <motion.div
              key={splash.id}
              initial={{ scale: 0.5, y: 15, opacity: 0 }}
              animate={{
                scale: [0.5, 1.18, 1],
                y: [15, -35],
                opacity: [0, 1, 1, 0],
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                duration: 0.8,
                times: [0, 0.25, 0.75, 1],
                ease: 'easeOut',
              }}
              className="flex flex-col items-center justify-center text-center font-black tracking-wider uppercase filter"
            >
              {splash.subText && (
                <span className="text-[10px] sm:text-xs tracking-widest text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] font-semibold">
                  {splash.subText}
                </span>
              )}
              <span className={`text-xl sm:text-2xl font-extrabold ${colorClass}`}>
                {splash.text}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
