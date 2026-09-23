import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import { 
  buildMasterSystemInstruction, 
  buildMasterTurnPrompt, 
  executeMasterGeneration, 
  MASTER_MODELS 
} from './server/masterEngine';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

async function generateContentWithFallback(
  params: any,
  fallbackModels = MASTER_MODELS
) {
  const ai = getAi();
  let lastError: any;
  for (const model of fallbackModels) {
    try {
      return await ai.models.generateContent({
        ...params,
        model,
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed with: ${err.message?.substring(0, 80)}. Trying fallback...`);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw lastError;
}

app.post('/api/summarize', async (req, res) => {
  try {
    const { previousSummary, recentTurns } = req.body;
    const ai = getAi();
    
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

    const response = await generateContentWithFallback({
        contents: [{role: "user", parts: [{text: prompt}]}],
        config: { temperature: 0.5 }
    });
    res.json({ text: response.text?.trim() });
  } catch (error: any) {
    console.error("Summarize error:", error.message);
    const { previousSummary } = req.body || {};
    res.json({ text: previousSummary || "A aventura segue em frente através de perigos e conquistas memoráveis." });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const ai = getAi();

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
        return res.json({ image: null });
    }

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
         if (candidate.finishReason === 'NO_IMAGE') {
            return res.json({ image: null });
         }
         return res.json({ image: null });
    }
    
    if (candidate.content && Array.isArray(candidate.content.parts)) {
        for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return res.json({ image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
            }
        }
    }
    
    res.json({ image: null });
  } catch (error: any) {
    console.error("Image generation error:", error.message);
    res.json({ image: null });
  }
});

app.post('/api/generate-appearance', async (req, res) => {
  try {
    const { characterDetails } = req.body;
    console.log("API generate-appearance requested for:", characterDetails?.race, characterDetails?.charClass);
    
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

    const response = await generateContentWithFallback({
        contents: [{role: "user", parts: [{text: prompt}]}],
    });
    res.json({ text: response.text?.trim() });
  } catch (error: any) {
    console.error("Appearance generation error:", error.message);
    const details = req.body?.characterDetails || {};
    const fallbackDesc = `Uma presença marcante de ${details.race || 'viajante'} ${details.charClass || 'aventureiro'}, empunhando seu ${details.weapon || 'armamento'} com a postura firme de quem já enfrentou incontáveis perigos. Seus olhos atentos e cicatrizes discretas revelam a determinação forjada por sua trajetória como ${details.background || 'combatente'}.`;
    res.json({ text: fallbackDesc });
  }
});

app.post('/api/generate-player-action', async (req, res) => {
  try {
    const { storyContext, masterNarration } = req.body;

    const systemInstruction = `Você é um jogador criativo e imersivo de um RPG de mesa. O usuário é o Mestre do Jogo (DM). Sua tarefa é ler a narração do Mestre e responder com a ação ou o diálogo do seu personagem.
    
**REGRAS:**
1.  **Seja Proativo:** Não espere que o Mestre lhe diga o que fazer. Pense como um personagem real faria. Interaja com o ambiente, fale com NPCs, investigue coisas suspeitas.
2.  **Mantenha o Personagem:** Aja de acordo com uma personalidade consistente. Você pode ser corajoso, covarde, curioso, engraçado, sério, etc. Crie uma personalidade simples e mantenha-se fiel a ela.
3.  **Respostas Curtas e Diretas:** Sua resposta deve ser APENAS a ação ou o diálogo do seu personagem. NÃO inclua narração, pensamentos fora do personagem ou explicações.
4.  **Formato:** Escreva em primeira pessoa (ex: "Eu examino a porta" ou "Eu digo: 'Quem está aí?'").`;

    const fullPrompt = `Contexto da História:
---
${storyContext}
---
Narração do Mestre: "${masterNarration}"
---
Qual é a ação ou diálogo do seu personagem?`;

    const response = await generateContentWithFallback({
        contents: [{role: "user", parts: [{text: fullPrompt}]}],
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.9,
        }
    });
    res.json({ text: response.text?.trim() });
  } catch (error: any) {
    console.error("Player action error:", error.message);
    res.json({ text: "Eu mantenho minha posição, seguro minha arma e avalio os arredores com atenção redobrada." });
  }
});

app.post('/api/generate-quick-content', async (req, res) => {
  try {
    const { type, context } = req.body;

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

    const response = await generateContentWithFallback({
        contents: [{role: "user", parts: [{text: prompt}]}],
        config: { temperature: 0.9 }
    });
    res.json({ text: response.text?.trim() });
  } catch (error: any) {
    console.error("Quick content error:", error.message);
    const { type } = req.body || {};
    let fallback = "Aventureiro Misterioso";
    if (type === 'tavern_name') fallback = "A Taverna do Javali Dourado";
    else if (type === 'location_description') fallback = "Tochas bruxuleantes iluminam paredes de pedra úmida, onde sombras dançam ao ritmo do vento.";
    else if (type === 'plot_hook') fallback = "Um viajante sussurra sobre estranhos acontecimentos na antiga torre ao anoitecer.";
    res.json({ text: fallback });
  }
});

app.post('/api/generate-story-segment', async (req, res) => {
  try {
    const { storyContext, prompt, textStyle, genre, setting, gameContext, relevantAchievements } = req.body;
    const ai = getAi();

    const systemInstruction = buildMasterSystemInstruction(genre, setting, textStyle);
    const fullPrompt = buildMasterTurnPrompt(
      storyContext,
      prompt,
      genre,
      setting,
      gameContext,
      relevantAchievements
    );

    const parsedResponse = await executeMasterGeneration(ai, systemInstruction, fullPrompt);

    if (!parsedResponse.storyText) {
      parsedResponse.storyText = "O mestre da masmorra observa a cena com atenção enquanto a tensão aumenta...";
    }

    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Erro ao gerar segmento da história com o Mestre:", error.message);
    const loc = req.body?.gameContext?.location || "Salão Principal";
    const prompt = req.body?.prompt || "";
    res.json({
      storyText: `O eco de sua ação "${prompt || 'de avanço'}" reverbera pelo ambiente. As sombras ao redor parecem hesitar diante da sua iniciativa enquanto você mantém o foco. O ar permanece tenso em ${loc}. O que você decide fazer a seguir?`,
      location: loc,
      actionSuggestions: [
        "Avançar com passos cautelosos",
        "Investigar o ambiente com atenção redobrada",
        "Preparar seus equipamentos para possíveis emboscadas"
      ],
      enemies: req.body?.gameContext?.enemies || []
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
