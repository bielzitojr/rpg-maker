import { Type, GoogleGenAI } from '@google/genai';
import type { GameStateUpdate, GameContext, TextDescriptionStyle } from '../types';

/**
 * Hierarquia dos modelos mais capazes para o Mestre de RPG:
 * 1. gemini-3-flash-preview: Alta capacidade de raciocínio narrativo, regras complexas e precisão JSON.
 * 2. gemini-3.8-flash: Modelo de geração 3 com alta fidelidade de contexto.
 * 3. gemini-3.1-flash-lite: Rápido e confiável para fallback em alta demanda.
 * 4. gemini-2.5-flash: Fallback de contingência.
 */
export const MASTER_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
];

export const masterResponseSchema = {
  type: Type.OBJECT,
  properties: {
    storyText: { 
      type: Type.STRING, 
      description: "A narração pura e atmosférica do Mestre. Não inicie com 'Mestre:'. Diálogos de NPCs ou rugidos devem ser blocos separados no formato 'Nome:\\n\"fala\"'." 
    },
    location: { 
      type: Type.STRING, 
      description: "Localização precisa e evocativa onde a cena ocorre (ex: 'Cripta dos Reis Esquecidos - Nível 2')." 
    },
    gameTime: {
      type: Type.OBJECT,
      description: "Avanço realista do tempo no mundo de jogo.",
      properties: {
        hour: { type: Type.INTEGER },
        minute: { type: Type.INTEGER },
        day: { type: Type.INTEGER },
        month: { type: Type.INTEGER },
        year: { type: Type.INTEGER }
      }
    },
    playerStatus: {
      type: Type.OBJECT,
      description: "Alterações nos pontos de vida, mana, energia, sanidade, experiência, etc. Apenas inclua campos alterados.",
      properties: {
        health: { type: Type.INTEGER },
        maxHealth: { type: Type.INTEGER },
        mana: { type: Type.INTEGER },
        maxMana: { type: Type.INTEGER },
        energy: { type: Type.INTEGER },
        maxEnergy: { type: Type.INTEGER },
        sanity: { type: Type.INTEGER },
        description: { type: Type.STRING },
        title: { type: Type.STRING },
        fame: { type: Type.STRING },
        level: { type: Type.INTEGER },
        experience: { type: Type.INTEGER },
        maxExperience: { type: Type.INTEGER },
        skillPoints: { type: Type.INTEGER },
        gold: { type: Type.INTEGER }
      }
    },
    inventory: {
      type: Type.ARRAY,
      description: "Apenas NOVOS itens genuinamente encontrados ou recebidos neste turno. Nunca repita itens pré-existentes.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['Arma', 'Armadura', 'Consumível', 'Missão', 'Chave', 'Outro'] },
          quantity: { type: Type.INTEGER },
          damage: { type: Type.STRING, description: "Dano da arma se aplicável (ex: '1d8 + 2')." }
        },
        required: ['name', 'description', 'type', 'quantity']
      }
    },
    skills: {
      type: Type.ARRAY,
      description: "Novas habilidades ou magias aprendidas ou desbloqueadas.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: [
              'Habilidades Passivas de Raça',
              'Habilidades Físicas de Classe',
              'Habilidades Passivas Físicas de Classe',
              'Habilidades Mágicas de Classe',
              'Habilidades Passivas Mágicas de Classe',
              'Habilidades Físicas Aprendidas',
              'Habilidades Mágicas Aprendidas',
              'Magia'
            ]
          },
          damage: { type: Type.STRING },
          cost: { type: Type.INTEGER },
          costType: { type: Type.STRING, enum: ['Mana', 'Energia'] },
          level: { type: Type.INTEGER },
          maxLevel: { type: Type.INTEGER }
        },
        required: ['name', 'description', 'category', 'level', 'maxLevel']
      }
    },
    bestiary: {
      type: Type.ARRAY,
      description: "Criaturas encontradas para adicionar ou atualizar no Bestiário com informações descobertas.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          knownInfo: {
            type: Type.OBJECT,
            properties: {
              health: { type: Type.STRING },
              mana: { type: Type.STRING },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              abilities: { type: Type.ARRAY, items: { type: Type.STRING } },
              loot: { type: Type.ARRAY, items: { type: Type.STRING } },
              habitat: { type: Type.STRING },
              lore: { type: Type.STRING }
            }
          }
        },
        required: ['name', 'description']
      }
    },
    allies: {
      type: Type.ARRAY,
      description: "Novos companheiros ou aliados que ingressaram no grupo neste turno.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ['name', 'description']
      }
    },
    enemies: {
      type: Type.ARRAY,
      description: "Lista COMPLETA de inimigos atualmente vivos em combate. Atualize o campo 'health'. Mantenha rigorosamente o mesmo 'id'. Remova quem chegou a 0 de vida.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          health: { type: Type.INTEGER },
          maxHealth: { type: Type.INTEGER }
        },
        required: ['id', 'name', 'health', 'maxHealth']
      }
    },
    unlockedAchievementId: { 
      type: Type.STRING, 
      description: "ID de conquista conquistada neste exato turno (apenas se os critérios foram plenamente atingidos)." 
    },
    diceRollChallenge: { 
      type: Type.BOOLEAN, 
      description: "Defina como true se a ação do jogador requer uma rolagem de teste d20 por haver risco de falha dramático." 
    },
    actionSuggestions: {
      type: Type.ARRAY,
      description: "3 a 5 sugestões de ações variadas, criativas e estratégicas para o jogador. Deixe vazio se diceRollChallenge for true.",
      items: { type: Type.STRING }
    },
    shipStatus: {
      type: Type.OBJECT,
      description: "(Sci-Fi / Espacial) Estado da nave estelar.",
      properties: {
        name: { type: Type.STRING },
        hullIntegrity: { type: Type.INTEGER },
        shieldLevel: { type: Type.INTEGER },
        engineStatus: { type: Type.STRING },
        scannerStatus: { type: Type.STRING },
        lifeSupportStatus: { type: Type.STRING },
        fuel: { type: Type.INTEGER },
        scrap: { type: Type.INTEGER }
      }
    },
    factionReputation: {
      type: Type.ARRAY,
      description: "Lista de reputação com facções políticas ou ordens.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          reputation: { type: Type.INTEGER },
          status: { type: Type.STRING }
        }
      }
    },
    squadStatus: {
      type: Type.OBJECT,
      description: "(Guerra) Estado do pelotão do jogador.",
      properties: {
        name: { type: Type.STRING },
        morale: { type: Type.INTEGER },
        members: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              status: { type: Type.STRING }
            }
          }
        }
      }
    },
    evidenceBoard: {
      type: Type.ARRAY,
      description: "(Investigação) Novas evidências e pistas descobertas.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          description: { type: Type.STRING }
        }
      }
    },
    npcDialogue: {
      type: Type.OBJECT,
      description: "(Bíblico) Mensagem tentadora ou provocativa do NPC 'O Inimigo'.",
      properties: {
        character: { type: Type.STRING },
        line: { type: Type.STRING }
      }
    }
  },
  required: ['storyText', 'location']
};

/**
 * Constrói a instrução de sistema (System Instruction) do Mestre,
 * com diretrizes literárias refinadas, regras invioláveis de arbitragem e combate.
 */
export function buildMasterSystemInstruction(
  genre: string,
  setting: string,
  textStyle: TextDescriptionStyle
): string {
  let styleDetail = '';
  switch (textStyle) {
    case 'Curto/Objetivo':
      styleDetail = 'Mantenha a narração concisa, ágil, direta ao ponto e cheia de impacto imediato (1 a 2 parágrafos curtos).';
      break;
    case 'Longo Complexo':
      styleDetail = 'Escreva com extrema riqueza sensorial, metáforas vívidas, parágrafos profundos, vocabulário nobre e descrição detalhada da atmosfera psicológica e física.';
      break;
    case 'Curto e Detalhado':
    default:
      styleDetail = 'Equilibre fluidez e profundidade sensorial (2 a 3 parágrafos envolventes), destacando luzes, texturas, aromas e peso emocional.';
      break;
  }

  return `Você é o "GRANDE MESTRE DE RPG" — o mais lendário, criativo, justo e envolvente Dungeon Master já concebido. Você conduz uma crônica épica em português do Brasil impecável.

══════════════════════════════════════════════════════════════════════════════
DIRETRIZES FUNDAMENTAIS DO MESTRE
══════════════════════════════════════════════════════════════════════════════

1. FILOSOFIA NARRATIVA & ATMOSFERA:
- Gênero Ativo: ${genre.toUpperCase()} | Cenário: ${setting.toUpperCase()}
- Estilo Textual: ${styleDetail}
- Seu mundo é vivo, reativo, com consequências reais e peso dramático.
- Não seja um mero robô descritor: dê alma aos coadjuvantes, faça o vento uivar, a lâmina tinir e a magia pulsar no ar.
- NUNCA comece sua resposta com prefixos como "Mestre:", "Narrador:" ou notas fora do personagem. Sua fala no campo 'storyText' é a pura voz da aventura.

2. A REGRA SAGRADA DA AGÊNCIA DO JOGADOR:
- Você descreve o mundo, o resultado das ações tomadas e os perigos iminentes.
- NUNCA assuma sentimentos, falas ou próximas ações pelo personagem do jogador.
- Toda cena de exploração ou diálogo deve concluir deixando a iniciativa nas mãos do jogador, terminando de forma instigante: "O que você faz?" ou equivalente de alta tensão.
- Forneça 3 a 5 sugestões afiadas e distintas em 'actionSuggestions' (uma ação de combate/força, uma de perspicácia/investigação, uma diplomática/social, uma ousada/ambiente).

3. REGRA CRÍTICA DE DIÁLOGOS E SONS DE SERES VIVOS:
- Quando QUALQUER NPC, aliado, inimigo ou criatura falar ou soltar um rugido/som característico, NUNCA embuta a fala no meio do parágrafo narrativo.
- Formate SEMPRE em bloco isolado, separado por parágrafo duplo (\\n\\n):
Nome do Personagem:
"Texto da fala ou onomatopeia do rugido com emoção."
- O sistema de interface reconhece o "Nome do Personagem:" e renderiza o retrato correspondente da criatura ou aliado na tela. Mantenha consistência estrita nos nomes.
- Se o jogador disser apenas "falo com o ferreiro", pergunte o que ele deseja dizer em vez de criar todo o diálogo por ele.

4. SISTEMA DE COMBATE TÁTICO E CINEMATOGRÁFICO:
- Ordem e Turnos: Em combate ativo, apenas o ator do turno age. Se for o turno de um monstro, ele ataca ferozmente o jogador ou aliados.
- Cálculo e Declaração de Dano (OBRIGATÓRIO): Cada golpe bem-sucedido deve ter seu dano calculado explicitamente usando as estatísticas e bônus das armas/atributos/magias.
- Narre o dano de forma visceral e DECLARE o valor numérico na narração:
Exemplo: "A lâmina de ferro corta o flanco do Goblin, espirrando sangue escuro e causando 9 de dano cortante!"
- Atualize a lista 'enemies': subtraia o dano do campo 'health' do inimigo afetado. Mantenha os mesmos 'id's.
- Morte de Inimigos: Quando o 'health' de um inimigo chegar a 0, narre sua queda heroica e REMOVA-O da lista 'enemies'.
- Proibição de Inimigos Fantasmas: NUNCA insira novos inimigos do nada durante uma batalha já em andamento, a não ser que uma emboscada explicitamente orquestrada faça parte da trama.
- Fim de Combate & XP: Quando todos os inimigos forem derrotados, anuncie a vitória no 'storyText', declare os Pontos de Experiência ganhos (ex: "Você venceu o combate e conquistou 120 de XP!") e aplique bônus de habilidades passivas (como traços raciais humanos ou intelecto de mago). Atualize 'playerStatus.experience'.

5. RIGOR DE REGRAS E COERÊNCIA MATERIAL:
- O jogador só pode utilizar itens que REALMENTE constem em seu inventário e habilidades que conheça.
- Se o jogador tentar usar uma poção que não possui ou empunhar uma arma que não tem, narre que ele procura em seus pertences e constata que não possui o objeto.
- Custos de Habilidades: Ao conjurar magias ou técnicas marciais, deduza o custo de Mana ou Energia no 'playerStatus'. Se não tiver recurso suficiente, a magia falha em cansaço.
- Recompensas Genuínas: Apenas adicione itens ao array 'inventory' quando forem genuinamente pilhados de baús, cadáveres ou recebidos de NPCs.

6. DESAFIOS DE TESTE D20 (DICE ROLL CHALLENGE):
- Quando a intenção do jogador envolver perigo, acrobacia arriscada, persuasão difícil ou incerteza dramática, NÃO resolva a ação de imediato.
- Narre a preparação da cena e defina 'diceRollChallenge: true', deixando 'actionSuggestions' vazio.
- Quando o turno seguinte vier com "[Resultado do Teste: X]":
  * 20: Triunfo Crítico! Execução magistral com vantagem colossal.
  * 15 a 19: Sucesso Pleno. O objetivo é cumprido com destreza.
  * 10 a 14: Sucesso com Custo. O jogador consegue, mas sofre um contratempo ou complicação.
  * 2 a 9: Falha Dramática. A tentativa falha, abrindo brecha para perigo ou mudança de plano.
  * 1: Falha Crítica! Desastre inesperado que muda drasticamente a situação.

7. ESPECIFICIDADES DO GÊNERO:
- Gênero Fantasia: Alinhe intrigas de facções medievais, ruínas ancestrais, itens mágicos e bestiário diversificado.
- Gênero Espacial: Monitore casco, escudos e combustível em 'shipStatus', destacando o isolamento do cosmo.
- Gênero Terror: Faça a sanidade oscilar em 'playerStatus.sanity' diante do inexplicável.
- Gênero Isekai: Notifique subidas de nível, atributos de RPG de videogame e pontos de habilidades.
- Gênero Bíblico: O antagonista sussurra tentações e dúvidas via 'npcDialogue'.

8. FORMATAÇÃO JSON IMPECÁVEL:
- Sua saída deve obedecer rigidamente ao responseSchema fornecido.
- Garanta que aspas dentro de strings sejam devidamente escapadas.`;
}

/**
 * Monta o prompt de usuário enriquecido com todas as informações contextuais
 * do personagem, combate, mundo e intenção do jogador.
 */
export function buildMasterTurnPrompt(
  storyContext: string,
  playerInput: string,
  genre: string,
  setting: string,
  gameContext: GameContext,
  relevantAchievements: any[] = []
): string {
  const char = gameContext.characterData;
  const status = gameContext.status;

  // Montagem do inventário
  const inventoryList = gameContext.inventory && gameContext.inventory.length > 0
    ? gameContext.inventory.map(i => `${i.name} (x${i.quantity}${i.damage ? `, dano: ${i.damage}` : ''})`).join(', ')
    : 'Mochila vazia';

  // Montagem das habilidades e magias
  const skillsList = gameContext.skills && gameContext.skills.length > 0
    ? gameContext.skills.map(s => {
        const costStr = s.cost ? ` [Custo: ${s.cost} ${s.costType || 'Recurso'}]` : '';
        const dmgStr = s.damage ? ` [Dano: ${s.damage}]` : '';
        return `• ${s.name} (Nív. ${s.level || 1}/${s.maxLevel || 5})${costStr}${dmgStr}: ${s.description}`;
      }).join('\n')
    : 'Nenhuma habilidade listada';

  // Identificação do personagem
  const charInfo = char ? `
Nome do Personagem: ${char.characterName || 'Aventureiro'}
Raça: ${char.race || 'Humano'} | Classe: ${char.class || 'Guerreiro'} | Gênero: ${char.gender || 'Não informado'}
Arma Inicial: ${char.weapon || 'Arma básica'}
Antecedentes: ${char.background || 'Viajante solitário'}
Aparência: ${char.appearance || 'Presença resoluta e olhar atento'}
${char.provacao ? `Provação Pessoal: ${char.provacao}` : ''}
`.trim() : `Personagem de Nível ${status.level || 1} em jornada.`;

  // Modificadores de atributo
  const mod = (val: number) => {
    const m = Math.floor(((val || 10) - 10) / 2);
    return m >= 0 ? `+${m}` : `${m}`;
  };

  const attributesInfo = `FOR: ${status.strength} (${mod(status.strength)}) | DES: ${status.dexterity} (${mod(status.dexterity)}) | CON: ${status.constitution} (${mod(status.constitution)}) | INT: ${status.intelligence} (${mod(status.intelligence)}) | SAB: ${status.wisdom} (${mod(status.wisdom)}) | CAR: ${status.charisma} (${mod(status.charisma)})`;

  // Status de combate
  let combatInfo = 'Nenhum combate ativo no momento.';
  if (gameContext.isInCombat) {
    const turnOrderStr = gameContext.turnOrder && gameContext.turnOrder.length > 0
      ? gameContext.turnOrder.map(c => c.name).join(' ➔ ')
      : 'Iniciativa calculada';
    const activeActor = gameContext.currentTurnActor ? gameContext.currentTurnActor.name : 'Jogador';
    combatInfo = `⚔️ COMBATE ATIVO!\nOrdem de Iniciativa: [${turnOrderStr}]\nÉ O TURNO DE AGIR DE: **${activeActor}**`;
  }

  // Aliados e Inimigos
  const alliesStr = gameContext.allies && gameContext.allies.length > 0
    ? gameContext.allies.map(a => `${a.name}`).join(', ')
    : 'Nenhum aliado no momento';

  const enemiesStr = gameContext.enemies && gameContext.enemies.length > 0
    ? gameContext.enemies.map(e => `${e.name} (id: "${e.id}", Vida: ${e.health}/${e.maxHealth})`).join('; ')
    : 'Nenhum inimigo ativo';

  const achievementIds = relevantAchievements.map(a => a.id).slice(0, 15);

  return `======================================================================
FICHA E ESTADO DO PROTAGONISTA
======================================================================
${charInfo}
Status Vitais:
- Nível: ${status.level} | XP: ${status.experience}/${status.maxExperience} | Ouro: ${status.gold}
- Pontos de Vida (HP): ${status.health}/${status.maxHealth}
- Pontos de Mana: ${status.mana}/${status.maxMana}
- Pontos de Energia: ${status.energy}/${status.maxEnergy}
- Sanidade: ${status.sanity}/${status.maxSanity}
Atributos Básicos:
${attributesInfo}

INVENTÁRIO ATUAL:
[${inventoryList}]

HABILIDADES & MAGIAS CONHECIDAS:
${skillsList}

COMPANHEIROS & ALIADOS:
[${alliesStr}]

INIMIGOS NO CENÁRIO:
[${enemiesStr}]

SITUAÇÃO TÁTICA:
${combatInfo}

LOCALIZAÇÃO & TEMPO:
- Local Atual: ${gameContext.location || 'Local a ser estabelecido pelo Mestre'}
${gameContext.gameTime ? `- Tempo no Mundo: ${gameContext.gameTime.hour || 12}:00 - Dia ${gameContext.gameTime.day || 1}, Mês ${gameContext.gameTime.month || 1}` : ''}

======================================================================
HISTÓRICO RECENTE DA CRÔNICA:
======================================================================
${storyContext || 'A jornada está em seu início solene.'}

======================================================================
AÇÃO OU EVENTO DESTE TURNO:
"${playerInput}"
======================================================================

Conquistas disponíveis para desbloqueio: ${JSON.stringify(achievementIds)}

Prossiga com a narração como Grande Mestre de RPG, narrando as consequências no mundo, atualizando os dados no JSON e formulando o próximo passo da aventura.`;
}

/**
 * Executa a chamada do Mestre com modelo Gemini e fallback em cascata.
 */
export async function executeMasterGeneration(
  ai: GoogleGenAI,
  systemInstruction: string,
  userPrompt: string
): Promise<GameStateUpdate> {
  let lastError: any = null;

  for (const modelName of MASTER_MODELS) {
    try {
      console.log(`[MasterEngine] Solicitando narração ao modelo: ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction,
          temperature: 0.85,
          topP: 0.95,
          responseMimeType: 'application/json',
          responseSchema: masterResponseSchema,
        },
      });

      const responseText = response.text?.trim();
      if (!responseText) {
        throw new Error('Resposta vazia retornada pelo modelo.');
      }

      const parsed = JSON.parse(responseText) as GameStateUpdate;

      // Limpeza de prefixo 'Mestre:' caso o modelo gere por hábito
      if (parsed.storyText) {
        parsed.storyText = parsed.storyText
          .replace(/^Mestre:\s*/i, '')
          .replace(/^Narrador:\s*/i, '')
          .trim();
      }

      console.log(`[MasterEngine] Resposta gerada com sucesso via ${modelName}.`);
      return parsed;
    } catch (err: any) {
      lastError = err;
      console.warn(`[MasterEngine] Modelo ${modelName} falhou: ${err.message?.substring(0, 100)}. Tentando próximo modelo...`);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  throw lastError || new Error('Todos os modelos de Mestre falharam.');
}
