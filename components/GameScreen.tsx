import React from 'react';
import StoryDisplay from './StoryDisplay';
import UserInput from './UserInput';
import DiceRoll from './DiceRoll';
import LoadingSpinner from './LoadingSpinner';
import Hud from './Hud';
import GameInfoBar from './GameInfoBar';
import TypingIndicator from './TypingIndicator';
import CombatTracker from './CombatTracker';
import TurnOrderDisplay from './TurnOrderDisplay'; // Importar o novo componente
import type { ModalType, Settings, GameTime, CharacterData, CombatState, Creature, EnemyInCombat } from '../types';

interface GameScreenProps {
  story: string;
  isLoading: boolean;
  error: string | null;
  onUserInput: (prompt: string) => void;
  onHudButtonClick: (modal: ModalType) => void;
  onHelpClick: () => void;
  notifications: Record<string, number>;
  settings: Settings;
  location: string;
  gameTime: GameTime;
  characterData: CharacterData;
  isDiceRollActive: boolean;
  onDiceRoll: () => void;
  isInitiativeRollActive: boolean; // Novo prop
  onInitiativeRoll: () => void; // Novo prop
  selectedGenre: string;
  actionSuggestions: string[];
  allies: Creature[];
  bestiary: Creature[];
  enemies: EnemyInCombat[];
  combatState: CombatState; // Adicionar estado de combate
}

const GameScreen: React.FC<GameScreenProps> = ({ 
    story, isLoading, error, onUserInput, onHudButtonClick, onHelpClick, 
    notifications, settings, location, gameTime, characterData,
    isDiceRollActive, onDiceRoll, isInitiativeRollActive, onInitiativeRoll,
    selectedGenre, actionSuggestions,
    allies, bestiary, enemies, combatState
}) => {
  const isPlayerTurn = combatState.isInCombat 
    ? combatState.turnOrder[combatState.currentTurnIndex]?.type === 'player' 
    : true;

  return (
    <div className="w-full flex flex-col h-[85vh]">
      {combatState.isInCombat && (
        <TurnOrderDisplay 
          turnOrder={combatState.turnOrder}
          currentTurnIndex={combatState.currentTurnIndex}
          characterData={characterData}
          allies={allies}
          enemies={enemies}
          bestiary={bestiary}
        />
      )}
      <div className="flex-grow w-full border-double border-8 border-[var(--border-color)] rounded-lg shadow-2xl shadow-black/50 overflow-hidden flex flex-row">
        <div className="flex-grow w-2/3 bg-[var(--surface-color)] text-[var(--surface-text-color)] p-4 flex flex-col">
            {isLoading && story.length === 0 ? (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
            </div>
            ) : (
            <>
                <StoryDisplay 
                story={story} 
                speed={settings.textSpeed} 
                characterName={characterData.characterName} 
                autoNarrate={settings.autoNarrate}
                characterImage={characterData.image}
                allies={allies}
                bestiary={bestiary}
                />
                {isLoading && story.length > 0 && <TypingIndicator />}
            </>
            )}
        </div>
        {enemies.length > 0 && <CombatTracker enemies={enemies} bestiary={bestiary} />}
      </div>

      {error && <p className="text-red-300 mb-4 text-center bg-red-900/50 p-2 rounded">{error}</p>}
      
      <GameInfoBar location={location} gameTime={gameTime} />
      
      {isInitiativeRollActive ? (
        <DiceRoll onRoll={onInitiativeRoll} isLoading={isLoading} label="Rolar Iniciativa" />
      ) : isDiceRollActive ? (
        <DiceRoll onRoll={onDiceRoll} isLoading={isLoading} />
      ) : (
        <UserInput 
            onSubmit={onUserInput} 
            isLoading={isLoading} 
            actionSuggestions={actionSuggestions}
            showActionSuggestions={settings.showActionSuggestions}
            isPlayerTurn={isPlayerTurn}
        />
      )}
      
      <Hud onHudButtonClick={onHudButtonClick} onHelpClick={onHelpClick} notifications={notifications} selectedGenre={selectedGenre} />
    </div>
  );
};

export default GameScreen;