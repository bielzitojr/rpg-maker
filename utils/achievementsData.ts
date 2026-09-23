export interface Achievement {
  id: string;
  genre: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export const ACHIEVEMENTS_DATA: Achievement[] = [
  // Arena
  { id: "arena_1", genre: "Arena", name: "Primeiro Sangue", description: "Vença seu primeiro combate na arena.", unlocked: false },
  { id: "arena_2", genre: "Arena", name: "Sobrevivente", description: "Termine um combate com menos de 10% da vida.", unlocked: false },
  { id: "arena_3", genre: "Arena", name: "Intocável", description: "Vença um combate sem receber dano.", unlocked: false },
  { id: "arena_4", genre: "Arena", name: "Carnificina", description: "Derrote 3 ou mais inimigos em um único combate.", unlocked: false },
  { id: "arena_5", genre: "Arena", name: "Aposta Arriscada", description: "Derrote um inimigo declarado como 'desafio mortal'.", unlocked: false },
  { id: "arena_6", genre: "Arena", name: "Favorito da Multidão", description: "Vença um combate usando um movimento extravagante.", unlocked: false },
  { id: "arena_7", genre: "Arena", name: "Veterano", description: "Vença 10 combates na arena.", unlocked: false },
  { id: "arena_8", genre: "Arena", name: "Estrategista", description: "Vença um combate usando um item de forma inteligente.", unlocked: false },
  { id: "arena_9", genre: "Arena", name: "Golpe de Sorte", description: "Dê um golpe crítico que finaliza o combate.", unlocked: false },
  { id: "arena_10", genre: "Arena", name: "Campeão da Arena", description: "Derrote o campeão atual da arena.", unlocked: false },

  // Dungeon
  { id: "dungeon_1", genre: "Dungeon", name: "Caçador de Tesouros", description: "Abra seu primeiro baú de tesouro.", unlocked: false },
  { id: "dungeon_2", genre: "Dungeon", name: "Mestre das Chaves", description: "Abra uma porta trancada.", unlocked: false },
  { id: "dungeon_3", genre: "Dungeon", name: "Não é uma Armadilha!", description: "Desarme ou sobreviva a uma armadilha.", unlocked: false },
  { id: "dungeon_4", genre: "Dungeon", name: "Leitor de Runas", description: "Decifre uma inscrição antiga ou runa mágica.", unlocked: false },
  { id: "dungeon_5", genre: "Dungeon", name: "Passagem Secreta", description: "Encontre e entre em uma área escondida.", unlocked: false },
  { id: "dungeon_6", genre: "Dungeon", name: "Matador de Monstros", description: "Derrote um monstro chefe da dungeon.", unlocked: false },
  { id: "dungeon_7", genre: "Dungeon", name: "Quebra-Cabeça", description: "Resolva um enigma complexo.", unlocked: false },
  { id: "dungeon_8", genre: "Dungeon", name: "Ouro de Tolo", description: "Seja enganado por um tesouro falso ou amaldiçoado.", unlocked: false },
  { id: "dungeon_9", genre: "Dungeon", name: "Até o Fim", description: "Chegue ao nível mais profundo de uma dungeon.", unlocked: false },
  { id: "dungeon_10", genre: "Dungeon", name: "Saqueador Lendário", description: "Encontre um artefato poderoso.", unlocked: false },

  // Exploração Espacial
  { id: "space_1", genre: "Exploração Espacial", name: "Primeiro Contato", description: "Descubra um novo planeta.", unlocked: false },
  { id: "space_2", genre: "Exploração Espacial", name: "Anomalia Detectada", description: "Investigue um fenômeno espacial estranho.", unlocked: false },
  { id: "space_3", genre: "Exploração Espacial", name: "Não Estamos Sozinhos", description: "Encontre uma forma de vida alienígena.", unlocked: false },
  { id: "space_4", genre: "Exploração Espacial", name: "Relíquia Cósmica", description: "Encontre um artefato de uma civilização antiga.", unlocked: false },
  { id: "space_5", genre: "Exploração Espacial", name: "Salto Quântico", description: "Viaje por um buraco de minhoca ou fenda espacial.", unlocked: false },
  { id: "space_6", genre: "Exploração Espacial", name: "Piloto Ás", description: "Sobreviva a um campo de asteroides ou batalha espacial.", unlocked: false },
  { id: "space_7", genre: "Exploração Espacial", name: "Engenheiro de Bordo", description: "Realize um reparo crítico na sua nave.", unlocked: false },
  { id: "space_8", genre: "Exploração Espacial", name: "Diplomata Galáctico", description: "Faça um acordo pacífico com uma raça alienígena.", unlocked: false },
  { id: "space_9", genre: "Exploração Espacial", name: "Terra Incognita", description: "Pouse em um planeta inexplorado.", unlocked: false },
  { id: "space_10", genre: "Exploração Espacial", name: "Horizonte de Eventos", description: "Chegue perto de um buraco negro.", unlocked: false },

  // Fantasia
  { id: "fantasy_1", genre: "Fantasia", name: "Matador de Dragões", description: "Derrote um dragão.", unlocked: false },
  { id: "fantasy_2", genre: "Fantasia", name: "Escolhido", description: "Empunhe uma arma lendária ou cumpra uma profecia.", unlocked: false },
  { id: "fantasy_3", genre: "Fantasia", name: "Amigo da Floresta", description: "Faça amizade com uma criatura mítica.", unlocked: false },
  { id: "fantasy_4", genre: "Fantasia", name: "Poder Arcano", description: "Aprenda uma magia de nível mestre.", unlocked: false },
  { id: "fantasy_5", genre: "Fantasia", name: "Pacto Feito", description: "Faça um acordo com uma entidade poderosa.", unlocked: false },
  { id: "fantasy_6", genre: "Fantasia", name: "Realeza", description: "Encontre ou salve um membro da família real.", unlocked: false },
  { id: "fantasy_7", genre: "Fantasia", name: "Guardião de Segredos", description: "Junte-se a uma ordem secreta ou guilda.", unlocked: false },
  { id: "fantasy_8", genre: "Fantasia", name: "Andarilho dos Reinos", description: "Visite um outro plano de existência.", unlocked: false },
  { id: "fantasy_9", genre: "Fantasia", name: "A Queda do Tirano", description: "Derrube um governante maligno.", unlocked: false },
  { id: "fantasy_10", genre: "Fantasia", name: "Salvação do Mundo", description: "Impeça um evento apocalíptico.", unlocked: false },

  // Guerra
  { id: "war_1", genre: "Guerra", name: "Batismo de Fogo", description: "Sobreviva à sua primeira batalha.", unlocked: false },
  { id: "war_2", genre: "Guerra", name: "Nenhum Homem Deixado Para Trás", description: "Salve um companheiro ferido no campo de batalha.", unlocked: false },
  { id: "war_3", genre: "Guerra", name: "Herói de Guerra", description: "Realize um ato de bravura que muda o curso da batalha.", unlocked: false },
  { id: "war_4", genre: "Guerra", name: "Sombra Inimiga", description: "Infiltre-se com sucesso em um acampamento inimigo.", unlocked: false },
  { id: "war_5", genre: "Guerra", name: "Mente Estratégica", description: "Crie e execute um plano de batalha bem-sucedido.", unlocked: false },
  { id: "war_6", genre: "Guerra", name: "O Preço da Vitória", description: "Vença uma batalha, mas sofra uma grande perda.", unlocked: false },
  { id: "war_7", genre: "Guerra", name: "Trégua", description: "Participe de uma negociação de paz ou cessar-fogo.", unlocked: false },
  { id: "war_8", genre: "Guerra", name: "Sargento", description: "Seja promovido a uma posição de liderança.", unlocked: false },
  { id: "war_9", genre: "Guerra", name: "Fim da Linha", description: "Defenda uma posição contra forças esmagadoras.", unlocked: false },
  { id: "war_10", genre: "Guerra", name: "O Fim da Guerra", description: "Participe da batalha final que decide a guerra.", unlocked: false },

  // Investigação
  { id: "investigation_1", genre: "Investigação", name: "A Primeira Pista", description: "Encontre a primeira pista crucial de um caso.", unlocked: false },
  { id: "investigation_2", genre: "Investigação", name: "Interrogatório", description: "Obtenha uma confissão de um suspeito.", unlocked: false },
  { id: "investigation_3", genre: "Investigação", name: "Lobo em Pele de Cordeiro", description: "Descubra que um aliado era o culpado.", unlocked: false },
  { id: "investigation_4", genre: "Investigação", name: "Conexão Inesperada", description: "Ligue dois casos que pareciam não ter relação.", unlocked: false },
  { id: "investigation_5", genre: "Investigação", name: "A Cena do Crime", description: "Encontre uma evidência que a polícia não viu.", unlocked: false },
  { id: "investigation_6", genre: "Investigação", name: "Beco sem Saída", description: "Siga uma pista falsa até o fim.", unlocked: false },
  { id: "investigation_7", genre: "Investigação", name: "Informante", description: "Consiga uma informação valiosa de uma fonte duvidosa.", unlocked: false },
  { id: "investigation_8", genre: "Investigação", name: "O Modus Operandi", description: "Identifique o padrão do criminoso.", unlocked: false },
  { id: "investigation_9", genre: "Investigação", name: "Justiça Cega", description: "Acuse a pessoa errada.", unlocked: false },
  { id: "investigation_10", genre: "Investigação", name: "Caso Encerrado", description: "Resolva o mistério e revele o culpado.", unlocked: false },

  // Isekai
  { id: "isekai_1", genre: "Isekai", name: "Bem-vindo a Outro Mundo", description: "Chegue a um novo mundo.", unlocked: false },
  { id: "isekai_2", genre: "Isekai", name: "Habilidade Única", description: "Descubra ou ganhe uma habilidade absurdamente poderosa.", unlocked: false },
  { id: "isekai_3", genre: "Isekai", name: "Primeiro Companheiro", description: "Faça seu primeiro amigo ou aliado neste novo mundo.", unlocked: false },
  { id: "isekai_4", genre: "Isekai", name: "Subindo de Nível", description: "Alcance o nível 5.", unlocked: false },
  { id: "isekai_5", genre: "Isekai", name: "Rei Demônio?", description: "Encontre o principal antagonista do mundo.", unlocked: false },
  { id: "isekai_6", genre: "Isekai", name: "Guilda de Aventureiros", description: "Junte-se a uma guilda ou grupo local.", unlocked: false },
  { id: "isekai_7", genre: "Isekai", name: "Choque Cultural", description: "Cometa uma gafe social hilária ou perigosa.", unlocked: false },
  { id: "isekai_8", genre: "Isekai", name: "Saudades de Casa", description: "Encontre algo que o lembre do seu antigo mundo.", unlocked: false },
  { id: "isekai_9", genre: "Isekai", name: "Status Aberto", description: "Aprenda a usar a 'interface' ou 'sistema' deste mundo.", unlocked: false },
  { id: "isekai_10", genre: "Isekai", name: "O Herói do Outro Mundo", description: "Seja reconhecido como um herói lendário.", unlocked: false },

  // Terror
  { id: "horror_1", genre: "Terror", name: "Não Olhe Para Trás", description: "Fuja de uma ameaça em vez de lutar.", unlocked: false },
  { id: "horror_2", genre: "Terror", name: "O Primeiro Susto", description: "Experimente o primeiro evento sobrenatural.", unlocked: false },
  { id: "horror_3", genre: "Terror", name: "Estamos Presos Aqui", description: "Descubra que não há como escapar do local.", unlocked: false },
  { id: "horror_4", genre: "Terror", name: "A Origem do Mal", description: "Descubra a história trágica por trás do horror.", unlocked: false },
  { id: "horror_5", genre: "Terror", name: "Não Estamos Sozinhos", description: "Veja a criatura ou entidade pela primeira vez.", unlocked: false },
  { id: "horror_6", genre: "Terror", "name": "Sanidade Despedaçada", "description": "Falhe em um teste de sanidade ou medo.", "unlocked": false },
  { id: "horror_7", genre: "Terror", name: "O Sacrifício", description: "Veja um personagem não-jogador morrer de forma horrível.", unlocked: false },
  { id: "horror_8", genre: "Terror", name: "A Calmaria Antes da Tempestade", description: "Encontre um local que parece seguro, mas não é.", unlocked: false },
  { id: "horror_9", genre: "Terror", name: "A Última Página", description: "Leia um diário ou documento que revela um terrível segredo.", unlocked: false },
  { id: "horror_10", genre: "Terror", name: "Sobrevivente", description: "Sobreviva à noite ou escape do local.", unlocked: false },
];