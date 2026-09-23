import type { Ability, SkillCategory } from '../utils/skillsData';
import type { Achievement } from '../utils/achievementsData';

// --- Tipos Globais de Estado e UI ---
export type GameState = 'loading' | 'mainMenu' | 'playModeSelection' | 'genreSelection' | 'settingSelection' | 'characterCreation' | 'inGame' | 'updateNotes' | 'loadGame' | 'achievements';
export type ModalType = 'Status' | 'Habilidades' | 'Inventário' | 'Bestiário' | 'Aliados' | 'Inimigos' | 'Mapa' | 'Sistema' | 'Configurações' | 'Caderno' | 'Geradores' | null;
export type TextSpeed = 'Lento' | 'Normal' | 'Rápido';
export type Theme = 'Padrão' | 'Claro' | 'Escuro';
export type TextDescriptionStyle = 'Curto/Objetivo' | 'Curto e Detalhado' | 'Longo Complexo';

// --- Tipos de Dados do Jogo ---
export interface Status {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  energy: number;
  maxEnergy: number;
  sanity: number;
  maxSanity: number;
  description: string;
  title: string;
  fame: string;
  level: number;
  experience: number;
  maxExperience: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  skillPoints: number;
  gold: number;
}

export interface CharacterData {
  playerName: string;
  characterName: string;
  gender: string;
  image: string | null;
  appearance: string;
  background: string;
  race: string;
  class: string;
  weapon: string;
  provacao?: string;
}

export interface GameTime {
    hour: number;
    minute: number;
    day: number;
    month: number;
    year: number;
}

// --- Mecânicas de Gênero ---
export interface ShipStatus {
    name: string;
    hullIntegrity: number; // 0-100
    shieldLevel: number; // 0-100
    engineStatus: string; // "Ótimo", "Danificado", "Crítico"
    scannerStatus: string;
    lifeSupportStatus: string;
    fuel: number;
    scrap: number;
}

export interface Faction {
    name: string;
    reputation: number; // ex: -100 (Odiado) a 100 (Venerado)
    status: string; // "Aliado", "Neutro", "Hostil"
}

export interface SquadStatus {
    name: string;
    morale: number; // 0-100
    members: { name: string, status: string }[]; // "Saudável", "Ferido", "Fora de Combate"
}

export interface Evidence {
    id: string; // ex: "evidencia_01"
    description: string;
}

export interface NpcDialogue {
    character: string;
    line: string;
}

// --- Tipos de Itens e Entidades ---
export type ItemType = 'Arma' | 'Armadura' | 'Consumível' | 'Missão' | 'Chave' | 'Outro';
export interface Item {
  name: string;
  description: string;
  type: ItemType;
  quantity: number;
  damage?: string;
}

export interface KnownInfo {
    health?: string;
    mana?: string;
    weaknesses?: string[];
    abilities?: string[];
    loot?: string[];
    habitat?: string;
    lore?: string;
}

export interface Creature {
  name:string;
  description: string;
  knownInfo: KnownInfo;
  image?: string | null;
}

export interface EnemyInCombat {
    id: string;
    name: string;
    description: string;
    health: number;
    maxHealth: number;
    image?: string | null;
}

// --- Tipos de Combate ---
export interface Combatant {
    id: string;
    name: string;
    type: 'player' | 'ally' | 'enemy';
    initiative: number;
}

export interface CombatState {
    isInCombat: boolean;
    turnOrder: Combatant[];
    currentTurnIndex: number;
}

// --- Tipos de Interação com a IA ---
export interface GameStateUpdate {
    storyText: string;
    location?: string;
    gameTime?: Partial<GameTime>;
    playerStatus?: Partial<Status>;
    inventory?: Item[];
    skills?: Ability[];
    bestiary?: Creature[];
    allies?: Creature[];
    enemies?: EnemyInCombat[];
    unlockedAchievementId?: string;
    diceRollChallenge?: boolean;
    actionSuggestions?: string[];
    shipStatus?: ShipStatus;
    factionReputation?: Faction[];
    squadStatus?: SquadStatus;
    evidenceBoard?: Evidence[];
    npcDialogue?: NpcDialogue;
}

export interface GameContext {
    status: Status;
    inventory: Item[];
    skills: Ability[];
    isInCombat: boolean;
    turnOrder?: Combatant[];
    currentTurnActor?: Combatant;
    allies: Creature[];
    enemies: EnemyInCombat[];
}

// --- Tipos de Ferramentas do Mestre ---
export interface NotebookData {
    notes: string;
    npcs: string;
    places: string;
    quests: string;
}

// --- Tipos de Configuração e Salvamento ---
export interface Settings {
    textSpeed: TextSpeed;
    textDescription: 'Curto/Objetivo' | 'Curto e Detalhado' | 'Longo Complexo';
    autoNarrate: boolean;
    theme: Theme;
    volume: number;
    showActionSuggestions: boolean;
    autoSave: boolean;
}

export interface SavedCharacter {
    id: string;
    savedAt: string;
    characterData: CharacterData;
    status: Status;
    inventory: Item[];
    skills: Ability[];
}

export interface SavedGame extends SavedCharacter {
    story: string;
    storySummary: string;
    bestiary: Creature[];
    allies: Creature[];
    enemies: EnemyInCombat[];
    systemLog: string[];
    selectedGenre: string;
    selectedSetting: string;
    location: string;
    gameTime: GameTime;
    unlockedAchievements: string[];
}

// Re-exportar tipos para fácil acesso
export { Ability, SkillCategory, Achievement };
