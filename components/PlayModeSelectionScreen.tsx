import React from 'react';

interface PlayModeSelectionScreenProps {
  onSelectMode: (mode: 'player' | 'master') => void;
  onBack: () => void;
}

const PlayModeSelectionScreen: React.FC<PlayModeSelectionScreenProps> = ({ onSelectMode, onBack }) => {
  const buttonClasses = "w-full px-6 py-4 bg-[var(--surface-color)] border border-[var(--border-color)] shadow-lg text-[var(--button-text-color)] font-bold rounded-lg hover:bg-[var(--primary-accent-color)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent-color)] focus:ring-opacity-75 transition-all duration-200 text-xl md:text-2xl font-title";
  
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6 animate-fade-in">
      <h2 className="text-2xl md:text-3xl text-amber-100 font-bold mb-4 font-title text-center">Escolha seu Papel</h2>
      <div className="w-full space-y-4">
          <button onClick={() => onSelectMode('player')} className={buttonClasses}>
              <h3 className="text-xl">Jogador</h3>
              <p className="text-sm font-normal font-body mt-1">Crie um herói e embarque em uma aventura épica narrada pela IA.</p>
          </button>
          <button onClick={() => onSelectMode('master')} className={buttonClasses}>
              <h3 className="text-xl">Mestre</h3>
              <p className="text-sm font-normal font-body mt-1">Narre a história e os desafios, enquanto a IA joga como o aventureiro.</p>
          </button>
      </div>
      <button
          onClick={onBack}
          className="mt-6 w-full sm:w-1/2 px-6 py-3 bg-stone-700/60 border border-stone-500 text-amber-50 font-bold rounded-lg hover:bg-stone-600/80 focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all duration-200 font-title"
      >
          Voltar
      </button>
    </div>
  );
};

export default PlayModeSelectionScreen;
