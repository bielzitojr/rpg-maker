import React from 'react';
import { Combatant, CharacterData, Creature, EnemyInCombat } from '../types';

interface TurnOrderDisplayProps {
    turnOrder: Combatant[];
    currentTurnIndex: number;
    characterData: CharacterData;
    allies: Creature[];
    enemies: EnemyInCombat[];
    bestiary: Creature[];
}

const CombatantCard: React.FC<{ combatant: Combatant, image: string | null, isCurrent: boolean }> = ({ combatant, image, isCurrent }) => {
    const cardClasses = `flex flex-col items-center p-1 bg-stone-800 border-2 rounded-lg transition-all duration-300 ${isCurrent ? 'border-yellow-400 current-turn-animation' : 'border-stone-600 shadow-md shadow-black/50'}`;

    return (
        <div className={cardClasses}>
            {image ? (
                <img src={image} alt={combatant.name} className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-md" />
            ) : (
                <div className="w-12 h-12 md:w-16 md:h-16 bg-stone-700 rounded-md flex items-center justify-center text-stone-400 text-xs text-center">
                    Sem Imagem
                </div>
            )}
            <p className="text-white text-xs md:text-sm font-bold mt-1 truncate w-full text-center px-1">{combatant.name}</p>
        </div>
    );
};

const TurnOrderDisplay: React.FC<TurnOrderDisplayProps> = ({ turnOrder, currentTurnIndex, characterData, allies, enemies, bestiary }) => {

    const getImageForCombatant = (combatant: Combatant): string | null => {
        if (combatant.type === 'player') {
            return characterData.image;
        }
        if (combatant.type === 'ally') {
            const allyData = allies.find(a => a.name === combatant.name);
            return allyData?.image || null;
        }
        if (combatant.type === 'enemy') {
            const enemyData = enemies.find(e => e.id === combatant.id);
            const bestiaryData = bestiary.find(b => b.name === enemyData?.name);
            return bestiaryData?.image || null;
        }
        return null;
    };

    const playerSide = turnOrder.filter(c => c.type === 'player' || c.type === 'ally');
    const enemySide = turnOrder.filter(c => c.type === 'enemy');
    const currentCombatant = turnOrder[currentTurnIndex];

    return (
        <div className="w-full bg-stone-900/80 p-2 rounded-lg mb-2 border-y-2 border-amber-400/50 animate-fade-in">
            <div className="flex justify-between items-start">
                {/* Player and Allies Side */}
                <div className="flex flex-wrap gap-2 justify-start">
                    {playerSide.map(combatant => (
                        <CombatantCard
                            key={combatant.id}
                            combatant={combatant}
                            image={getImageForCombatant(combatant)}
                            isCurrent={currentCombatant?.id === combatant.id}
                        />
                    ))}
                </div>
                {/* Enemies Side */}
                <div className="flex flex-wrap gap-2 justify-end">
                     {enemySide.map(combatant => (
                        <CombatantCard
                            key={combatant.id}
                            combatant={combatant}
                            image={getImageForCombatant(combatant)}
                            isCurrent={currentCombatant?.id === combatant.id}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TurnOrderDisplay;