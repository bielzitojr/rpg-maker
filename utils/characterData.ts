export const RACES: string[] = ["Humano", "Elfo", "Anão", "Orc", "Halfling", "Tiefling", "Meio-Elfo"];
export const CLASSES: string[] = ["Guerreiro", "Mago", "Ladino", "Clérigo", "Bárbaro", "Patrulheiro", "Bardo"];

// --- NOVAS RAÇAS DE MONSTROS (PARA ISEKAI) ---
export const MONSTER_RACES: string[] = ["Goblin", "Slime", "Lobisomem", "Vampiro", "Dragão (Jovem)", "Aracne"];

export interface Weapon {
  name: string;
  damage: string;
}

export const WEAPONS_BY_CLASS: { [key: string]: Weapon[] } = {
  Guerreiro: [
    { name: "Espada Longa", damage: "1d8 + FOR" },
    { name: "Machado de Batalha", damage: "1d10 + FOR" },
    { name: "Martelo de Guerra", damage: "1d8 + FOR" },
    { name: "Espadão", damage: "2d6 + FOR" }
  ],
  Mago: [
    { name: "Cajado", damage: "1d6" },
    { name: "Varinha", damage: "1d4" },
    { name: "Adaga Rúnica", damage: "1d4 + INT" },
    { name: "Orbe Arcano", damage: "1d4" }
  ],
  Ladino: [
    { name: "Adagas Duplas", damage: "2x 1d4 + DES" },
    { name: "Arco Curto", damage: "1d6 + DES" },
    { name: "Rapieira", damage: "1d8 + DES" },
    { name: "Besta de Mão", damage: "1d6 + DES" }
  ],
  Clérigo: [
    { name: "Maça", damage: "1d6 + FOR" },
    { name: "Martelo Leve", damage: "1d4 + FOR" },
    { name: "Símbolo Sagrado", damage: "1d4 + SAB" },
    { name: "Escudo", damage: "1d4" }
  ],
  Bárbaro: [
    { name: "Machado Grande", damage: "1d12 + FOR" },
    { name: "Marreta", damage: "2d6 + FOR" },
    { name: "Clava Pesada", damage: "1d8 + FOR" },
    { name: "Lança", damage: "1d6 + FOR" }
  ],
  Patrulheiro: [
    { name: "Arco Longo", damage: "1d8 + DES" },
    { name: "Cimitarra", damage: "1d6 + DES" },
    { name: "Espadas Curtas", damage: "2x 1d6 + DES" },
    { name: "Chicote", damage: "1d4 + DES" }
  ],
  Bardo: [
    { name: "Alaúde", damage: "1d4" },
    { name: "Rapieira", damage: "1d8 + DES" },
    { name: "Flauta Encantada", damage: "1d4" },
    { name: "Adaga", damage: "1d4 + DES" }
  ],
};

export const APPEARANCES: string[] = [
  "Cabelos escuros e desgrenhados, com uma cicatriz sobre o olho esquerdo. Veste uma armadura de couro gasta pela estrada.",
  "Olhos azuis penetrantes e cabelos prateados trançados. Suas vestes são finas e bordadas com símbolos arcanos.",
  "Uma figura robusta, com barba ruiva trançada e um olhar severo. Marcas de batalhas antigas cobrem seus braços musculosos.",
  "Pele pálida e olhos de um verde perturbador. Move-se com uma graça silenciosa, sempre envolto em sombras.",
  "Um sorriso travesso está sempre presente em seu rosto sardento. Suas roupas são coloridas e um tanto excêntricas.",
  "Chifres curvados emergem de sua testa e sua pele tem um tom avermelhado. Seus olhos brilham com uma luz interior misteriosa.",
];

export const BACKGROUNDS: string[] = [
  "Um ex-soldado que desertou do exército real após uma batalha sangrenta, buscando redenção em terras distantes.",
  "Um acólito de um templo esquecido, expulso por praticar magias proibidas. Agora, busca poder a qualquer custo.",
  "Um caçador de recompensas das cidades do norte, conhecido por sua eficiência e por nunca fazer perguntas.",
  "Um nobre caído cuja família perdeu tudo. Vaga pelo mundo na esperança de restaurar a honra de seu nome.",
  "Um artista de rua que descobriu um talento para a magia e agora usa seus dons para sobreviver e encantar.",
  "Nascido em uma tribo selvagem, deixou seu lar para provar seu valor ao mundo civilizado e se tornar uma lenda.",
];

// --- BÔNUS DE ATRIBUTOS ---

export const RACE_BONUSES: { [key: string]: string } = {
    "Humano": "Versátil e adaptável. Bônus: +1 em todos os atributos.",
    "Elfo": "Ágil e perceptivo. Bônus: +2 Destreza, +1 Sabedoria.",
    "Anão": "Resistente e forte. Bônus: +2 Constituição, +2 Força.",
    "Orc": "Incrivelmente forte, mas rústico. Bônus: +3 Força, -1 Carisma.",
    "Halfling": "Sortudo e charmoso. Bônus: +2 Destreza, +2 Carisma.",
    "Tiefling": "Carismático e astuto. Bônus: +2 Carisma, +1 Inteligência.",
    "Meio-Elfo": "Uma mistura de talentos. Bônus: +1 Carisma, +1 Destreza, +1 Constituição.",
};

export const MONSTER_RACE_BONUSES: { [key: string]: string } = {
    "Goblin": "Pequeno e astuto. Bônus: +3 Destreza, +1 Inteligência, -1 Força.",
    "Slime": "Adaptável e resistente. Bônus: +3 Constituição, -1 Força, Habilidade: Resistência a dano físico. Armas Naturais.",
    "Lobisomem": "Feroz e forte. Bônus: +3 Força, +2 Destreza (Forma Lupina), -1 Carisma.",
    "Vampiro": "Elegante e mortal. Bônus: +2 Carisma, +2 Destreza, Fraqueza: Luz solar.",
    "Dragão (Jovem)": "Poderoso, mas imaturo. Bônus: +4 Força, +2 Constituição, -2 Destreza. Armas Naturais.",
    "Aracne": "Caçadora ágil. Bônus: +3 Destreza, +1 Inteligência. Armas Naturais.",
};

export const CLASS_BONUSES: { [key: string]: string } = {
    "Guerreiro": "Mestre do combate. Bônus: +2 Força, +2 Constituição.",
    "Mago": "Conjurador arcano. Bônus: +3 Inteligência, +1 Sabedoria.",
    "Ladino": "Especialista em furtividade. Bônus: +3 Destreza, +1 Carisma.",
    "Clérigo": "Canalizador de poder divino. Bônus: +3 Sabedoria, +1 Constituição.",
    "Bárbaro": "Guerreiro Feroz. Bônus: +3 Força, +1 Constituição.",
    "Patrulheiro": "Explorador habilidoso. Bônus: +2 Destreza, +2 Sabedoria.",
    "Bardo": "Artista inspirador. Bônus: +3 Carisma, +1 Destreza.",
};

// --- Para cálculo programático ---

export const RACE_STATS_BONUSES: { [key: string]: { [key: string]: number } } = {
    "Humano": { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    "Elfo": { dexterity: 2, wisdom: 1 },
    "Anão": { constitution: 2, strength: 2 },
    "Orc": { strength: 3, charisma: -1 },
    "Halfling": { dexterity: 2, charisma: 2 },
    "Tiefling": { charisma: 2, intelligence: 1 },
    "Meio-Elfo": { charisma: 1, dexterity: 1, constitution: 1 },
};

export const MONSTER_RACE_STATS_BONUSES: { [key: string]: { [key: string]: number } } = {
    "Goblin": { dexterity: 3, intelligence: 1, strength: -1 },
    "Slime": { constitution: 3, strength: -1 },
    "Lobisomem": { strength: 3, dexterity: 2, charisma: -1 },
    "Vampiro": { charisma: 2, dexterity: 2 },
    "Dragão (Jovem)": { strength: 4, constitution: 2, dexterity: -2 },
    "Aracne": { dexterity: 3, intelligence: 1 },
};

export const CLASS_STATS_BONUSES: { [key: string]: { [key: string]: number } } = {
    "Guerreiro": { strength: 2, constitution: 2 },
    "Mago": { intelligence: 3, wisdom: 1 },
    "Ladino": { dexterity: 3, charisma: 1 },
    "Clérigo": { wisdom: 3, constitution: 1 },
    "Bárbaro": { strength: 3, constitution: 1 },
    "Patrulheiro": { dexterity: 2, wisdom: 2 },
    "Bardo": { charisma: 3, dexterity: 1 },
};

// --- ARMAS NATURAIS ---
export const RACES_WITH_NATURAL_WEAPONS: string[] = ["Dragão (Jovem)", "Slime", "Aracne"];
export const NATURAL_WEAPON: Weapon = { name: "Armas Naturais (Garras, Dentes, etc.)", damage: "1d6 + FOR" };

export const SEVEN_DEADLY_SINS: string[] = ["Gula", "Avareza", "Luxúria", "Ira", "Inveja", "Preguiça", "Soberba"];

export const FIRST_NAMES: string[] = ["Alistair", "Brynn", "Cassian", "Darian", "Elara", "Finnian", "Gwen", "Joric", "Lyra", "Orin", "Zara", "Kael", "Seraphina", "Roric"];
export const LAST_NAMES: string[] = ["Ironhand", "Shadowfen", "Stormrider", "Blackwood", "Silversong", "Brightwater", "Stonehelm", "Fireheart", "Moonwhisper", "Swiftwind"];