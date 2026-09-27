# Chat, combate e provedores de IA

Atualização de 24/09/2026.

- Ao solicitar um teste, o mestre informa atributo, CD e motivo. O botão Enviar passa a D20. Um clique calcula, registra no chat e envia o resultado; falhas e novas tentativas preservam o mesmo dado. O turno só avança depois da resolução.
- Iniciativa também pode ser rolada pelo botão D20. O combate abre automaticamente a aba Combate, junto da narrativa, com seleção de alvo, imagens e vida dos inimigos, técnicas ativas aprendidas e consumíveis possuídos. A aba Aventura permite recolher esses controles.
- Técnicas verificam recursos e recarga. Custos e consumo são confirmados somente após uma resposta válida; uma tentativa de rede malsucedida não gasta o item. Ações internas dos inimigos não aparecem como falas do jogador.
- Os ícones mostram contadores vermelhos. Configurações → Dev → Ver prompt do mestre mostra instruções atuais, último envio e diagnóstico, sem os cabeçalhos de autenticação.
- O mestre recebe os catálogos de criaturas, itens e habilidades. Respostas com novos nomes inexistentes são rejeitadas e recebem uma tentativa de correção. Fichas de inimigos e itens são reconciliadas com os dados locais. Registros antigos dos saves continuam reconhecidos para compatibilidade.

## Configuração da conversa

Em Configurações, selecione o provedor, informe sua chave e use Aplicar configuração de IA ou Testar conexão.

| Provedor | Modelo inicial | Chave de ambiente opcional |
|---|---|---|
| Gemini | gemini-3-flash-preview | GEMINI_API_KEY |
| Groq | openai/gpt-oss-20b | GROQ_API_KEY |
| OpenRouter | openrouter/free | OPENROUTER_API_KEY |

Chaves digitadas valem somente na sessão e não entram nos saves. Modelos e provedor escolhido são salvos. A geração de retratos continua usando a chave Gemini. Não há troca automática de provedor nem de modelo pago.

O Groq usa catálogos compactos, histórico recente menor, respostas objetivas e reserva de saída menor para reduzir consumo no plano gratuito. Gemini e OpenRouter recebem até 24 mensagens recentes, além do estado atual e dos catálogos. A conversa completa permanece no save e no chat.

Planos gratuitos têm cotas e disponibilidade variáveis: [Groq](https://console.groq.com/docs/rate-limits), [OpenRouter](https://openrouter.ai/pricing). Catálogos e aventuras extensos ainda podem ultrapassar limites. Nenhum plano gratuito garante operação ilimitada de um jogo público. Para distribuição, use chaves individuais dos jogadores ou um servidor com orçamento e limites por usuário; não distribua uma chave compartilhada dentro do executável.

## Recuperação de erros

Timeout de texto de 45 segundos por tentativa, com uma nova tentativa limitada para falhas transitórias (incluindo HTTP 503), espera curta e cancelamento. HTTP 429 informa cota, sem insistência automática. Resposta truncada, bloqueio explícito e ausência de texto têm diagnósticos distintos. JSON cercado por marcações é recuperado; estrutura inválida recebe uma tentativa de correção antes de apresentar erro. O estado não é aplicado parcialmente.

Testes de provedores usam respostas simuladas: formatos, chaves separadas por destino, cancelamento de retry, erros de cota/503/truncamento. Não substituem uma verificação real com a chave e os limites da conta do jogador.
