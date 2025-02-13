'use client';
import { useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";

const Home: NextPage = () => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">Choose Your Game</h1>

      <div className="flex space-x-4">
        {/* Flappy Bird Button - Opens Popup */}
        <button
          onClick={() => setShowPopup(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Flappy Bird Coming SOOON
        </button>

        {/* 2048 Game Button */}
        <Link href="/game2048">
          <button className="px-4 py-2 bg-green-500 text-white rounded">
            2048 Game
          </button>
        </Link>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold mb-2">Flappy Bird is Coming Soon! 🐦</h2>
            <p>Stay tuned for updates. Exciting things are on the way!</p>

            {/* Close Button */}
            <button
              onClick={() => setShowPopup(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
