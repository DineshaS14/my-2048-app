"use client";

import React, { useEffect, useRef, useState } from 'react';

// Canvas and game constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_RADIUS = 15;
const PIPE_WIDTH = 60;
const PIPE_SPACING = 250; // horizontal distance between pipe pairs
const NUM_PIPES = Math.ceil(CANVAS_WIDTH / PIPE_SPACING) + 1;

// Physics constants
const GRAVITY = 800;             // pixels per second²
const FLAP_IMPULSE = -300;       // upward velocity on flap
const MAX_DOWN_VELOCITY = 400;   // maximum downward velocity

// Type definition for a pair of pipes
type PipePair = {
  x: number;        // horizontal position of the pair
  bottomY: number;  // y coordinate where the bottom pipe starts
  gap: number;      // vertical gap between the top and bottom pipes
  scored: boolean;  // flag to prevent multiple score counts per pair
};

const FlappyBird: React.FC = () => {
  // References to the canvas and game objects
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birdRef = useRef({ x: 50, y: CANVAS_HEIGHT / 2, velocityY: 0 });
  const pipesRef = useRef<PipePair[]>([]);
  const lastTimestampRef = useRef<number>(0);
  const animationFrameId = useRef<number>(0);

  // Game state variables
  const [gameState, setGameState] = useState<'start' | 'running' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);

  // Initialize pipe pairs based on the number needed
  const initPipes = (): PipePair[] => {
    const pipes: PipePair[] = [];
    for (let i = 0; i < NUM_PIPES; i++) {
      const x = CANVAS_WIDTH + i * PIPE_SPACING;
      const bottomY = Math.random() * (CANVAS_HEIGHT - 300) + 150; // safe vertical margin
      const gap = 110; // gap between 80 and 120
      pipes.push({ x, bottomY, gap, scored: false });
    }
    return pipes;
  };

  // Reset the game to its initial state
  const resetGame = () => {
    birdRef.current = { x: 50, y: CANVAS_HEIGHT / 2, velocityY: 0 };
    pipesRef.current = initPipes();
    setScore(0);
    lastTimestampRef.current = 0;
    setGameState('running');
    setPaused(false);
  };

  // Main game loop
  const updateGame = (timestamp: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // Compute the time elapsed since the last frame (in seconds)
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
    const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = timestamp;

    // Clear the canvas and draw the background
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Only update physics if the game is running and not paused
    if (gameState === 'running' && !paused) {
      // Update bird physics
      birdRef.current.velocityY += GRAVITY * deltaTime;
      if (birdRef.current.velocityY > MAX_DOWN_VELOCITY) {
        birdRef.current.velocityY = MAX_DOWN_VELOCITY;
      }
      birdRef.current.y += birdRef.current.velocityY * deltaTime;
      
      // Calculate a gradually increasing pipe speed (in pixels per second)
      const elapsed = timestamp;
      const basePipeSpeed = 100;
      const currentPipeSpeed = basePipeSpeed + elapsed / 30000;
      
      // Update each pipe pair's position
      pipesRef.current.forEach((pipe) => {
        pipe.x -= currentPipeSpeed * deltaTime;
        // When a pipe pair goes offscreen, reposition it to the right
        if (pipe.x + PIPE_WIDTH < 0) {
          pipe.x += NUM_PIPES * PIPE_SPACING;
          // Generate new random vertical values for a new gap
          pipe.bottomY = Math.random() * (CANVAS_HEIGHT - 300) + 150;
          pipe.gap = 110;
          pipe.scored = false;
        }
      });

      // Check for collisions and update the score
      pipesRef.current.forEach((pipe) => {
        // Collision detection: if the bird overlaps horizontally with the pipe...
        if (
          birdRef.current.x + BIRD_RADIUS > pipe.x &&
          birdRef.current.x - BIRD_RADIUS < pipe.x + PIPE_WIDTH
        ) {
          // ...and if the bird is above the bottom of the top pipe
          // or below the top of the bottom pipe, it's a hit.
          if (
            birdRef.current.y - BIRD_RADIUS < pipe.bottomY - pipe.gap ||
            birdRef.current.y + BIRD_RADIUS > pipe.bottomY
          ) {
            setGameState('gameover');
          }
        }
        // Score: when the bird passes the pipe pair (only count once per pair)
        if (!pipe.scored && birdRef.current.x > pipe.x + PIPE_WIDTH) {
          pipe.scored = true;
          setScore((prev) => prev + 1);
        }
      });
    }

    // Draw the pipe pairs
    ctx.fillStyle = 'green';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    pipesRef.current.forEach((pipe) => {
      // Top (upside-down) pipe: drawn from the top of the canvas to (bottomY - gap)
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.bottomY - pipe.gap);
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.bottomY - pipe.gap);
      // Bottom pipe: drawn from bottomY to the bottom of the canvas
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY);
      ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY);
    });

    // Draw the bird with rotation based on its vertical velocity
    // Calculate a clamped rotation angle (in radians)
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

    // Draw the score at the top center
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 50);

    // Check collisions with canvas boundaries
    if (birdRef.current.y + BIRD_RADIUS > CANVAS_HEIGHT) {
      birdRef.current.y = CANVAS_HEIGHT - BIRD_RADIUS;
      birdRef.current.velocityY = 0;
      setGameState('gameover');
    } else if (birdRef.current.y - BIRD_RADIUS < 0) {
      birdRef.current.y = BIRD_RADIUS;
      birdRef.current.velocityY = 0;
    }

    // Overlay messages for start and game over states
    if (gameState === 'start') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Flappy Bird', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '24px Arial';
      ctx.fillText('Click to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    } else if (gameState === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '24px Arial';
      ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }

    // If the game is paused, overlay a pause message
    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Paused', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // Continue the animation loop
    animationFrameId.current = requestAnimationFrame(updateGame);
  };

  // Start or resume the animation loop when the game is running
  useEffect(() => {
    if (gameState === 'running') {
      animationFrameId.current = requestAnimationFrame(updateGame);
    }
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [gameState, paused]);

  // Handle tap/click: start/restart the game or flap the bird
  const handleJump = () => {
    if (gameState === 'start' || gameState === 'gameover') {
      resetGame();
    } else if (gameState === 'running' && !paused) {
      birdRef.current.velocityY = FLAP_IMPULSE;
    }
  };

  // Toggle the pause state
  const togglePause = () => {
    if (gameState === 'running') {
      setPaused((prev) => !prev);
      // Reset lastTimestamp so deltaTime stays accurate when resuming
      lastTimestampRef.current = 0;
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Pause button (visible only when the game is running) */}
      {gameState === 'running' && (
        <button
          className="absolute top-4 left-4 px-4 py-2 bg-white text-black rounded"
          onClick={togglePause}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
      )}
      <h1 className="text-5xl font-bold text-white mb-4">Flappy Bird</h1>
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
