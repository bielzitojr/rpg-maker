import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ACHIEVEMENTS_DATA } from "../utils/achievementsData";
import { MANUAL_API_KEY } from "../config/apiKey";
// Fix: Import types used in this file to resolve compilation errors.
import type { TextDescriptionStyle, GameContext, GameStateUpdate } from '../types';
// Fix: Re-export types to be available for other modules.
export type { 
    Status, GameTime, Ability, Combatant, GameStateUpdate, GameContext,
    TextDescriptionStyle, ShipStatus, Faction, SquadStatus, Evidence, 
    NpcDialogue, Item, Creature, EnemyInCombat, KnownInfo, ItemType 
} from '../types';

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        storyText: { type: Type.STRING, description: "A continuação da história." },
        location: { type: Type.STRING, description: "A localização atual do personagem. Inclua sempre." },
        gameTime: {
            type: Type.OBJECT, description: "Atualizações no tempo do jogo.",
            properties: {
                hour: { type: Type.INTEGER }, minute: { type: Type.INTEGER }, day: { type: Type.INTEGER }, month: { type: Type.INTEGER }, year: { type: Type.INTEGER }
            }
        },
        playerStatus: {
            type: Type.OBJECT, description: "Atualizações no status do jogador. Apenas inclua se houver alterações.",
            properties: {
                health: { type: Type.INTEGER }, maxHealth: { type: Type.INTEGER }, mana: { type: Type.INTEGER }, maxMana: { type: Type.INTEGER },
                energy: { type: Type.INTEGER }, maxEnergy: { type: Type.INTEGER },
                sanity: { type: Type.INTEGER, description: "(Gênero Terror) A sanidade atual do jogador." },
                description: { type: Type.STRING }, title: { type: Type.STRING }, fame: { type: Type.STRING },
                level: { type: Type.INTEGER }, experience: { type: Type.INTEGER }, maxExperience: { type: Type.INTEGER },
                skillPoints: { type: Type.INTEGER, description: "(Gênero Isekai) Pontos de habilidade para distribuir." },
                gold: { type: Type.INTEGER, description: "(Gênero Arena) A quantidade de ouro do jogador." },
            }
        },
        inventory: {
            type: Type.ARRAY, description: "Lista de NOVOS itens REALMENTE adquiridos na narrativa deste turno (encontrados em baús, pegos de inimigos, recebidos de NPCs). NÃO adicione itens que o jogador apenas 'imaginou' ter ou que não foram explicitamente dados a ele.",
            items: { type: Type.OBJECT, properties: { 
                name: { type: Type.STRING }, 
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['Arma', 'Armadura', 'Consumível', 'Missão', 'Chave', 'Outro'] },
                quantity: { type: Type.INTEGER },
                damage: { type: Type.STRING, description: "O dano da arma, se o item for do tipo 'Arma'." }
            }}
        },
        skills: {
            type: Type.ARRAY, description: "Lista de NOVAS habilidades ou magias aprendidas. Para o gênero Isekai, use as categorias apropriadas. Sempre inclua 'level' e 'maxLevel'.",
            items: { type: Type.OBJECT, properties: { 
                name: { type: Type.STRING }, 
                description: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Habilidades Passivas de Raça', 'Habilidades Físicas de Classe', 'Habilidades Passivas Físicas de Classe', 'Habilidades Mágicas de Classe', 'Habilidades Passivas Mágicas de Classe', 'Habilidades Físicas Aprendidas', 'Habilidades Mágicas Aprendidas', 'Magia'] },
                damage: { type: Type.STRING, description: "O dano da habilidade, se aplicável." },
                cost: { type: Type.INTEGER, description: "O custo de recurso da habilidade, se aplicável." },
                costType: { type: Type.STRING, enum: ['Mana', 'Energia'], description: "O tipo de recurso consumido." },
                level: { type: Type.INTEGER, description: "O nível inicial da habilidade (geralmente 1)." },
                maxLevel: { type: Type.INTEGER, description: "O nível máximo que a habilidade pode atingir." }
            } }
        },
        bestiary: {
            type: Type.ARRAY, description: "Lista de criaturas para ADICIONAR ou ATUALIZAR no bestiário. Retorne a ficha completa com todas as informações conhecidas até agora.",
            items: { type: Type.OBJECT, properties: { 
                name: { type: Type.STRING }, 
                description: { type: Type.STRING, description: "A descrição base da criatura." },
                knownInfo: { type: Type.OBJECT, properties: {
                    health: { type: Type.STRING, description: "Descrição da vitalidade (ex: 'Baixa', 'Média', 'Alta')." },
                    mana: { type: Type.STRING, description: "Descrição da energia mágica (ex: 'Nenhuma', 'Reserva arcana profunda')." },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    abilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    loot: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Itens que podem ser obtidos da criatura." },
                    habitat: { type: Type.STRING },
                    lore: { type: Type.STRING, description: "História ou fatos interessantes sobre a criatura." }
                }}
            }}
        },
        allies: {
            type: Type.ARRAY, description: "Lista de NOVOS aliados que se juntaram ao jogador.",
            items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } }
        },
        enemies: {
            type: Type.ARRAY, description: "A lista COMPLETA de inimigos atualmente em combate. **MUITO IMPORTANTE:** Você DEVE usar os mesmos 'id's fornecidos no prompt em 'Inimigos em Cena'. Retorne a lista completa de inimigos, atualizando o campo 'health' daqueles que sofreram dano. Se um inimigo morrer, remova-o da lista. NÃO gere novos IDs para inimigos existentes.",
            items: { type: Type.OBJECT, properties: {
                id: { type: Type.STRING, description: "O identificador único para este inimigo específico na luta." }, 
                name: { type: Type.STRING }, 
                description: { type: Type.STRING },
                health: { type: Type.INTEGER },
                maxHealth: { type: Type.INTEGER }
            }}
        },
        unlockedAchievementId: { type: Type.STRING, description: "O ID de uma conquista desbloqueada NESTE turno." },
        diceRollChallenge: { type: Type.BOOLEAN, description: "Defina como true se o jogador precisar fazer um teste de dados (rolar um d20) para a próxima ação." },
        actionSuggestions: {
            type: Type.ARRAY,
            description: "Uma lista de 3 a 5 ações sugeridas que o jogador pode tomar a seguir. As sugestões devem ser curtas, diretas e variadas. Não forneça sugestões se 'diceRollChallenge' for true.",
            items: { type: Type.STRING },
            maxItems: 5
        },
        shipStatus: {
            type: Type.OBJECT, description: "(Gênero Exploração Espacial) O status completo da nave do jogador.",
            properties: {
                name: { type: Type.STRING }, hullIntegrity: { type: Type.INTEGER }, shieldLevel: { type: Type.INTEGER },
                engineStatus: { type: Type.STRING }, scannerStatus: { type: Type.STRING }, lifeSupportStatus: { type: Type.STRING },
                fuel: { type: Type.INTEGER }, scrap: { type: Type.INTEGER },
            }
        },
        factionReputation: {
            type: Type.ARRAY, description: "(Gênero Fantasia) A lista completa de reputação com as facções.",
            items: {
                type: Type.OBJECT, properties: { name: { type: Type.STRING }, reputation: { type: Type.INTEGER }, status: { type: Type.STRING } }
            }
        },
        squadStatus: {
            type: Type.OBJECT, description: "(Gênero Guerra) O status completo do esquadrão do jogador.",
            properties: {
                name: { type: Type.STRING }, morale: { type: Type.INTEGER },
                members: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, status: { type: Type.STRING } } } }
            }
        },
        evidenceBoard: {
            type: Type.ARRAY, description: "(Gênero Investigação) Lista de NOVAS evidências encontradas.",
            items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, description: { type: Type.STRING } } }
        },
        npcDialogue: {
            type: Type.OBJECT, description: "(Gênero Bíblico) Uma fala do NPC 'O Inimigo' para o jogador.",
            properties: { character: { type: Type.STRING, description: "Sempre 'O Inimigo'" }, line: { type: Type.STRING } }
        }
    },
    required: ["storyText", "location"]
};

// Obtém a chave de API do arquivo de configuração manual.
const getApiKey = (): string | undefined => {
    // Para uma melhor segurança em produção, considere usar variáveis de ambiente.
    return MANUAL_API_KEY;
};

export async function summarizeStory(previousSummary: string, recentTurns: string): Promise<string> {
    const API_KEY = getApiKey();
    if (!API_KEY) {
        throw new Error("Chave de API não configurada para o resumidor.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `Você é um assistente de resumo para um jogo de RPG. Sua tarefa é continuar um resumo existente com base nos eventos recentes da história. Mantenha o resumo conciso, em terceira pessoa e capture apenas os pontos mais importantes da trama, principais NPCs encontrados e mudanças significativas no mundo ou no personagem.

Resumo Anterior:
---
${previousSummary || "A aventura está apenas começando."}
---

Eventos Recentes (últimos turnos):
---
${recentTurns}
---

Atualize o resumo com os eventos recentes:`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{role: "user", parts: [{text: prompt}]}],
            config: {
                temperature: 0.5,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Erro ao gerar resumo da história:", error);
        throw new Error("Não foi possível gerar o resumo da história.");
    }
}

export async function generateCharacterImage(prompt: string): Promise<string | null> {
    const API_KEY = getApiKey();
    if (!API_KEY) {
        throw new Error("Chave de API não configurada.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidate = response?.candidates?.[0];

        if (!candidate) {
            console.error("Nenhum candidato retornado pela IA para geração de imagem:", JSON.stringify(response, null, 2));
            throw new Error("A IA não retornou nenhum candidato para a imagem.");
        }

        // Handle failure reasons from the model
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
             // NO_IMAGE is a common safety-related refusal, not a critical error.
             if (candidate.finishReason === 'NO_IMAGE') {
                console.warn(`A geração de imagem foi recusada pelo modelo (motivo: ${candidate.finishReason}). O prompt pode ter violado as políticas de segurança. Continuando sem imagem.`);
                return null;
             }
             // For other reasons, it's an actual error.
             console.error(`Geração de imagem falhou com o motivo: ${candidate.finishReason}`, JSON.stringify(response, null, 2));
             throw new Error(`O modelo recusou-se a gerar uma imagem. Motivo: ${candidate.finishReason}`);
        }
        
        // Extract image data if generation was successful
        if (candidate.content && Array.isArray(candidate.content.parts)) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        
        // Handle case where the response is valid but contains no image data
        console.warn("Resposta da IA válida, mas sem dados de imagem ao gerar imagem do personagem. Continuando sem imagem.", JSON.stringify(response, null, 2));
        return null;

    } catch (error) {
        console.error("Erro ao gerar imagem do personagem:", error);
        // Rethrow other errors (network, API key, etc.) to be caught by the calling function
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Não foi possível gerar a imagem do personagem.");
    }
}

export async function generateAppearanceDescription(characterDetails: { race: string; charClass: string; weapon: string; background: string; }): Promise<string> {
    const API_KEY = getApiKey();
    if (!API_KEY) {
        throw new Error("Chave de API não configurada.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `Crie uma descrição de aparência evocativa e detalhada (3-4 frases) para um personagem de RPG de fantasia, baseando-se nos detalhes fornecidos. A descrição deve ir além do óbvio, sugerindo a personalidade do personagem através de sua aparência.
    - Raça: ${characterDetails.race}
    - Classe: ${characterDetails.charClass}
    - Arma Inicial: ${characterDetails.weapon}
    - Antecedentes: ${characterDetails.background}
    **Instruções:**
    1.  **Seja Vívido:** Use adjetivos fortes e detalhes sensoriais (ex: "olhos cor de âmbar", "uma cicatriz irregular", "roupas puídas pela viagem").
    2.  **Incorpore a História:** Deixe que os antecedentes e a classe influenciem a descrição (ex: um 'ex-soldado' pode ter uma postura rígida ou um olhar cansado; um 'Ladino' pode ter olhos astutos e movimentos furtivos).
    3.  **Foco Visual:** A descrição deve ser puramente visual. Evite descrever pensamentos ou sentimentos diretamente.
    4.  **Seja Original:** Evite clichês de fantasia sempre que possível.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{role: "user", parts: [{text: prompt}]}],
        });
        return response.text.trim();
    } catch (error) {
        console.error("Erro ao gerar descrição da aparência:", error);
        throw new Error("Não foi possível gerar a descrição da aparência.");
    }
}

export async function generatePlayerAction(storyContext: string, masterNarration: string): Promise<string> {
    const API_KEY = getApiKey();
    if (!API_KEY) {
        throw new Error("Chave de API não configurada para o jogador IA.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const systemInstruction = `Você é um jogador criativo e imersivo de um RPG de mesa. O usuário é o Mestre do Jogo (DM). Sua tarefa é ler a narração do Mestre e responder com a ação ou o diálogo do seu personagem.
    
**REGRAS:**
1.  **Seja Proativo:** Não espere que o Mestre lhe diga o que fazer. Pense como um personagem real faria. Interaja com o ambiente, fale com NPCs, investigue coisas suspeitas.
2.  **Mantenha o Personagem:** Aja de acordo com uma personalidade consistente. Você pode ser corajoso, covarde, curioso, engraçado, sério, etc. Crie uma personalidade simples e mantenha-se fiel a ela.
3.  **Respostas Curtas e Diretas:** Sua resposta deve ser APENAS a ação ou o diálogo do seu personagem. NÃO inclua narração, pensamentos fora do personagem ou explicações.
4.  **Formato:** Escreva em primeira pessoa (ex: "Eu examino a porta" ou "Eu digo: 'Quem está aí?'").

**EXEMPLO:**
*Mestre narra:* "Você entra em uma taverna barulhenta. O cheiro de cerveja e fumaça enche o ar. Um anão com um tapa-olho limpa um copo atrás do balcão, e um bardo canta uma canção melancólica em um canto."
*Sua resposta DEVE ser algo como:* "Eu me aproximo do balcão e digo ao anão: 'Uma cerveja, por favor. E qual é a história desse bardo triste?'"`;

    const fullPrompt = `Contexto da História:
---
${storyContext}
---
Narração do Mestre: "${masterNarration}"
---
Qual é a ação ou diálogo do seu personagem?`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{role: "user", parts: [{text: fullPrompt}]}],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.9,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Erro ao gerar ação do jogador IA:", error);
        return "A IA do jogador fica em silêncio, ponderando sobre o cosmos.";
    }
}

export async function generateQuickContent(
    type: 'npc_name' | 'tavern_name' | 'location_description' | 'plot_hook', 
    context: string
): Promise<string> {
    const API_KEY = getApiKey();
    if (!API_KEY) {
        throw new Error("Chave de API não configurada para o gerador de conteúdo.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    let prompt = '';
    switch (type) {
        case 'npc_name':
            prompt = `Gere um nome de PNJ (personagem não-jogador) de fantasia único e evocativo. Contexto: ${context || 'Geral'}. Retorne apenas o nome.`;
            break;
        case 'tavern_name':
            prompt = `Gere um nome criativo e temático para uma taverna de fantasia. Contexto: ${context || 'Geral'}. Retorne apenas o nome.`;
            break;
        case 'location_description':
            prompt = `Crie uma descrição de ambiente curta e imersiva (2-3 frases) para uma cena de RPG. A cena é: ${context || 'uma clareira na floresta'}.`;
            break;
        case 'plot_hook':
            prompt = `Crie um gancho de aventura ou rumor interessante para uma campanha de RPG. O gancho deve ser uma única frase curta e misteriosa. Contexto: ${context || 'uma pequena vila'}.`;
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{role: "user", parts: [{text: prompt}]}],
            config: {
                temperature: 0.9,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Erro ao gerar ${type}:`, error);
        throw new Error(`Não foi possível gerar ${type}.`);
    }
}

export async function generateStorySegment(storyContext: string, prompt: string, textStyle: TextDescriptionStyle, genre: string, setting: string, gameContext: GameContext): Promise<GameStateUpdate> {
    const API_KEY = getApiKey();
    if (!API_KEY) {
        console.error("Chave de API não configurada!");
        return {
            storyText: "ERRO DE CONFIGURAÇÃO: A chave de API do Mestre não foi encontrada. A aventura não pode continuar.",
            location: 'Vazio da Configuração'
        };
    }
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const relevantAchievements = ACHIEVEMENTS_DATA.filter(a => a.genre === genre || a.genre === 'Geral');

        const inventoryString = gameContext.inventory.length > 0
            ? gameContext.inventory.map(item => `${item.name} (x${item.quantity})`).join(', ')
            : 'Vazio';
            
        const skillsString = gameContext.skills.length > 0
            ? gameContext.skills.map(skill => {
                const levelData = skill.progression.find(p => p.level === skill.level) || skill.progression[0];
                const details = [
                    `Nível ${skill.level}`,
                    levelData.damage ? `Dano: ${levelData.damage}` : null,
                    levelData.cost ? `Custo: ${levelData.cost} ${skill.costType}` : null
                ].filter(Boolean).join(', ');
                return `${skill.name} (${details}): "${levelData.description}"`;
              }).join('; \n')
            : 'Nenhuma';
        
        const combatStatusString = gameContext.isInCombat 
            ? `COMBATE ATIVO. Ordem de Turno: ${gameContext.turnOrder?.map(c => c.name).join(', ')}. É o turno de ${gameContext.currentTurnActor?.name}.`
            : "Nenhum combate no momento.";

        const alliesString = gameContext.allies.map(a => `${a.name} (Aliado)`).join(', ');
        const enemiesString = gameContext.enemies.map(e => `${e.name} (id: ${e.id}, Vida: ${e.health}/${e.maxHealth})`).join(', ');

        const fullPrompt = `Contexto da História (Resumo e Eventos Recentes):
        ---
        ${storyContext || "A história está apenas começando."}
        ---
        ESTADO ATUAL DO JOGO:
        - Personagem: Nível ${gameContext.status.level} ${gameContext.status.strength > gameContext.status.intelligence ? 'Guerreiro' : 'Conjurador'} com Vida ${gameContext.status.health}/${gameContext.status.maxHealth}.
        - Inventário: [${inventoryString}]
        - Habilidades Disponíveis: [\n${skillsString}\n]
        - Aliados em Cena: [${alliesString || 'Nenhum'}]
        - Inimigos em Cena: [${enemiesString || 'Nenhum'}]
        - Situação de Combate: ${combatStatusString}
        ---
        Ação do jogador (ou evento do turno): "${prompt}"
        ---
        Conquistas Disponíveis: ${JSON.stringify(relevantAchievements.map(a => a.id))}
        ---
        Continue a história e atualize o estado do jogo no formato JSON, seguindo as regras do gênero '${genre}' na ambientação '${setting}'.`;

        let styleInstruction = '';
        switch (textStyle) {
            case 'Curto/Objetivo': styleInstruction = "Seja conciso e direto."; break;
            case 'Longo Complexo': styleInstruction = "Escreva parágrafos longos e complexos, com vocabulário rico."; break;
            case 'Curto e Detalhado': default: styleInstruction = "Seja detalhado e imersivo, com parágrafos de tamanho razoável."; break;
        }

        const systemInstruction = `Você é 'O Mestre', um narrador de RPG experiente e um contador de histórias profissional. Sua narrativa é épica e profunda.

**ESTILO DE ESCRITA ATUAL: ${styleInstruction}** Mantenha este estilo em toda a sua narração.
**GÊNERO ATUAL: ${genre.toUpperCase()}**
**AMBIENTAÇÃO ATUAL: ${setting.toUpperCase()}**

### REGRAS DE DIÁLOGO E SONS (REGRA CRÍTICA) ###
1.  **FORMATAÇÃO OBRIGATÓRIA:** Quando QUALQUER personagem ou criatura (aliado, inimigo, monstro, animal) falar, emitir um som ou rugido, você DEVE formatar a fala como um turno de diálogo separado.
2.  **ESTRUTURA:** Use o formato \`Nome do Personagem:\\nConteúdo da Fala ou Som.\` Exatamente assim. O nome deve corresponder a um personagem conhecido (aliado, inimigo ou do bestiário).
3.  **SEPARAÇÃO DA NARRAÇÃO:** NUNCA coloque o diálogo ou som dentro do parágrafo da narração principal (storyText). O diálogo deve ser um bloco distinto, separado por uma linha em branco (\\n\\n).
4.  **EXEMPLO DE DIÁLOGO:**
    - **INCORRETO:** O velho mago olha para você e diz: "A caverna é perigosa."
    - **CORRETO:** O velho mago olha para você com seus olhos sábios.\\n\\nMago Ancião:\\nA caverna é perigosa.
5.  **EXEMPLO DE SOM:**
    - **INCORRETO:** Você ouve um lobo uivando à distância.
    - **CORRETO:** Um uivo solitário ecoa pela floresta fria.\\n\\nLobo:\\nAuuuuuu!
6.  **IMAGENS AUTOMÁTICAS:** O sistema do jogo irá procurar por uma imagem para o 'Nome do Personagem' que você usar. Se o nome corresponder a um aliado ou a uma criatura no bestiário, a imagem aparecerá no chat. Portanto, seja consistente com os nomes.

### REGRAS DE COMBATE POR TURNOS (SE APLICÁVEL) ###
1.  **ESTRUTURA DO TURNO:** O combate é dividido em turnos. Apenas o personagem cujo turno está ativo pode agir.
2.  **CÁLCULO DE DANO (REGRA CRÍTICA):** Quando um ataque acertar, você DEVE calcular o dano. Role dados virtuais para qualquer fórmula de dano (ex: para "1d8 + FOR", role um d8 e some o bônus de Força do atacante).
3.  **NARRAÇÃO DO DANO (REGRA CRÍTICA):** Você DEVE declarar o dano total causado de forma clara e explícita na sua narrativa. Exemplo: "O machado acerta o orc em cheio, causando 11 de dano!".
4.  **ATUALIZAÇÃO DE ESTADO:** Após o dano ser narrado, você DEVE atualizar o campo 'health' do alvo no array 'enemies' do JSON de resposta. Se a vida de um inimigo chegar a 0, remova-o da lista 'enemies'. **CRÍTICO: NÃO adicione novos inimigos à lista no meio de um combate já iniciado.** O combate deve prosseguir com os inimigos que já estão presentes.
5.  **RECONHECIMENTO DE HABILIDADES (REGRA CRÍTICA):** O jogador pode usar habilidades da sua lista 'Habilidades Disponíveis'. Ao usar uma, você DEVE usar sua descrição, custo de recurso ('mana'/'energia') e fórmula de dano para narrar a ação e calcular o resultado. Atualize o \`playerStatus\` (subtraindo o custo do recurso apropriado) e a \`health\` do inimigo (\`enemies\`) de acordo.
6.  **APLICAÇÃO DE PASSIVAS (REGRA CRÍTICA):** Ao calcular dano, cura ou outros efeitos, você DEVE verificar as habilidades passivas do personagem. Se uma passiva for aplicada (ex: 'Potencial Mágico' aumentando dano mágico), você DEVE mencionar o efeito na narração. Exemplo: "Sua 'Potencial Mágico' amplifica o feitiço, causando 18 de dano!"
7.  **PERSISTÊNCIA DA VIDA (MUITO IMPORTANTE):** A vida dos inimigos informada em 'Inimigos em Cena' no prompt é a vida ATUAL deles. Você DEVE usar esses valores como base e apenas subtrair o dano causado neste turno. NUNCA redefina a vida de um inimigo para o máximo, a menos que uma habilidade de cura específica seja usada nele.
8.  **AÇÕES DE IA:** Se for o turno de um aliado ou inimigo (indicado no prompt), escolha uma ação lógica para ele (atacar o inimigo mais próximo, usar uma habilidade, etc.) e siga as regras de cálculo e narração de dano.
9.  **FOCO NO TURNO ATUAL:** Narre apenas a ação do turno atual. Não descreva o que acontecerá no próximo turno. O jogo avançará o turno automaticamente.

### REGRAS DE FIM DE COMBATE ###
1.  **EXPERIÊNCIA (XP):** Ao final do combate (quando o jogador vence), você DEVE calcular e conceder pontos de experiência (XP) ao jogador. A quantidade de XP deve ser baseada na dificuldade dos inimigos derrotados.
2.  **NARRAÇÃO DE XP (REGRA CRÍTICA):** Você DEVE declarar a quantidade de XP ganha no campo 'storyText'. Exemplo: "Você derrotou os goblins e ganhou 80 de XP!".
3.  **XP BÔNUS DE PASSIVAS:** Você DEVE verificar se o jogador possui habilidades passivas que aumentam o ganho de XP (ex: 'Espírito Adaptável' dos Humanos). Se possuir, aplique o bônus e mencione-o na narração. Exemplo: "Graças ao seu 'Espírito Adaptável', você recebe um bônus e ganha um total de 88 de XP!"
4.  **ATUALIZAÇÃO DE ESTADO:** Você DEVE atualizar o campo 'experience' no 'playerStatus' do JSON de resposta com o valor total de XP ganho.

**REGRAS DE ESTRUTURA DE DADOS:**
1.  **Inventário Preciso:** O campo 'inventory' deve conter APENAS e EXCLUSIVAMENTE os itens NOVOS adquiridos neste turno. NUNCA retorne o inventário completo ou itens que o jogador já possuía. Se for uma arma, inclua o campo 'damage'.
2.  **Bestiário Dinâmico:** Use o campo 'bestiary' para introduzir novas criaturas ou para ADICIONAR informações a criaturas existentes. Quando o jogador descobre algo novo (uma fraqueza, um hábito, um loot), retorne a ficha COMPLETA da criatura com a nova informação adicionada em 'knownInfo'. Não revele tudo de uma vez; a descoberta deve ser gradual.
3.  **Inimigos em Combate:** A lista 'enemies' deve conter TODOS os inimigos no combate atual. Para cada inimigo, forneça o MESMO 'id' que foi dado a você no prompt (ex: "goblin_1"). SEMPRE inclua 'health' e 'maxHealth' atualizados, refletindo o dano sofrido NESTE TURNO.
4.  **VIDA DOS INIMIGOS:** Para manter o equilíbrio no início do jogo (nível 1-3 do jogador), os inimigos encontrados devem ter uma vida máxima ('maxHealth') de no máximo 20. Inimigos mais fortes podem aparecer, mas devem ser raros e apresentados como um grande desafio.
5.  **JSON VÁLIDO E SEGURO (REGRA CRÍTICA):** Sua resposta DEVE ser um JSON perfeitamente válido. É absolutamente ESSENCIAL que você escape corretamente aspas duplas (") dentro de QUALQUER campo de texto usando uma contrabarra (\\"). Se você incluir uma citação como "Olá", o JSON DEVE ser formatado como '{"campo": "Ele disse: \\"Olá\\"}"'. JSON inválido irá quebrar o jogo e é uma falha inaceitável.

**REGRAS GERAIS:**
1.  **Qualidade Textual Impecável:** Sua prioridade máxima é a qualidade da escrita. Use português do Brasil perfeito. O campo 'storyText' deve conter apenas a narrativa, sem notas ou texto técnico. Use parágrafos e quebras de linha (\\n\\n) para melhorar a legibilidade. NUNCA inicie sua resposta com 'Mestre:' ou qualquer prefixo de falante.
2.  **Agência do Jogador:** SUA REGRA MAIS IMPORTANTE. Fora do combate, NUNCA tome decisões pelo jogador ou descreva as ações dele. Sua narração deve terminar em um ponto que exija uma ação do jogador. Apresente a situação, sempre finalize perguntando 'O que você faz?' ou algo similar, e forneça de 3 a 5 sugestões de ação criativas no campo 'actionSuggestions' (a menos que 'diceRollChallenge' seja 'true' ou o combate esteja ativo).
3.  **Testes de Dados (d20):** Quando uma ação fora de combate tiver um resultado incerto, sua narração deve indicar que um teste é necessário. Então, defina o campo 'diceRollChallenge' como 'true'. O jogador rolará um d20 e o resultado será enviado na próxima ação como '[Resultado do Teste: X]'. Baseie a continuação da história no sucesso (resultado alto) ou fracasso (resultado baixo).
4.  **Estrutura Narrativa:** Siga a estrutura da "Jornada do Herói". Crie provações, aliados e revelações que desenvolvam o personagem.
5.  **Gerenciamento de Estado:** Retorne SEMPRE a 'location' atual. Atualize o JSON com TODAS as mudanças de estado. Se um item for encontrado, adicione ao 'inventory'. Se um inimigo aparecer, adicione a 'enemies' e ao 'bestiary' (com informações iniciais). A lista 'enemies' deve sempre refletir o combate atual. Desbloqueie conquistas quando as condições forem cumpridas.
6.  **DIÁLOGO INTERATIVO:** Se o jogador indicar que quer falar com um NPC (ex: 'falar com', 'perguntar para'), SUA RESPOSTA DEVE SER uma pergunta, pedindo ao jogador para especificar o que ele quer dizer (ex: 'O que você diz para ele?'). NÃO GERE a resposta do NPC. Apenas peça a fala do jogador.

**REGRAS DE COERÊNCIA E RESTRIÇÃO (MUITO IMPORTANTE):**
1.  **SEJA UM JUIZ RIGOROSO:** Sua função mais crítica é manter a consistência do mundo. O jogador SÓ PODE usar itens que estão em seu inventário e habilidades/magias que ele realmente aprendeu.
2.  **AÇÃO COM ITEM INEXISTENTE:** Se o jogador tentar usar um item que não possui, sua resposta DEVE ser que ele procura, mas não encontra tal item. NUNCA adicione o item ao inventário dele magicamente só porque ele pediu.
3.  **NÃO CEDA À FANTASIA DO JOGADOR:** Se o jogador disser 'Eu encontro um baú do tesouro', e você não o colocou lá no turno anterior, a resposta correta é 'Você examina a área, mas não encontra nenhum baú.'. Mantenha o controle total da narrativa e do estado do jogo.

### REGRAS ESPECÍFICAS DE GÊNERO E AMBIENTAÇÃO ###
(Adapte as mecânicas de gênero criativamente à ambientação de '${setting}'. Continue a aplicá-las como instruído anteriormente.)`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{role: "user", parts: [{text: fullPrompt}]}],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
                topP: 0.95,
                topK: 40,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        
        if (!parsedResponse.storyText) {
            parsedResponse.storyText = "O mestre da masmorra parece ter se perdido em seus pensamentos...";
        }

        return parsedResponse as GameStateUpdate;

    } catch (error) {
        console.error("Erro ao gerar segmento da história:", error);
        
        const fallbackResponse: GameStateUpdate = {
            storyText: `\nOcorreu um erro cósmico! ${error instanceof Error ? error.message : 'O fluxo do tempo foi interrompido.'} Tente sua ação novamente.`,
            enemies: gameContext.enemies, // Retorna os inimigos para não quebrar o estado de combate
            location: 'Limbo Dimensional'
        };
        return fallbackResponse;
    }
}