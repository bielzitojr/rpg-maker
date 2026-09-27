# Tutorial, dados e descobertas — 25/09/2026

## Como experimentar

- Abra uma aventura: na primeira execução desta versão aparece o guia com a área explicada destacada e o restante escurecido. Use Próximo, Voltar ou Pular. Para rever: Configurações → Rever tutorial com destaque.
- Em combate, escolha uma sugestão com ícone ou escreva sua própria ação. Ataques e manobras incertas preparam um teste local. O botão D20 mostra a animação, soma o atributo e envia o resultado. Espaço ou clique aceleram a animação. A iniciativa e os testes manuais também usam a animação.
- Os inimigos e aliados da IA agem automaticamente. Se uma chamada falhar, a sequência pausa e mantém ação/dado para Tentar novamente; não há repetição automática infinita.
- Configurações → Dev → Laboratório de combate permite escolher a criatura e de um a três inimigos. O padrão usa um mestre local, sem API e sem cota. A opção de IA configurada permite testar o serviço real. Sair da simulação restaura o estado anterior; a simulação não salva personagens, itens, descobertas ou conquistas na aventura original.

## Correções encontradas

O texto do golpe apresentado pelo jogador descrevia uma resolução antes do dado e outra depois. O texto sozinho não comprova que o dano havia sido subtraído duas vezes, mas esse fluxo era inadequado. Agora, preparar um ataque não causa dano nem avança o turno. Respostas que pedem dado têm os efeitos prematuros descartados e a narrativa trocada por uma preparação neutra. O resultado local é aplicado em uma única resolução.

Status notificava toda vez que a IA reenviava a ficha. Além disso, sanidade era normalizada mesmo fora do gênero Terror. Agora somente mudanças efetivas nos campos relevantes geram aviso; mudanças apenas na descrição não geram contador.

## Descoberta de criaturas

O catálogo completo permanece no Dev, separado do conhecimento do personagem. A aba comum e o painel de combate não mostram a vida exata desconhecida. Os antigos campos automáticos de knownInfo não desbloqueiam os números por si só.

Regras desta versão:

- Avistamento: nome e ilustração; demais campos ficam desconhecidos.
- Derrota observada: vida total, nível e tipo.
- Três impactos observados: defesa.
- Ataque sofrido: dano efetivamente observado e tipo de dano; três ataques revelam o padrão e a faixa de dano da espécie.
- Técnica mágica observada: aptidão, técnica e alcance. Duas conjurações revelam custo e recarga; três revelam reserva de mana.
- Pesquisa solicitada em biblioteca, academia, arquivo, guilda, universidade, escola ou templo pode revelar os campos estudados. Informação recebida de um personagem também pode revelá-los. A IA precisa indicar espécie, campos, origem e evidência. Os valores são preenchidos a partir do catálogo local.

Conhecimento e evidências ficam no save. A narrativa da IA recebe instruções para não expor os números privados; a interface não depende de a IA obedecer para ocultar campos ainda desconhecidos.

## Conexão da IA

O erro da imagem era genérico e não demonstrava que a chave estava inválida. Agora o diagnóstico distingue timeout, DNS, interrupção e TLS, com modelo, código e tempo decorrido, sem registrar a chave. O tempo de resposta por tentativa é ajustável entre 30 e 120 segundos, inicialmente 75. Catálogos e histórico enviados foram compactados, e a preparação local do teste evita uma chamada extra de IA por ataque.

Uma consulta real curta ao Gemini 3 Flash Preview retornou HTTP 200 e JSON válido em 5,3 segundos em 25/09/2026. Isso comprova a conexão naquele teste; não elimina indisponibilidade do provedor, limites de cota ou garante esse tempo em uma aventura completa.
