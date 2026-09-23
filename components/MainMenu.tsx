import React from 'react';

interface MainMenuProps {
  onStartGame: () => void;
  onLoadGame: () => void;
  onShowUpdates: () => void;
  onShowSettings: () => void;
  onShowAchievements: () => void;
  isLoading: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onLoadGame, onShowUpdates, onShowSettings, onShowAchievements, isLoading }) => {
  const menuOptions = [
    { label: 'Jogar', action: onStartGame, disabled: isLoading },
    { label: 'Carregar Jogo', action: onLoadGame, disabled: false },
    { label: 'Conquistas', action: onShowAchievements, disabled: false },
    { label: 'Configurações', action: onShowSettings, disabled: false },
    { label: 'Notas de Atualização', action: onShowUpdates, disabled: false },
  ];

  return (
    <div className="w-full max-w-xs md:max-w-sm flex flex-col items-center gap-4 animate-fade-in">
      {menuOptions.map((option) => (
        <button
          key={option.label}
          onClick={option.action}
          disabled={option.disabled}
          className="w-full px-6 py-3 bg-[var(--surface-color)] border border-[var(--border-color)] shadow-md text-[var(--button-text-color)] font-bold rounded-md hover:bg-[var(--primary-accent-color)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent-color)] focus:ring-opacity-75 disabled:bg-stone-500/50 disabled:text-stone-400 disabled:cursor-not-allowed disabled:border-stone-700 transition-all duration-200 text-lg md:text-xl font-title"
        >
          {isLoading && option.label === 'Jogar' ? 'Carregando...' : option.label}
        </button>
      ))}
    </div>
  );
};

export default MainMenu;