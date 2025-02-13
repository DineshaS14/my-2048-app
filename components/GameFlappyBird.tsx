"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ------------------------------
// Canvas and Game Constants
// ------------------------------
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_RADIUS = 15;
const PIPE_WIDTH = 60;
const PIPE_SPACING = 250; // horizontal distance between pipe pairs
const NUM_PIPES = Math.ceil(CANVAS_WIDTH / PIPE_SPACING) + 1;

// Physics constants
const GRAVITY = 800;             // pixels per second² (downward acceleration)
const FLAP_IMPULSE = -300;       // immediate upward velocity on flap
const MAX_DOWN_VELOCITY = 400;   // maximum downward velocity

// ------------------------------
// Type Definitions
// ------------------------------
/**
 * PipePair represents a pair of pipes.
 * - x: Horizontal position of the pipe pair.
 * - bottomY: y coordinate where the bottom pipe starts.
 * - gap: Vertical gap between the top (upside-down) and bottom pipes.
 * - scored: Flag to ensure the pair is scored only once.
 */
type PipePair = {
  x: number;
  bottomY: number;
  gap: number;
  scored: boolean;
};

// ------------------------------
// FlappyBird Component
// ------------------------------
const FlappyBird: React.FC = () => {
  // References to the canvas and game objects.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // birdRef holds the bird's position and vertical velocity.
  const birdRef = useRef({ x: 50, y: CANVAS_HEIGHT / 2, velocityY: 0 });
  // pipesRef holds the array of pipe pairs.
  const pipesRef = useRef<PipePair[]>([]);
  // lastTimestampRef is used to calculate deltaTime between frames.
  const lastTimestampRef = useRef<number>(0);
  // animationFrameId stores the current requestAnimationFrame ID.
  const animationFrameId = useRef<number>(0);

  // ------------------------------
  // Game State Variables
  // ------------------------------
  // gameState: 'start' before game begins, 'running' during play, and 'gameover' on loss.
  const [gameState, setGameState] = useState<'start' | 'running' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);

  // ------------------------------
  // Initialize Pipe Pairs
  // ------------------------------
  /**
   * initPipes creates an array of pipe pairs.
   * Each pipe pair is positioned offscreen to the right.
   */
  const initPipes = (): PipePair[] => {
    const pipes: PipePair[] = [];
    for (let i = 0; i < NUM_PIPES; i++) {
      // Position each pipe pair further to the right.
      const x = CANVAS_WIDTH + i * PIPE_SPACING;
      // bottomY is randomized to create a safe vertical margin.
      const bottomY = Math.random() * (CANVAS_HEIGHT - 300) + 150;
      // Fixed gap value for easier passage (adjust as needed).
      const gap = 110;
      pipes.push({ x, bottomY, gap, scored: false });
    }
    return pipes;
  };

  // ------------------------------
  // Reset Game Function
  // ------------------------------
  /**
   * resetGame resets all game parameters to their initial state.
   */
  const resetGame = () => {
    // Reset bird position and velocity.
    birdRef.current = { x: 50, y: CANVAS_HEIGHT / 2, velocityY: 0 };
    // Initialize new pipe pairs.
    pipesRef.current = initPipes();
    setScore(0);
    // Reset the timestamp for deltaTime calculations.
    lastTimestampRef.current = 0;
    // Set game state to running and unpause the game.
    setGameState('running');
    setPaused(false);
  };

  // ------------------------------
  // Main Game Loop (updateGame)
  // ------------------------------
  /**
   * updateGame is the main animation loop.
   * It updates the physics, moves the pipes, checks for collisions,
   * draws the game elements on the canvas, and then schedules the next frame.
   *
   * Wrapped in useCallback so that it is memoized and can be used safely as a dependency.
   */
  const updateGame = useCallback((timestamp: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // Calculate deltaTime in seconds
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
    const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = timestamp;

    // Clear the canvas and fill with a background color
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update physics only if the game is running and not paused
    if (gameState === 'running' && !paused) {
      // Apply gravity to the bird's vertical velocity
      birdRef.current.velocityY += GRAVITY * deltaTime;
      // Clamp the bird's downward velocity
      if (birdRef.current.velocityY > MAX_DOWN_VELOCITY) {
        birdRef.current.velocityY = MAX_DOWN_VELOCITY;
      }
      // Update bird's vertical position
      birdRef.current.y += birdRef.current.velocityY * deltaTime;
      
      // Calculate pipe speed which gradually increases over time
      const elapsed = timestamp;
      const basePipeSpeed = 100;
      const currentPipeSpeed = basePipeSpeed + elapsed / 30000;
      
      // Update each pipe pair's horizontal position
      pipesRef.current.forEach((pipe) => {
        pipe.x -= currentPipeSpeed * deltaTime;
        // If a pipe pair goes offscreen, reposition it to the right with new values.
        if (pipe.x + PIPE_WIDTH < 0) {
          pipe.x += NUM_PIPES * PIPE_SPACING;
          pipe.bottomY = Math.random() * (CANVAS_HEIGHT - 300) + 150;
          pipe.gap = 110;
          pipe.scored = false;
        }
      });

      // Check for collisions between the bird and pipes, and update score.
      pipesRef.current.forEach((pipe) => {
        // Check horizontal overlap
        if (
          birdRef.current.x + BIRD_RADIUS > pipe.x &&
          birdRef.current.x - BIRD_RADIUS < pipe.x + PIPE_WIDTH
        ) {
          // Check vertical boundaries of the gap:
          if (
            birdRef.current.y - BIRD_RADIUS < pipe.bottomY - pipe.gap ||
            birdRef.current.y + BIRD_RADIUS > pipe.bottomY
          ) {
            setGameState('gameover');
          }
        }
        // Increase score if the bird passes the pipe pair (only once per pair)
        if (!pipe.scored && birdRef.current.x > pipe.x + PIPE_WIDTH) {
          pipe.scored = true;
          setScore((prev) => prev + 1);
        }
      });
    }

    // ------------------------------
    // Drawing the Pipes
    // ------------------------------
    ctx.fillStyle = 'green';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    pipesRef.current.forEach((pipe) => {
      // Draw top (upside-down) pipe: from top of canvas to (bottomY - gap)
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.bottomY - pipe.gap);
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.bottomY - pipe.gap);
      // Draw bottom pipe: from bottomY to bottom of canvas
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY);
      ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY);
    });

    // ------------------------------
    // Drawing the Bird
    // ------------------------------
    // Calculate a rotation angle based on the bird's vertical velocity (clamped)
    const angle = Math.max(Math.min(birdRef.current.velocityY / 300, 0.5), -0.5);
    ctx.save();
    ctx.translate(birdRef.current.x, birdRef.current.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // ------------------------------
    // Drawing the Score on the Canvas
    // ------------------------------
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 50);

    // ------------------------------
    // Check for Boundary Collisions
    // ------------------------------
    if (birdRef.current.y + BIRD_RADIUS > CANVAS_HEIGHT) {
      birdRef.current.y = CANVAS_HEIGHT - BIRD_RADIUS;
      birdRef.current.velocityY = 0;
      setGameState('gameover');
    } else if (birdRef.current.y - BIRD_RADIUS < 0) {
      birdRef.current.y = BIRD_RADIUS;
      birdRef.current.velocityY = 0;
    }

    // ------------------------------
    // Drawing Overlays (Start, Game Over, Pause)
    // ------------------------------
    if (gameState === 'start') {
      // Start overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Flappy Bird', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '24px Arial';
      ctx.fillText('Click to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    } else if (gameState === 'gameover') {
      // Game Over overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '24px Arial';
      ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }

    if (paused) {
      // Pause overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Paused', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // Schedule the next frame
    animationFrameId.current = requestAnimationFrame(updateGame);
  // Dependencies for updateGame: we update when gameState or paused change.
  }, [gameState, paused]);

  // ------------------------------
  // useEffect to Start the Animation Loop
  // ------------------------------
  /**
   * This useEffect starts (or resumes) the animation loop whenever the game is running.
   * By including updateGame in the dependency array, we ensure that any changes
   * to its logic are properly captured.
   */
  useEffect(() => {
    if (gameState === 'running') {
      animationFrameId.current = requestAnimationFrame(updateGame);
    }
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [gameState, paused, updateGame]);

  // ------------------------------
  // Event Handlers
  // ------------------------------
  /**
   * handleJump is triggered when the canvas is clicked.
   * It starts or restarts the game if needed, or applies the flap impulse.
   */
  const handleJump = () => {
    if (gameState === 'start' || gameState === 'gameover') {
      resetGame();
    } else if (gameState === 'running' && !paused) {
      birdRef.current.velocityY = FLAP_IMPULSE;
    }
  };

  /**
   * togglePause toggles the paused state.
   * It also resets the lastTimestamp so that deltaTime remains accurate.
   */
  const togglePause = () => {
    if (gameState === 'running') {
      setPaused((prev) => !prev);
      lastTimestampRef.current = 0;
    }
  };

  // ------------------------------
  // JSX Render
  // ------------------------------
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Pause button (visible only when running) */}
      {gameState === 'running' && (
        <button
          className="absolute top-4 left-4 px-4 py-2 bg-white text-black rounded"
          onClick={togglePause}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
      )}
      <h1 className="text-5xl font-bold text-white mb-4">Flappy Bird</h1>
      {/* The canvas that displays the game */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleJump}
        className="border-8 border-gray-800 rounded-lg bg-blue-200"
      />
      <p className="text-white mt-4">
        Click to {gameState === 'start' || gameState === 'gameover' ? 'start' : 'flap'}
      </p>
    </div>
  );
};

export default FlappyBird;

