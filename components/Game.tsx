'use client';
import React, { useState, useEffect, useCallback } from 'react';

const GRID_SIZE = 4;

// Initialize a 4x4 board and add two random tiles.
const getInitialBoard = () => {
  const board = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  return addRandomTile(addRandomTile(board));
};

// Helper to copy the board.
const copyBoard = (board: number[][]): number[][] => board.map(row => [...row]);

// Add a random tile (with value 2 or 4) to an empty cell.
const addRandomTile = (board: number[][]): number[][] => {
  const emptyCells: { x: number; y: number }[] = [];
  board.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell === 0) {
        emptyCells.push({ x: i, y: j });
      }
    });
  });
  if (emptyCells.length === 0) return board;
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newValue = Math.random() < 0.9 ? 2 : 4;
  const newBoard = copyBoard(board);
  newBoard[randomCell.x][randomCell.y] = newValue;
  return newBoard;
};

// Slide a row to the left by filtering zeros, merging equal numbers, and padding zeros to the end.
const slideRow = (row: number[]): { newRow: number[], scoreGained: number } => {
  const nonZero = row.filter(val => val !== 0);
  let result: number[] = [];
  let scoreGained = 0;
  for (let i = 0; i < nonZero.length; i++) {
    if (nonZero[i] === nonZero[i + 1]) {
      const mergedValue = nonZero[i] * 2;
      result.push(mergedValue);
      scoreGained += mergedValue;
      i++; // Skip the next cell since it's merged
    } else {
      result.push(nonZero[i]);
    }
  }
  while (result.length < GRID_SIZE) {
    result.push(0);
  }
  return { newRow: result, scoreGained };
};

// Move the board left.
const moveLeft = (board: number[][]): { board: number[][], scoreGained: number } => {
  let scoreGained = 0;
  const newBoard = board.map(row => {
    const { newRow, scoreGained: rowScore } = slideRow(row);
    scoreGained += rowScore;
    return newRow;
  });
  return { board: newBoard, scoreGained };
};

// Move the board right (reverse each row, slide, then reverse back).
const moveRight = (board: number[][]): { board: number[][], scoreGained: number } => {
  let scoreGained = 0;
  const newBoard = board.map(row => {
    const reversed = [...row].reverse();
    const { newRow, scoreGained: rowScore } = slideRow(reversed);
    scoreGained += rowScore;
    return newRow.reverse();
  });
  return { board: newBoard, scoreGained };
};

// Transpose the board (rows become columns).
const transpose = (board: number[][]): number[][] => {
  return board[0].map((_, i) => board.map(row => row[i]));
};

// Move the board up.
const moveUp = (board: number[][]): { board: number[][], scoreGained: number } => {
  const transposed = transpose(board);
  const { board: moved, scoreGained } = moveLeft(transposed);
  return { board: transpose(moved), scoreGained };
};

// Move the board down.
const moveDown = (board: number[][]): { board: number[][], scoreGained: number } => {
  const transposed = transpose(board);
  const { board: moved, scoreGained } = moveRight(transposed);
  return { board: transpose(moved), scoreGained };
};

// Check if two boards are equal.
const boardsEqual = (a: number[][], b: number[][]): boolean => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
};

// Check if no moves are possible.
const isGameOver = (board: number[][]): boolean => {
  // If there is any empty cell, the game is not over.
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (board[i][j] === 0) return false;
    }
  }
  // Check if any merge is possible.
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const current = board[i][j];
      // Check right and down neighbors.
      if (j < GRID_SIZE - 1 && board[i][j + 1] === current) return false;
      if (i < GRID_SIZE - 1 && board[i + 1][j] === current) return false;
    }
  }
  return true;
};

const Game: React.FC = () => {
  const [board, setBoard] = useState<number[][]>(getInitialBoard());
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Handle a move in the given direction.
  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;

    let moveFunc: ((board: number[][]) => { board: number[][], scoreGained: number }) | undefined;
    if (direction === 'up') moveFunc = moveUp;
    else if (direction === 'down') moveFunc = moveDown;
    else if (direction === 'left') moveFunc = moveLeft;
    else if (direction === 'right') moveFunc = moveRight;

    if (!moveFunc) return;

    const { board: newBoard, scoreGained } = moveFunc(board);
    if (!boardsEqual(board, newBoard)) {
      const boardWithNewTile = addRandomTile(newBoard);
      setBoard(boardWithNewTile);
      setScore(prevScore => prevScore + scoreGained);
      if (isGameOver(boardWithNewTile)) {
        setGameOver(true);
      }
    }
  }, [board, gameOver]);

  // Listen for keyboard arrow keys.
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        handleMove('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleMove('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handleMove('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleMove('right');
        break;
      default:
        break;
    }
  }, [handleMove]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset the game state.
  const resetGame = () => {
    setBoard(getInitialBoard());
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-xl font-semibold">Score: {score}</div>
      <div className="grid grid-cols-4 gap-2 bg-gray-500 p-2">
        {board.map((row, rowIndex) =>
          row.map((cell, cellIndex) => (
            <div 
              key={`${rowIndex}-${cellIndex}`}
              className={`w-20 h-20 flex items-center justify-center rounded 
              ${cell === 0 ? 'bg-gray-200' : 'bg-orange-300'} 
              text-2xl font-bold`}
            >
              {cell !== 0 ? cell : ''}
            </div>
          ))
        )}
      </div>
      {gameOver ? (
        <div className="mt-4">
          <div className="mb-2 text-2xl font-bold text-red-600">Game Over!</div>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Restart Game
          </button>
        </div>
      ) : (
        <div className="mt-4 text-sm text-gray-600">Use the arrow keys to play.</div>
      )}
    </div>
  );
};

export default Game;
