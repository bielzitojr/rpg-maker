import React from 'react';
import type { GameTime } from '../types';

interface GameInfoBarProps {
  location: string;
  gameTime: GameTime;
}

const GameInfoBar: React.FC<GameInfoBarProps> = ({ location, gameTime }) => {

  const formatTime = (time: GameTime) => {
    const hour = String(time.hour).padStart(2, '0');
    const minute = String(time.minute).padStart(2, '0');
    const day = String(time.day).padStart(2, '0');
    const month = String(time.month).padStart(2, '0');
    return `${hour}:${minute} - ${day}/${month}/${time.year}`;
  }

  return (
    <div className="w-full flex justify-between items-center text-xs md:text-sm text-amber-200/80 mb-2 px-2">
      <div className="font-semibold">
        <span className="font-bold">Localização:</span> {location}
      </div>
      <div className="font-mono">
        {formatTime(gameTime)}
      </div>
    </div>
  );
};

export default GameInfoBar;