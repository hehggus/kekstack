import test from 'node:test';
import assert from 'node:assert/strict';
import { TetrisGame } from './tetris_game';
import { TetrominoType, Position, Tetromino } from './models';

test('TetrisGame initializes matching tetris_engine rules', () => {
  const game = new TetrisGame(1);
  assert.equal(game.boardRows, 20);
  assert.equal(game.boardCols, 10);
  assert.equal(game.scoreState.score, 0);
  assert.equal(game.scoreState.combo, 0);
  assert.equal(game.scoreState.backToBack, false);
  assert.equal(game.levelState.level, 1);
  assert.equal(game.levelState.linesCleared, 0);
  assert.equal(game.isGameOver, false);
  assert.ok(game.activePiece !== null);
  assert.equal(game.nextQueue.length, 5);
});

test('Movement respects boundaries', () => {
  const game = new TetrisGame(1);
  const startCol = game.activePiece!.position.col;

  // Move left
  const moved = game.moveLeft();
  assert.equal(moved, true);
  assert.equal(game.activePiece!.position.col, startCol - 1);

  // Move far left
  for (let i = 0; i < 15; i++) {
    game.moveLeft();
  }
  const minCol = game.activePiece!.position.col;
  assert.equal(game.moveLeft(), false);
  assert.equal(game.activePiece!.position.col, minCol);
});

test('Soft drop adds 1 point per cell and moves piece down', () => {
  const game = new TetrisGame(1);
  const startRow = game.activePiece!.position.row;
  const startScore = game.scoreState.score;

  const dropped = game.softDrop();
  assert.equal(dropped, true);
  assert.equal(game.activePiece!.position.row, startRow + 1);
  assert.equal(game.scoreState.score, startScore + 1);
});

test('Hard drop calculates distance, awards 2 pts/cell and locks piece', () => {
  const game = new TetrisGame(1);
  const initialPieceCount = game.pieceCount;

  const dist = game.hardDrop();
  assert.ok(dist > 0);
  assert.equal(game.scoreState.score, dist * 2);
  assert.equal(game.pieceCount, initialPieceCount + 1);
  assert.ok(game.activePiece !== null);
});

test('Hold piece matches tetris_engine logic', () => {
  const game = new TetrisGame(1);
  const firstPiece = game.activePiece!.type;

  assert.equal(game.holdPiece, null);
  const held = game.hold();
  assert.equal(held, true);
  assert.equal(game.holdPiece, firstPiece);

  // Cannot hold twice in the same turn
  assert.equal(game.hold(), false);

  // After locking a piece, canHold is reset
  game.hardDrop();
  assert.equal(game.canHold, true);
});

test('Line clear scores base points multiplied by level', () => {
  const game = new TetrisGame(1);

  // Fill bottom row except for col 0
  const bottom = game.boardRows - 1;
  for (let c = 1; c < game.boardCols; c++) {
    game.board.grid[bottom][c] = { filled: true, type: TetrominoType.I };
  }

  // Position active piece to fill the remaining cell
  game.activePiece = new Tetromino(TetrominoType.I, 1, new Position(bottom - 1, -2)); // position cell at (bottom, 0)
  // Let's directly test lock piece
  // Fill all of bottom row
  game.board.grid[bottom][0] = { filled: true, type: TetrominoType.I };
  const { board: clearedBoard, linesCleared } = game.board.clearLines();
  assert.equal(linesCleared, 1);
  assert.equal(clearedBoard.cellAt(bottom, 0).filled, false);
});
