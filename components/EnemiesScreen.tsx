import React from 'react';
import Modal from './Modal';
import { Creature, EnemyInCombat } from '../types';
// Fix: Corrected import path for icons.
import { WeaknessIcon, AbilitiesIcon } from './icons/index';

interface EnemiesScreenProps {
  enemies: EnemyInCombat[];
  bestiary: Creature[];
  onClose: () => void;
}

const StatBar: React.FC<{ value: number; maxValue: number; }> = ({ value, maxValue }) => (
    <div className="w-full bg-stone-300 rounded-full h-4 border border-stone-400 mt-2">
        <div 
            className="bg-red-600 h-full rounded-full transition-all duration-300 text-center text-white text-xs font-bold flex items-center justify-center" 
            style={{ width: `${(value / maxValue) * 100}%` }}
        >
           {value} / {maxValue}
        </div>
    </div>
);

const KnownInfoDisplay: React.FC<{ info: Creature['knownInfo'] }> = ({ info }) => {
    const hasWeaknesses = info.weaknesses && info.weaknesses.length > 0;
    const hasAbilities = info.abilities && info.abilities.length > 0;

    if (!hasWeaknesses && !hasAbilities) return null;

    return (
        <div className="mt-2 pt-2 border-t border-red-300/50 flex flex-col sm:flex-row gap-4">
            {hasWeaknesses && (
                <div>
                    <h4 className="font-bold text-red-800 flex items-center gap-1 text-sm"><WeaknessIcon className="w-4 h-4" /> Fraquezas</h4>
                    <ul className="list-disc list-inside text-sm text-red-900/90">
                        {info.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}
             {hasAbilities && (
                <div>
                    <h4 className="font-bold text-red-800 flex items-center gap-1 text-sm"><AbilitiesIcon className="w-4 h-4" /> Habilidades</h4>
                    <ul className="list-disc list-inside text-sm text-red-900/90">
                        {info.abilities?.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};


const EnemiesScreen: React.FC<EnemiesScreenProps> = ({ enemies, bestiary, onClose }) => {
  return (
    <Modal title="Inimigos em Combate" onClose={onClose}>
      {enemies.length === 0 ? (
        <p className="text-stone-500 text-center italic">Nenhum inimigo por perto. O caminho está livre... por enquanto.</p>
      ) : (
        <ul className="space-y-4">
          {enemies.map((enemy, index) => {
            const bestiaryEntry = bestiary.find(c => c.name === enemy.name);
            return (
                <li key={index} className="p-3 bg-red-200/50 border border-red-400/50 rounded-lg flex items-start gap-4">
                  {bestiaryEntry?.image ? (
                      <img src={bestiaryEntry.image} alt={enemy.name} className="w-16 h-16 rounded-md object-cover border-2 border-red-400" />
                  ) : (
                      <div className="w-16 h-16 rounded-md bg-red-300 flex items-center justify-center text-center text-red-500 text-xs p-1">Sem Imagem</div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 font-title text-xl">{enemy.name}</h3>
                    <p className="text-sm text-red-800 italic">{enemy.description}</p>
                    <StatBar value={enemy.health} maxValue={enemy.maxHealth} />
                    {bestiaryEntry && <KnownInfoDisplay info={bestiaryEntry.knownInfo} />}
                  </div>
                </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};

export default EnemiesScreen;