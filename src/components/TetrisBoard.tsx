
import React, { useMemo } from 'react';
import { BoardState, Position, Tetromino, TetrominoType } from '../game/models';
import { SOLID_COLORS } from './PiecePreviews';

interface TetrisBoardProps {
  board: BoardState;
  activePiece: Tetromino | null;
  ghostPiece: Tetromino | null;
  clearingRows?: number[];
  flashingCells?: Position[];
  showGhost?: boolean;
  showGhostOutline?: boolean;
  ghostOpacity?: number;
  showStackOutline?: boolean;
  gridStyle?: 'lines' | 'checkerboard';
  gridOpacity?: number;
  neonGlow?: boolean;
  neonIntensity?: number;
}

export const TetrisBoard: React.FC<TetrisBoardProps> = ({
  board,
  activePiece,
  ghostPiece,
  clearingRows = [],
  flashingCells = [],
  showGhost = true,
  showGhostOutline = true,
  ghostOpacity = 0.2,
  showStackOutline = true,
  gridStyle = 'lines',
  gridOpacity = 0.25,
  neonGlow = true,
  neonIntensity = 0.5,
}) => {
  // Map active piece cell coordinates
  const activeCells = useMemo(() => {
    const map = new Map<string, TetrominoType>();
    if (activePiece) {
      for (const pos of activePiece.cells) {
        if (pos.row >= 0 && pos.row < board.rows && pos.col >= 0 && pos.col < board.cols) {
          map.set(`${pos.row},${pos.col}`, activePiece.type);
        }
      }
    }
    return map;
  }, [activePiece, board.rows, board.cols]);

  // Map ghost piece cell coordinates
  const ghostCells = useMemo(() => {
    const map = new Map<string, TetrominoType>();
    if (showGhost && ghostPiece && activePiece && ghostPiece.position.row !== activePiece.position.row) {
      for (const pos of ghostPiece.cells) {
        if (pos.row >= 0 && pos.row < board.rows && pos.col >= 0 && pos.col < board.cols) {
          map.set(`${pos.row},${pos.col}`, ghostPiece.type);
        }
      }
    }
    return map;
  }, [showGhost, ghostPiece, activePiece, board.rows, board.cols]);

  // Set of flashing cell keys
  const flashingKeys = useMemo(() => {
    const set = new Set<string>();
    for (const pos of flashingCells) {
      set.add(`${pos.row},${pos.col}`);
    }
    return set;
  }, [flashingCells]);

  // Generate seamless SVG contour path segments for locked stack
  const stackOutlinePath = useMemo(() => {
    if (!showStackOutline) return '';
    const segments: string[] = [];
    const cellW = 10;
    const cellH = 10;

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (board.cellAt(r, c).filled) {
          const x1 = c * cellW;
          const x2 = (c + 1) * cellW;
          const y1 = r * cellH;
          const y2 = (r + 1) * cellH;

          // Top edge
          if (r === 0 || !board.cellAt(r - 1, c).filled) {
            segments.push(`M ${x1} ${y1} L ${x2} ${y1}`);
          }
          // Bottom edge
          if (r === board.rows - 1 || !board.cellAt(r + 1, c).filled) {
            segments.push(`M ${x1} ${y2} L ${x2} ${y2}`);
          }
          // Left edge
          if (c === 0 || !board.cellAt(r, c - 1).filled) {
            segments.push(`M ${x1} ${y1} L ${x1} ${y2}`);
          }
          // Right edge
          if (c === board.cols - 1 || !board.cellAt(r, c + 1).filled) {
            segments.push(`M ${x2} ${y1} L ${x2} ${y2}`);
          }
        }
      }
    }
    return segments.join(' ');
  }, [board, showStackOutline]);

  // Generate seamless SVG contour path segments for ghost piece
  const ghostOutlinePath = useMemo(() => {
    if (!showGhost || !showGhostOutline || ghostCells.size === 0) return '';
    const segments: string[] = [];
    const cellW = 10;
    const cellH = 10;

    for (const [key] of ghostCells) {
      const [rStr, cStr] = key.split(',');
      const r = parseInt(rStr, 10);
      const c = parseInt(cStr, 10);

      const x1 = c * cellW;
      const x2 = (c + 1) * cellW;
      const y1 = r * cellH;
      const y2 = (r + 1) * cellH;

      // Top edge
      if (!ghostCells.has(`${r - 1},${c}`)) {
        segments.push(`M ${x1} ${y1} L ${x2} ${y1}`);
      }
      // Bottom edge
      if (!ghostCells.has(`${r + 1},${c}`)) {
        segments.push(`M ${x1} ${y2} L ${x2} ${y2}`);
      }
      // Left edge
      if (!ghostCells.has(`${r},${c - 1}`)) {
        segments.push(`M ${x1} ${y1} L ${x1} ${y2}`);
      }
      // Right edge
      if (!ghostCells.has(`${r},${c + 1}`)) {
        segments.push(`M ${x2} ${y1} L ${x2} ${y2}`);
      }
    }
    return segments.join(' ');
  }, [showGhost, showGhostOutline, ghostCells]);

  const ghostColor = activePiece ? SOLID_COLORS[activePiece.type] : '#ffffff';

  // Hex opacity for ghost fill
  const ghostAlphaHex = Math.max(0, Math.min(255, Math.round(ghostOpacity * 255)))
    .toString(16)
    .padStart(2, '0');

  // Neon glow box-shadow for board border
  const boardGlowStyle = neonGlow && neonIntensity > 0
    ? `0 0 ${neonIntensity * 16}px rgba(255, 255, 255, ${neonIntensity * 0.25}), inset 0 0 ${neonIntensity * 8}px rgba(255, 255, 255, ${neonIntensity * 0.12})`
    : undefined;

  return (
    <div
      data-testid="tetris-board"
      className="relative flex justify-center items-start select-none"
    >
      {/* 
        NO top white border: open-top matrix (border-l-2 border-r-2 border-b-2 border-white)
        Optional delicate neon glow around matrix boundaries
      */}
      <div
        className="relative p-0 bg-black border-l-2 border-r-2 border-b-2 border-white overflow-hidden transition-shadow"
        style={{ boxShadow: boardGlowStyle }}
      >
        <div
          className="relative grid grid-cols-10 bg-[#070709] overflow-hidden"
          style={{
            width: 'min(52vw, 230px)',
            height: 'min(104vw, 460px)',
            gridTemplateRows: `repeat(${board.rows}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: board.rows }).map((_, r) => {
            const isClearing = clearingRows.includes(r);

            return Array.from({ length: board.cols }).map((_, c) => {
              const key = `${r},${c}`;
              const cell = board.cellAt(r, c);
              const activeType = activeCells.get(key);
              const ghostType = ghostCells.get(key);
              const isFlashing = flashingKeys.has(key);

              const isLockedBlock = cell.filled && cell.type !== null;
              const isActiveBlock = activeType !== undefined;
              const isGhostBlock = ghostType !== undefined && !isLockedBlock && !isActiveBlock;
              const isEmptyCell = !isActiveBlock && !isLockedBlock && !isGhostBlock;

              let cellBg = '#070709';
              let cellShadow: string | undefined = undefined;

              if (isClearing || isFlashing) {
                cellBg = '#ffffff'; // Instant white flash on clear or lock
                if (neonGlow && neonIntensity > 0) {
                  cellShadow = `0 0 ${neonIntensity * 16}px #ffffff`;
                }
              } else if (isActiveBlock) {
                cellBg = SOLID_COLORS[activeType];
                if (neonGlow && neonIntensity > 0) {
                  cellShadow = `0 0 ${neonIntensity * 10}px ${SOLID_COLORS[activeType]}`;
                }
              } else if (isLockedBlock) {
                cellBg = SOLID_COLORS[cell.type!];
                if (neonGlow && neonIntensity > 0) {
                  cellShadow = `0 0 ${neonIntensity * 6}px ${SOLID_COLORS[cell.type!]}aa`;
                }
              } else if (isGhostBlock) {
                cellBg = `${SOLID_COLORS[ghostType]}${ghostAlphaHex}`; // Configurable translucent ghost fill
              } else if (isEmptyCell) {
                if (gridStyle === 'checkerboard' && (r + c) % 2 === 0) {
                  cellBg = `rgba(255, 255, 255, ${gridOpacity * 0.12})`;
                } else {
                  cellBg = '#070709';
                }
              }

              // Empty cell border styling
              const borderStyle =
                isEmptyCell && gridStyle === 'lines' && gridOpacity > 0
                  ? `0.5px solid rgba(255, 255, 255, ${gridOpacity * 0.25})`
                  : undefined;

              return (
                <div
                  key={key}
                  className="relative flex items-center justify-center pointer-events-none"
                  style={{
                    backgroundColor: cellBg,
                    border: borderStyle,
                    boxShadow: cellShadow,
                    zIndex: isActiveBlock || isFlashing ? 5 : 1,
                  }}
                />
              );
            });
          })}

          {/* 
            Seamless SVG Contour Overlays:
            Delicate thinner stroke (0.7-0.8) with smooth corner rounds and zero pixel breaks
          */}
          <svg
            viewBox={`0 0 ${board.cols * 10} ${board.rows * 10}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          >
            {/* SVG Filters for Neon Glow on contours */}
            {neonGlow && neonIntensity > 0 && (
              <defs>
                <filter id="stack-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation={neonIntensity * 0.8}
                    floodColor="#ffffff"
                    floodOpacity={neonIntensity * 0.9}
                  />
                </filter>
                <filter id="ghost-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation={neonIntensity * 0.8}
                    floodColor={ghostColor}
                    floodOpacity={neonIntensity * 0.8}
                  />
                </filter>
              </defs>
            )}

            {/* Ghost Piece Seamless Thinner Outer Contour */}
            {ghostOutlinePath && (
              <path
                d={ghostOutlinePath}
                fill="none"
                stroke={ghostColor}
                strokeWidth="0.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
                filter={neonGlow && neonIntensity > 0 ? 'url(#ghost-neon-glow)' : undefined}
              />
            )}

            {/* Locked Stack Seamless Thinner White Perimeter Outline */}
            {stackOutlinePath && (
              <path
                d={stackOutlinePath}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={neonGlow && neonIntensity > 0 ? 'url(#stack-neon-glow)' : undefined}
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
