import test from 'node:test';
import assert from 'node:assert/strict';
import { TetrisGame } from './tetris_game';
import { TetrominoType, Position, Tetromino, Cell, BoardState, TSpinType } from './models';
import { HandlingController } from './handling_controller';

test('Tetris Guideline Spawning: Piece placement and horizontal centering', () => {
  // Test "I" spawns horizontally in the 20th row (row 0), centered at cols 3..6
  const iPiece = Tetromino.spawn(TetrominoType.I, 10);
  assert.equal(iPiece.rotation, 0);
  for (const cell of iPiece.cells) {
    assert.equal(cell.row, 0, 'I piece must spawn in the 20th row (index 0)');
    assert.ok(cell.col >= 3 && cell.col <= 6, 'I piece must span cols 3..6');
  }

  // Test "O" spawns in hidden 21st and 22nd rows (rows -1 and -2), centered at cols 4..5
  const oPiece = Tetromino.spawn(TetrominoType.O, 10);
  assert.equal(oPiece.rotation, 0);
  for (const cell of oPiece.cells) {
    assert.ok(cell.row === -1 || cell.row === -2, 'O piece must spawn in rows -1 and -2');
    assert.ok(cell.col >= 3 && cell.col <= 5, 'O piece must be within indices 3..5');
  }

  // Test T, S, Z, J, L spawn in hidden 21st and 22nd rows, cols within indices 3..5
  const otherTypes = [
    TetrominoType.T,
    TetrominoType.S,
    TetrominoType.Z,
    TetrominoType.J,
    TetrominoType.L,
  ];

  for (const type of otherTypes) {
    const piece = Tetromino.spawn(type, 10);
    assert.equal(piece.rotation, 0);
    for (const cell of piece.cells) {
      assert.ok(
        cell.row === -1 || cell.row === -2,
        `Type ${type} must spawn in hidden rows -1 and -2 (21st and 22nd rows)`
      );
      assert.ok(
        cell.col >= 3 && cell.col <= 5,
        `Type ${type} must spawn horizontally centered in cols 3..5`
      );
    }
  }
});

test('Block Out Game Over: No push-up/wall-kick on spawn collision', () => {
  const game = new TetrisGame(1, 'marathon');

  // Fill row 0 at columns 3, 4, 5, 6
  for (let c = 3; c <= 6; c++) {
    game.board.grid[0][c] = Cell.of(TetrominoType.O);
  }

  let gameOverReason: string | undefined;
  game.addEventListener((e) => {
    if (e.type === 'gameOver') {
      gameOverReason = e.reason;
    }
  });

  // Force next piece to be 'I', which spawns in row 0 at cols 3..6
  // @ts-expect-error accessing private pieceManager for testing
  game.pieceManager.bag = [TetrominoType.I, TetrominoType.I];

  const spawned = game.spawnNext();
  assert.equal(spawned, false, 'Spawn must fail when spawn cells are occupied');
  assert.equal(game.isGameOver, true, 'Game over must trigger immediately');
  assert.equal(gameOverReason, 'blockOut', 'Game over event must declare blockOut reason');
});

test('Lock Delay (Infinity Rule): 500ms delay and floor move resets up to limit', () => {
  const game = new TetrisGame(1, 'marathon');
  game.lockDelayDuration = 500;
  game.maxLockResets = 15;

  // Drop piece until it rests on the floor
  while (game.softDrop()) {}
  assert.equal(game.isGrounded, true, 'Piece must be grounded on the floor');

  // Ticking update while grounded should accumulate lockDelayTimer
  assert.equal(game.lockDelayTimer, 0);
  game.update(100);
  assert.equal(game.lockDelayTimer, 100);

  // Moving left on the floor should reset lockDelayTimer to 0 and increment lockResetCount
  const moved = game.moveLeft();
  assert.equal(moved, true);
  assert.equal(game.lockDelayTimer, 0, 'Move on floor must reset lockDelayTimer to 0');
  assert.equal(game.lockResetCount, 1, 'Move on floor must increment lockResetCount');

  // Perform remaining 14 floor resets (total 15)
  for (let i = 1; i < 15; i++) {
    const dir = i % 2 === 1 ? game.moveRight() : game.moveLeft();
    assert.equal(dir, true);
    assert.equal(game.lockDelayTimer, 0);
    assert.equal(game.lockResetCount, i + 1);
  }
  assert.equal(game.lockResetCount, 15);

  // Advance timer by 200ms
  game.update(200);
  assert.equal(game.lockDelayTimer, 200);

  // 16th move: beyond maxLockResets (15), move must succeed but lockDelayTimer must NOT reset!
  game.moveLeft();
  assert.equal(game.lockDelayTimer, 200, 'Beyond maxLockResets, timer must NOT be reset');

  // Ticking remaining 300ms (total 500ms) should lock the piece!
  const initialPieceCount = game.pieceCount;
  game.update(300);
  assert.equal(game.pieceCount, initialPieceCount + 1, 'Piece must lock when timer reaches 500ms');
});

test('O-Piece Rotation resets Lock Delay on floor (Jstris style O-Spin)', () => {
  const game = new TetrisGame(1, 'marathon');
  game.lockDelayDuration = 500;
  game.maxLockResets = 15;

  // Force active piece to O resting on the floor (row 18, col 4)
  game.activePiece = new Tetromino(TetrominoType.O, 0, new Position(18, 4));
  assert.equal(game.isGrounded, true, 'O piece must be on the floor');

  // Let lock delay tick 200ms
  game.update(200);
  assert.equal(game.lockDelayTimer, 200);

  // Rotating O-piece clockwise must succeed and reset lockDelayTimer to 0!
  const rotated = game.rotateCW();
  assert.equal(rotated, true, 'O piece rotation must be registered');
  assert.equal(game.activePiece?.rotation, 1, 'O piece rotation state must advance to 1');
  assert.equal(game.lockDelayTimer, 0, 'Rotating O-piece must reset lock delay timer');
  assert.equal(game.lockResetCount, 1, 'Rotating O-piece must increment lock reset count');

  // Further rotations: 1 -> 2 -> 3 -> 0
  game.update(150);
  assert.equal(game.lockDelayTimer, 150);
  game.rotateCW();
  assert.equal(game.activePiece?.rotation, 2);
  assert.equal(game.lockDelayTimer, 0);
});

test('180-Degree Rotation (Flip) executes in a single tick with wall kicks', () => {
  const game = new TetrisGame(1, 'marathon');

  // Position a T piece in the middle of board, pointing Up (rotation 0)
  game.activePiece = new Tetromino(TetrominoType.T, 0, new Position(10, 4));
  const flipped = game.rotate180();
  assert.equal(flipped, true, '180 rotation must succeed');
  assert.equal(game.activePiece?.rotation, 2, 'T piece rotation must be 2 (pointing down)');

  // 180 flip next to left wall
  game.activePiece = new Tetromino(TetrominoType.T, 0, new Position(10, 0));
  const flippedAtWall = game.rotate180();
  assert.equal(flippedAtWall, true, '180 rotation at wall must succeed using wall kick');
  assert.equal(game.activePiece?.rotation, 2);
});

test('SOCD Last-Input Win switches active direction and restarts DAS', () => {
  const handling = new HandlingController({ dasDelayMs: 167, arrRateMs: 33, softDropFactor: 20 });
  const moveLog: string[] = [];

  // 1. Press Left -> initial tap left
  handling.pressDirection('left', (d) => {
    moveLog.push(d);
    return true;
  });
  assert.equal(handling.heldDirection, 'left');
  assert.equal(moveLog.length, 1);
  assert.equal(moveLog[0], 'left');

  // Advance 100ms
  handling.update(100, (d) => {
    moveLog.push(d);
    return true;
  });
  assert.equal(handling.isDasCharged, false);

  // 2. While Left is held, press Right -> Last-Input Win immediately switches to Right!
  handling.pressDirection('right', (d) => {
    moveLog.push(d);
    return true;
  });
  assert.equal(handling.heldDirection, 'right', 'Right must win as last input');
  assert.equal(handling.dasTimer, 0, 'DAS timer must reset for the new direction');
  assert.equal(moveLog[moveLog.length - 1], 'right', 'Immediate tap right must execute');

  // 3. Release Right while Left is still held -> resumes Left immediately!
  handling.releaseDirection('right', (d) => {
    moveLog.push(d);
    return true;
  });
  assert.equal(handling.heldDirection, 'left', 'Left must resume when right is released');
  assert.equal(handling.dasTimer, 0, 'DAS timer must reset when resuming held direction');
  assert.equal(moveLog[moveLog.length - 1], 'left');

  // 4. Release Left -> movement stops
  handling.releaseDirection('left');
  assert.equal(handling.heldDirection, null);
});

test('T-Spin Detection: 3-Corner Rule differentiates Full vs Mini', () => {
  const game = new TetrisGame(1, 'marathon');

  // Build a T-slot on rows 17..19:
  // row 17: empty
  // row 18: solid block at col 3 and col 5
  // row 19: solid floor/blocks
  game.board.grid[18][3] = Cell.of(TetrominoType.I);
  game.board.grid[18][5] = Cell.of(TetrominoType.I);
  game.board.grid[19][3] = Cell.of(TetrominoType.I);
  game.board.grid[19][4] = Cell.of(TetrominoType.I);
  game.board.grid[19][5] = Cell.of(TetrominoType.I);

  // T piece pointing Down (rotation 2) placed in slot at (17, 3)
  // Corners of 3x3 at row 17, col 3:
  // TL: (17, 3) - empty
  // TR: (17, 5) - empty
  // BL: (19, 3) - occupied
  // BR: (19, 5) - occupied
  // T pointing down: front corners are BL and BR!
  // Add an overhang block at (17, 3)
  game.board.grid[17][3] = Cell.of(TetrominoType.I);
  // Now 3 corners occupied: TL, BL, BR.
  // Front corners are BL and BR (both occupied) -> FULL T-Spin!
  const piece = new Tetromino(TetrominoType.T, 2, new Position(17, 3));
  const tSpinFull = game.rotation.detectTSpin(piece, game.board, 0);
  assert.equal(tSpinFull, TSpinType.full, '3 corners occupied with both front corners occupied is Full T-Spin');

  // T pointing Up (rotation 0) in same position:
  // Front corners are TL and TR.
  // TL is occupied, TR is empty. Only 1 front corner occupied without 5th kick -> T-Spin Mini!
  const pieceUp = new Tetromino(TetrominoType.T, 0, new Position(17, 3));
  const tSpinMini = game.rotation.detectTSpin(pieceUp, game.board, 0);
  assert.equal(tSpinMini, TSpinType.mini, '1 front corner open without 5th kick is T-Spin Mini');

  // If 5th kick (kickIndex === 4) was used, T-Spin Mini is promoted to Full T-Spin!
  const tSpinPromoted = game.rotation.detectTSpin(pieceUp, game.board, 4);
  assert.equal(tSpinPromoted, TSpinType.full, '5th kick promotes to Full T-Spin');
});

test('Line Clear Delay (ARE / LCD) pauses input and gravity while clearing rows', () => {
  const game = new TetrisGame(1, 'marathon');
  game.lineClearDelayMs = 250;

  // Fill bottom row except column 4
  const bottomRow = 19;
  for (let c = 0; c < 10; c++) {
    if (c !== 4) game.board.grid[bottomRow][c] = Cell.of(TetrominoType.I);
  }

  // Active piece is single block I piece at (19, 4)
  game.activePiece = new Tetromino(TetrominoType.I, 1, new Position(18, 2)); // col 4 is occupied by I rotation 1
  game.hardDrop();

  // Piece locked and 1 line cleared: should enter line clearing delay
  assert.equal(game.isLineClearing, true, 'Must enter isLineClearing state');
  assert.equal(game.clearingRows.length, 1, 'Must have 1 clearing row');

  // While line clearing, player input is blocked
  assert.equal(game.moveLeft(), false);
  assert.equal(game.rotateCW(), false);
  assert.equal(game.softDrop(), false);

  // Update 150ms (less than 250ms)
  game.update(150);
  assert.equal(game.isLineClearing, true);

  // Update remaining 100ms
  game.update(100);
  assert.equal(game.isLineClearing, false, 'Line clear delay must end and resume play');
  assert.equal(game.clearingRows.length, 0);
  assert.equal(game.levelState.linesCleared, 1);
});

test('DCD (DAS Cut Delay) pauses DAS auto-shift after hard drop', () => {
  const handling = new HandlingController({ dasDelayMs: 167, arrRateMs: 33, softDropFactor: 20 });
  handling.startMove('right', () => true);
  handling.update(200, () => true);
  assert.equal(handling.isDasCharged, true);

  // Trigger DCD of 33ms (simulating hard drop)
  handling.triggerDcd(33);
  let moved = false;
  handling.update(16, () => {
    moved = true;
    return true;
  });
  assert.equal(moved, false, 'DAS must be frozen during DCD period');

  // Once DCD expires (advance past remaining 17ms + arrRateMs 33ms = 50ms)
  handling.update(50, () => {
    moved = true;
    return true;
  });
  assert.equal(moved, true, 'DAS auto-repeat resumes once DCD expires');
});
