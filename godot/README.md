# RPG Maker — versão Godot restaurada

A versão ativa agora preserva a identidade e os principais sistemas do projeto original: fundo marrom, pergaminho, fontes IM Fell English SC e Libre Baskerville, menus e fluxo de criação de personagem. O código web original permanece na pasta superior.

## Abrir e jogar

1. Feche a janela da versão anterior, se estiver aberta.
2. Na pasta `rpg-maker`, abra **Iniciar Godot.cmd**. Alternativamente, importe este `project.godot` no Godot e pressione F5.
3. Escolha **Jogar → Jogador ou Mestre → Gênero → Ambientação → Personagem**. Isekai pede apenas os dois nomes e o gênero; depois, **Começar introdução** abre o prólogo em quadrinhos e revela a raça sorteada. Veja `ISEKAI.md`.
4. Preencha os nomes ou use **Gerar Aleatoriamente**. Clique **Iniciar Aventura**. No modo Jogador, o Gemini cria a abertura; no modo Mestre, você narra a primeira cena.
5. **Enter** envia uma ação; **Shift + Enter** cria uma nova linha. Em caso de falha, o jogo preserva a ação e oferece **Tentar novamente**.

## O que foi restaurado

- Menu inicial: Jogar, Carregar Jogo, Conquistas, Configurações e Notas de Atualização.
- Modos Jogador e Mestre; nove gêneros e oito ambientações originais.
- Criação com nomes, gênero, aparência, raça, classe, arma, antecedentes e provação Bíblica. Isekai inclui as raças de monstros e habilidades originais.
- Retrato carregado do computador ou solicitado ao Gemini, com zoom e remoção.
- Bônus originais de raça/classe, atributos, vida, mana, energia, sanidade, experiência e pontos de habilidade.
- Respostas estruturadas do Gemini atualizam inventário, habilidades, bestiário, aliados, inimigos, localização e relógio. A abertura não duplica a arma inicial.
- Habilidades com nível, progressão, dano, custo e melhoria por pontos. Bestiário preserva informações descobertas anteriormente.
- Testes d20 e combate com iniciativa, ordem de turnos e atualização da vida. Para participantes controlados pela IA, clique **Resolver turno da IA**.
- Mecânicas de gênero: ouro, nave, reputação, esquadrão, evidências, provação e sanidade, conforme os dados narrados pelo Gemini.
- Catálogo original de 80 conquistas, com desbloqueios persistidos.
- Saves separados de aventuras e personagens, carregamento e exclusão com confirmação. Arquivos são gravados com temporário e cópia de segurança.
- Caderno do Mestre com anotações, NPCs, lugares e missões; geradores e controle manual dos inimigos.
- Velocidade/estilo de texto, sugestões, temas, salvamento automático, música original disponível e voz do Windows.
- Conjunto completo de dez ícones ilustrados ativo na barra. A opção **Configurações → Usar novos ícones ilustrados** permite alternar para os símbolos originais.

## Gemini e credencial local

Configure sua própria chave em Configurações ou na variável GEMINI_API_KEY. Credenciais locais não são distribuídas.

A ordem de procura é: credencial protegida, `../config/apiKey.ts`, variável `GEMINI_API_KEY` e `../.env.local`. Em Configurações, é possível informar outra chave para a sessão, alterar os modelos e **Testar conexão com Gemini**. A presença de uma chave não é apresentada como conexão confirmada: isso só ocorre depois de uma resposta real.

O jogo envia ao Gemini o histórico, personagem e estado da aventura para narrar. Internet e acesso à API são necessários. O modelo de conversa configurado é `gemini-3-flash-preview`; a disponibilidade depende da API/conta. Nenhuma chave é registrada nos saves ou logs.

**Retratos por IA:** no teste desta configuração, o modelo de imagens retornou cota excedida (HTTP 429). O botão está integrado, mas precisa de acesso/cota no modelo escolhido. Enquanto isso, use **Carregar** na criação de personagem. Aparência em texto, conversa e gerador do Mestre responderam normalmente.

## Saves e diferenças práticas

Os novos saves ficam em `user://rpg_maker_v2`, normalmente `%APPDATA%/Godot/app_userdata/RPG Maker/rpg_maker_v2/`. Os saves do navegador e do protótipo anterior não são importados automaticamente. O retrato fica em arquivo local, referenciado pelo save; ao copiar progresso para outra máquina, leve também a pasta `portraits`.

O mapa original ainda era uma tela provisória. Aqui o painel mostra os locais visitados; não há mapa gráfico. As músicas são carregadas da pasta original `../public/assets/audio`; gêneros sem arquivo específico usam uma faixa existente. A narração usa vozes em português instaladas no Windows. Não foi gerado um executável independente: o iniciador usa o Godot instalado.

## Verificação

Consulte `VALIDACAO.md` para os resultados e limites dos testes.

Na pasta `godot`, para repetir somente os testes locais:

```powershell
& "$env:USERPROFILE\Desktop\Godot_v4.7.2-stable_win64_console.exe" --headless --path . --script res://tests/restore_tests.gd -- --test
```

Os scripts `restore_live.gd` e `features_live.gd` fazem chamadas reais ao Gemini; `render_restore.gd` gera capturas sem chamadas à API. Todos usam pastas de teste, sem sobrescrever as aventuras do jogador.

Código ativo: `scripts/rpg_app.gd`, `scripts/rpg_state.gd`, `scripts/rpg_store.gd` e `scripts/gemini_api.gd`. `data/original.json` contém o catálogo extraído dos arquivos TypeScript originais. A cena principal não utiliza mais o antigo `scripts/main.gd`.

Fontes acompanhadas das licenças em `assets/fonts`. Prompts dos ícones ilustrados em `assets/icons/PROMPTS.md` e `assets/icons/HUD-PROMPTS.md`. Integração baseada na [API generateContent do Gemini](https://ai.google.dev/api/generate-content).


