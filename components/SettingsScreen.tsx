import React, { useState } from 'react';
import Modal from './Modal';
import { TextDescriptionStyle } from '../services/geminiService';
import { audioService } from '../services/audioService';
import type { Settings, TextSpeed, Theme } from '../types';

interface SettingsScreenProps {
  onClose: () => void;
  onReturnToMenu: () => void;
  onSaveAdventure: () => void;
  onSaveCharacter: () => void;
  gameState: string;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
    onClose, onReturnToMenu, onSaveAdventure, onSaveCharacter, gameState, settings, setSettings 
}) => {
  const [isMusicPaused, setIsMusicPaused] = useState(audioService.isPaused());

  const handleSettingChange = (key: keyof Settings, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleTogglePause = () => {
    audioService.togglePause();
    setIsMusicPaused(audioService.isPaused());
  };

  const OptionWrapper: React.FC<{ children: React.ReactNode, label: string }> = ({ label, children }) => (
    <div className="flex items-center justify-between w-full p-2 bg-stone-200/50 rounded-md">
        <label className="text-stone-700 font-bold">{label}</label>
        {children}
    </div>
  );

  const selectClasses = "bg-stone-700 text-white p-1 rounded border border-stone-500";
  const buttonClasses = "w-full sm:w-auto px-6 py-3 border font-bold rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 transition-all duration-200 font-title";

  return (
    <Modal title="Configurações" onClose={onClose}>
      <div className="space-y-4 flex flex-col items-center">
        
        <OptionWrapper label="Velocidade do Texto">
            <select className={selectClasses} value={settings.textSpeed} onChange={e => handleSettingChange('textSpeed', e.target.value as TextSpeed)}>
                <option>Lento</option>
                <option>Normal</option>
                <option>Rápido</option>
            </select>
        </OptionWrapper>

        <OptionWrapper label="Descrição do Texto">
            <select className={selectClasses} value={settings.textDescription} onChange={e => handleSettingChange('textDescription', e.target.value as TextDescriptionStyle)}>
                <option>Curto/Objetivo</option>
                <option>Curto e Detalhado</option>
                <option>Longo Complexo</option>
            </select>
        </OptionWrapper>

        <OptionWrapper label="Narrativa Automática">
            <input 
              type="checkbox" 
              className="w-6 h-6"
              checked={settings.autoNarrate} 
              onChange={e => handleSettingChange('autoNarrate', e.target.checked)} 
            />
        </OptionWrapper>
        
        <OptionWrapper label="Mostrar Sugestões de Ações">
            <input 
              type="checkbox" 
              className="w-6 h-6"
              checked={settings.showActionSuggestions} 
              onChange={e => handleSettingChange('showActionSuggestions', e.target.checked)} 
            />
        </OptionWrapper>

        <OptionWrapper label="Salvar Automaticamente">
            <input 
              type="checkbox" 
              className="w-6 h-6"
              checked={settings.autoSave} 
              onChange={e => handleSettingChange('autoSave', e.target.checked)} 
            />
        </OptionWrapper>

        <OptionWrapper label="Tema">
            <select className={selectClasses} value={settings.theme} onChange={e => handleSettingChange('theme', e.target.value as Theme)}>
                <option>Padrão</option>
                <option>Claro</option>
                <option>Escuro</option>
            </select>
        </OptionWrapper>
        
        <OptionWrapper label="Música">
            <button onClick={handleTogglePause} className={`${selectClasses} px-4 w-28 text-center`}>
                {isMusicPaused ? '▶ Retomar' : '❚❚ Pausar'}
            </button>
        </OptionWrapper>

        <OptionWrapper label="Volume da Música">
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.volume}
              onChange={e => handleSettingChange('volume', parseFloat(e.target.value))}
              className="w-32 cursor-pointer"
            />
        </OptionWrapper>

        <div className="w-full pt-4 mt-4 border-t border-stone-400 flex flex-col gap-3">
            {gameState === 'inGame' && (
                <>
                    <button onClick={() => onSaveAdventure()} className={`${buttonClasses} bg-blue-800/80 border-blue-600 text-blue-50 hover:bg-blue-700/90 focus:ring-blue-500`}>
                        Salvar Aventura
                    </button>
                    <button onClick={() => onSaveCharacter()} className={`${buttonClasses} bg-green-800/80 border-green-600 text-green-50 hover:bg-green-700/90 focus:ring-green-500`}>
                        Salvar Personagem
                    </button>
                    <button onClick={onReturnToMenu} className={`${buttonClasses} bg-red-800/80 border-red-600 text-red-50 hover:bg-red-700/90 focus:ring-red-500`}>
                        Voltar ao Menu Principal
                    </button>
                </>
            )}
        </div>

      </div>
    </Modal>
  );
};

export default SettingsScreen;