# Verificação da restauração

Ambiente: Windows, Godot 4.7.2, renderer Compatibility.

## Testes concluídos

- **76 verificações locais, zero falhas**, registradas em `restore-tests.log`: dados originais, bônus, progressão, inventário, conhecimento cumulativo do bestiário, aliados, iniciativa, turnos, conquistas, saves, modos, painéis, cancelamento, respostas inválidas e retrato local.
- **Fluxo real do Gemini, zero falhas**, em `restore-live.log`: variável de ambiente removida do processo; credencial protegida carregada; menus e criação de personagem; abertura da aventura; segundo turno; atualização de localização; presença de habilidades e arma; salvamento e recarga; resposta da IA como aventureiro no modo Mestre.
- **Galeria renderizada e inspecionada**: menu, papéis, gêneros, ambientação, personagem Isekai e Fantasia, configurações, jogo, status e habilidades. Capturas em `tests/restored-*.png`.
- **Aparência e gerador do Mestre**: respostas reais recebidas no teste `features-live.log`.
- **Retrato por Gemini: bloqueado externamente.** A API retornou HTTP 429, com cota zero para o modelo de imagens desta configuração. Não foi confirmada uma geração bem-sucedida. O jogo orienta usar **Carregar** para selecionar uma imagem local; a conversa de texto não é afetada.

Os testes de conversa usaram personagens fictícios de teste e saves em pastas de teste. Uma resposta real confirma o fluxo no momento do teste, não a disponibilidade futura do serviço ou a correção de toda narrativa possível.

## Correções verificadas

- A chave original era rejeitada pelo Gemini; a configuração protegida evita depender da variável de ambiente do processo de desenvolvimento.
- Falhas da API não são transformadas em narrativa nem apagam o progresso.
- A provação Bíblica não é enviada para outros gêneros.
- Atualizações parciais do bestiário preservam o conhecimento anterior.
- Inimigos omitidos na resposta não encerram o combate; uma lista vazia explícita encerra.

## Limites

Não há importação automática de saves do navegador, mapa gráfico nem executável independente. O áudio depende dos arquivos originais e de voz instalada no Windows. A geração de retratos depende de suporte do modelo Gemini escolhido.

## Prólogo Isekai
16 imagens locais instaladas; 13 desfechos de raça verificados. Teste isekai_tests.gd aprovado sem falhas: criação com três campos, transição animada, proteção contra cliques duplicados, raça estável ao voltar e carregar, entrada na aventura e configuração sem chave. Verificação feita sem chamadas reais ao Gemini. Regressão: 76 verificações aprovadas.

