import React from 'react';
import Modal from './Modal';

interface HelpModalProps {
  genre: string;
  onClose: () => void;
}

const getHelpText = (genre: string): { title: string, text: string } => {
    switch(genre) {
        case 'Arena':
            return {
                title: 'Mecânicas da Arena',
                text: 'Seu objetivo é sobreviver e prosperar como um gladiador. Você ganhará Ouro por suas vitórias, que pode ser usado na Loja para comprar equipamentos melhores. Entre as lutas, a IA lhe dará a opção de visitar a Loja ou a Área de Treino. Apenas digite "Ir para a loja" ou "Quero treinar" para interagir.'
            };
        case 'Bíblico':
            return {
                title: 'Mecânicas Bíblicas',
                text: 'Sua jornada é uma prova de fé. Uma entidade misteriosa, "O Inimigo", irá sussurrar em sua mente, tentando te desviar do seu caminho com base no pecado capital que você escolheu como sua provação. Suas escolhas morais são o centro desta aventura.'
            };
        case 'Dungeon':
            return {
                title: 'Mecânicas de Dungeon',
                text: 'Explore masmorras em busca de tesouros e glória. Os itens que você encontra possuem um sistema de raridade (Comum, Incomum, Raro, Épico, Lendário, Divino) e um ranking de 1 a 5 estrelas em seu nome. Fique de olho em equipamentos melhores e fragmentos de mapa para descobrir os segredos da masmorra.'
            };
        case 'Exploração Espacial':
            return {
                title: 'Mecânicas de Exploração Espacial',
                text: 'Você é o capitão de sua nave. A IA irá informar o status dos seus sistemas (casco, escudos, motores) e recursos (combustível, sucata). Eventos como batalhas ou campos de asteroides podem danificar sua nave. Use comandos como "Usar sucata para reparar os escudos" para sobreviver.'
            };
        case 'Fantasia':
            return {
                title: 'Mecânicas de Fantasia',
                text: 'Suas ações têm consequências. Este mundo é habitado por diversas facções (reinos, guildas, clãs). Suas escolhas em diálogos e missões afetarão sua Reputação com elas, abrindo novas oportunidades ou criando novos inimigos. O Mestre irá informá-lo sobre mudanças em sua reputação.'
            };
        case 'Guerra':
            return {
                title: 'Mecânicas de Guerra',
                text: 'Você não está sozinho. Você lidera um pequeno esquadrão em campo. Suas ordens e o resultado das batalhas afetam o Moral da sua equipe. Um moral alto significa que eles lutarão melhor, enquanto um moral baixo pode levá-los à desobediência ou ao pânico. Proteja seus homens.'
            };
        case 'Investigação':
            return {
                title: 'Mecânicas de Investigação',
                text: 'Sua mente é sua maior arma. Ao encontrar pistas, a IA as adicionará ao seu "Quadro de Evidências". O Mestre informará o ID de cada evidência (ex: "evidencia_01"). Você pode então usar comandos como "Analisar evidencia_01" ou "Conectar evidencia_01 com evidencia_03" para avançar no caso.'
            };
        case 'Isekai':
            return {
                title: 'Mecânicas de Isekai',
                text: 'Você foi transportado para um mundo regido por regras de videogame. O foco aqui é a progressão rápida. Você ganhará experiência e subirá de nível com frequência. A cada nível, você receberá Pontos de Habilidade para distribuir e a IA descreverá novas habilidades que você pode aprender.'
            };
        case 'Terror':
            return {
                title: 'Mecânicas de Terror',
                text: 'Sobreviver é a única vitória. Este modo introduz a Sanidade, visível na sua tela de Status. Eventos aterrorizantes irão diminuí-la. Se sua sanidade ficar muito baixa, a IA começará a descrever alucinações, paranoia e outros efeitos que podem atrapalhar seu julgamento e suas ações.'
            };
        default:
            return {
                title: 'Ajuda',
                text: 'As mecânicas especiais para este gênero ainda serão descobertas.'
            };
    }
}


const HelpModal: React.FC<HelpModalProps> = ({ genre, onClose }) => {
    const { title, text } = getHelpText(genre);
  return (
    <Modal title={title} onClose={onClose}>
        <div className="space-y-4">
            <p className="text-stone-600 whitespace-pre-wrap">{text}</p>
        </div>
    </Modal>
  );
};

export default HelpModal;
