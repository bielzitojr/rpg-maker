import React, { useState, useEffect, useCallback } from 'react';
import { RACES, CLASSES, WEAPONS_BY_CLASS, BACKGROUNDS, SEVEN_DEADLY_SINS, FIRST_NAMES, LAST_NAMES, MONSTER_RACES, RACES_WITH_NATURAL_WEAPONS, NATURAL_WEAPON, Weapon } from '../utils/characterData';
import { generateCharacterImage, generateAppearanceDescription } from '../services/geminiService';
import type { CharacterData } from '../types';

interface UseCharacterCreatorProps {
  selectedGenre: string;
  initialData?: CharacterData | null;
}

const GENDERS = ['Masculino', 'Feminino', 'Não-binário'];

const useCharacterCreator = ({ selectedGenre, initialData }: UseCharacterCreatorProps) => {
  const getInitialState = useCallback((): CharacterData => {
    if (initialData) {
      const finalData = { ...initialData };
      if (selectedGenre === 'Bíblico' && !finalData.provacao) {
        finalData.provacao = SEVEN_DEADLY_SINS[0];
      } else if (selectedGenre !== 'Bíblico' && finalData.provacao) {
        delete finalData.provacao;
      }
      return finalData;
    }
    const initialState: CharacterData = {
      playerName: '', characterName: '', gender: GENDERS[0], image: null,
      appearance: '', background: '', race: RACES[0],
      class: CLASSES[0], weapon: WEAPONS_BY_CLASS[CLASSES[0]][0].name,
    };
    if (selectedGenre === 'Bíblico') {
      initialState.provacao = SEVEN_DEADLY_SINS[0];
    }
    return initialState;
  }, [initialData, selectedGenre]);

  const [character, setCharacter] = useState<CharacterData>(getInitialState());
  const [availableWeapons, setAvailableWeapons] = useState<Weapon[]>(WEAPONS_BY_CLASS[character.class]);
  const [isGeneratingAppearance, setIsGeneratingAppearance] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    const weapons = WEAPONS_BY_CLASS[character.class] || [];
    setAvailableWeapons(weapons);
    if (!RACES_WITH_NATURAL_WEAPONS.includes(character.race) && !weapons.some(w => w.name === character.weapon)) {
      setCharacter(c => ({ ...c, weapon: weapons[0]?.name || '' }));
    }
  }, [character.class, character.race, character.weapon]);

  useEffect(() => {
    if (RACES_WITH_NATURAL_WEAPONS.includes(character.race)) {
      setCharacter(c => ({ ...c, weapon: NATURAL_WEAPON.name }));
    } else {
      const weapons = WEAPONS_BY_CLASS[character.class] || [];
      if (character.weapon === NATURAL_WEAPON.name) {
        setCharacter(c => ({ ...c, weapon: weapons[0]?.name || '' }));
      }
    }
  }, [character.race, character.class]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCharacter(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (base64Image: string) => {
    setCharacter(prev => ({ ...prev, image: base64Image }));
  };

  const handleGenerateImage = async () => {
    if (!character.appearance || !character.race || !character.class) {
      alert("Por favor, preencha a aparência, raça e classe primeiro para gerar uma imagem mais precisa.");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const imagePrompt = `Retrato de personagem de RPG, estilo arte digital, seguro para todos os públicos. Foco no rosto e ombros. Personagem: um(a) ${character.race} ${character.gender} da classe ${character.class}. Descrição visual: ${character.appearance}.`;
      const generatedImage = await generateCharacterImage(imagePrompt);
      if (generatedImage) {
        setCharacter(c => ({ ...c, image: generatedImage }));
      } else {
        alert("A IA não conseguiu gerar uma imagem desta vez. Tente ajustar a descrição da aparência ou tente novamente mais tarde.");
      }
    } catch (error) {
      console.error("Falha ao gerar imagem", error);
      alert("Ocorreu um erro ao tentar gerar a imagem.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRandomizeField = (field: keyof Omit<CharacterData, 'image' | 'appearance' | 'weapon'>) => {
    let randomValue: string;
    switch (field) {
        case 'playerName':
            randomValue = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
            break;
        case 'characterName':
            randomValue = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
            break;
        case 'gender':
             randomValue = GENDERS[Math.floor(Math.random() * GENDERS.length)];
             break;
        case 'background':
            randomValue = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
            break;
        case 'race':
            const allRaces = selectedGenre === 'Isekai' ? [...RACES, ...MONSTER_RACES] : RACES;
            randomValue = allRaces[Math.floor(Math.random() * allRaces.length)];
            break;
        case 'class':
            randomValue = CLASSES[Math.floor(Math.random() * CLASSES.length)];
            break;
        case 'provacao':
            randomValue = SEVEN_DEADLY_SINS[Math.floor(Math.random() * SEVEN_DEADLY_SINS.length)];
            break;
    }
     setCharacter(c => ({ ...c, [field]: randomValue }));
  };

  const handleRandomizeAppearance = async () => {
    setIsGeneratingAppearance(true);
    try {
      const description = await generateAppearanceDescription({
        race: character.race,
        charClass: character.class,
        weapon: character.weapon,
        background: character.background,
      });
      setCharacter(c => ({ ...c, appearance: description }));
    } catch (error) {
      console.error("Falha ao gerar aparência", error);
      setCharacter(c => ({ ...c, appearance: "Uma figura misteriosa envolta em sombras." }));
    } finally {
      setIsGeneratingAppearance(false);
    }
  };
  
  const handleRandomize = useCallback(async () => {
    const allRaces = selectedGenre === 'Isekai' ? [...RACES, ...MONSTER_RACES] : RACES;
    const randomRace = allRaces[Math.floor(Math.random() * allRaces.length)];
    const randomClass = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    const randomWeapons = WEAPONS_BY_CLASS[randomClass];
    let randomWeapon = randomWeapons[Math.floor(Math.random() * randomWeapons.length)];
    if (RACES_WITH_NATURAL_WEAPONS.includes(randomRace)) {
        randomWeapon = NATURAL_WEAPON;
    }
    const randomBackground = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    const randomPlayerName = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`;
    const randomCharName = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
    const randomSin = selectedGenre === 'Bíblico' ? SEVEN_DEADLY_SINS[Math.floor(Math.random() * SEVEN_DEADLY_SINS.length)] : undefined;
    const randomGender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    
    const baseRandomChar: CharacterData = {
        ...character,
        race: randomRace, class: randomClass, weapon: randomWeapon.name,
        background: randomBackground, playerName: randomPlayerName, characterName: randomCharName,
        gender: randomGender,
        provacao: randomSin,
    };
    setCharacter(baseRandomChar);
    
    setIsGeneratingAppearance(true);
    try {
        const description = await generateAppearanceDescription({ race: randomRace, charClass: randomClass, weapon: randomWeapon.name, background: randomBackground });
        setCharacter(c => ({ ...c, appearance: description }));
    } catch (error) {
        console.error("Falha ao gerar aparência", error);
        setCharacter(c => ({ ...c, appearance: "Uma figura misteriosa envolta em sombras." }));
    } finally {
        setIsGeneratingAppearance(false);
    }
  }, [selectedGenre, character]);

  return {
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
  };
};

export default useCharacterCreator;