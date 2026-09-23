// Este componente não é mais necessário na tela principal de combate,
// pois a ordem de turno e os inimigos são mostrados no TurnOrderDisplay.
// Ele ainda pode ser útil em outros contextos ou removido completamente no futuro.

import React from 'react';
import { Creature, EnemyInCombat } from '../types';
// Fix: Corrected import path for icons.
import { WeaknessIcon, AbilitiesIcon } from './icons/index';

interface CombatTrackerProps {
  enemies: EnemyInCombat[];
  bestiary: Creature[];
}

const StatBar: React.FC<{ value: number; maxValue: number; }> = ({ value, maxValue }) => (
    <div className="w-full bg-stone-300 rounded-full h-4 border border-stone-400 mt-2 relative">
        <div 
            className="bg-red-600 h-full rounded-full transition-all duration-300" 
            style={{ width: `${(value / maxValue) * 100}%` }}
        >
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold mix-blend-difference">
             {value} / {maxValue}
        </span>
    </div>
);

const KnownInfoDisplay: React.FC<{ info: Creature['knownInfo'] }> = ({ info }) => {
    const hasWeaknesses = info.weaknesses && info.weaknesses.length > 0;
    const hasAbilities = info.abilities && info.abilities.length > 0;

    if (!hasWeaknesses && !hasAbilities) return null;

    return (
        <div className="mt-2 pt-2 border-t border-red-300/50 flex flex-col gap-2">
            {hasWeaknesses && (
                <div>
                    <h4 className="font-bold text-red-800 flex items-center gap-1 text-sm"><WeaknessIcon className="w-4 h-4" /> Fraquezas</h4>
                    <ul className="list-disc list-inside text-xs text-red-900/90">
                        {info.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}
             {hasAbilities && (
                <div>
                    <h4 className="font-bold text-red-800 flex items-center gap-1 text-sm"><AbilitiesIcon className="w-4 h-4" /> Habilidades</h4>
                    <ul className="list-disc list-inside text-xs text-red-900/90">
                        {info.abilities?.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};


const CombatTracker: React.FC<CombatTrackerProps> = ({ enemies, bestiary }) => {
  return (
    <div className="w-full md:w-1/3 lg:w-1/4 h-full bg-stone-800/50 border-l-4 border-stone-600/50 p-2 overflow-y-auto flex flex-col gap-2 animate-fade-in-left">
      <style>{`
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-left {
          animation: fade-in-left 0.5s ease-out forwards;
        }
      `}</style>
      <h2 className="text-xl font-bold font-title text-red-300 text-center border-b-2 border-red-400/50 pb-1">EM COMBATE</h2>
      <ul className="space-y-3">
        {enemies.map((enemy) => {
          const bestiaryEntry = bestiary.find(c => c.name === enemy.name);
          return (
              <li key={enemy.id} className="p-2 bg-red-400/20 border border-red-400/50 rounded-lg flex flex-col items-start gap-2">
                {bestiaryEntry?.image ? (
                    <img src={bestiaryEntry.image} alt={enemy.name} className="w-full h-24 rounded-md object-cover border-2 border-red-400" />
                ) : null}
                <div className="w-full">
                  <h3 className="font-bold text-red-200 font-title text-lg">{enemy.name}</h3>
                  <p className="text-xs text-red-200/80 italic">{enemy.description}</p>
                  <StatBar value={enemy.health} maxValue={enemy.maxHealth} />
                  {bestiaryEntry && <KnownInfoDisplay info={bestiaryEntry.knownInfo} />}
                </div>
              </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CombatTracker;