/**
 * Delta-Time Handling Controller for Competitive Guideline Piece Movement
 * Independent of screen refresh rate (60Hz, 90Hz, 120Hz, 144Hz, variable FPS).
 *
 * Implements:
 * 1. Immediate 1st tap response on press.
 * 2. Strict SOCD (Simultaneous Opposing Cardinal Directions) Last-Input Win priority.
 * 3. DAS (Delayed Auto Shift) delay threshold in milliseconds.
 * 4. ARR (Auto Repeat Rate) delta-time accumulator loop: `while (dasTimer >= arrRate)`.
 * 5. 0 ms ARR instant shift to wall without event loop freezing on 120Hz+ screens.
 * 6. DCD (DAS Cut Delay): brief freeze of DAS auto-repeat after hard-drop.
 * 7. Soft Drop Factor (SDF) dividing base gravity interval.
 */

export type MoveDirection = 'left' | 'right';

export interface HandlingConfig {
  dasDelayMs: number;     // e.g. 167 ms (~10 frames @ 60 FPS)
  arrRateMs: number;      // e.g. 33 ms (~2 frames @ 60 FPS), 0 = instant
  softDropFactor: number; // e.g. 20.0x gravity multiplier
}

export class HandlingController {
  public dasDelayMs: number;
  public arrRateMs: number;
  public softDropFactor: number;

  // Active repeating direction under SOCD Last-Input Win
  public heldDirection: MoveDirection | null = null;
  public isLeftHeld: boolean = false;
  public isRightHeld: boolean = false;

  public dasTimer: number = 0;
  public isDasCharged: boolean = false;
  public isSoftDropping: boolean = false;

  // DCD (DAS Cut Delay) timer in ms
  public dcdTimer: number = 0;

  constructor(config: HandlingConfig) {
    this.dasDelayMs = config.dasDelayMs;
    this.arrRateMs = config.arrRateMs;
    this.softDropFactor = config.softDropFactor;
  }

  public updateConfig(config: HandlingConfig): void {
    this.dasDelayMs = config.dasDelayMs;
    this.arrRateMs = config.arrRateMs;
    this.softDropFactor = config.softDropFactor;
  }

  /**
   * SOCD Last-Input Win: Press direction.
   * If the opposing direction is already held, prioritizes the new input immediately,
   * performs an instant 1-cell shift, and restarts DAS timing.
   */
  public pressDirection(dir: MoveDirection, onMove: (d: MoveDirection) => boolean): void {
    if (dir === 'left') {
      this.isLeftHeld = true;
    } else {
      this.isRightHeld = true;
    }

    // Switch active direction to the latest input
    this.heldDirection = dir;
    this.dasTimer = 0;
    this.isDasCharged = false;
    onMove(dir);
  }

  /**
   * SOCD Last-Input Win: Release direction.
   * If the opposing direction is still held, immediately resumes movement in that direction.
   */
  public releaseDirection(dir: MoveDirection, onMove?: (d: MoveDirection) => boolean): void {
    if (dir === 'left') {
      this.isLeftHeld = false;
      if (this.isRightHeld) {
        // Fall back to Right
        this.heldDirection = 'right';
        this.dasTimer = 0;
        this.isDasCharged = false;
        if (onMove) onMove('right');
      } else {
        this.heldDirection = null;
        this.dasTimer = 0;
        this.isDasCharged = false;
      }
    } else {
      this.isRightHeld = false;
      if (this.isLeftHeld) {
        // Fall back to Left
        this.heldDirection = 'left';
        this.dasTimer = 0;
        this.isDasCharged = false;
        if (onMove) onMove('left');
      } else {
        this.heldDirection = null;
        this.dasTimer = 0;
        this.isDasCharged = false;
      }
    }
  }

  /**
   * Backward-compatible aliases for single button / event callers
   */
  public startMove(dir: MoveDirection, onMove: (d: MoveDirection) => boolean): void {
    this.pressDirection(dir, onMove);
  }

  public endMove(dir: MoveDirection, onMove?: (d: MoveDirection) => boolean): void {
    this.releaseDirection(dir, onMove);
  }

  /**
   * Set active soft drop state (holding down ArrowDown or touch down button).
   */
  public setSoftDrop(active: boolean): void {
    this.isSoftDropping = active;
  }

  /**
   * Trigger DAS Cut Delay (DCD) in milliseconds (e.g. 16-33 ms)
   * Freezes DAS repetition briefly to protect newly spawned pieces after hard drop.
   */
  public triggerDcd(ms: number): void {
    if (ms > 0) {
      this.dcdTimer = ms;
    }
  }

  public reset(): void {
    this.heldDirection = null;
    this.isLeftHeld = false;
    this.isRightHeld = false;
    this.dasTimer = 0;
    this.isDasCharged = false;
    this.isSoftDropping = false;
    this.dcdTimer = 0;
  }

  /**
   * Resets DAS timer and charge status for a newly spawned piece per Tetris Guideline.
   */
  public resetDas(): void {
    this.dasTimer = 0;
    this.isDasCharged = false;
  }

  /**
   * Main per-frame handling update driven strictly by delta time (ms).
   * Safe for high-refresh-rate displays (120Hz/144Hz+) and zero-ARR instant shifts.
   */
  public update(deltaMs: number, onMove: (d: MoveDirection) => boolean): void {
    if (!this.heldDirection) return;

    // Handle DCD (DAS Cut Delay)
    if (this.dcdTimer > 0) {
      this.dcdTimer -= deltaMs;
      if (this.dcdTimer > 0) return;
    }

    this.dasTimer += deltaMs;

    if (!this.isDasCharged) {
      // Waiting for initial DAS delay to charge
      if (this.dasTimer >= this.dasDelayMs) {
        this.isDasCharged = true;
        this.dasTimer -= this.dasDelayMs;

        // Perform first auto-shift
        const moved = onMove(this.heldDirection);
        if (!moved) return;

        if (this.arrRateMs <= 0) {
          // Instant ARR: safely shift to wall up to maximum board width (10-20 cols)
          let steps = 0;
          while (onMove(this.heldDirection) && steps < 20) {
            steps++;
          }
          this.dasTimer = 0;
        } else {
          // Drain accumulated time in steps of arrRateMs
          let steps = 0;
          while (this.dasTimer >= this.arrRateMs && steps < 30) {
            this.dasTimer -= this.arrRateMs;
            steps++;
            if (!onMove(this.heldDirection)) break;
          }
        }
      }
    } else {
      // DAS is already charged; execute ARR repeats
      if (this.arrRateMs <= 0) {
        let steps = 0;
        while (onMove(this.heldDirection) && steps < 20) {
          steps++;
        }
        this.dasTimer = 0;
      } else {
        let steps = 0;
        while (this.dasTimer >= this.arrRateMs && steps < 30) {
          this.dasTimer -= this.arrRateMs;
          steps++;
          if (!onMove(this.heldDirection)) break;
        }
      }
    }
  }

  /**
   * Calculate effective gravity interval (ms per line drop)
   * When soft dropping, base gravity interval is divided by softDropFactor.
   */
  public getEffectiveGravity(baseGravityMs: number): number {
    if (!this.isSoftDropping) return baseGravityMs;
    const factor = Math.max(1, this.softDropFactor);
    return Math.max(1, baseGravityMs / factor);
  }
}
