import type { NextPage } from 'next';
import Link from 'next/link';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">Choose Your Game</h1>
      <div className="flex space-x-4">
        <Link href="/gameFlappyBird">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">
            Flappy Bird
          </button>
        </Link>
        <Link href="/game2048">
          <button className="px-4 py-2 bg-green-500 text-white rounded">
            2048 Game
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
