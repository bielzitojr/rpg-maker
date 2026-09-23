# Prólogo de Isekai

Ao iniciar uma nova aventura de Isekai, a criação pede apenas Seu Nome, Nome do Personagem e Gênero. A raça é sorteada uniformemente entre as 13 raças do catálogo e permanece a mesma durante toda a introdução. Voltar uma página não faz outro sorteio.

São quatro páginas de quadrinhos: atropelamento, passagem pelo espaço, despertar na floresta e reconhecimento do novo corpo. A última página possui uma imagem própria para cada raça. Cada página começa preta e revela uma faixa suavemente a cada 3 segundos. Depois que todas as faixas estão visíveis, 5 segundos sem interação avançam automaticamente. Espaço revela a próxima faixa; com a página completa, avança para a seguinte. A transição escurece suavemente com leve deslocamento lateral, sem deformar a imagem. Cliques e teclas reiniciam a espera de inatividade.

A introdução usa imagens locais e funciona sem internet. Ao terminá-la, a aventura continua com o Gemini a partir do despertar, sem repetir o prólogo. Se faltar uma chave, a configuração abre e a raça permanece reservada. O gênero informado é preservado e enviado ao narrador; as imagens não identificam um rosto do personagem.

O novo personagem começa como Aprendiz, sem arma concedida automaticamente e sem habilidades prontas. A árvore permite escolher talentos e habilidades raciais. Os saves antigos continuam abrindo diretamente na aventura, sem novo sorteio ou repetição do prólogo.

Imagens: `assets/isekai/`. Prompts: `assets/isekai/PROMPTS.md`. Geração pela ferramenta integrada image_gen.

Verificação: `tests/isekai_tests.gd` cobre os três campos, a preservação de identidade, a animação, cliques repetidos, todas as 13 imagens finais, voltar páginas, configuração sem chave e carregar saves. O teste não chama a API.


A música de fundo para durante o prólogo. Efeitos locais sintetizados acompanham cada faixa e respeitam o volume configurado. Os limites dos quadros são definidos por imagem em assets/isekai/panel_cuts.json para evitar revelar a faixa seguinte antes da hora. Testes de áudio, recorte e fluxo aprovados.

