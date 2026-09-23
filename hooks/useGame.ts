import { useState, useCallback, useEffect, useRef } from 'react';
import { generateStorySegment, GameStateUpdate, TextDescriptionStyle, ShipStatus, Faction, SquadStatus, Evidence, generateCharacterImage, Creature, Item, EnemyInCombat, GameContext, summarizeStory, generatePlayerAction, generateQuickContent } from '../services/geminiService';
import { CLASS_STATS_BONUSES, MONSTER_RACE_STATS_BONUSES, RACE_STATS_BONUSES, WEAPONS_BY_CLASS, RACES_WITH_NATURAL_WEAPONS, NATURAL_WEAPON } from '../utils/characterData';
import { ACHIEVEMENTS_DATA, Achievement } from '../utils/achievementsData';
import { getInitialIsekaiSkills, AbilityProgression } from '../utils/skillsData';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import type { GameState, ModalType, Settings, Status, CharacterData, GameTime, SavedCharacter, SavedGame, Ability, NotebookData, CombatState, Combatant } from '../types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const useGame = () => {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [playMode, setPlayMode] = useState<'player' | 'master' | null>(null);
  const [story, setStory] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedSetting, setSelectedSetting] = useState<string>('');
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [isDiceRollActive, setIsDiceRollActive] = useState<boolean>(false);
  const [isInitiativeRollActive, setIsInitiativeRollActive] = useState<boolean>(false);
  const [enemiesForInitiative, setEnemiesForInitiative] = useState<EnemyInCombat[]>([]);
  const [isNewAdventureForLoadedChar, setIsNewAdventureForLoadedChar] = useState<boolean>(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [shouldAutoSave, setShouldAutoSave] = useState(false);
  const [hasShownIncognitoWarning, setHasShownIncognitoWarning] = useState(false);
  
  const [storySummary, setStorySummary] = useState<string>('');
  const [turnsSinceLastSummary, setTurnsSinceLastSummary] = useState<number>(0);

  const [status, setStatus] = useState<Status>({ 
    health: 10, maxHealth: 10, mana: 10, maxMana: 10, energy: 10, maxEnergy: 10,
    sanity: 100, maxSanity: 0,
    description: 'Pronto para a aventura!',
    title: 'nenhum', fame: '', level: 1, experience: 0, maxExperience: 100,
    strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0,
    skillPoints: 0, gold: 0
  });
  const [inventory, setInventory] = useState<Item[]>([]);
  const [skills, setSkills] = useState<Ability[]>([]);
  const [bestiary, setBestiary] = useState<Creature[]>([]);
  const [allies, setAllies] = useState<Creature[]>([]);
  const [enemies, setEnemies] = useState<EnemyInCombat[]>([]);
  const [systemLog, setSystemLog] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, number>>({
    'Status': 0, 'Habilidades': 0, 'Inventário': 0, 'Bestiário': 0, 'Aliados': 0, 'Inimigos': 0, 'Mapa': 0, 'Sistema': 0, 'Configurações': 0,
  });
  const [location, setLocation] = useState<string>('Local Desconhecido');
  const [gameTime, setGameTime] = useState<GameTime>({ hour: 8, minute: 0, day: 1, month: 1, year: 1428 });
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_DATA);
  const [actionSuggestions, setActionSuggestions] = useState<string[]>([]);
  
  const [shipStatus, setShipStatus] = useState<ShipStatus | null>(null);
  const [factionReputation, setFactionReputation] = useState<Faction[]>([]);
  const [squadStatus, setSquadStatus] = useState<SquadStatus | null>(null);
  const [evidenceBoard, setEvidenceBoard] = useState<Evidence[]>([]);

  // New states for master mode tools
  const [notebookData, setNotebookData] = useState<NotebookData>({ notes: '', npcs: '', places: '', quests: '' });
  const [generatorResult, setGeneratorResult] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // --- NOVO ESTADO DE COMBATE ---
  const [combatState, setCombatState] = useState<CombatState>({
    isInCombat: false,
    turnOrder: [],
    currentTurnIndex: 0,
  });
  const isLoadingRef = useRef(false);
  const combatStateRef = useRef(combatState);
  useEffect(() => { combatStateRef.current = combatState }, [combatState]);


  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = storageService.getItem('rpgMakerSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      textSpeed: 'Normal',
      textDescription: 'Curto e Detalhado',
      autoNarrate: false,
      theme: 'Padrão',
      volume: 0.5,
      showActionSuggestions: false,
      autoSave: true,
    };
  });
  
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);

  useEffect(() => {
    setSavedGames(JSON.parse(storageService.getItem('rpgMakerSavedGames') || '[]'));
    setSavedCharacters(JSON.parse(storageService.getItem('rpgMakerSavedCharacters') || '[]'));
    const savedAchievements = JSON.parse(storageService.getItem('rpgMakerUnlockedAchievements') || '[]');
    setAchievements(prev => prev.map(ach => ({...ach, unlocked: savedAchievements.includes(ach.id)})));
  }, []);
  
  useEffect(() => {
    storageService.setItem('rpgMakerSettings', JSON.stringify(settings));
    document.body.classList.remove('theme-claro', 'theme-escuro');
    if (settings.theme === 'Claro') document.body.classList.add('theme-claro');
    if (settings.theme === 'Escuro') document.body.classList.add('theme-escuro');
    audioService.setVolume(settings.volume);
  }, [settings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setGameState('mainMenu');
    }, 3000); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const initializeAndPlay = async () => {
        await audioService.init();
        setAudioInitialized(true); 
    };
    initializeAndPlay();
  }, []);

  useEffect(() => {
    if (!audioInitialized) return;

    if (gameState === 'mainMenu') {
        audioService.playMenuMusic();
    } else if (gameState === 'inGame') {
        if (playMode === 'player') {
            if (combatState.isInCombat && characterData) {
                audioService.playBattleMusic(characterData.class);
            } else if (selectedGenre) {
                audioService.playAdventureMusic(selectedGenre);
            }
        }
    } else {
        if (gameState !== 'loading' && gameState !== 'characterCreation') { 
            audioService.stopMusic();
        }
    }
  }, [gameState, combatState.isInCombat, characterData, selectedGenre, audioInitialized, playMode]);

  const showIncognitoWarning = () => {
      if (!storageService.isLocalStorageAvailable() && !hasShownIncognitoWarning) {
          alert("Aviso: Você está em modo anônimo. Seu progresso será salvo apenas para esta sessão e será perdido ao fechar o navegador.");
          setHasShownIncognitoWarning(true);
      }
  };
  
  const getRecentStoryTurns = (fullStory: string, numTurns: number): string => {
    const turns = fullStory.split('\n\n');
    const recentTurns = turns.slice(-numTurns);
    return recentTurns.join('\n\n');
  };

  const handleSaveAdventure = useCallback((isAutoSave = false) => {
    try {
        if (!characterData || playMode !== 'player') return;
        showIncognitoWarning();
        const unlockedAchievements = achievements.filter(a => a.unlocked).map(a => a.id);
        
        // Otimizações para reduzir o tamanho do save:
        // 1. Limita a história salva aos últimos 20 turnos.
        const storyToSave = getRecentStoryTurns(story, 20);
        // 2. Limita o log do sistema às últimas 50 entradas.
        const logToSave = systemLog.slice(-50);
        // 3. Remove imagens (dados base64 pesados) do bestiário e dos aliados antes de salvar.
        const bestiaryToSave = bestiary.map(creature => ({ ...creature, image: null }));
        const alliesToSave = allies.map(ally => ({ ...ally, image: null }));
        // 4. Remove a imagem do personagem principal do save da aventura para economizar espaço.
        const characterDataToSave = { ...characterData, image: null };

        const newSave: SavedGame = {
            id: characterData.characterName,
            savedAt: new Date().toLocaleString(),
            characterData: characterDataToSave,
            status, 
            inventory, 
            skills, 
            bestiary: bestiaryToSave,
            allies: alliesToSave,
            enemies, 
            systemLog: logToSave,
            story: storyToSave, 
            storySummary, 
            selectedGenre, 
            selectedSetting,
            location, 
            gameTime, 
            unlockedAchievements
        };

        const updatedSaves = [...savedGames.filter(s => s.id !== newSave.id), newSave];
        storageService.setItem('rpgMakerSavedGames', JSON.stringify(updatedSaves));
        setSavedGames(updatedSaves);
        if (!isAutoSave) {
            alert(`Aventura "${newSave.id}" salva!`);
        } else {
            console.log(`Aventura "${newSave.id}" salva automaticamente.`);
        }
    } catch (error) {
        console.error("Falha ao salvar aventura:", error);
        if (!isAutoSave) {
            alert(`Falha ao salvar aventura:\n${error instanceof Error ? error.message : 'O armazenamento pode estar cheio ou o navegador está em modo privado.'}`);
        }
    }
  }, [characterData, status, inventory, skills, bestiary, allies, enemies, systemLog, story, storySummary, selectedGenre, selectedSetting, location, gameTime, achievements, savedGames, hasShownIncognitoWarning, playMode]);

  const handleSaveCharacter = useCallback((isAutoSave = false) => {
    try {
        if (!characterData || playMode !== 'player') return;
        showIncognitoWarning();
        const newSave: SavedCharacter = {
            id: characterData.characterName,
            savedAt: new Date().toLocaleString(),
            characterData, status, inventory, skills
        };
        const updatedSaves = [...savedCharacters.filter(s => s.id !== newSave.id), newSave];
        storageService.setItem('rpgMakerSavedCharacters', JSON.stringify(updatedSaves));
        setSavedCharacters(updatedSaves);
        if (!isAutoSave) {
            alert(`Personagem "${newSave.id}" salvo!`);
        } else {
            console.log(`Personagem "${newSave.id}" salvo automaticamente.`);
        }
    } catch (error) {
        console.error("Falha ao salvar personagem:", error);
        if (!isAutoSave) {
            alert("Não foi possível salvar o personagem. O armazenamento pode estar cheio ou o navegador está em modo privado.");
        }
    }
  }, [characterData, status, inventory, skills, savedCharacters, hasShownIncognitoWarning, playMode]);

  useEffect(() => {
    if (shouldAutoSave && settings.autoSave) {
        handleSaveAdventure(true);
        handleSaveCharacter(true);
        setShouldAutoSave(false);
    } else if (shouldAutoSave) {
        setShouldAutoSave(false);
    }
  }, [shouldAutoSave, settings.autoSave, handleSaveAdventure, handleSaveCharacter]);

  const handleLoadAdventure = (save: SavedGame) => {
    setPlayMode('player');
    setCharacterData(save.characterData);
    setStatus(save.status);
    setInventory(save.inventory);
    setSkills(save.skills);
    setBestiary(save.bestiary);
    setAllies(save.allies);
    setEnemies(save.enemies);
    setSystemLog(save.systemLog);
    setStory(save.story);
    setStorySummary(save.storySummary || '');
    setSelectedGenre(save.selectedGenre);
    setSelectedSetting(save.selectedSetting || '');
    setLocation(save.location);
    setGameTime(save.gameTime);
    setAchievements(prev => prev.map(ach => ({...ach, unlocked: save.unlockedAchievements.includes(ach.id)})));
    setGameState('inGame');
  };

  const handleLoadCharacter = (save: SavedCharacter) => {
    setPlayMode('player');
    setCharacterData(save.characterData);
    setStatus(save.status);
    setInventory(save.inventory);
    setSkills(save.skills);
    setBestiary([]);
    setAllies([]);
    setEnemies([]);
    setSystemLog([]);
    setStory('');
    setStorySummary('');
    setSelectedGenre('');
    setSelectedSetting('');
    setLocation('Local Desconhecido');
    setGameTime({ hour: 8, minute: 0, day: 1, month: 1, year: 1428 });
    setIsNewAdventureForLoadedChar(true);
    setGameState('genreSelection');
  };
  
  const handleDeleteSave = (id: string, type: 'game' | 'character') => {
    if(type === 'game') {
        const updatedSaves = savedGames.filter(s => s.id !== id);
        storageService.setItem('rpgMakerSavedGames', JSON.stringify(updatedSaves));
        setSavedGames(updatedSaves);
    } else {
        const updatedSaves = savedCharacters.filter(s => s.id !== id);
        storageService.setItem('rpgMakerSavedCharacters', JSON.stringify(updatedSaves));
        setSavedCharacters(updatedSaves);
    }
  };

  const handleUpgradeSkill = (skillName: string) => {
    const skillToUpgrade = skills.find(s => s.name === skillName);
    if (skillToUpgrade && status.skillPoints > 0 && skillToUpgrade.level < skillToUpgrade.maxLevel) {
        const newSkills = skills.map(s => 
            s.name === skillName ? { ...s, level: s.level + 1 } : s
        );
        setSkills(newSkills);
        setStatus(prev => ({ ...prev, skillPoints: prev.skillPoints - 1 }));
        setSystemLog(prev => [...prev, `Habilidade '${skillName}' melhorada para o nível ${skillToUpgrade.level + 1}!`]);
        setNotifications(prev => ({ ...prev, 'Habilidades': (prev['Habilidades'] || 0) + 1 }));
    }
  };

  const endCombat = () => {
    setSystemLog(prev => [...prev, 'Combate finalizado!']);
    setCombatState({ isInCombat: false, turnOrder: [], currentTurnIndex: 0 });
    // Potential XP gain or loot can be handled here in the future
  };

  const startCombat = (currentEnemies: EnemyInCombat[]) => {
    if (combatStateRef.current.isInCombat) {
        console.warn("Tentativa de iniciar combate enquanto já estava em combate. Ignorando.");
        return;
    }
    setSystemLog(prev => [...prev, 'O combate começou! O Mestre pede um teste de iniciativa.']);
    setStory(prev => prev + `\n\nMestre:\nInimigos se aproximam! Role os dados para ver quem age primeiro.`);
    setEnemiesForInitiative(currentEnemies);
    setIsInitiativeRollActive(true);
    setActionSuggestions([]);
  };
  
    const handleInitiativeRoll = () => {
        if (!characterData) return;
        setIsInitiativeRollActive(false);
        audioService.playSoundEffect('/assets/audio/sfx/dice/roll.mp3');

        // Build the narrative string for the main chat
        let initiativeNarration = "As tensões aumentam enquanto todos se preparam para a batalha!\n\n**Resultados da Iniciativa:**\n";
        
        const playerBaseRoll = Math.floor(Math.random() * 20) + 1;
        const playerModifier = status.dexterity;
        const playerInitiative = playerBaseRoll + playerModifier;
        initiativeNarration += `- ${characterData.characterName} rolou ${playerInitiative} (${playerBaseRoll} + ${playerModifier} DES).\n`;
        const playerCombatant: Combatant = { id: 'player', name: characterData.characterName, type: 'player', initiative: playerInitiative };

        const allyCombatants: Combatant[] = allies.map(ally => {
            const roll = Math.floor(Math.random() * 20) + 1;
            initiativeNarration += `- ${ally.name} rolou ${roll}.\n`;
            return { id: ally.name, name: ally.name, type: 'ally', initiative: roll };
        });

        const enemyCombatants: Combatant[] = enemiesForInitiative.map(enemy => {
            const roll = Math.floor(Math.random() * 20) + 1;
            initiativeNarration += `- ${enemy.name} (${enemy.id}) rolou ${roll}.\n`;
            return { id: enemy.id, name: enemy.name, type: 'enemy', initiative: roll };
        });

        const allCombatants = [playerCombatant, ...allyCombatants, ...enemyCombatants];
        allCombatants.sort((a, b) => b.initiative - a.initiative);

        const turnOrderLog = `Ordem de iniciativa: ${allCombatants.map(c => c.name).join(', ')}.`;
        initiativeNarration += `\n${turnOrderLog}`;

        setStory(prev => prev + `\n\nMestre:\n${initiativeNarration}`);
        setSystemLog(prev => [...prev, turnOrderLog]); // Keep a clean version for the log
        setEnemiesForInitiative([]);
        
        setCombatState({ isInCombat: true, turnOrder: allCombatants, currentTurnIndex: 0 });
    };

  useEffect(() => {
    if (combatState.isInCombat) {
        processNextTurn();
    }
  }, [combatState.currentTurnIndex, combatState.isInCombat]); // Roda quando o turno muda

  const processNextTurn = useCallback(() => {
    const { isInCombat, turnOrder, currentTurnIndex } = combatStateRef.current;
    if (!isInCombat || turnOrder.length === 0 || isLoadingRef.current) return;

    const currentActor = turnOrder[currentTurnIndex];
    if (currentActor.type === 'ally' || currentActor.type === 'enemy') {
        handleAiTurn(currentActor);
    }
    // If it's the player's turn, the app will just wait for user input.
  }, []);

  const advanceTurn = useCallback(() => {
    setCombatState(prevState => {
        if (!prevState.isInCombat) return prevState;
        const nextIndex = (prevState.currentTurnIndex + 1) % prevState.turnOrder.length;

        // Announce new round
        if (nextIndex === 0) {
            setSystemLog(prev => [...prev, 'Nova rodada de combate iniciada.']);
        }

        // Announce player's turn
        const nextActor = prevState.turnOrder[nextIndex];
        if (nextActor.type === 'player' && characterData) {
            setStory(prevStory => prevStory + `\n\nMestre:\nÉ o seu turno, ${characterData.characterName}.`);
        }

        return { ...prevState, currentTurnIndex: nextIndex };
    });
  }, [characterData]);

  const handleAiTurn = async (actor: Combatant) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      const prompt = `É o turno de ${actor.name}. Descreva sua ação de combate.`;
      const newStoryHistory = story + `\n\nSistema:\nÉ o turno de ${actor.name}.`;
      setStory(newStoryHistory);
      
      try {
        const gameContext: GameContext = { 
            status, inventory, skills, allies, enemies,
            isInCombat: true, 
            turnOrder: combatState.turnOrder, 
            currentTurnActor: actor 
        };
        const historyForAI = storySummary ? `${storySummary}\n\n[EVENTOS RECENTES]\n${newStoryHistory.slice(-1500)}` : newStoryHistory;
        const result = await generateStorySegment(historyForAI, prompt, settings.textDescription, selectedGenre, selectedSetting, gameContext);

        let storyText = processStoryResult(result);
        if (!storyText) storyText = `${actor.name} pondera sobre sua próxima ação...`;
        
        const finalStory = newStoryHistory + `\n\nMestre:\n${storyText}`;
        setStory(finalStory);
        updateGameState(result);
        
        // Check if combat ended due to this turn
        if (result.enemies && result.enemies.length === 0) {
            endCombat();
        } else {
            advanceTurn();
        }

      } catch (err) {
          setError('A IA encontrou uma dificuldade. Por favor, tente novamente.');
          console.error(String(err));
          setStory(story);
      } finally {
          setIsLoading(false);
          isLoadingRef.current = false;
      }
  };


  const updateGameState = (update: GameStateUpdate) => {
    const logEntries: string[] = [];
    const newNotifications = { ...notifications };
    let hasNewNotifications = false;

    // Handle combat state transition
    const wasInCombat = combatStateRef.current.isInCombat;
    if (!wasInCombat && update.enemies && update.enemies.length > 0) {
        startCombat(update.enemies);
    } else if (wasInCombat && (!update.enemies || update.enemies.length === 0)) {
        endCombat();
    }


    if (update.location) setLocation(update.location);
    if (update.actionSuggestions && update.actionSuggestions.length > 0 && !combatStateRef.current.isInCombat) {
        setActionSuggestions(update.actionSuggestions);
    } else {
        setActionSuggestions([]);
    }
    if (update.gameTime) setGameTime(prev => ({...prev, ...update.gameTime}));
    if (update.diceRollChallenge) setIsDiceRollActive(true);

    if(update.unlockedAchievementId) {
        const achievement = achievements.find(a => a.id === update.unlockedAchievementId && !a.unlocked);
        if(achievement) {
            setAchievements(prev => prev.map(a => a.id === achievement.id ? {...a, unlocked: true} : a));
            const unlockedIds = achievements.filter(a => a.unlocked || a.id === achievement.id).map(a => a.id);
            storageService.setItem('rpgMakerUnlockedAchievements', JSON.stringify(unlockedIds));
            alert(`🏆 Conquista Desbloqueada! 🏆\n\n${achievement.name}\n${achievement.description}`);
            logEntries.push(`Conquista Desbloqueada: ${achievement.name}`);
            audioService.playSoundEffect('/assets/audio/sfx/system/achievement_unlocked.mp3');
        }
    }

    if (update.playerStatus) {
        if (update.playerStatus.level && status.level < update.playerStatus.level) {
            logEntries.push(`Você subiu para o nível ${update.playerStatus.level}!`);
            newNotifications['Status']++;
            hasNewNotifications = true;
        }
        
        setStatus(prevStatus => {
            const newStatus = { ...prevStatus, ...update.playerStatus };
            newStatus.health = Math.max(0, newStatus.health);
            newStatus.mana = Math.max(0, newStatus.mana);
            newStatus.energy = Math.max(0, newStatus.energy);
            newStatus.sanity = Math.max(0, newStatus.sanity);
            return newStatus;
        });
    }
    
    if (update.shipStatus) setShipStatus(update.shipStatus);
    if (update.factionReputation) setFactionReputation(update.factionReputation);
    if (update.squadStatus) setSquadStatus(update.squadStatus);
    if (update.evidenceBoard) {
        const newEvidence = update.evidenceBoard.filter(ev => !evidenceBoard.some(oldEv => oldEv.id === ev.id));
        if (newEvidence.length > 0) {
            setEvidenceBoard(prev => [...prev, ...newEvidence]);
            newEvidence.forEach(ev => logEntries.push(`Nova evidência encontrada: ${ev.description}`));
            newNotifications['Inventário']++; 
            hasNewNotifications = true;
        }
    }

    if (update.inventory && update.inventory.length > 0) {
        const newInventory = [...inventory];
        let newItemsCount = 0;
        update.inventory.forEach(newItem => {
            const existingItemIndex = newInventory.findIndex(i => i.name.toLowerCase().trim() === newItem.name.toLowerCase().trim());
            if(existingItemIndex !== -1) {
                newInventory[existingItemIndex].quantity += newItem.quantity;
            } else {
                newInventory.push(newItem);
            }
            logEntries.push(`Item adquirido: ${newItem.name} (x${newItem.quantity}).`);
            newItemsCount++;
        });
        setInventory(newInventory);
        if (newItemsCount > 0) {
            newNotifications['Inventário'] += newItemsCount;
            hasNewNotifications = true;
        }
    }
    
    if (update.skills && update.skills.length > 0) {
        const newSkillsFromAPI = update.skills.filter(newSkill => 
            !skills.some(existingSkill => existingSkill.name === newSkill.name)
        );

        if (newSkillsFromAPI.length > 0) {
            const formattedNewSkills: Ability[] = newSkillsFromAPI.map(apiSkillUntyped => {
                const apiSkill = apiSkillUntyped as any;

                const initialProgression: AbilityProgression = {
                    level: apiSkill.level || 1,
                    description: apiSkill.description || 'Nova habilidade misteriosa.',
                    damage: apiSkill.damage,
                    cost: apiSkill.cost,
                };

                const newAbility: Ability = {
                    name: apiSkill.name,
                    category: apiSkill.category || 'Habilidades Mágicas Aprendidas',
                    costType: apiSkill.costType,
                    level: apiSkill.level || 1,
                    maxLevel: apiSkill.maxLevel || 1,
                    progression: [initialProgression],
                };
                
                return newAbility;
            });

            setSkills(prev => [...prev, ...formattedNewSkills]);
            formattedNewSkills.forEach(skill => logEntries.push(`Habilidade aprendida: ${skill.name}.`));
            newNotifications['Habilidades'] += formattedNewSkills.length;
            hasNewNotifications = true;
        }
    }

    if (update.bestiary && update.bestiary.length > 0) {
        const newBestiary = [...bestiary];
        let bestiaryUpdatesCount = 0;
        const creaturesForImageGen: Creature[] = [];
        update.bestiary.forEach(updatedCreature => {
            const existingIndex = newBestiary.findIndex(c => c.name === updatedCreature.name);
            if (existingIndex !== -1) {
                if (JSON.stringify(newBestiary[existingIndex].knownInfo) !== JSON.stringify(updatedCreature.knownInfo)) {
                    logEntries.push(`Você aprendeu algo novo sobre ${updatedCreature.name}.`);
                    bestiaryUpdatesCount++;
                }
                newBestiary[existingIndex] = {...newBestiary[existingIndex], ...updatedCreature};
            } else {
                newBestiary.push(updatedCreature);
                creaturesForImageGen.push(updatedCreature);
                logEntries.push(`Nova criatura encontrada: ${updatedCreature.name}.`);
                bestiaryUpdatesCount++;
            }
        });
        setBestiary(newBestiary);
        creaturesForImageGen.forEach(creature => {
            const imagePrompt = `Retrato de criatura de RPG, estilo arte digital, foco na criatura. Criatura: um(a) ${creature.name}. Descrição: ${creature.description}.`;
            generateCharacterImage(imagePrompt).then(generatedImage => {
                if (generatedImage) {
                    setBestiary(prev => prev.map(c => c.name === creature.name ? { ...c, image: generatedImage } : c));
                }
            });
        });
        if (bestiaryUpdatesCount > 0) {
            newNotifications['Bestiário'] += bestiaryUpdatesCount;
            hasNewNotifications = true;
        }
    }

    if (update.allies && update.allies.length > 0) {
        const newAllies = update.allies.filter(newAlly => !allies.some(existingAlly => existingAlly.name === newAlly.name));
        if (newAllies.length > 0) {
            setAllies(prev => [...prev, ...newAllies]);
            newAllies.forEach(ally => {
                logEntries.push(`${ally.name} se juntou ao grupo.`);
                const imagePrompt = `Retrato de personagem de RPG, estilo arte digital, foco no personagem. Personagem: um(a) ${ally.name}. Descrição: ${ally.description}.`;
                generateCharacterImage(imagePrompt).then(generatedImage => {
                    if (generatedImage) {
                        setAllies(prev => prev.map(a => a.name === ally.name ? { ...a, image: generatedImage } : a));
                    }
                });
            });
            newNotifications['Aliados'] += newAllies.length;
            hasNewNotifications = true;
        }
    }

    if (update.enemies) {
        setEnemies(update.enemies);
    }

    if (logEntries.length > 0) {
        setSystemLog(prev => [...prev, ...logEntries]);
        newNotifications['Sistema'] += logEntries.length;
    }

    if (hasNewNotifications) {
        audioService.playSoundEffect('/assets/audio/sfx/notifications/notification.mp3');
    }

    setNotifications(newNotifications);
  };

  const handleSelectGenre = (genre: string) => {
    setSelectedGenre(genre);
    if (genre === 'Isekai') {
      setSelectedSetting('Um Mundo de Fantasia com Sistema de Jogo');
      setGameState('characterCreation');
    } else {
      setGameState('settingSelection');
    }
  };

  const handleSelectSetting = (setting: string) => {
    setSelectedSetting(setting);
    setGameState('characterCreation');
  };

  const processStoryResult = (result: GameStateUpdate): string => {
      const textParts = [];
      if (result.storyText) textParts.push(result.storyText);
      if (result.npcDialogue && result.npcDialogue.line) {
          textParts.push(`\n\n${result.npcDialogue.character}:\n*${result.npcDialogue.line}*`);
      }
      return textParts.join('').trim().replace(/undefined\s*$/, '').trim();
  };

  const handleStartAdventure = useCallback(async (character: CharacterData) => {
    setCharacterData(character);
    setIsLoading(true);
    setError(null);
    setStorySummary('');
    setTurnsSinceLastSummary(0);
    setActionSuggestions([]);

    // --- Lógica de cálculo de atributos refatorada ---
    const baseAttributes: { [key: string]: number } = {
        strength: 0, dexterity: 0, constitution: 0,
        intelligence: 0, wisdom: 0, charisma: 0,
    };

    const allRaceBonuses = { ...RACE_STATS_BONUSES, ...MONSTER_RACE_STATS_BONUSES };
    const raceBonuses = allRaceBonuses[character.race] || {};
    const classBonuses = CLASS_STATS_BONUSES[character.class] || {};

    Object.keys(baseAttributes).forEach(attr => {
        const key = attr as keyof typeof baseAttributes;
        const raceBonus = Number(raceBonuses[key as keyof typeof raceBonuses] || 0);
        const classBonus = Number(classBonuses[key as keyof typeof classBonuses] || 0);
        // Garante que o cálculo é feito com números, prevenindo concatenação de strings.
        baseAttributes[key] += raceBonus + classBonus;
    });

    const finalConstitution = baseAttributes.constitution;
    const finalDexterity = baseAttributes.dexterity;
    const finalIntelligence = baseAttributes.intelligence;

    const finalMaxHealth = 10 + (finalConstitution * 10);
    const finalMaxEnergy = 10 + (finalDexterity * 10);
    const finalMaxMana = 10 + (finalIntelligence * 10);
    
    const newStatus: Status = {
      health: finalMaxHealth, maxHealth: finalMaxHealth, mana: finalMaxMana, maxMana: finalMaxMana, 
      energy: finalMaxEnergy, maxEnergy: finalMaxEnergy, sanity: 100, maxSanity: 0,
      description: 'Pronto para a aventura!', title: 'nenhum', fame: 'Desconhecido', 
      level: 1, experience: 0, maxExperience: 100,
      strength: baseAttributes.strength, dexterity: baseAttributes.dexterity, constitution: baseAttributes.constitution,
      intelligence: baseAttributes.intelligence, wisdom: baseAttributes.wisdom, charisma: baseAttributes.charisma,
      skillPoints: selectedGenre === 'Isekai' ? 2 : 0,
      gold: 0,
    };
    
    if (selectedGenre === 'Terror') newStatus.maxSanity = 100;
    
    const newSkills = selectedGenre === 'Isekai' ? getInitialIsekaiSkills(character.race, character.class) : [];
    
    const newInventory: Item[] = [];
    if (character.weapon) {
        const weaponList = WEAPONS_BY_CLASS[character.class] || [];
        const weaponData = RACES_WITH_NATURAL_WEAPONS.includes(character.race) ? NATURAL_WEAPON : weaponList.find(w => w.name === character.weapon);
        if (weaponData) {
            newInventory.push({
                name: weaponData.name, description: `Sua fiel ${weaponData.name}. Parece confiável.`,
                type: 'Arma', quantity: 1, damage: weaponData.damage
            });
        }
    }

    setSkills(newSkills);
    setInventory(newInventory);
    setStatus(newStatus);
    setShipStatus(null);
    setFactionReputation([]);
    setSquadStatus(null);
    setEvidenceBoard([]);
    setGameState('inGame');

    try {
      let initialPrompt = `Crie a cena de abertura para uma aventura de RPG do gênero ${selectedGenre} com ambientação ${selectedSetting}. O personagem principal, ${character.characterName}, é um(a) ${character.race} ${character.gender} da classe ${character.class} cuja aparência é '${character.appearance}' e cujo histórico é '${character.background}'.`;
      if (selectedGenre === 'Bíblico' && character.provacao) {
        initialPrompt += ` A provação que ele enfrenta, baseada nos sete pecados capitais, é a '${character.provacao}'. A aventura deve ser moldada a partir da escolha deste pecado.`;
      }
      initialPrompt += ` Comece a história, introduzindo as mecânicas únicas deste gênero se aplicável.`;

      const gameContext: GameContext = { status: newStatus, inventory: newInventory, skills: newSkills, isInCombat: false, allies, enemies };
      const result = await generateStorySegment('', initialPrompt, settings.textDescription, selectedGenre, selectedSetting, gameContext);
      let storyText = processStoryResult(result);
      if (!storyText) storyText = "O mestre parece ter se perdido em seus pensamentos antes de começar a história...";
      setStory(`Mestre:\n${storyText}`);
      const update = { ...result };
      delete update.inventory; // Impede que a arma inicial seja duplicada pela IA no primeiro turno
      updateGameState(update);
    } catch (err) {
      setError('Falha ao iniciar a história. Por favor, verifique sua chave de API e tente novamente.');
      console.error(String(err));
      setGameState('mainMenu'); 
    } finally {
      setIsLoading(false);
      setIsNewAdventureForLoadedChar(false);
    }
  }, [selectedGenre, selectedSetting, settings.textDescription]);

    const updateSummary = useCallback(async (currentStory: string, previousSummary: string) => {
        const turns = currentStory.split('\n\n');
        const recentTurns = turns.slice(-10).join('\n\n');
        try {
            const newSummary = await summarizeStory(previousSummary, recentTurns);
            setStorySummary(newSummary);
            setTurnsSinceLastSummary(0);
            console.log("Resumo da história atualizado.");
        } catch (err) {
            console.error("Falha ao atualizar o resumo da história:", err);
        }
    }, []);

  const handleUserInput = async (prompt: string) => {
    if (!prompt.trim() || isLoadingRef.current) return;

    const storyBeforeUpdate = story; // Preserve story state for potential error revert
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
        if (playMode === 'player') {
            if (!characterData) {
                throw new Error("Dados do personagem não encontrados no modo jogador.");
            }
            setActionSuggestions([]);
            const newStoryHistory = story + `\n\n${characterData.characterName}:\n${prompt}`;
            setStory(newStoryHistory);

            const currentActor = combatState.isInCombat ? combatState.turnOrder[combatState.currentTurnIndex] : undefined;
            const gameContext: GameContext = { 
                status, inventory, skills, allies, enemies,
                isInCombat: combatState.isInCombat,
                turnOrder: combatState.turnOrder,
                currentTurnActor: currentActor
            };
            const historyForAI = storySummary ? `${storySummary}\n\n[EVENTOS RECENTES]\n${newStoryHistory.slice(-1500)}` : newStoryHistory;
            const result = await generateStorySegment(historyForAI, prompt, settings.textDescription, selectedGenre, selectedSetting, gameContext);
            let storyText = processStoryResult(result);
            if (!storyText) storyText = "O mestre parece confuso...";
            
            const finalStory = newStoryHistory + `\n\nMestre:\n${storyText}`;
            setStory(finalStory);
            updateGameState(result);
            
            if (combatStateRef.current.isInCombat) {
                if (!result.enemies || result.enemies.length === 0) {
                    endCombat();
                } else {
                    advanceTurn();
                }
            }
            
            const newTurnCount = turnsSinceLastSummary + 1;
            if (newTurnCount >= 5 && !combatStateRef.current.isInCombat) {
                updateSummary(finalStory, storySummary);
            } else {
                setTurnsSinceLastSummary(newTurnCount);
            }
            setShouldAutoSave(true);

        } else if (playMode === 'master') {
            const newStoryHistory = story + `\n\nMestre:\n${prompt}`;
            setStory(newStoryHistory);
            
            const playerAction = await generatePlayerAction(newStoryHistory, prompt);
            const finalStory = newStoryHistory + `\n\nJogador (IA):\n${playerAction}`;
            setStory(finalStory);
        }
    } catch (err) {
        if (playMode === 'player') {
            setError('Não foi possível obter a próxima parte da história. Por favor, tente novamente.');
            setStory(storyBeforeUpdate); // Revert to story before player input
        } else {
            setError('A IA do jogador falhou em responder. Por favor, tente novamente.');
            // No need to revert story, as the master's turn is what was just added
        }
        console.error(String(err));
    } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
    }
  };

  const handleDiceRoll = async () => {
    setIsDiceRollActive(false);
    setActionSuggestions([]);
    audioService.playSoundEffect('/assets/audio/sfx/dice/roll.mp3');
    const result = Math.floor(Math.random() * 20) + 1;

    if (result === 20) setTimeout(() => audioService.playSoundEffect('/assets/audio/sfx/dice/critical_success.mp3'), 300);

    const rollDisplayString = `\n\nMestre:\n[Você rolou ${result}!]`;
    const storyWithRoll = story + rollDisplayString;
    setStory(storyWithRoll);
    setIsLoading(true);
    setError(null);

    try {
      const promptForAI = `[Resultado do Teste: ${result}]`;
      const gameContext: GameContext = { status, inventory, skills, isInCombat: false, allies, enemies };
      const historyForAI = storySummary ? `${storySummary}\n\n[EVENTOS RECENTES]\n${storyWithRoll.slice(-1500)}` : storyWithRoll;
      const aiResponse = await generateStorySegment(historyForAI, promptForAI, settings.textDescription, selectedGenre, selectedSetting, gameContext);
      let storyText = processStoryResult(aiResponse);
      if (!storyText) storyText = "O mestre pondera sobre o resultado do dado...";

      const finalStory = storyWithRoll + `\n\nMestre:\n${storyText}`;
      setStory(finalStory);
      updateGameState(aiResponse);

      const newTurnCount = turnsSinceLastSummary + 1;
      if (newTurnCount >= 5) {
        updateSummary(finalStory, storySummary);
      } else {
        setTurnsSinceLastSummary(newTurnCount);
      }
      setShouldAutoSave(true);
    } catch (err) {
      setError('Não foi possível obter a próxima parte da história. Por favor, tente novamente.');
      console.error(String(err));
      setStory(story);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToPlayModeSelection = () => {
    setGameState('playModeSelection');
  };

  const handleSelectPlayMode = (mode: 'player' | 'master') => {
    setPlayMode(mode);
    if (mode === 'player') {
      setIsNewAdventureForLoadedChar(false);
      setGameState('genreSelection');
    } else {
      // Setup for Master mode
      setCharacterData({
          playerName: 'IA',
          characterName: 'Jogador (IA)',
          gender: 'Desconhecido',
          image: null,
          appearance: 'Uma entidade de pura lógica e criatividade.',
          background: 'Nascido nos circuitos de um grande servidor.',
          race: 'Construto',
          class: 'Inteligência Artificial',
          weapon: 'Algoritmos'
      });
      setStory("Mestre:\nVocê é o Mestre. A IA é o seu jogador. Descreva a cena inicial para começar a aventura.");
      setEnemies([]); // Ensure battle music doesn't play
      setGameState('inGame');
    }
  };

  // New handlers for master tools
  const handleNotebookChange = (field: keyof NotebookData, value: string) => {
    setNotebookData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateQuickContent = async (type: 'npc_name' | 'tavern_name' | 'location_description' | 'plot_hook', context: string) => {
    setIsGeneratingContent(true);
    setGeneratorResult('');
    try {
        const result = await generateQuickContent(type, context);
        setGeneratorResult(result);
    } catch (err) {
        setGeneratorResult(err instanceof Error ? err.message : 'Falha na geração.');
    } finally {
        setIsGeneratingContent(false);
    }
  };
  
  const handleAddEnemyToCombat = (name: string, maxHealth: number) => {
    const newEnemy: EnemyInCombat = {
        id: generateId(),
        name,
        description: 'Uma nova ameaça apareceu.',
        health: maxHealth,
        maxHealth
    };
    setEnemies(prev => [...prev, newEnemy]);
  };

  const handleUpdateEnemyHealth = (id: string, newHealth: number) => {
    setEnemies(prev => prev.map(enemy => 
        enemy.id === id ? { ...enemy, health: Math.max(0, newHealth) } : enemy
    ));
  };

  const handleRemoveEnemyFromCombat = (id: string) => {
    setEnemies(prev => prev.filter(enemy => enemy.id !== id));
  };


  const handleShowUpdates = () => setGameState('updateNotes');
  const handleShowLoadGame = () => setGameState('loadGame');
  const handleShowAchievements = () => setGameState('achievements');
  const handleBackToMenu = () => setGameState('mainMenu');
  const handleBackToGenre = () => setGameState('genreSelection');
  const handleBackToSetting = () => setGameState('settingSelection');
  const handleToggleHelpModal = () => setIsHelpModalOpen(prev => !prev);

  const handleReturnToMainMenu = () => {
    setActiveModal(null);
    setGameState('mainMenu');
    setStory('');
    setStorySummary('');
    setTurnsSinceLastSummary(0);
    setSelectedGenre('');
    setSelectedSetting('');
    setCharacterData(null);
    setInventory([]);
    setSkills([]);
    setBestiary([]);
    setAllies([]);
    setEnemies([]);
    setSystemLog([]);
    setActionSuggestions([]);
    setLocation('Local Desconhecido');
    setGameTime({ hour: 8, minute: 0, day: 1, month: 1, year: 1428 });
    setNotifications({ 'Status': 0, 'Habilidades': 0, 'Inventário': 0, 'Bestiário': 0, 'Aliados': 0, 'Inimigos': 0, 'Mapa': 0, 'Sistema': 0, 'Configurações': 0 });
    setShipStatus(null);
    setFactionReputation([]);
    setSquadStatus(null);
    setEvidenceBoard([]);
    setPlayMode(null);
    setNotebookData({ notes: '', npcs: '', places: '', quests: '' });
    setGeneratorResult('');
    setIsGeneratingContent(false);
    setCombatState({isInCombat: false, turnOrder: [], currentTurnIndex: 0});
  }

  const handleModalToggle = (modal: ModalType) => {
    setActiveModal(prev => (prev === modal ? null : modal));
    if (modal) {
        setNotifications(prev => ({ ...prev, [modal]: 0 }));
    }
  }

  return {
    gameState,
    playMode,
    story,
    isLoading,
    error,
    selectedGenre,
    characterData,
    isDiceRollActive,
    isInitiativeRollActive,
    status,
    inventory,
    skills,
    bestiary,
    allies,
    enemies,
    systemLog,
    activeModal,
    isHelpModalOpen,
    notifications,
    location,
    gameTime,
    achievements,
    actionSuggestions,
    settings,
    savedGames,
    savedCharacters,
    notebookData,
    generatorResult,
    isGeneratingContent,
    combatState, // Expor o estado de combate
    setSettings,
    setActiveModal,
    handleSaveAdventure,
    handleSaveCharacter,
    handleLoadAdventure,
    handleLoadCharacter,
    handleDeleteSave,
    handleUpgradeSkill,
    handleSelectGenre,
    handleSelectSetting,
    handleStartAdventure,
    handleUserInput,
    handleDiceRoll,
    handleInitiativeRoll,
    handleNavigateToPlayModeSelection,
    handleSelectPlayMode,
    handleShowUpdates,
    handleShowLoadGame,
    handleShowAchievements,
    handleBackToMenu,
    handleBackToGenre,
    handleBackToSetting,
    handleToggleHelpModal,
    handleReturnToMainMenu,
    handleModalToggle,
    handleNotebookChange,
    handleGenerateQuickContent,
    handleAddEnemyToCombat,
    handleUpdateEnemyHealth,
    handleRemoveEnemyFromCombat,
  };
};

export default useGame;