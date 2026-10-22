/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TetrisGame, GameEvent, ActionSplash } from './game/tetris_game';
import { GameMode } from './game/game_modes';
import { Position } from './game/models';
import { GameSettings, DEFAULT_GAME_SETTINGS, loadGameSettings, saveGameSettings } from './game/settings';
import { HandlingController } from './game/handling_controller';
import { TetrisBoard } from './components/TetrisBoard';
import { ActionSplashes } from './components/ActionSplashes';
import { HoldPiecePreview, NextPiecePreview } from './components/PiecePreviews';
import { StatsPanel } from './components/StatsPanel';
import { TouchGamepad } from './components/TouchGamepad';
import { GameOverModal } from './components/GameOverModal';
import { Pause, Download } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { StartModeModal } from './components/StartModeModal';
import { PauseModal } from './components/PauseModal';
import { soundManager } from './game/audio';
import { downloadProjectZip } from './utils/downloadZip';

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>('marathon');
  const [startLevel, setStartLevel] = useState<number>(1);

  // Unified Game Settings (Handling DAS/ARR/SDF/DCD, Visuals, Audio)
  const [settings, setSettings] = useState<GameSettings>(() => loadGameSettings());

  // Save settings on changes
  useEffect(() => {
    saveGameSettings(settings);
  }, [settings]);

  const [isStartModalOpen, setIsStartModalOpen] = useState<boolean>(
    () => typeof window !== 'undefined' && !window.location.search.includes('autostart=1')
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  // Action Splashes state (T-Spin, Tetris, B2B, Combo, Perfect Clear)
  const [splashes, setSplashes] = useState<ActionSplash[]>([]);

  // Exact engine from tetris_engine
  const gameRef = useRef<TetrisGame | null>(null);
  if (!gameRef.current) {
    gameRef.current = new TetrisGame(startLevel, gameMode);
    gameRef.current.lockDelayDuration = settings.lockDelayDuration;
    gameRef.current.maxLockResets = settings.maxLockResets;
    gameRef.current.lineClearDelayMs = settings.lineClearDelayMs;
    if (isStartModalOpen) {
      gameRef.current.isPaused = true;
    }
  }
  const game = gameRef.current;

  // Sync game rules whenever settings change
  useEffect(() => {
    game.lockDelayDuration = settings.lockDelayDuration;
    game.maxLockResets = settings.maxLockResets;
    game.lineClearDelayMs = settings.lineClearDelayMs;
  }, [game, settings.lockDelayDuration, settings.maxLockResets, settings.lineClearDelayMs]);

  // Dedicated Delta-Time Handling Controller
  const handlingRef = useRef<HandlingController | null>(null);
  if (!handlingRef.current) {
    handlingRef.current = new HandlingController({
      dasDelayMs: settings.dasDelayMs,
      arrRateMs: settings.arrRateMs,
      softDropFactor: settings.softDropFactor,
    });
  }
  const handling = handlingRef.current;

  // Sync HandlingController whenever user alters settings
  useEffect(() => {
    handling.updateConfig({
      dasDelayMs: settings.dasDelayMs,
      arrRateMs: settings.arrRateMs,
      softDropFactor: settings.softDropFactor,
    });
  }, [handling, settings.dasDelayMs, settings.arrRateMs, settings.softDropFactor]);

  // Keys currently held down (to prevent duplicate keydown triggers & handle SOCD)
  const keysDownRef = useRef<Set<string>>(new Set());

  // React state trigger for rendering
  const [, setTick] = useState<number>(0);
  const [timeMs, setTimeMs] = useState<number>(0);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [flashingCells, setFlashingCells] = useState<Position[]>([]);

  // Time tracking
  const lastTimeRef = useRef<number | null>(null);
  const gravityAccumulatorRef = useRef<number>(0);
  const timeElapsedRef = useRef<number>(0);

  const sync = useCallback(() => {
    setTick((t) => (t + 1) % 100000);
  }, []);

  // Hook up audio settings
  useEffect(() => {
    soundManager.enabled = settings.soundEnabled;
    soundManager.hapticsEnabled = settings.hapticsEnabled;
  }, [settings.soundEnabled, settings.hapticsEnabled]);

  // Hook up engine events
  useEffect(() => {
    const unsub = game.addEventListener((e: GameEvent) => {
      switch (e.type) {
        case 'spawn':
          // Reset DAS state for newly spawned piece per Tetris Guideline
          handling.resetDas();
          break;
        case 'move':
          soundManager.playMove();
          break;
        case 'rotate':
          soundManager.playRotate();
          break;
        case 'softDrop':
          soundManager.playSoftDrop();
          break;
        case 'hardDrop':
          soundManager.playHardDrop();
          break;
        case 'hold':
          soundManager.playHold();
          break;
        case 'lock':
          // Flash the locking piece bright white for 70ms!
          setFlashingCells([...e.cells]);
          setTimeout(() => {
            setFlashingCells([]);
          }, 70);
          break;
        case 'lineClear':
          soundManager.playLineClear(e.isTetris);
          setClearingRows([...e.clearedIndices]);
          if (e.actionSplash) {
            const splash = e.actionSplash;
            setSplashes((prev) => [...prev.slice(-2), splash]);
            setTimeout(() => {
              setSplashes((prev) => prev.filter((s) => s.id !== splash.id));
            }, 800);
          }
          setTimeout(() => {
            setClearingRows([]);
          }, 120);
          break;
        case 'gameOver':
          soundManager.playGameOver();
          setIsGameOverModalOpen(true);
          handling.reset();
          keysDownRef.current.clear();
          try {
            const raw = localStorage.getItem(`tetris_${e.mode}_scores`);
            const scores = raw ? JSON.parse(raw) : [];
            scores.push({
              score: e.score,
              lines: e.lines,
              level: game.levelState.level,
              date: new Date().toISOString(),
            });
            scores.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
            localStorage.setItem(`tetris_${e.mode}_scores`, JSON.stringify(scores.slice(0, 10)));
          } catch {}
          break;
      }
      sync();
    });

    return () => unsub();
  }, [game, handling, sync]);

  // Main Game Loop using requestAnimationFrame with Delta Time
  useEffect(() => {
    let animId: number;

    const loop = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const delta = Math.min(now - lastTimeRef.current, 100);
      lastTimeRef.current = now;

      if (!game.isGameOver && !game.isPaused && !isStartModalOpen) {
        timeElapsedRef.current += delta;
        setTimeMs(timeElapsedRef.current);

        // Ultra mode: 3 minutes time limit
        if (game.gameMode === 'ultra' && timeElapsedRef.current >= 180000) {
          game.endDueToTimeUp();
          sync();
          return;
        }

        // 1. Process Delta-Time DAS and ARR piece movement with SOCD Last-Input Win
        handling.update(delta, (dir) => {
          let moved = false;
          if (dir === 'left') {
            moved = game.moveLeft();
          } else {
            moved = game.moveRight();
          }
          if (moved) sync();
          return moved;
        });

        // 2. Process Delta-Time Gravity with Soft Drop Factor (SDF) - Apotris style
        // Separate gravity from Lock Delay: downward movement is ONLY executed
        // if there is empty space below piece (!game.checkCollision('down')) and not line clearing.
        if (!game.checkCollision('down') && !game.isLineClearing) {
          const baseGravity = game.levelState.gravityMs;
          const effectiveInterval = handling.getEffectiveGravity(baseGravity);
          gravityAccumulatorRef.current += delta;

          while (gravityAccumulatorRef.current >= effectiveInterval) {
            gravityAccumulatorRef.current -= effectiveInterval;
            if (!game.checkCollision('down') && !game.isLineClearing) {
              const moved = game.softDrop();
              sync();
              if (!moved) {
                gravityAccumulatorRef.current = 0;
                break;
              }
            } else {
              gravityAccumulatorRef.current = 0;
              break;
            }
          }
        } else {
          // If piece is resting on floor/blocks, or during line clearing:
          // Downward gravity is cleared to prevent phantom acceleration!
          gravityAccumulatorRef.current = 0;
        }

        // 3. Independent Lock Delay & Line Clear Delay check:
        // When piece is on floor, lockDelayTimer ticks independently up to lockDelayDuration (500ms).
        // Successful left/right shifts and rotations reset lockDelayTimer back to 0 (up to 15 resets).
        // Piece locks ONLY after lockDelayDuration (500ms) of inactivity on floor or on Hard Drop!
        game.update(delta);
        sync();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [game, handling, isStartModalOpen, sync]);

  // Change mode
  const handleSelectMode = useCallback(
    (mode: GameMode) => {
      setGameMode(mode);
      game.reset(startLevel, mode);
      handling.reset();
      keysDownRef.current.clear();
      timeElapsedRef.current = 0;
      setTimeMs(0);
      gravityAccumulatorRef.current = 0;
      lastTimeRef.current = null;
      setIsGameOverModalOpen(false);
      setSplashes([]);
      sync();
    },
    [game, handling, startLevel, sync]
  );

  const handleStartGame = useCallback(() => {
    setIsStartModalOpen(false);
    game.reset(startLevel, gameMode);
    game.isPaused = false;
    handling.reset();
    keysDownRef.current.clear();
    timeElapsedRef.current = 0;
    setTimeMs(0);
    gravityAccumulatorRef.current = 0;
    lastTimeRef.current = null;
    setSplashes([]);
    sync();
  }, [game, handling, startLevel, gameMode, sync]);

  // Directional move helper for SOCD
  const executeMove = useCallback(
    (dir: 'left' | 'right') => {
      return dir === 'left' ? game.moveLeft() : game.moveRight();
    },
    [game]
  );

  // Controls
  const handleSoftDrop = useCallback(() => {
    const moved = game.softDrop();
    sync();
    return moved;
  }, [game, sync]);

  const handleHardDrop = useCallback(() => {
    game.hardDrop();
    handling.triggerDcd(settings.dcdDelayMs);
    sync();
  }, [game, handling, settings.dcdDelayMs, sync]);

  const handleRotateCW = useCallback(() => {
    game.rotateCW();
    sync();
  }, [game, sync]);

  const handleRotateCCW = useCallback(() => {
    game.rotateCCW();
    sync();
  }, [game, sync]);

  const handleRotate180 = useCallback(() => {
    game.rotate180();
    sync();
  }, [game, sync]);

  const handleHold = useCallback(() => {
    game.hold();
    sync();
  }, [game, sync]);

  const handleRestart = useCallback(() => {
    game.reset(startLevel, gameMode);
    game.isPaused = false;
    handling.reset();
    keysDownRef.current.clear();
    timeElapsedRef.current = 0;
    setTimeMs(0);
    gravityAccumulatorRef.current = 0;
    lastTimeRef.current = null;
    setIsGameOverModalOpen(false);
    setSplashes([]);
    sync();
  }, [game, handling, startLevel, gameMode, sync]);

  const handleTogglePause = useCallback(() => {
    if (isStartModalOpen) return;
    game.isPaused = !game.isPaused;
    handling.reset();
    keysDownRef.current.clear();
    sync();
  }, [game, handling, isStartModalOpen, sync]);

  // Touch gamepad continuous hold handlers with strict SOCD Last-Input Win
  const handleTouchMoveLeftStart = useCallback(() => {
    if (game.isGameOver || game.isPaused || isStartModalOpen) return;
    handling.pressDirection('left', executeMove);
    sync();
  }, [game, handling, isStartModalOpen, executeMove, sync]);

  const handleTouchMoveLeftEnd = useCallback(() => {
    handling.releaseDirection('left', executeMove);
    sync();
  }, [handling, executeMove, sync]);

  const handleTouchMoveRightStart = useCallback(() => {
    if (game.isGameOver || game.isPaused || isStartModalOpen) return;
    handling.pressDirection('right', executeMove);
    sync();
  }, [game, handling, isStartModalOpen, executeMove, sync]);

  const handleTouchMoveRightEnd = useCallback(() => {
    handling.releaseDirection('right', executeMove);
    sync();
  }, [handling, executeMove, sync]);

  const handleTouchSoftDropStart = useCallback(() => {
    if (game.isGameOver || game.isPaused || isStartModalOpen) return;
    handling.setSoftDrop(true);
    handleSoftDrop();
  }, [game, handling, isStartModalOpen, handleSoftDrop]);

  const handleTouchSoftDropEnd = useCallback(() => {
    handling.setSoftDrop(false);
  }, [handling]);

  // Keyboard navigation with SOCD Last-Input Win and Delta-Time DAS/ARR/SDF
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isStartModalOpen || isSettingsOpen || isGameOverModalOpen) return;

      const keysDown = keysDownRef.current;
      if (keysDown.has(e.code)) return;
      keysDown.add(e.code);

      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          handling.pressDirection('left', executeMove);
          sync();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handling.pressDirection('right', executeMove);
          sync();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handling.setSoftDrop(true);
          handleSoftDrop();
          break;
        case 'ArrowUp':
        case 'KeyX':
          e.preventDefault();
          handleRotateCW();
          break;
        case 'KeyZ':
          e.preventDefault();
          handleRotateCCW();
          break;
        case 'KeyA':
          e.preventDefault();
          handleRotate180();
          break;
        case 'Space':
          e.preventDefault();
          handleHardDrop();
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          e.preventDefault();
          handleHold();
          break;
        case 'KeyP':
        case 'Escape':
          e.preventDefault();
          handleTogglePause();
          break;
        case 'KeyR':
          e.preventDefault();
          handleRestart();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keysDown = keysDownRef.current;
      keysDown.delete(e.code);

      if (e.code === 'ArrowLeft') {
        handling.releaseDirection('left', executeMove);
        sync();
      } else if (e.code === 'ArrowRight') {
        handling.releaseDirection('right', executeMove);
        sync();
      } else if (e.code === 'ArrowDown') {
        handling.setSoftDrop(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    handling,
    executeMove,
    handleSoftDrop,
    handleRotateCW,
    handleRotateCCW,
    handleRotate180,
    handleHardDrop,
    handleHold,
    handleTogglePause,
    handleRestart,
    isStartModalOpen,
    isSettingsOpen,
    isGameOverModalOpen,
    sync,
  ]);

  return (
    <div
      data-testid="app-container"
      className="min-h-[100dvh] max-h-[100dvh] h-[100dvh] w-full bg-black text-white flex flex-col justify-between items-center overflow-hidden touch-none select-none px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {/* Visual Top Margin / Spacing Area with Download and Pause Buttons */}
      <header className="w-full max-w-[420px] flex items-center justify-between px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pb-1 select-none">
        <button
          type="button"
          onClick={downloadProjectZip}
          aria-label="Download project ZIP"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121217] border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition cursor-pointer active:scale-95 shadow-sm text-xs font-semibold"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>ZIP</span>
        </button>

        <button
          type="button"
          onClick={handleTogglePause}
          aria-label="Pause game"
          className="p-2 sm:p-2.5 rounded-xl bg-[#121217] border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition cursor-pointer active:scale-95 shadow-sm"
        >
          <Pause className="w-5 h-5 stroke-[2]" />
        </button>
      </header>

      {/* Main Playfield Area */}
      <main className="w-full max-w-[420px] flex-1 flex items-start justify-center pt-1 pb-1">
        <div className="w-full flex items-start justify-between px-1.5 gap-2">
          {/* Left Column: HOLD & Stats (SCORE, Lv, LINE, PIECE, 00:00.80, MARATHON/SPRINT/ULTRA/ZEN) */}
          <div className="w-20 sm:w-24 flex flex-col items-start pt-0 space-y-3">
            <HoldPiecePreview piece={game.holdPiece} canHold={game.canHold} />
            <StatsPanel
              score={game.scoreState.score}
              level={game.levelState.level}
              lines={game.levelState.linesCleared}
              pieceCount={game.pieceCount}
              timeMs={timeMs}
              gameMode={gameMode}
            />
          </div>

          {/* Center Column: Open-top 10x20 Tetris Matrix with thinner contours & Action Splashes overlay */}
          <div className="flex-1 flex justify-center relative">
            <TetrisBoard
              board={game.board}
              activePiece={game.activePiece}
              ghostPiece={game.ghostPiece}
              clearingRows={clearingRows}
              flashingCells={flashingCells}
              showGhost={settings.showGhost}
              showGhostOutline={settings.showGhostOutline}
              ghostOpacity={settings.ghostOpacity}
              showStackOutline={settings.showStackOutline}
              gridStyle={settings.gridStyle}
              gridOpacity={settings.gridOpacity}
              neonGlow={settings.neonGlow}
              neonIntensity={settings.neonIntensity}
            />
            {/* Animated Action Splashes (Tetris, T-Spin, B2B, Combo, Perfect Clear) */}
            <ActionSplashes splashes={splashes} />
          </div>

          {/* Right Column: NEXT Queue (5 solid upcoming pieces vertically stacked) */}
          <div className="w-20 sm:w-24 flex flex-col items-start pt-0">
            <NextPiecePreview queue={game.nextQueue} />
          </div>
        </div>
      </main>

      {/* Bottom Android Touch Gamepad (Continuous Delta-Time DAS/ARR & SDF with SOCD Last-Input Win) */}
      <footer className="w-full pt-1 pb-2">
        <TouchGamepad
          onMoveLeftStart={handleTouchMoveLeftStart}
          onMoveLeftEnd={handleTouchMoveLeftEnd}
          onMoveRightStart={handleTouchMoveRightStart}
          onMoveRightEnd={handleTouchMoveRightEnd}
          onSoftDropStart={handleTouchSoftDropStart}
          onSoftDropEnd={handleTouchSoftDropEnd}
          onHardDrop={handleHardDrop}
          onRotateCW={handleRotateCW}
          onRotateCCW={handleRotateCCW}
          onRotate180={handleRotate180}
          onHold={handleHold}
        />
      </footer>

      {/* Start Game Mode Selection Modal */}
      <StartModeModal
        isOpen={isStartModalOpen}
        selectedMode={gameMode}
        onSelectMode={handleSelectMode}
        startLevel={startLevel}
        onStartLevelChange={setStartLevel}
        onStartGame={handleStartGame}
      />

      {/* Pause Menu Modal (housing all controls & settings) */}
      <PauseModal
        isOpen={game.isPaused && !isStartModalOpen && !game.isGameOver && !isSettingsOpen}
        onResume={handleTogglePause}
        onRestart={handleRestart}
        onOpenSettings={() => setIsSettingsOpen(true)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        hapticsEnabled={settings.hapticsEnabled}
        onToggleHaptics={() => setSettings((s) => ({ ...s, hapticsEnabled: !s.hapticsEnabled }))}
        gameMode={gameMode}
        onSelectMode={handleSelectMode}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        score={game.scoreState.score}
        lines={game.levelState.linesCleared}
        level={game.levelState.level}
        pieceCount={game.pieceCount}
        timeMs={timeMs}
        isVictory={game.isVictory}
        gameMode={gameMode}
        onRestart={handleRestart}
      />

      {/* Full Settings Modal (with Handling DAS / ARR / SDF / DCD & Lock Delay Sliders) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gameMode={gameMode}
        onSelectMode={handleSelectMode}
        startLevel={startLevel}
        onStartLevelChange={(lvl) => {
          setStartLevel(lvl);
          game.reset(lvl, gameMode);
          sync();
        }}
        // Handling (DAS, ARR, SDF, DCD)
        dasDelayMs={settings.dasDelayMs}
        onDasDelayChange={(dasDelayMs) => setSettings((s) => ({ ...s, dasDelayMs }))}
        arrRateMs={settings.arrRateMs}
        onArrRateChange={(arrRateMs) => setSettings((s) => ({ ...s, arrRateMs }))}
        softDropFactor={settings.softDropFactor}
        onSoftDropFactorChange={(softDropFactor) => setSettings((s) => ({ ...s, softDropFactor }))}
        dcdDelayMs={settings.dcdDelayMs}
        onDcdDelayChange={(dcdDelayMs) => setSettings((s) => ({ ...s, dcdDelayMs }))}
        onResetHandlingDefaults={() =>
          setSettings((s) => ({
            ...s,
            dasDelayMs: DEFAULT_GAME_SETTINGS.dasDelayMs,
            arrRateMs: DEFAULT_GAME_SETTINGS.arrRateMs,
            softDropFactor: DEFAULT_GAME_SETTINGS.softDropFactor,
            dcdDelayMs: DEFAULT_GAME_SETTINGS.dcdDelayMs,
            lockDelayDuration: DEFAULT_GAME_SETTINGS.lockDelayDuration,
            maxLockResets: DEFAULT_GAME_SETTINGS.maxLockResets,
            lineClearDelayMs: DEFAULT_GAME_SETTINGS.lineClearDelayMs,
          }))
        }
        // Lock Delay (Infinity Rule) & Line Clear Delay
        lockDelayDuration={settings.lockDelayDuration}
        onLockDelayChange={(lockDelayDuration) => setSettings((s) => ({ ...s, lockDelayDuration }))}
        maxLockResets={settings.maxLockResets}
        onMaxLockResetsChange={(maxLockResets) => setSettings((s) => ({ ...s, maxLockResets }))}
        lineClearDelayMs={settings.lineClearDelayMs}
        onLineClearDelayChange={(lineClearDelayMs) => setSettings((s) => ({ ...s, lineClearDelayMs }))}
        // Audio & Haptics
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        hapticsEnabled={settings.hapticsEnabled}
        onToggleHaptics={() => setSettings((s) => ({ ...s, hapticsEnabled: !s.hapticsEnabled }))}
        // Visuals
        showGhost={settings.showGhost}
        onToggleGhost={() => setSettings((s) => ({ ...s, showGhost: !s.showGhost }))}
        showGhostOutline={settings.showGhostOutline}
        onToggleGhostOutline={() => setSettings((s) => ({ ...s, showGhostOutline: !s.showGhostOutline }))}
        ghostOpacity={settings.ghostOpacity}
        onGhostOpacityChange={(ghostOpacity) => setSettings((s) => ({ ...s, ghostOpacity }))}
        showStackOutline={settings.showStackOutline}
        onToggleStackOutline={() => setSettings((s) => ({ ...s, showStackOutline: !s.showStackOutline }))}
        gridStyle={settings.gridStyle}
        onGridStyleChange={(gridStyle) => setSettings((s) => ({ ...s, gridStyle }))}
        gridOpacity={settings.gridOpacity}
        onGridOpacityChange={(gridOpacity) => setSettings((s) => ({ ...s, gridOpacity }))}
        neonGlow={settings.neonGlow}
        onToggleNeonGlow={() => setSettings((s) => ({ ...s, neonGlow: !s.neonGlow }))}
        neonIntensity={settings.neonIntensity}
        onNeonIntensityChange={(neonIntensity) => setSettings((s) => ({ ...s, neonIntensity }))}
      />
    </div>
  );
}
