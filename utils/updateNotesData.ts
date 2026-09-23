export const updates = [
     {
      version: "v1.10 - A Estabilidade Arcana",
      notes: [
          "CORREÇÃO CRÍTICA: Corrigido um erro de sistema interno (parsing de JSON) que poderia raramente impedir a continuação da história. A IA do Mestre agora é mais confiável.",
          "MELHORIA DE UI: Corrigida a cor do texto dos botões no menu principal para o tema claro, que estavam invisíveis (texto branco sobre fundo branco)."
      ]
    },
     {
      version: "v1.9 - A Alma do Jogo",
      notes: [
          "NOVO: Adicionado um indicador de 'digitando' (...) que aparece enquanto o Mestre prepara sua resposta, melhorando o feedback visual.",
          "NOVO: Habilidades agora possuem valores de Dano e Custo de recurso (Mana/Energia), visíveis na tela de Habilidades para melhor planejamento.",
          "NOVO: Implementado o sistema de progressão de Habilidades! Agora você pode usar seus Pontos de Habilidade para melhorar as habilidades existentes.",
          "REFEITO: A tela de Habilidades foi completamente redesenhada com abas internas para uma melhor organização por categoria (Passivas, Físicas, Mágicas, etc.).",
          "CORREÇÃO: A imagem do personagem agora é gerada diretamente na tela de criação de personagem através de um novo botão, dando mais controle e feedback visual imediato ao jogador.",
          "CORREÇÃO: Resolvido um problema de consistência onde o Mestre narrava o uso de armas que o jogador não possuía no inventário no início do jogo. Sua arma inicial agora é adicionada corretamente.",
      ]
    },
    {
      version: "v1.8 - A Experiência Aprimorada",
      notes: [
          "INTERFACE: A tela de Notas de Atualização foi completamente redesenhada e agora utiliza abas para facilitar a navegação entre as versões.",
          "GAMEPLAY: Adicionado um sistema interativo de Testes de Dados (d20). O Mestre agora pode solicitar rolagens de dados para ações de resultado incerto, substituindo a caixa de texto por um botão de rolagem.",
          "VISUAL: Resultados de dados agora possuem feedback visual impactante na narrativa: Falha Crítica (1) tem efeito de fogo roxo; Falha (2-9) é laranja; Sucesso (10-19) é verde; Sucesso Crítico (20) é dourado com efeito de estrelas animadas.",
          "CORREÇÃO: As configurações de 'Velocidade de Texto', 'Descrição de Texto' e 'Narrativa Automática' foram corrigidas e agora funcionam como esperado.",
          "CORREÇÃO: Resolvido um bug visual onde o nome do jogador aparecia em amarelo sobre fundos claros, dificultando a leitura.",
          "MELHORIA TÉCNICA: Aprimorada a estabilidade do sistema de áudio e a segurança da chave de API nos bastidores."
      ]
    },
    {
      version: "v1.7 - A Profundidade dos Mundos",
      notes: [
          "GRANDE ATUALIZAÇÃO DE GAMEPLAY! Cada gênero agora possui mecânicas únicas para uma experiência distinta.",
          "Gênero 'Arena': Adicionada uma loja para comprar itens e uma área de treino, acessíveis fora de combate.",
          "Gênero 'Bíblico': Introduzido o NPC 'O Inimigo', que provoca o jogador com base em sua provação (pecado capital).",
          "Gênero 'Dungeon': Implementado um sistema de raridade de itens (Comum a Divino) e ranking de estrelas (1-5).",
          "Gênero 'Exploração Espacial': Adicionado gerenciamento de nave, com status de casco, escudos, combustível e sucata.",
          "Gênero 'Fantasia': Introduzido um sistema de reputação com diferentes facções do mundo.",
          "Gênero 'Guerra': Implementado gerenciamento de esquadrão com um sistema de moral que afeta o combate.",
          "Gênero 'Investigação': Adicionado um 'Quadro de Evidências' para conectar pistas e resolver mistérios.",
          "Gênero 'Isekai': Foco em progressão acelerada, com ganho de pontos de habilidade para distribuir ao subir de nível.",
          "Gênero 'Terror': Adicionada a mecânica de 'Sanidade', que afeta a percepção do jogador.",
          "Adicionado um botão de Ajuda (?) na interface do jogo para explicar as mecânicas de cada gênero.",
          "Adicionada a opção de pausar e retomar a música nas Configurações.",
          "Adicionado o gênero 'Bíblico' com a mecânica de 'Provação' na criação de personagem.",
          "Corrigido um bug crítico que impedia o retorno correto ao menu principal durante o jogo."
      ]
    },
    {
      version: "v1.6 - O Mundo Vivo",
      notes: [
          "Adicionado sistema de Conquistas! O botão 'Conquistas' no menu principal agora está funcional.",
          "Cada gênero de aventura possui 10 conquistas únicas para desbloquear.",
          "Adicionado Relógio e Calendário ao jogo! O tempo agora passa e é exibido na interface.",
          "A Localização atual do personagem agora é exibida na tela.",
          "A IA do Mestre foi aprimorada para ter um domínio impecável da língua portuguesa.",
          "Corrigido um bug visual que causava o aparecimento do texto 'undefined' na narrativa.",
      ]
    },
    {
      version: "v1.5 - O Livro das Histórias",
      notes: [
          "Implementado sistema de Salvar e Carregar Jogo!",
          "Agora é possível 'Salvar Aventura' para continuar exatamente de onde parou.",
          "Adicionada a opção 'Salvar Personagem' para iniciar novas aventuras com seus heróis já criados.",
          "O botão 'Carregar Jogo' no menu principal agora está funcional e abre uma tela para gerenciar seus jogos salvos.",
          "Adicionadas novas opções nas Configurações: Velocidade do Texto, Nível de Detalhe da Narrativa, Narrativa Automática e Temas (Claro, Escuro).",
          "A velocidade do texto afeta a exibição da história com um efeito de 'máquina de escrever'.",
          "O detalhe da narrativa instrui a IA a ser mais ou menos descritiva."
      ]
    },
    {
      version: "v1.4 - A Voz do Mestre",
      notes: [
          "A IA agora assume a persona de um Mestre de RPG de mesa experiente e profissional.",
          "A narrativa foi aprimorada com inspiração na 'Jornada do Herói' de Joseph Campbell.",
          "O Mestre agora tem total liberdade criativa para narrativas mais maduras, incluindo conteúdo sensível, violento ou explícito, para maior imersão.",
          "Textos de combate são mais diretos e objetivos, enquanto narrações de ambiente e diálogo são mais detalhadas.",
          "As respostas da IA são agora prefixadas com 'Mestre:' para clareza na interface."
      ]
    },
    {
      version: "v1.3 - A Alma do Herói",
      notes: [
          "Implementado sistema de atributos clássicos: Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma.",
          "Adicionado Nível e Experiência para progressão de personagem.",
          "Criação de personagem agora exibe bônus de raça e classe.",
          "Adicionados campos para nome do jogador e do personagem.",
          "Tela de Status atualizada para exibir todos os novos atributos, nomes, e os novos campos 'Título' e 'Fama'.",
          "Adicionada a barra de 'Energia' na tela de Status.",
          "Atributos base agora são calculados com os bônus de raça e classe.",
      ]
    },
    {
      version: "v1.2 - A Interface Consciente",
      notes: [
          "Adicionado sistema de notificações para abas do HUD.",
          "Restaurada a aba 'Sistema' com um registro de eventos do jogo.",
          "Adicionada a aba 'Configurações' com opção para retornar ao menu principal.",
      ]
    },
    {
      version: "v1.1 - A Estética do Aventureiro",
      notes: [
        "Reformulação visual completa para uma estética de RPG de mesa.",
        "Paleta de cores alterada para tons de madeira, pergaminho e âmbar.",
        "Fontes atualizadas para um estilo mais clássico e temático.",
        "Adicionada esta tela de 'Notas de Atualização'!",
      ],
    },
    {
        version: "v1.0 - O Início da Jornada",
        notes: [
            "Adicionada uma tela de carregamento inicial temática.",
            "Implementada a tela de seleção de gênero para personalizar o início da história."
        ]
    }
  ];