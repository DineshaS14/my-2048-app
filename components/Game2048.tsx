"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// ------------------------------
// Constants and Helper Functions
// ------------------------------

// Grid size (4x4 board for 2048)
const GRID_SIZE = 4;
// Size of each tile in pixels
const TILE_SIZE = 100;
// Canvas size (width and height)
const CANVAS_SIZE = GRID_SIZE * TILE_SIZE;

/**
 * Returns the background and text colors for a given tile value.
 * If the tile is empty (value 0), returns the color for empty cells.
 */
const getTileColors = (value: number) => {
  const colors: { [key: number]: { background: string; text: string } } = {
    2: { background: "#eee4da", text: "#776e65" },
    4: { background: "#ede0c8", text: "#776e65" },
    8: { background: "#f2b179", text: "#ffffff" },
    16: { background: "#f59563", text: "#ffffff" },
    32: { background: "#f67c5f", text: "#ffffff" },
    64: { background: "#f65e3b", text: "#ffffff" },
    128: { background: "#edcf72", text: "#ffffff" },
    256: { background: "#edcc61", text: "#ffffff" },
    512: { background: "#edc850", text: "#ffffff" },
    1024: { background: "#edc53f", text: "#ffffff" },
    2048: { background: "#edc22e", text: "#ffffff" },
  };
  // Color for empty cells:
  if (value === 0) {
    return { background: "#cdc1b4", text: "#776e65" };
  }
  return colors[value] || { background: "#3c3a32", text: "#ffffff" };
};

/**
 * Creates and returns an initial board with all cells set to 0,
 * then adds two random tiles (2 or 4) to the board.
 */
const getInitialBoard = (): number[][] => {
  const board: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  return addRandomTile(addRandomTile(board));
};

/**
 * Adds a random tile (2 or 4) in one of the empty cells on the board.
 * Returns a deep copy of the board after modification.
 */
const addRandomTile = (board: number[][]): number[][] => {
  const emptyCells: { x: number; y: number }[] = [];
  board.forEach((row, i) =>
    row.forEach((cell, j) => {
      if (cell === 0) emptyCells.push({ x: i, y: j });
    })
  );
  if (emptyCells.length === 0) return board;
  const { x, y } =
    emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[x][y] = Math.random() < 0.9 ? 2 : 4;
  // Return a deep copy to ensure state updates occur
  return board.map((row) => [...row]);
};

/**
 * Checks whether two 2D arrays (boards) are equal.
 */
const arraysEqual = (a: number[][], b: number[][]): boolean => {
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
};

/**
 * Transposes a 2D array.
 */
const transpose = (board: number[][]): number[][] =>
  board[0].map((_, i) => board.map((row) => row[i]));

/**
 * Moves and merges a single row to the left.
 * Returns the new row and the score obtained from merging tiles.
 */
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
  // Pad the row with zeros to maintain the grid size
  while (newRow.length < GRID_SIZE) {
    newRow.push(0);
  }
  return { newRow, score };
};

/**
 * Moves the entire board to the left.
 * Returns the new board and the total score obtained.
 */
const moveLeft = (
  board: number[][]
): { newBoard: number[][]; totalScore: number } => {
  let newBoard: number[][] = [];
  let totalScore = 0;
  for (let i = 0; i < board.length; i++) {
    const { newRow, score } = moveRowLeft(board[i]);
    newBoard.push(newRow);
    totalScore += score;
  }
  return { newBoard, totalScore };
};

/**
 * Moves the board to the right.
 */
const moveRight = (
  board: number[][]
): { newBoard: number[][]; totalScore: number } => {
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

/**
 * Moves the board upward.
 */
const moveUp = (
  board: number[][]
): { newBoard: number[][]; totalScore: number } => {
  const transposed = transpose(board);
  const { newBoard: moved, totalScore } = moveLeft(transposed);
  return { newBoard: transpose(moved), totalScore };
};

/**
 * Moves the board downward.
 */
const moveDown = (
  board: number[][]
): { newBoard: number[][]; totalScore: number } => {
  const transposed = transpose(board);
  const { newBoard: moved, totalScore } = moveRight(transposed);
  return { newBoard: transpose(moved), totalScore };
};

/**
 * Checks if the game is over by verifying that no moves are possible.
 */
const isGameOver = (board: number[][]): boolean => {
  // If there is any empty cell, the game is not over
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (board[i][j] === 0) return false;
    }
  }
  // Check for adjacent tiles that can be merged
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (j < GRID_SIZE - 1 && board[i][j] === board[i][j + 1]) return false;
      if (i < GRID_SIZE - 1 && board[i][j] === board[i + 1][j]) return false;
    }
  }
  return true;
};

// ------------------------------
// CanvasGame Component
// ------------------------------

/**
 * Main component that renders the 2048 game using an HTML canvas.
 * It includes the game board, scoreboard, control buttons, and overlays.
 */
const CanvasGame: React.FC = () => {
  // Reference to the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state variables
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [board, setBoard] = useState<number[][]>(getInitialBoard());
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  /**
   * Draws the board on the canvas.
   * Loops over each cell to draw the tile background, border, and number.
   */
  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the entire canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Loop through the grid and draw each tile
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const value = board[i][j];
        const { background, text } = getTileColors(value);
        const x = j * TILE_SIZE;
        const y = i * TILE_SIZE;

        // Draw tile background with padding
        ctx.fillStyle = background;
        ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);

        // Draw a thick border around the tile
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#444444";
        ctx.strokeRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);

        // If the tile is non-zero, draw its number in the center
        if (value !== 0) {
          ctx.fillStyle = text;
          ctx.font = "bold 32px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(value), x + TILE_SIZE / 2, y + TILE_SIZE / 2);
        }
      }
    }
  }, [board]);

  // Redraw the board every time it changes
  useEffect(() => {
    drawBoard();
  }, [board, drawBoard]);

  /**
   * Handles moves based on a direction input ("up", "down", "left", "right").
   * Updates the board, score, and checks for game over.
   */
  const handleMove = (direction: string) => {
    if (gameOver) return;

    let moveResult:
      | { newBoard: number[][]; totalScore: number }
      | undefined = undefined;

    switch (direction) {
      case "up":
        moveResult = moveUp(board);
        break;
      case "down":
        moveResult = moveDown(board);
        break;
      case "left":
        moveResult = moveLeft(board);
        break;
      case "right":
        moveResult = moveRight(board);
        break;
      default:
        return;
    }

    if (moveResult) {
      const { newBoard, totalScore } = moveResult;
      // Only update if the board has changed
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

  /**
   * Handles keydown events for arrow keys.
   * Maps the arrow key events to corresponding move directions.
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const moves: { [key in "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"]: string } = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      if (moves[e.key as keyof typeof moves]) {
        e.preventDefault();
        handleMove(moves[e.key as keyof typeof moves]);
      }
    },
    [board, score, gameOver]
  );

  // Add the keydown event listener when the component mounts
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /**
   * Resets the game by reinitializing the board, resetting the score, and clearing the game over state.
   */
  const newGame = () => {
    setBoard(getInitialBoard());
    setScore(0);
    setGameOver(false);
  };

  
  // ------------------------------
  // JSX Return (Render)
  // ------------------------------
  return (
    <div className="flex flex-col items-center justify-center border-4 p-6 border-black rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="flex justify-center items-center space-x-8">
  {/* Left Column - Title & Subtitle */}
  <div className="flex flex-col space-y-4">
  <div
  style={{fontSize: "6rem",
    color: "#312626",
    textShadow: "4px 4px 2px rgba(0, 0, 0, 0.6)", // Black shadow
  }} 
  className="font-bold text-6xl">2048</div>
  <div 
  style={{fontSize: "0.9rem"}}
  className="text-xs">
  Can you get to the <strong className="font-bold">2048 tile?</strong>  
  </div>
  
  </div>

  {/* Right Column - Scoreboard & Button */}
  <div
  style={{ backgroundColor: "#312626" }} // Explicit color setting 
  className="flex flex-col items-center space-y-4 rounded-lg p-4">
    {/* Scores Row */}
    <div
    className="flex justify-between items-center">
      {/* Score display */}
      <div
      className="bg-[#bbada0] text-white text-center items-center ">
        <p className="text-xs uppercase font-bold">Score</p>
        <p className="text-2xl font-bold">{score}</p>
      </div>
      <div className="text-white">
      &nbsp;|&nbsp;<br/>&nbsp;|&nbsp;<br/>
      </div>
      {/* Best score display */}
      <div className="bg-[#bbada0] text-white text-center  px-6 py-6 rounded-md">
        <p className="text-xs uppercase font-bold">Best</p>
        <p className="text-2xl font-bold">{bestScore}</p>
      </div>
    </div>

    {/* New Game Button */}
    <button
      onClick={() => {
      newGame();
      setGameStarted(true);
      }}
      style={{ backgroundColor: "#312626" }} // Explicit color setting
      className="text-white border-solid border-black border-4 rounded-lg px-4 shadow-md transition duration-200 font-bold text-lg hover:bg-orange-500 mx-2 my-2"
    >
      New Game
    </button>
  </div>
</div>



      {/* Canvas container with its own border */}
      <div className="relative inline-block rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border-8 border-gray-800 rounded-lg block"
        />
        {/* Start overlay: if the game hasn't started, show Play and New Game buttons side-by-side */}
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-opacity-70 rounded-lg">
            <div className="flex space-x-4">
              <button
                onClick={() => setGameStarted(true)}
                style={{ backgroundColor: "#312626" }} // Explicit color setting
                className="text-white border-solid border-black border-4 rounded-lg px-4 shadow-md transition duration-200 font-bold text-lg hover:bg-orange-500 mx-2 my-2"
              >
                Play
              </button>
              
            </div>
          </div>
        )}
        {/* Game Over overlay: displays when the game is over */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 rounded-lg">
            <h2
            style={{fontSize: "6rem",
              color: "#312626",
              textShadow: "4px 4px 2px rgba(0, 0, 0, 0.6)", // Black shadow
            }}  
            className="text-4xl font-bold text-white mb-4">Game Over!</h2>
            <button
              onClick={newGame}
              style={{ backgroundColor: "#312626" }} // Explicit color setting
              className="text-white border-solid border-black border-4 rounded-lg px-4 shadow-md transition duration-200 font-bold text-lg hover:bg-orange-500 mx-2 my-2"
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasGame;
