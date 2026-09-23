import React from 'react';

interface DiceRollProps {
  onRoll: () => void;
  isLoading: boolean;
  label?: string;
}

const DiceRoll: React.FC<DiceRollProps> = ({ onRoll, isLoading, label = 'Rolar d20' }) => {
  const handleRoll = () => {
    if (!isLoading) {
      onRoll();
    }
  };

  return (
    <div className="w-full flex justify-center items-center p-2 bg-stone-900/50 border-t-2 border-amber-300/30 rounded-lg">
      <button
        onClick={handleRoll}
        disabled={isLoading}
        className="w-full sm:w-auto px-8 py-4 bg-amber-800 text-amber-50 font-bold rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-stone-600 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors duration-200 text-2xl font-title animate-pulse"
      >
        {isLoading ? '...' : label}
      </button>
    </div>
  );
};

export default DiceRoll;