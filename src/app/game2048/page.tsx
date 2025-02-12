"use client";

import React from "react";
import Game2048 from "../../../components/Game2048";

function Game2048Page() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 to-purple-300 p-4">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 drop-shadow-lg">Game 2048</h1>
        <h3 className="text-xl text-gray-700 mt-2">
          Made by Dinesha for the LiL Bro TJW
        </h3>
      </header>

      {/* Game container */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <Game2048 />
      </div>

      {/* Game Rules */}
      <div className="mt-6 p-6 border-4 border-black rounded-lg bg-yellow-100 max-lg: shadow-xl">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
          Game Rules
        </h2>
        <ul className="list-disc list-inside text-gray-700 border-4 border-black border-solid p-6 rounded-lg bg-white space-y-1">
          <li>Use the arrow keys to move the tiles.</li>
          <li>Tiles with the same number merge when they touch.</li>
          <li>A new tile appears after each move.</li>
          <li>Reach 2048 to win—but no win overlay; keep playing!</li>
        </ul>
      </div>
    </div>
  );
}

export default Game2048Page;
