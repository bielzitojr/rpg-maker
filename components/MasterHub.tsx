import React from 'react';
import StoryDisplay from './StoryDisplay';
import UserInput from './UserInput';
import TypingIndicator from './TypingIndicator';
// Fix: Corrected import path for icons.
import { SystemIcon, SettingsIcon, NotebookIcon, GeneratorIcon, EnemiesIcon } from './icons/index';
import type { ModalType, Settings, CharacterData } from '../types';

interface MasterHubProps {
  story: string;
  isLoading: boolean;
  error: string | null;
  onUserInput: (prompt: string) => void;
  onHudButtonClick: (modal: ModalType) => void;
  settings: Settings;
  characterData: CharacterData;
}

const MasterHud: React.FC<{ onHudButtonClick: (modal: ModalType) => void }> = ({ onHudButtonClick }) => {
    const hudItems = [
        { label: 'Caderno', Icon: NotebookIcon, modal: 'Caderno' as ModalType, action: () => onHudButtonClick('Caderno') },
        { label: 'Geradores', Icon: GeneratorIcon, modal: 'Geradores' as ModalType, action: () => onHudButtonClick('Geradores') },
        { label: 'Inimigos', Icon: EnemiesIcon, modal: 'Inimigos' as ModalType, action: () => onHudButtonClick('Inimigos') },
        { label: 'Sistema', Icon: SystemIcon, modal: 'Sistema' as ModalType, action: () => onHudButtonClick('Sistema') },
        { label: 'Configurações', Icon: SettingsIcon, modal: 'Configurações' as ModalType, action: () => onHudButtonClick('Configurações') },
    ];

    return (
        <footer className="w-full mt-4">
            <div className="flex justify-center items-center flex-wrap gap-1 md:gap-3 p-2 bg-stone-900/50 border-t-2 border-amber-300/30 rounded-lg">
                {hudItems.map(({ label, Icon, action }) => (
                    <div key={label} className="relative">
                        <button 
                            title={label}
                            onClick={action}
                            className="p-2 rounded-md text-amber-200/80 hover:bg-amber-200/10 hover:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors duration-200"
                            aria-label={label}
                        >
                            <Icon className="w-6 h-6 md:w-7 md:h-7" />
                        </button>
                    </div>
                ))}
            </div>
        </footer>
    );
};


const MasterHub: React.FC<MasterHubProps> = ({ 
    story, isLoading, error, onUserInput, onHudButtonClick, settings, characterData
}) => {
  return (
    <div className="w-full flex flex-col h-[85vh]">
      <div className="flex-grow w-full bg-[var(--surface-color)] text-[var(--surface-text-color)] border-double border-8 border-[var(--border-color)] rounded-lg p-4 shadow-2xl shadow-black/50 mb-6 overflow-hidden flex flex-col">
          <>
            <StoryDisplay 
              story={story} 
              speed={settings.textSpeed} 
              characterName={characterData.characterName}
              autoNarrate={settings.autoNarrate}
              characterImage={null}
              allies={[]}
              bestiary={[]}
            />
            {isLoading && story.length > 0 && <TypingIndicator />}
          </>
      </div>

      {error && <p className="text-red-300 mb-4 text-center bg-red-900/50 p-2 rounded">{error}</p>}
      
      <UserInput 
          onSubmit={onUserInput} 
          isLoading={isLoading} 
          actionSuggestions={[]}
          showActionSuggestions={false}
      />
      
      <MasterHud onHudButtonClick={onHudButtonClick} />
    </div>
  );
};

export default MasterHub;