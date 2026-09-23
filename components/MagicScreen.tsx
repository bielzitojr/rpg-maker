import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import type { Ability, SkillCategory } from '../utils/skillsData';
// Fix: Corrected import path for icons.
import { MagicIcon, StrengthIcon } from './icons/index';

interface SkillsScreenProps {
  skills: Ability[];
  genre: string;
  onClose: () => void;
  skillPoints: number;
  onUpgradeSkill: (skillName: string) => void;
}

const SkillsScreen: React.FC<SkillsScreenProps> = ({ skills, genre, onClose, skillPoints, onUpgradeSkill }) => {
  const isIsekai = genre === 'Isekai';
  const title = isIsekai ? "Habilidades" : "Grimório";

  const groupedSkills = useMemo(() => {
    return skills.reduce((acc, skill) => {
        const category = skill.category || (isIsekai ? 'Habilidades Mágicas Aprendidas' : 'Magia');
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(skill);
        return acc;
    }, {} as Record<SkillCategory, Ability[]>);
  }, [skills, isIsekai]);

  const categoryOrder: SkillCategory[] = useMemo(() => isIsekai ? [
      'Habilidades Passivas de Raça',
      'Habilidades Passivas Físicas de Classe',
      'Habilidades Passivas Mágicas de Classe',
      'Habilidades Físicas de Classe',
      'Habilidades Mágicas de Classe',
      'Habilidades Físicas Aprendidas',
      'Habilidades Mágicas Aprendidas'
  ] : ['Magia'], [isIsekai]);

  const availableCategories = useMemo(() => categoryOrder.filter(cat => groupedSkills[cat] && groupedSkills[cat].length > 0), [categoryOrder, groupedSkills]);
  const [activeTab, setActiveTab] = useState<SkillCategory | null>(availableCategories.length > 0 ? availableCategories[0] : null);


  const tabButtonClasses = (isActive: boolean) => 
    `px-3 py-2 text-sm font-bold font-title transition-colors duration-200 rounded-t-lg ${
      isActive ? 'border-b-4 border-[var(--primary-accent-color)] text-[var(--primary-accent-color)] bg-stone-200/50' : 'text-stone-500 hover:text-stone-800'
    }`;
    
  const renderSkill = (skill: Ability, index: number) => {
    const currentLevelData = skill.progression.find(p => p.level === skill.level) || skill.progression[0];
    const nextLevelData = skill.level < skill.maxLevel ? skill.progression.find(p => p.level === skill.level + 1) : null;

    const canUpgrade = skillPoints > 0 && skill.level < skill.maxLevel;
    const hasStats = currentLevelData.damage || (currentLevelData.cost && skill.costType);

    return (
      <li key={`${skill.name}-${index}`} className="p-3 bg-stone-200/50 rounded-lg shadow-sm">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-stone-800 font-title text-xl">{skill.name}</h3>
                {hasStats && (
                    <div className="flex items-center gap-4 text-xs text-stone-600 mt-1">
                        {currentLevelData.damage && <span><strong>Dano:</strong> {currentLevelData.damage}</span>}
                        {currentLevelData.cost && skill.costType && <span><strong>Custo:</strong> {currentLevelData.cost} {skill.costType}</span>}
                    </div>
                )}
            </div>
            <div className="text-right">
               {skill.maxLevel > 1 ? (
                 <span className={`font-bold text-sm px-2 py-1 rounded-full ${skill.level === skill.maxLevel ? 'bg-yellow-400 text-yellow-900' : 'bg-stone-300 text-stone-700'}`}>
                    Nível {skill.level} / {skill.maxLevel}
                </span>
               ) : (
                <span className="font-bold text-sm px-2 py-1 rounded-full bg-cyan-200 text-cyan-800">
                    Passiva
                </span>
               )}
            </div>
        </div>
        <p className="text-stone-600 text-sm mt-2">{currentLevelData.description}</p>
        
        {isIsekai && skill.maxLevel > 1 && (
            <div className="mt-3 text-right flex items-center justify-end gap-4">
                {nextLevelData && (
                    <div className="text-xs text-green-700 text-left">
                       <span className="font-bold">Próx. Nível:</span> {nextLevelData.description}
                    </div>
                )}
                <button 
                    onClick={() => onUpgradeSkill(skill.name)}
                    disabled={!canUpgrade}
                    className="px-4 py-1 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
                >
                    Melhorar (1 Ponto)
                </button>
            </div>
        )}
      </li>
    );
  };

  return (
    <Modal title={title} onClose={onClose}>
      {skills.length === 0 ? (
        <p className="text-stone-500 text-center italic">
          {isIsekai ? "Você ainda não aprendeu nenhuma habilidade." : "Seu grimório está vazio."}
        </p>
      ) : (
        <div>
            {isIsekai && (
              <div className="mb-4 text-center">
                  <span className="text-lg font-bold font-title text-stone-800">Pontos de Habilidade Disponíveis: </span>
                  <span className="text-2xl font-bold text-yellow-600">{skillPoints}</span>
              </div>
            )}
            <div className="w-full flex flex-wrap border-b-2 border-stone-300 mb-4">
                {availableCategories.map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveTab(category)}
                        className={tabButtonClasses(activeTab === category)}
                    >
                        {category.replace('Habilidades ', '').replace(' de Classe', '').replace('Físicas', 'Fís.' ).replace('Mágicas', 'Mág.')}
                    </button>
                ))}
            </div>
            
            <div className="w-full">
                {activeTab && groupedSkills[activeTab] ? (
                    <ul className="space-y-3">
                        {groupedSkills[activeTab].map(renderSkill)}
                    </ul>
                ) : (
                    <p className="text-stone-500 text-center italic">Selecione uma categoria.</p>
                )}
            </div>
        </div>
      )}
    </Modal>
  );
};

export default SkillsScreen;