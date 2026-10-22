import test from 'node:test';
import assert from 'node:assert/strict';
import { TetrisEngine } from './engine';
import { BOARD_WIDTH, BOARD_TOTAL_HEIGHT, BOARD_BUFFER_HEIGHT } from './constants';

test('TetrisEngine initializes with correct default state', () => {
  const engine = new TetrisEngine(0);
  assert.equal(engine.state.score, 0);
  assert.equal(engine.state.level, 0);
  assert.equal(engine.state.lines, 0);
  assert.equal(engine.state.pieceCount, 0);
  assert.equal(engine.state.isGameOver, false);
  assert.equal(engine.state.isPaused, false);
  assert.ok(engine.state.activePiece !== null);
  assert.equal(engine.state.board.length, BOARD_TOTAL_HEIGHT);
  assert.equal(engine.state.board[0].length, BOARD_WIDTH);
  assert.ok(engine.state.nextQueue.length >= 5);
});

test('TetrisEngine moves piece horizontally and respects walls', () => {
  const engine = new TetrisEngine(0);
  const initialX = engine.state.activePiece!.x;

  const movedLeft = engine.move(-1);
  assert.equal(movedLeft, true);
  assert.equal(engine.state.activePiece!.x, initialX - 1);

  // Move far left to boundary
  for (let i = 0; i < 15; i++) {
    engine.move(-1);
  }
  const minX = engine.state.activePiece!.x;
  const blockedLeft = engine.move(-1);
  assert.equal(blockedLeft, false);
  assert.equal(engine.state.activePiece!.x, minX);
});

test('Soft drop moves piece down and increases score', () => {
  const engine = new TetrisEngine(0);
  const startY = engine.state.activePiece!.y;
  const startScore = engine.state.score;

  const dropped = engine.softDrop();
  assert.equal(dropped, true);
  assert.equal(engine.state.activePiece!.y, startY + 1);
  assert.equal(engine.state.score, startScore + 1);
});

test('Hard drop immediately lands piece, updates score and piece count', () => {
  const engine = new TetrisEngine(0);
  const initialPieceCount = engine.state.pieceCount;

  const dropDist = engine.hardDrop();
  assert.ok(dropDist > 0);
  assert.equal(engine.state.pieceCount, initialPieceCount + 1);
  assert.equal(engine.state.score, dropDist * 2);
  // Next piece should be spawned
  assert.ok(engine.state.activePiece !== null);
});

test('Hold swaps piece and locks until next piece locks', () => {
  const engine = new TetrisEngine(0);
  const firstPieceType = engine.state.activePiece!.type;

  assert.equal(engine.state.holdPiece, null);
  const held = engine.hold();
  assert.equal(held, true);
  assert.equal(engine.state.holdPiece, firstPieceType);

  // Can't hold twice in the same turn
  const heldAgain = engine.hold();
  assert.equal(heldAgain, false);

  // After hard drop, canHold resets to true
  engine.hardDrop();
  assert.equal(engine.state.canHold, true);
});

test('Rotation tests wall kick and updates rotation state', () => {
  const engine = new TetrisEngine(0);
  // Force a T piece
  engine.state.activePiece = {
    type: 'T',
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    x: 4,
    y: 10,
    rotation: 0,
    lowestY: 10,
    lockResets: 0,
    lastMoveWasRotation: false,
    lastKickWasMiniCandidate: false,
  };

  const rotatedCW = engine.rotate('cw');
  assert.equal(rotatedCW, true);
  assert.equal(engine.state.activePiece.rotation, 1);

  const rotatedCCW = engine.rotate('ccw');
  assert.equal(rotatedCCW, true);
  assert.equal(engine.state.activePiece.rotation, 0);
});

test('Line clear removes full row, increments lines and awards score', () => {
  const engine = new TetrisEngine(0);

  // Fill bottom row except for column 0
  const bottomRow = BOARD_TOTAL_HEIGHT - 1;
  for (let x = 1; x < BOARD_WIDTH; x++) {
    engine.state.board[bottomRow][x] = 'I';
  }

  // Position a 1-block active piece at (0, bottomRow)
  engine.state.activePiece = {
    type: 'I',
    matrix: [[1]],
    x: 0,
    y: bottomRow,
    rotation: 0,
    lowestY: bottomRow,
    lockResets: 0,
    lastMoveWasRotation: false,
    lastKickWasMiniCandidate: false,
  };

  let lineClearFired = false;
  engine.addEventListener((e) => {
    if (e.type === 'lineClear') {
      lineClearFired = true;
      assert.equal(e.result.linesCleared, 1);
    }
  });

  engine.lockPiece();
  assert.equal(lineClearFired, true);
  assert.equal(engine.state.lines, 1);
  assert.ok(engine.state.score >= 100);
});
