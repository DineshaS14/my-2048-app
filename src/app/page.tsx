import type { NextPage } from 'next';
import CanvasGame from '../../components/Game';
import FlappyBird from '../../components/FlappyBird';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">2048 Game</h1>
      <FlappyBird />
    </div>
  );
};

export default Home;
