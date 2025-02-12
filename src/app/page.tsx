import type { NextPage } from 'next';
import Game from '../../components/Game';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">2048 Game</h1>
      <Game />
    </div>
  );
};

export default Home;
