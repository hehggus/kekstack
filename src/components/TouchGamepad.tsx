import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  RotateCw,
  Undo2,
  Redo2,
  ArrowLeftRight,
  Pause,
} from 'lucide-react';
import { soundManager } from '../game/audio';

interface TouchGamepadProps {
  onMoveLeftStart: () => void;
  onMoveLeftEnd: () => void;
  onMoveRightStart: () => void;
  onMoveRightEnd: () => void;
  onSoftDropStart: () => void;
  onSoftDropEnd: () => void;
  onHardDrop: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onRotate180: () => void;
  onHold: () => void;
  onPause?: () => void;
}

export const TouchGamepad: React.FC<TouchGamepadProps> = ({
  onMoveLeftStart,
  onMoveLeftEnd,
  onMoveRightStart,
  onMoveRightEnd,
  onSoftDropStart,
  onSoftDropEnd,
  onHardDrop,
  onRotateCW,
  onRotateCCW,
  onRotate180,
  onHold,
  onPause,
}) => {
  // Continuous hold handlers for DAS/ARR and soft drop
  const makeContinuousHandlers = (onStart: () => void, onEnd: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
      soundManager.triggerHaptic(8);
      onStart();
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      onEnd();
    },
    onPointerLeave: (e: React.PointerEvent) => {
      e.preventDefault();
      onEnd();
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      onEnd();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  // Instant trigger handlers (rotations, hard drop, hold)
  const makeInstantHandlers = (action: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      soundManager.triggerHaptic(10);
      action();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const btnBaseClass =
    'relative flex items-center justify-center rounded-2xl bg-[#0f0f13] border border-[#1e1e24] text-[#555562] active:text-[#e2e8f0] active:bg-[#1f1f28] active:border-[#383848] transition-all select-none touch-none cursor-pointer shadow-sm';

  return (
    <div
      data-testid="touch-gamepad"
      className="w-full max-w-[390px] mx-auto flex flex-col gap-2.5 px-3 select-none touch-none"
    >
      {/* Upper Row: [Pause] [Spacer] [Rotate 180] [Hold] [Hard Drop] */}
      <div className="grid grid-cols-5 gap-2.5">
        {/* Pause Button in column 0 */}
        {onPause ? (
          <button
            type="button"
            aria-label="Pause game"
            className={`${btnBaseClass} aspect-square h-[68px] sm:h-20`}
            onClick={onPause}
          >
            <Pause className="w-7 h-7 stroke-[1.8]" />
          </button>
        ) : (
          <div />
        )}

        <div /> {/* Spacer for column 1 */}

        {/* Rotate 180 (Above Soft Drop) */}
        <button
          type="button"
          aria-label="Rotate 180 degrees"
          className={`${btnBaseClass} aspect-square h-[68px] sm:h-20`}
          {...makeInstantHandlers(onRotate180)}
        >
          <RotateCw className="w-8 h-8 stroke-[1.7]" />
        </button>

        {/* Hold / Swap (Above Rotate CCW) */}
        <button
          type="button"
          aria-label="Hold Piece"
          className={`${btnBaseClass} aspect-square h-[68px] sm:h-20`}
          {...makeInstantHandlers(onHold)}
        >
          <ArrowLeftRight className="w-8 h-8 stroke-[1.7]" />
        </button>

        {/* Hard Drop (Above Rotate CW) */}
        <button
          type="button"
          aria-label="Hard Drop"
          className={`${btnBaseClass} aspect-square h-[68px] sm:h-20`}
          {...makeInstantHandlers(onHardDrop)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <path d="M12 3v12" />
            <path d="m6 10 6 6 6-6" />
            <path d="M5 20h14" />
          </svg>
        </button>
      </div>

      {/* Lower Row: 5 buttons [Left] [Right] [Soft Drop] [Rotate CCW] [Rotate CW] */}
      <div className="grid grid-cols-5 gap-2.5">
        {/* Move Left with unified Delta-Time DAS/ARR */}
        <button
          type="button"
          aria-label="Move Left"
          className={`${btnBaseClass} aspect-square h-[68px] sm:h-20`}
          {...makeContinuousHandlers(onMoveLeftStart, onMoveLeftEnd)}
        >
          <ArrowLeft className="w-8 h-8 stroke-[2]" />
        </button>

        {/* Move Right with unified Delta-Time DAS/ARR */}
        <button
          type="button"
          aria-label="Move Right"
          className={`${btnBaseClass} aspect-square h-[68px] sm:h-20`}
          {...makeContinuousHandlers(onMoveRightStart, onMoveRightEnd)}
        >
          <ArrowRight className="w-8 h-8 stroke-[2]" />
        </button>

        {/* Soft Drop with unified SDF gravity multiplier */}
        <button
          type="button"
          aria-label="Soft Drop"
          className={`${btnBaseClass} aspect-square h-[68px] sm:h-20`}
          {...makeContinuousHandlers(onSoftDropStart, onSoftDropEnd)}
        >
          <ArrowDown className="w-8 h-8 stroke-[2]" />
        </button>

        {/* Rotate CCW (Left curved undo-style arrow) */}
        <button
          type="button"
          aria-label="Rotate Counter-Clockwise"
          className={`${btnBaseClass} aspect-square h-[68px] sm:h-20`}
          {...makeInstantHandlers(onRotateCCW)}
        >
          <Undo2 className="w-8 h-8 stroke-[1.8]" />
        </button>

        {/* Rotate CW (Right curved redo-style arrow) */}
        <button
          type="button"
          aria-label="Rotate Clockwise"
          className={`${btnBaseClass} aspect-square h-[68px] sm:h-20`}
          {...makeInstantHandlers(onRotateCW)}
        >
          <Redo2 className="w-8 h-8 stroke-[1.8]" />
        </button>
      </div>
    </div>
  );
};
