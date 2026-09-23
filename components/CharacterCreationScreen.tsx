import React from 'react';
import { RACES, CLASSES, WEAPONS_BY_CLASS, BACKGROUNDS, RACE_BONUSES, CLASS_BONUSES, SEVEN_DEADLY_SINS, MONSTER_RACES, MONSTER_RACE_BONUSES, RACES_WITH_NATURAL_WEAPONS, NATURAL_WEAPON } from '../utils/characterData';
// Fix: Corrected import path for icons.
import { DiceIcon } from './icons/index';
import CharacterImageEditor from './CharacterImageEditor';
import useCharacterCreator from '../hooks/useCharacterCreator';
import type { CharacterData } from '../types';

interface CharacterCreationScreenProps {
  onStart: (characterData: CharacterData) => void;
  onBack: () => void;
  selectedGenre: string;
  initialData?: CharacterData | null;
}

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onStart, onBack, selectedGenre, initialData }) => {
  const {
    character,
    setCharacter,
    availableWeapons,
    isGeneratingAppearance,
    isGeneratingImage,
    handleChange,
    handleImageChange,
    handleGenerateImage,
    handleRandomize,
    handleRandomizeField,
    handleRandomizeAppearance
  } = useCharacterCreator({ selectedGenre, initialData });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(character);
  };

  const inputLabelClasses = "block text-amber-100 text-sm font-bold mb-1 font-title";
  const inputClasses = "w-full bg-stone-900/50 border border-amber-300/30 rounded px-3 py-2 text-[#fdf6e3] focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-200";
  const textareaClasses = `${inputClasses} min-h-[120px] resize-y`;
  const randomizeButton = "p-1.5 text-amber-200/80 hover:bg-amber-200/10 hover:text-amber-100 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400";
  const allRaceBonuses = { ...RACE_BONUSES, ...MONSTER_RACE_BONUSES };
  const currentWeaponInfo = RACES_WITH_NATURAL_WEAPONS.includes(character.race) ? NATURAL_WEAPON : availableWeapons.find(w => w.name === character.weapon);
  const allRaces = selectedGenre === 'Isekai' ? [...RACES, ...MONSTER_RACES] : RACES;
  const GENDERS = ['Masculino', 'Feminino', 'Não-binário'];

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl animate-fade-in bg-[#3a2d21]/80 p-6 rounded-lg border-2 border-stone-600 shadow-xl">
      <h2 className="text-2xl md:text-3xl text-amber-100 font-bold mb-6 text-center font-title">Crie seu Personagem</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna da Imagem */}
        <div className="md:col-span-1 flex flex-col items-center gap-4">
          <CharacterImageEditor
            image={character.image}
            isGeneratingImage={isGeneratingImage}
            onGenerateImage={handleGenerateImage}
            onImageChange={handleImageChange}
            onRemoveImage={() => setCharacter(c => ({...c, image: null}))}
          />
        </div>

        {/* Coluna do Meio */}
        <div className="space-y-4">
          <div>
            <label htmlFor="playerName" className={inputLabelClasses}>Seu Nome</label>
            <div className="flex items-center gap-2">
                <input type="text" id="playerName" name="playerName" value={character.playerName} onChange={handleChange} className={inputClasses} placeholder="Nome do Jogador" required />
                <button type="button" onClick={() => handleRandomizeField('playerName')} className={randomizeButton} title="Gerar nome do jogador"><DiceIcon className="w-6 h-6"/></button>
            </div>
          </div>
          <div>
            <label htmlFor="characterName" className={inputLabelClasses}>Nome do Personagem</label>
            <div className="flex items-center gap-2">
                <input type="text" id="characterName" name="characterName" value={character.characterName} onChange={handleChange} className={inputClasses} placeholder="Nome do Personagem" required />
                <button type="button" onClick={() => handleRandomizeField('characterName')} className={randomizeButton} title="Gerar nome do personagem"><DiceIcon className="w-6 h-6"/></button>
            </div>
          </div>
          <div>
            <label htmlFor="gender" className={inputLabelClasses}>Gênero</label>
            <div className="flex items-center gap-2">
                <select id="gender" name="gender" value={character.gender} onChange={handleChange} className={inputClasses}>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <button type="button" onClick={() => handleRandomizeField('gender')} className={randomizeButton} title="Gerar gênero"><DiceIcon className="w-6 h-6"/></button>
            </div>
          </div>
          <div>
            <label htmlFor="appearance" className={inputLabelClasses}>Aparência</label>
            <div className="flex items-start gap-2">
                <textarea id="appearance" name="appearance" value={character.appearance} onChange={handleChange} className={textareaClasses} placeholder="Descreva a aparência do seu personagem..."></textarea>
                <button type="button" onClick={handleRandomizeAppearance} disabled={isGeneratingAppearance} className={randomizeButton} title="Gerar aparência com IA"><DiceIcon className={`w-6 h-6 ${isGeneratingAppearance ? 'animate-spin' : ''}`}/></button>
            </div>
          </div>
        </div>

        {/* Coluna da Direita */}
        <div className="space-y-4">
          <div>
            <label htmlFor="race" className={inputLabelClasses}>Raça</label>
            <div className="flex items-center gap-2">
                <select id="race" name="race" value={character.race} onChange={handleChange} className={inputClasses}>
                    {selectedGenre === 'Isekai' ? (
                        <>
                            <optgroup label="Raças Padrão">
                                {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                            </optgroup>
                            <optgroup label="Raças de Monstro">
                                {MONSTER_RACES.map(r => <option key={r} value={r}>{r}</option>)}
                            </optgroup>
                        </>
                    ) : (
                        RACES.map(r => <option key={r} value={r}>{r}</option>)
                    )}
                </select>
                <button type="button" onClick={() => handleRandomizeField('race')} className={randomizeButton} title="Gerar raça"><DiceIcon className="w-6 h-6"/></button>
            </div>
            <div className="mt-2 text-xs text-amber-200/80 p-2 bg-stone-900/40 rounded">{allRaceBonuses[character.race]}</div>
          </div>
          <div>
            <label htmlFor="class" className={inputLabelClasses}>Classe</label>
            <div className="flex items-center gap-2">
                <select id="class" name="class" value={character.class} onChange={handleChange} className={inputClasses}>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" onClick={() => handleRandomizeField('class')} className={randomizeButton} title="Gerar classe"><DiceIcon className="w-6 h-6"/></button>
            </div>
            <div className="mt-2 text-xs text-amber-200/80 p-2 bg-stone-900/40 rounded">{CLASS_BONUSES[character.class]}</div>
          </div>
          {selectedGenre !== 'Isekai' && (
            <div>
              <label htmlFor="weapon" className={inputLabelClasses}>Arma Inicial</label>
              <div className="flex items-center gap-2">
                  <select id="weapon" name="weapon" value={character.weapon} onChange={handleChange} className={inputClasses} disabled={RACES_WITH_NATURAL_WEAPONS.includes(character.race) || availableWeapons.length === 0}>
                      {availableWeapons.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setCharacter(c => ({...c, weapon: availableWeapons[Math.floor(Math.random() * availableWeapons.length)].name}))} className={randomizeButton} title="Gerar arma" disabled={RACES_WITH_NATURAL_WEAPONS.includes(character.race)}><DiceIcon className="w-6 h-6"/></button>
              </div>
              <div className="mt-2 text-xs text-amber-200/80 p-2 bg-stone-900/40 rounded">Dano: {currentWeaponInfo?.damage || 'N/A'}</div>
            </div>
          )}
          {selectedGenre === 'Bíblico' && (
            <div>
                <label htmlFor="provacao" className={inputLabelClasses}>Provação</label>
                <div className="flex items-center gap-2">
                    <select id="provacao" name="provacao" value={character.provacao || SEVEN_DEADLY_SINS[0]} onChange={handleChange} className={inputClasses}>
                        {SEVEN_DEADLY_SINS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="button" onClick={() => handleRandomizeField('provacao')} className={randomizeButton} title="Gerar provação"><DiceIcon className="w-6 h-6"/></button>
                </div>
            </div>
          )}
          {selectedGenre !== 'Isekai' && (
            <div>
              <label htmlFor="background" className={inputLabelClasses}>Antecedentes</label>
              <div className="flex items-start gap-2">
                  <textarea id="background" name="background" value={character.background} onChange={handleChange} className={textareaClasses} placeholder="Qual a história do seu personagem?"></textarea>
                  <button type="button" onClick={() => handleRandomizeField('background')} className={randomizeButton} title="Gerar antecedentes"><DiceIcon className="w-6 h-6"/></button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button type="button" onClick={onBack} className="w-full sm:w-auto px-6 py-2 bg-stone-700/60 border border-stone-500 text-amber-50 font-bold rounded-lg hover:bg-stone-600/80 focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all duration-200 font-title">
            Voltar
        </button>
        <button type="button" onClick={handleRandomize} className="w-full sm:w-auto px-6 py-2 bg-amber-800/80 border border-amber-600 text-amber-50 font-bold rounded-lg hover:bg-amber-700/90 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 font-title">
            Gerar Aleatoriamente
        </button>
        <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-green-800/80 border border-green-600 text-green-50 font-bold rounded-lg hover:bg-green-700/90 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 font-title">
            Iniciar Aventura
        </button>
      </div>
    </form>
  );
};

export default CharacterCreationScreen;