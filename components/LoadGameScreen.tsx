import React, { useState } from 'react';
import type { SavedGame, SavedCharacter } from '../types';

interface LoadGameScreenProps {
  savedGames: SavedGame[];
  savedCharacters: SavedCharacter[];
  onLoadGame: (save: SavedGame) => void;
  onLoadCharacter: (save: SavedCharacter) => void;
  onDelete: (id: string, type: 'game' | 'character') => void;
  onBack: () => void;
}

type ActiveTab = 'games' | 'characters';

const LoadGameScreen: React.FC<LoadGameScreenProps> = ({ savedGames, savedCharacters, onLoadGame, onLoadCharacter, onDelete, onBack }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('games');

  const tabButtonClasses = (isActive: boolean) => 
    `w-full py-2 font-bold font-title text-lg transition-colors duration-200 ${
      isActive ? 'bg-amber-600 text-white' : 'bg-stone-700 text-amber-100 hover:bg-stone-600'
    }`;
  
  const SaveSlot: React.FC<{save: SavedGame | SavedCharacter, type: ActiveTab}> = ({ save, type }) => (
    <div className="p-3 bg-stone-800/60 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
            <p className="font-bold text-amber-100">{save.id}</p>
            <p className="text-xs text-stone-300">Salvo em: {save.savedAt}</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => type === 'games' ? onLoadGame(save as SavedGame) : onLoadCharacter(save as SavedCharacter)}
                className="px-4 py-1 bg-green-700 text-white rounded hover:bg-green-600"
            >
                Carregar
            </button>
            <button
                onClick={() => onDelete(save.id, type === 'games' ? 'game' : 'character')}
                className="px-4 py-1 bg-red-800 text-white rounded hover:bg-red-700"
            >
                Deletar
            </button>
        </div>
    </div>
  );

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-6 animate-fade-in bg-[#3a2d21]/80 p-6 rounded-lg border-2 border-stone-600 shadow-xl">
        <h2 className="text-3xl md:text-4xl text-amber-100 font-bold mb-4 font-title">Carregar Jogo</h2>
        
        <div className="w-full flex">
            <button className={`${tabButtonClasses(activeTab === 'games')} rounded-l-lg`} onClick={() => setActiveTab('games')}>
                Jogos Salvos
            </button>
            <button className={`${tabButtonClasses(activeTab === 'characters')} rounded-r-lg`} onClick={() => setActiveTab('characters')}>
                Personagens Salvos
            </button>
        </div>

        <div className="w-full h-64 overflow-y-auto space-y-3 p-2 bg-black/20 rounded">
            {activeTab === 'games' && (
                savedGames.length > 0 ? (
                    savedGames.map(sg => <SaveSlot key={sg.id + sg.savedAt} save={sg} type="games" />)
                ) : <p className="text-center text-stone-400 italic">Nenhuma aventura salva.</p>
            )}
            {activeTab === 'characters' && (
                 savedCharacters.length > 0 ? (
                    savedCharacters.map(sc => <SaveSlot key={sc.id + sc.savedAt} save={sc} type="characters" />)
                ) : <p className="text-center text-stone-400 italic">Nenhum personagem salvo.</p>
            )}
        </div>

        <button
            onClick={onBack}
            className="mt-4 w-1/2 px-6 py-3 bg-stone-700/60 border border-stone-500 text-amber-50 font-bold rounded-lg hover:bg-stone-600/80 focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all duration-200 font-title"
        >
            Voltar
        </button>
    </div>
  );
};

export default LoadGameScreen;