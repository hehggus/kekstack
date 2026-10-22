import React from 'react';
import { TetrominoType } from '../game/models';

export const SOLID_COLORS: Record<TetrominoType, string> = {
  [TetrominoType.I]: '#22c1a4', // Solid Teal/Cyan bar
  [TetrominoType.O]: '#f7b500', // Solid Golden Yellow square
  [TetrominoType.T]: '#7c3aed', // Solid Purple T
  [TetrominoType.S]: '#93d736', // Solid Lime Green S
  [TetrominoType.Z]: '#ef4444', // Solid Coral Red Z
  [TetrominoType.J]: '#2563eb', // Solid Royal Blue J
  [TetrominoType.L]: '#f97316', // Solid Orange L
};

export const GRAY_COLOR = '#666672'; // Solid gray for inactive hold

interface SolidPieceProps {
  type: TetrominoType;
  cellSize?: number;
  isGray?: boolean;
}

/**
 * Renders each tetromino as a single contiguous solid monolithic shape
 * with zero internal division lines.
 */
export const SolidPiece: React.FC<SolidPieceProps> = ({ type, cellSize = 16, isGray = false }) => {
  const s = cellSize;
  const color = isGray ? GRAY_COLOR : SOLID_COLORS[type];

  switch (type) {
    case TetrominoType.I:
      // 4x1 horizontal bar
      return (
        <svg width={4 * s} height={s} viewBox={`0 0 ${4 * s} ${s}`} className="overflow-visible">
          <rect x="0" y="0" width={4 * s} height={s} rx="1.5" fill={color} />
        </svg>
      );

    case TetrominoType.O:
      // 2x2 square
      return (
        <svg width={2 * s} height={2 * s} viewBox={`0 0 ${2 * s} ${2 * s}`} className="overflow-visible">
          <rect x="0" y="0" width={2 * s} height={2 * s} rx="1.5" fill={color} />
        </svg>
      );

    case TetrominoType.T:
      // T shape
      return (
        <svg width={3 * s} height={2 * s} viewBox={`0 0 ${3 * s} ${2 * s}`} className="overflow-visible">
          <path
            d={`M ${s} 0 L ${2 * s} 0 L ${2 * s} ${s} L ${3 * s} ${s} L ${3 * s} ${2 * s} L 0 ${2 * s} L 0 ${s} L ${s} ${s} Z`}
            fill={color}
            stroke={color}
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </svg>
      );

    case TetrominoType.S:
      // S shape
      return (
        <svg width={3 * s} height={2 * s} viewBox={`0 0 ${3 * s} ${2 * s}`} className="overflow-visible">
          <path
            d={`M ${s} 0 L ${3 * s} 0 L ${3 * s} ${s} L ${2 * s} ${s} L ${2 * s} ${2 * s} L 0 ${2 * s} L 0 ${s} L ${s} ${s} Z`}
            fill={color}
            stroke={color}
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </svg>
      );

    case TetrominoType.Z:
      // Z shape
      return (
        <svg width={3 * s} height={2 * s} viewBox={`0 0 ${3 * s} ${2 * s}`} className="overflow-visible">
          <path
            d={`M 0 0 L ${2 * s} 0 L ${2 * s} ${s} L ${3 * s} ${s} L ${3 * s} ${2 * s} L ${s} ${2 * s} L ${s} ${s} L 0 ${s} Z`}
            fill={color}
            stroke={color}
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </svg>
      );

    case TetrominoType.J:
      // J shape
      return (
        <svg width={3 * s} height={2 * s} viewBox={`0 0 ${3 * s} ${2 * s}`} className="overflow-visible">
          <path
            d={`M 0 0 L ${s} 0 L ${s} ${s} L ${3 * s} ${s} L ${3 * s} ${2 * s} L 0 ${2 * s} Z`}
            fill={color}
            stroke={color}
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </svg>
      );

    case TetrominoType.L:
      // L shape
      return (
        <svg width={3 * s} height={2 * s} viewBox={`0 0 ${3 * s} ${2 * s}`} className="overflow-visible">
          <path
            d={`M ${2 * s} 0 L ${3 * s} 0 L ${3 * s} ${2 * s} L 0 ${2 * s} L 0 ${s} L ${2 * s} ${s} Z`}
            fill={color}
            stroke={color}
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </svg>
      );
  }
};

export const HoldPiecePreview: React.FC<{ piece: TetrominoType | null; canHold: boolean }> = ({
  piece,
  canHold,
}) => {
  return (
    <div className="flex flex-col items-center sm:items-start select-none">
      <span className="text-white text-base sm:text-lg font-bold tracking-wider mb-2 uppercase">
        HOLD
      </span>
      <div className="w-16 h-12 flex items-center justify-center sm:justify-start">
        {piece !== null ? <SolidPiece type={piece} cellSize={16} isGray={!canHold} /> : null}
      </div>
    </div>
  );
};

export const NextPiecePreview: React.FC<{ queue: TetrominoType[] }> = ({ queue }) => {
  const nextFive = queue.slice(0, 5);

  return (
    <div className="flex flex-col items-center sm:items-start select-none">
      <span className="text-white text-base sm:text-lg font-bold tracking-wider mb-2 uppercase">
        NEXT
      </span>
      <div className="flex flex-col items-start space-y-4">
        {nextFive.map((type, idx) => (
          <div
            key={idx}
            className="w-20 h-10 flex items-center justify-start"
          >
            <SolidPiece type={type} cellSize={16} />
          </div>
        ))}
      </div>
    </div>
  );
};
