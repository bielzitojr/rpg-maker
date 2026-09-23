import React from 'react';
import { Achievement } from '../utils/achievementsData';

interface AchievementsScreenProps {
  achievements: Achievement[];
  onBack: () => void;
}

const TrophyIcon: React.FC<{unlocked: boolean}> = ({ unlocked }) => (
    <svg 
        className={`w-8 h-8 ${unlocked ? 'text-yellow-500' : 'text-stone-400'}`} 
        fill="currentColor" 
        viewBox="0 0 20 20"
    >
        <path d="M17.5,3H15V1.5A.5.5,0,0,0,14.5,1h-9a.5.5,0,0,0-.5.5V3H2.5A1.5,1.5,0,0,0,1,4.5v3A1.5,1.5,0,0,0,2.5,9H3v6a3,3,0,0,0,3,3h8a3,3,0,0,0,3-3V9h.5A1.5,1.5,0,0,0,19,7.5v-3A1.5,1.5,0,0,0,17.5,3ZM14,3H6V2h8ZM7,15a1,1,0,0,1-1-1V9H7Zm6,0V9h1a1,1,0,0,1,0,2H12v1h1a1,1,0,0,1,0,2H12v1Z"/>
    </svg>
);

const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ achievements, onBack }) => {
  const groupedAchievements: { [key: string]: Achievement[] } = achievements.reduce((acc, ach) => {
    (acc[ach.genre] = acc[ach.genre] || []).push(ach);
    return acc;
  }, {} as { [key: string]: Achievement[] });

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-6 animate-fade-in bg-[var(--surface-color)] text-[var(--surface-text-color)] border-double border-8 border-[var(--border-color)] rounded-lg p-6 shadow-2xl shadow-[var(--shadow-color)]/50">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 font-title">Conquistas</h2>
      <div className="w-full h-[60vh] overflow-y-auto space-y-6 pr-4">
        {Object.keys(groupedAchievements).map(genre => (
          <div key={genre}>
            <h3 className="text-2xl font-bold font-title text-[var(--tertiary-accent-color)] border-b-2 border-[var(--border-color)] pb-1 mb-3">{genre}</h3>
            <ul className="space-y-3">
              {groupedAchievements[genre].map(ach => (
                <li key={ach.id} className={`p-3 rounded-lg flex items-center gap-4 ${ach.unlocked ? 'bg-amber-100/30' : 'bg-stone-500/10'}`}>
                  <TrophyIcon unlocked={ach.unlocked} />
                  <div>
                    <h4 className={`font-bold font-title text-xl ${ach.unlocked ? 'text-amber-800' : 'text-stone-600'}`}>{ach.name}</h4>
                    <p className={`text-sm ${ach.unlocked ? 'text-stone-700' : 'text-stone-500'}`}>{ach.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <button
        onClick={onBack}
        className="mt-6 w-1/2 px-6 py-3 bg-[var(--tertiary-accent-color)]/80 border border-[var(--border-color)] text-amber-50 font-bold rounded-lg hover:bg-[var(--secondary-accent-color)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-accent-color)] transition-all duration-200 font-title"
      >
        Voltar
      </button>
    </div>
  );
};

export default AchievementsScreen;