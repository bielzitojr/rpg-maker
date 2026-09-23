export type SkillCategory = 
  | 'Habilidades Passivas de Raça'
  | 'Habilidades Físicas de Classe'
  | 'Habilidades Passivas Físicas de Classe'
  | 'Habilidades Mágicas de Classe'
  | 'Habilidades Passivas Mágicas de Classe'
  | 'Habilidades Físicas Aprendidas'
  | 'Habilidades Mágicas Aprendidas'
  | 'Magia'; // Categoria genérica para outros modos

export interface AbilityProgression {
    level: number;
    description: string;
    damage?: string;
    cost?: number;
}

export interface Ability {
    name: string;
    category: SkillCategory;
    costType?: 'Mana' | 'Energia';
    level: number;
    maxLevel: number;
    progression: AbilityProgression[];
}

// --- HABILIDADES PASSIVAS DE RAÇA (INICIAL) ---
const RACIAL_PASSIVE_SKILLS: { [key: string]: Ability[] } = {
    "Humano": [{ name: "Espírito Adaptável", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Ganha 10% a mais de experiência de todas as fontes." }] }],
    "Elfo": [{ name: "Sentidos Aguçados", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Percebe inimigos escondidos com mais facilidade e tem maior chance de agir primeiro em combate." }] }],
    "Anão": [{ name: "Tenacidade Rochosa", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Reduz o dano recebido de todos os ataques físicos em 5%." }] }],
    "Orc": [{ name: "Força Bruta", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Seus ataques corpo a corpo têm 10% de chance de atordoar oponentes por 1 turno." }] }],
    "Halfling": [{ name: "Pés Ligeiros", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Tem 25% de chance de desviar do primeiro ataque recebido em cada combate." }] }],
    "Tiefling": [{ name: "Resistência Infernal", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Reduz o dano de fogo e escuridão recebido em 20%." }] }],
    "Meio-Elfo": [{ name: "Herança Dupla", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Pode aprender habilidades físicas e mágicas com 5% menos custo de experiência." }] }],
    "Goblin": [{ name: "Táticas de Enxame", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Causa 15% de dano extra ao atacar o mesmo alvo que um aliado no mesmo turno." }] }],
    "Slime": [{ name: "Corpo Maleável", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Imune a acertos críticos e dano de queda. Resistência a dano de contusão." }] }],
    "Lobisomem": [{ name: "Fúria Lunar", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Seus atributos de Força e Destreza aumentam em 2 pontos durante a noite." }] }],
    "Vampiro": [{ name: "Sifão Vital", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Recupera vida igual a 10% do dano que causa com ataques corpo a corpo." }] }],
    "Dragão (Jovem)": [{ name: "Presença Aterradora", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Inimigos em combate corpo a corpo sofrem uma penalidade de -5% no ataque." }] }],
    "Aracne": [{ name: "Veneno Paralisante", category: "Habilidades Passivas de Raça", level: 1, maxLevel: 1, progression: [{ level: 1, description: "Seus ataques têm 15% de chance de aplicar lentidão aos inimigos por 2 turnos." }] }],
};

// --- HABILIDADES DE CLASSE (POOLS) ---

const CLASS_PHYSICAL_SKILLS: Ability[] = [
    { name: "Golpe Giratório", category: "Habilidades Físicas de Classe", costType: "Energia", level: 1, maxLevel: 5, progression: [
        { level: 1, description: "Um ataque em área que atinge todos os inimigos adjacentes.", damage: "1d4 + 50% Dano da Arma", cost: 10 },
        { level: 2, description: "O ataque atinge com mais força.", damage: "1d6 + 50% Dano da Arma", cost: 12 },
        { level: 3, description: "O alcance do giro aumenta ligeiramente.", damage: "1d6 + 60% Dano da Arma", cost: 15 },
        { level: 4, description: "Inimigos atingidos podem ficar atordoados (10% de chance).", damage: "1d8 + 70% Dano da Arma", cost: 18 },
        { level: 5, description: "Um golpe devastador que atinge uma grande área com maior chance de atordoar (20%).", damage: "1d10 + 80% Dano da Arma", cost: 20 },
    ]},
    { name: "Disparo Perfurante", category: "Habilidades Físicas de Classe", costType: "Energia", level: 1, maxLevel: 5, progression: [
        { level: 1, description: "Um tiro que ignora 10% da armadura do inimigo.", damage: "1d6 + Dano da Arma", cost: 8 },
        { level: 2, description: "Um tiro que ignora 15% da armadura do inimigo.", damage: "1d8 + Dano da Arma", cost: 10 },
        { level: 3, description: "Um tiro que ignora 20% da armadura do inimigo.", damage: "1d10 + Dano da Arma", cost: 13 },
        { level: 4, description: "Um tiro que ignora 25% da armadura do inimigo.", damage: "1d12 + Dano da Arma", cost: 16 },
        { level: 5, description: "Um tiro que ignora 35% da armadura do inimigo e causa sangramento.", damage: "2d6 + Dano da Arma", cost: 20 },
    ]},
     { name: "Ataque Furtivo", category: "Habilidades Físicas de Classe", costType: "Energia", level: 1, maxLevel: 5, progression: [
        { level: 1, description: "Causa dano extra se atacar sem ser visto.", damage: "1d6 + 150% Dano da Arma", cost: 5 },
        { level: 2, description: "Causa mais dano extra se atacar sem ser visto.", damage: "1d8 + 175% Dano da Arma", cost: 7 },
        { level: 3, description: "O dano extra aumenta significativamente.", damage: "1d10 + 200% Dano da Arma", cost: 10 },
        { level: 4, description: "Aplica veneno se atacar sem ser visto.", damage: "1d10 + 225% Dano da Arma", cost: 14 },
        { level: 5, description: "Tem 50% de chance de ser um acerto crítico se atacar sem ser visto.", damage: "1d12 + 250% Dano da Arma", cost: 18 },
    ]},
];

const CLASS_PHYSICAL_PASSIVE_SKILLS: Ability[] = [
    { name: "Maestria com Armas Pesadas", category: "Habilidades Passivas Físicas de Classe", level: 1, maxLevel: 5, progression: [
        { level: 1, description: "Aumenta o dano com machados, martelos e espadas grandes em 5%." },
        { level: 2, description: "Aumenta o dano com armas pesadas em 10%." },
        { level: 3, description: "Aumenta o dano com armas pesadas em 15%." },
        { level: 4, description: "Aumenta o dano com armas pesadas em 20%." },
        { level: 5, description: "Aumenta o dano com armas pesadas em 25% e adiciona chance de derrubar o inimigo." },
    ]},
];

const CLASS_MAGICAL_SKILLS: Ability[] = [
    { name: "Explosão Arcana", category: "Habilidades Mágicas de Classe", costType: "Mana", level: 1, maxLevel: 5, progression: [
        { level: 1, description: "Uma explosão de energia pura que causa dano não-elemental.", damage: "1d4 + INT", cost: 10 },
        { level: 2, description: "A explosão é maior e mais potente.", damage: "1d6 + INT", cost: 12 },
        { level: 3, description: "A energia residual deixa os alvos vulneráveis a magia.", damage: "1d8 + INT", cost: 15 },
        { level: 4, description: "A força da explosão pode empurrar inimigos para trás.", damage: "2d6 + INT", cost: 18 },
        { level: 5, description: "Uma detonação massiva de poder arcano puro.", damage: "2d8 + INT", cost: 22 },
    ]},
    { name: "Lança de Gelo", category: "Habilidades Mágicas de Classe", costType: "Mana", level: 1, maxLevel: 5, progression: [
        { level: 1, description: "Cria uma lança de gelo que atinge um inimigo, causando lentidão.", damage: "1d6 + INT", cost: 12 },
        { level: 2, description: "A lança agora perfura um inimigo e atinge um segundo.", damage: "1d8 + INT", cost: 14 },
        { level: 3, description: "Aumenta a duração da lentidão.", damage: "2d4 + INT", cost: 17 },
        { level: 4, description: "A lança tem chance de congelar o primeiro alvo.", damage: "2d6 + INT", cost: 20 },
        { level: 5, description: "A lança se estilhaça no impacto, causando dano de gelo em área.", damage: "2d8 + INT", cost: 24 },
    ]},
    { name: "Raio Solar", category: "Habilidades Mágicas de Classe", costType: "Mana", level: 1, maxLevel: 5, progression: [
        { level: 1, description: "Um feixe de luz sagrada que causa dano extra a mortos-vivos e demônios.", damage: "1d8 + SAB", cost: 15 },
        { level: 2, description: "O raio deixa os alvos queimando com luz sagrada por 2 turnos.", damage: "1d10 + SAB", cost: 18 },
        { level: 3, description: "O raio agora cega os alvos por 1 turno.", damage: "2d6 + SAB", cost: 22 },
        { level: 4, description: "Aumenta o dano base e o dano contra mortos-vivos.", damage: "2d8 + SAB", cost: 26 },
        { level: 5, description: "O raio se torna uma explosão solar, atingindo inimigos próximos ao alvo.", damage: "3d6 + SAB", cost: 30 },
    ]},
];

const CLASS_MAGICAL_PASSIVE_SKILLS: Ability[] = [
    { name: "Potencial Mágico", category: "Habilidades Passivas Mágicas de Classe", level: 1, maxLevel: 5, progression: [
        { level: 1, description: "Aumenta a potência de todas as magias em 5%." },
        { level: 2, description: "Aumenta a potência de todas as magias em 10%." },
        { level: 3, description: "Aumenta a potência de todas as magias em 15%." },
        { level: 4, description: "Aumenta a potência de todas as magias em 20%." },
        { level: 5, description: "Aumenta a potência de todas as magias em 25% e reduz a resistência mágica dos alvos." },
    ]},
    { name: "Fé Inabalável", category: "Habilidades Passivas Mágicas de Classe", level: 1, maxLevel: 5, progression: [
        { level: 1, description: "Magias de cura e proteção são 10% mais potentes." },
        { level: 2, description: "Magias de cura e proteção são 15% mais potentes." },
        { level: 3, description: "Magias de cura e proteção são 20% mais potentes." },
        { level: 4, description: "Magias de cura e proteção são 25% mais potentes." },
        { level: 5, description: "Magias de cura e proteção são 30% mais potentes e removem um efeito negativo." },
    ]},
];


// --- HABILIDADES INICIAIS POR CLASSE ---

const INITIAL_CLASS_SKILLS: { [key: string]: Ability[] } = {
    "Guerreiro": [CLASS_PHYSICAL_SKILLS[0], CLASS_PHYSICAL_PASSIVE_SKILLS[0]],
    "Mago": [CLASS_MAGICAL_SKILLS[0], CLASS_MAGICAL_SKILLS[1], CLASS_MAGICAL_PASSIVE_SKILLS[0]],
    "Ladino": [CLASS_PHYSICAL_SKILLS[2]],
    "Clérigo": [CLASS_MAGICAL_SKILLS[2], CLASS_MAGICAL_PASSIVE_SKILLS[1]],
    "Bárbaro": [CLASS_PHYSICAL_SKILLS[0]],
    "Patrulheiro": [CLASS_PHYSICAL_SKILLS[1]],
    "Bardo": [CLASS_MAGICAL_SKILLS[0]],
};

// --- FUNÇÃO PARA OBTER HABILIDADES INICIAIS ---

export function getInitialIsekaiSkills(race: string, charClass: string): Ability[] {
    const racialSkills = RACIAL_PASSIVE_SKILLS[race] || [];
    const classSkills = INITIAL_CLASS_SKILLS[charClass] || [];
    return [...racialSkills.map(s => ({...s, level: 1})), ...classSkills.map(s => ({...s, level: 1}))];
}