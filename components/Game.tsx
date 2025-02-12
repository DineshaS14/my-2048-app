'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';

const GRID_SIZE = 4;
const TILE_SIZE = 100; // pixels per tile
const CANVAS_SIZE = GRID_SIZE * TILE_SIZE;

//
// Color mapping for each tile value
//
const getTileColors = (value: number) => {
  const colors: { [key: number]: { background: string; text: string } } = {
    2: { background: '#eee4da', text: '#776e65' },
    4: { background: '#ede0c8', text: '#776e65' },
    8: { background: '#f2b179', text: '#ffffff' },
    16: { background: '#f59563', text: '#ffffff' },
    32: { background: '#f67c5f', text: '#ffffff' },
    64: { background: '#f65e3b', text: '#ffffff' },
    128: { background: '#edcf72', text: '#ffffff' },
    256: { background: '#edcc61', text: '#ffffff' },
    512: { background: '#edc850', text: '#ffffff' },
    1024: { background: '#edc53f', text: '#ffffff' },
    2048: { background: '#edc22e', text: '#ffffff' },
  };
  // For empty cells:
  if (value === 0) {
    return { background: '#cdc1b4', text: '#776e65' };
  }
  return colors[value] || { background: '#3c3a32', text: '#ffffff' };
};

//
// Game logic functions
//
const getInitialBoard = (): number[][] => {
  const board: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  return addRandomTile(addRandomTile(board));
};

const addRandomTile = (board: number[][]): number[][] => {
  const emptyCells: { x: number; y: number }[] = [];
  board.forEach((row, i) =>
    row.forEach((cell, j) => {
      if (cell === 0) emptyCells.push({ x: i, y: j });
    })
  );
  if (emptyCells.length === 0) return board;
  const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[x][y] = Math.random() < 0.9 ? 2 : 4;
  // Return a deep copy of the board.
  return board.map((row) => [...row]);
};

const arraysEqual = (a: number[][], b: number[][]): boolean => {
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
};

const transpose = (board: number[][]): number[][] =>
  board[0].map((_, i) => board.map((row) => row[i]));

const moveRowLeft = (row: number[]): { newRow: number[]; score: number } => {
  let newRow = row.filter((val) => val !== 0);
  let score = 0;
  for (let i = 0; i < newRow.length - 1; i++) {
    if (newRow[i] === newRow[i + 1]) {
      newRow[i] *= 2;
      score += newRow[i];
      newRow[i + 1] = 0;
      i++;
    }
  }
  newRow = newRow.filter((val) => val !== 0);
  while (newRow.length < GRID_SIZE) {
    newRow.push(0);
  }
  return { newRow, score };
};

const moveLeft = (board: number[][]): { newBoard: number[][]; totalScore: number } => {
  let newBoard: number[][] = [];
  let totalScore = 0;
  for (let i = 0; i < board.length; i++) {
    const { newRow, score } = moveRowLeft(board[i]);
    newBoard.push(newRow);
    totalScore += score;
  }
  return { newBoard, totalScore };
};

const moveRight = (board: number[][]): { newBoard: number[][]; totalScore: number } => {
  let newBoard: number[][] = [];
  let totalScore = 0;
  for (let i = 0; i < board.length; i++) {
    const reversedRow = [...board[i]].reverse();
    const { newRow, score } = moveRowLeft(reversedRow);
    newBoard.push(newRow.reverse());
    totalScore += score;
  }
  return { newBoard, totalScore };
};

const moveUp = (board: number[][]): { newBoard: number[][]; totalScore: number } => {
  const transposed = transpose(board);
  const { newBoard: moved, totalScore } = moveLeft(transposed);
  return { newBoard: transpose(moved), totalScore };
};

const moveDown = (board: number[][]): { newBoard: number[][]; totalScore: number } => {
  const transposed = transpose(board);
  const { newBoard: moved, totalScore } = moveRight(transposed);
  return { newBoard: transpose(moved), totalScore };
};

const isGameOver = (board: number[][]): boolean => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (board[i][j] === 0) return false;
    }
  }
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (j < GRID_SIZE - 1 && board[i][j] === board[i][j + 1]) return false;
      if (i < GRID_SIZE - 1 && board[i][j] === board[i + 1][j]) return false;
    }
  }
  return true;
};

//
// Canvas game component with an attractive background and overlays on canvas
//
const CanvasGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [board, setBoard] = useState<number[][]>(getInitialBoard());
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Draw the board on the canvas
  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Loop through the board and draw each tile
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const value = board[i][j];
        const { background, text } = getTileColors(value);
        const x = j * TILE_SIZE;
        const y = i * TILE_SIZE;

        // Draw tile background with padding
        ctx.fillStyle = background;
        ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);

        // Draw a thicker, darker gray border around each tile
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#444444';
        ctx.strokeRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);

        // Draw the number if the tile is non-zero.
        if (value !== 0) {
          ctx.fillStyle = text;
          ctx.font = 'bold 32px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(value), x + TILE_SIZE / 2, y + TILE_SIZE / 2);
        }
      }
    }
  }, [board]);

  useEffect(() => {
    drawBoard();
  }, [board, drawBoard]);

  // Handle keyboard input for moves
  const handleMove = (direction: string) => {
    if (gameOver) return;

    let moveResult:
      | { newBoard: number[][]; totalScore: number }
      | undefined = undefined;

    switch (direction) {
      case 'up':
        moveResult = moveUp(board);
        break;
      case 'down':
        moveResult = moveDown(board);
        break;
      case 'left':
        moveResult = moveLeft(board);
        break;
      case 'right':
        moveResult = moveRight(board);
        break;
      default:
        return;
    }

    if (moveResult) {
      const { newBoard, totalScore } = moveResult;
      if (!arraysEqual(board, newBoard)) {
        const boardWithNewTile = addRandomTile(newBoard);
        const newScore = score + totalScore;
        setScore(newScore);
        if (newScore > bestScore) setBestScore(newScore);
        setBoard(boardWithNewTile);
        if (isGameOver(boardWithNewTile)) {
          setGameOver(true);
        }
      }
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const moves: { [key in 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight']: string } = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      if (moves[e.key as keyof typeof moves]) {
        e.preventDefault();
        handleMove(moves[e.key as keyof typeof moves]);
      }
    },
    [board, score, gameOver]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const newGame = () => {
    setBoard(getInitialBoard());
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-500 to-purple-600">
      <h1 className="text-5xl font-bold text-white mb-4">2048 By DinDin</h1>
      <div className="flex justify-between w-80 mb-4 space-x-4">
        <div className="bg-[#bbada0] text-white px-4 border-solid border-black py-2 rounded">Score: {score}</div>&nbsp;&nbsp;&nbsp;
        <div className="bg-[#bbada0] text-white px-4 py-2 rounded">Best: {bestScore}</div>
      </div>
      <button
        onClick={newGame}
        className="bg-orange-300 border border-black text-black px-8 py-4 rounded hover:bg-orange-400 text-2xl mb-4"
      >
        New Game
      </button>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border-8 border-gray-800 rounded-lg"
        />
        {/* Start overlay: show Play button on top of the board until game is started */}
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg">
            <button
              onClick={() => setGameStarted(true)}
              className="bg-orange-700 border border-black text-white px-8 py-4 rounded hover:bg-orange-800 text-2xl"
            >
              Play
            </button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 rounded-lg">
            <h2 className="text-4xl font-bold text-white mb-4">Game Over!</h2>
            <button
              onClick={newGame}
              className="bg-red-500 border border-black text-white px-6 py-3 rounded hover:bg-red-600 text-2xl"
            >
              Restart
            </button>
          </div>
        )}
      </div>
      <div className="mt-6 p-4 border-4 border-black rounded-lg bg-yellow-100 max-w-md shadow-xl">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Game Rules</h2>
        <ul className="list-disc list-inside text-gray-700 border-4 border-black border-solid p-4 bg-white rounded-lg">
          <li>Use the arrow keys to move the tiles.</li>
          <li>Tiles with the same number merge when they touch.</li>
          <li>A new tile appears after each move.</li>
          <li>Reach 2048 to win—but no win overlay; keep playing!</li>
        </ul>
      </div>
    </div>
  );
};

export default CanvasGame;
