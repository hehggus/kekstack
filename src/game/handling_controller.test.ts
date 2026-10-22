import test from 'node:test';
import assert from 'node:assert/strict';
import { HandlingController } from './handling_controller';

test('HandlingController triggers immediate shift on startMove', () => {
  const controller = new HandlingController({ dasDelayMs: 167, arrRateMs: 33, softDropFactor: 20 });
  let moves = 0;
  controller.startMove('left', () => {
    moves++;
    return true;
  });

  assert.equal(moves, 1, 'Immediate first tap shift must fire');
  assert.equal(controller.heldDirection, 'left');
  assert.equal(controller.isDasCharged, false);
});

test('HandlingController respects DAS delay and ARR rate regardless of refresh rate (120Hz vs 60Hz)', () => {
  // Test 120Hz (8.33ms step)
  const controller120 = new HandlingController({ dasDelayMs: 167, arrRateMs: 33, softDropFactor: 20 });
  let moves120 = 0;
  controller120.startMove('right', () => {
    moves120++;
    return true;
  });
  assert.equal(moves120, 1);

  // Advance ~150ms in 8.33ms steps (less than 167ms DAS)
  for (let t = 0; t < 150; t += 8.33) {
    controller120.update(8.33, () => {
      moves120++;
      return true;
    });
  }
  assert.equal(moves120, 1, 'No additional moves before 167ms DAS delay');

  // Advance past 167ms (e.g. up to 300ms total)
  // At 300ms:
  // t=0: 1st tap
  // t=167ms: 1st DAS auto-shift (move #2)
  // remaining time = 133ms. With ARR = 33ms, 133 / 33 = 4 additional repeats.
  // Total expected moves at 300ms = 1 (tap) + 1 (DAS trigger) + 4 (ARR) = 6 moves.
  for (let t = 150; t < 300; t += 8.33) {
    controller120.update(8.33, () => {
      moves120++;
      return true;
    });
  }

  // Test 60Hz (16.67ms step) over exact same 300ms duration
  const controller60 = new HandlingController({ dasDelayMs: 167, arrRateMs: 33, softDropFactor: 20 });
  let moves60 = 0;
  controller60.startMove('right', () => {
    moves60++;
    return true;
  });

  for (let t = 0; t < 300; t += 16.67) {
    controller60.update(16.67, () => {
      moves60++;
      return true;
    });
  }

  // Both 120Hz and 60Hz must yield the exact same move count!
  assert.equal(moves120, moves60, `120Hz (${moves120}) and 60Hz (${moves60}) move count must be identical`);
});

test('HandlingController while (dasTimer >= arrRate) catches up over lag spike without dropping moves', () => {
  const controller = new HandlingController({ dasDelayMs: 167, arrRateMs: 33, softDropFactor: 20 });
  let moves = 0;
  controller.startMove('left', () => {
    moves++;
    return true;
  });
  assert.equal(moves, 1);

  // Simulate a single large 267ms lag spike frame
  // 267ms: 167ms charges DAS (move #2) + 100ms ARR remainder (100 / 33 = 3 moves)
  // Total moves = 1 + 1 + 3 = 5
  controller.update(267, () => {
    moves++;
    return true;
  });

  assert.equal(moves, 5, 'Accumulator loop while (dasTimer >= arrRate) must execute all steps across spike');
});

test('HandlingController 0 ms ARR shifts continuously to wall', () => {
  const controller = new HandlingController({ dasDelayMs: 167, arrRateMs: 0, softDropFactor: 20 });
  let col = 4;
  controller.startMove('left', () => {
    if (col > 0) {
      col--;
      return true;
    }
    return false;
  });
  assert.equal(col, 3, 'First tap moved to col 3');

  // Trigger past DAS
  controller.update(200, () => {
    if (col > 0) {
      col--;
      return true;
    }
    return false;
  });

  assert.equal(col, 0, '0 ARR shifted all the way to wall (col 0)');
});

test('HandlingController soft drop factor divides base gravity correctly', () => {
  const controller = new HandlingController({ dasDelayMs: 167, arrRateMs: 33, softDropFactor: 20 });
  const baseGravity = 1000;

  // Not soft dropping
  assert.equal(controller.getEffectiveGravity(baseGravity), 1000);

  // Soft dropping active
  controller.setSoftDrop(true);
  assert.equal(controller.getEffectiveGravity(baseGravity), 50); // 1000 / 20 = 50ms

  // Custom factor 25x
  controller.updateConfig({ dasDelayMs: 167, arrRateMs: 33, softDropFactor: 25 });
  assert.equal(controller.getEffectiveGravity(baseGravity), 40); // 1000 / 25 = 40ms
});
