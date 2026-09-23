import React from 'react';
import Modal from './Modal';
// Fix: Corrected import path for icons.
import { StrengthIcon, DexterityIcon, ConstitutionIcon, IntelligenceIcon, WisdomIcon, CharismaIcon } from './icons/index';
import type { CharacterData, Status } from '../types';


interface StatusScreenProps {
  character: CharacterData;
  status: Status;
  onClose: () => void;
}

const StatBar: React.FC<{ value: number; maxValue: number; color: string; label: string }> = ({ value, maxValue, color, label }) => (
    <div>
        <div className="flex justify-between text-sm font-bold text-stone-700">
            <span>{label}</span>
            <span>{value} / {maxValue}</span>
        </div>
        <div className="w-full bg-stone-300 rounded-full h-5 border border-stone-400 overflow-hidden">
            <div 
                className={`${color} h-full rounded-full transition-all duration-500`} 
                style={{ width: `${(value / maxValue) * 100}%` }}
            ></div>
        </div>
    </div>
);

const AttributeDisplay: React.FC<{ label: string; value: number; Icon: React.FC<{className?: string}> }> = ({ label, value, Icon }) => (
    <div className="flex flex-col items-center justify-center bg-stone-200/50 p-2 rounded-lg">
        <Icon className="w-8 h-8 text-stone-600 mb-1" />
        <div className="text-sm font-bold font-title text-stone-700">{label}</div>
        <div className="text-3xl font-semibold text-stone-900">{value}</div>
    </div>
);


const StatusScreen: React.FC<StatusScreenProps> = ({ character, status, onClose }) => {
  return (
    <Modal title={character.characterName} onClose={onClose}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna Esquerda - Identidade */}
            <div className="md:col-span-1 flex flex-col items-center justify-start gap-4">
                 {character.image ? (
                    <img src={character.image} alt="Retrato" className="w-48 h-48 object-cover rounded-lg border-4 border-stone-500 shadow-lg" />
                ) : (
                    <div className="w-48 h-48 bg-stone-200 rounded-lg border-4 border-stone-500 flex items-center justify-center text-stone-500">
                        Sem Retrato
                    </div>
                )}
                <div className="text-center">
                    <p className="text-stone-600 text-lg">{character.race} {character.class}</p>
                    <p className="text-xs text-stone-500 mt-1">(Jogado por: {character.playerName})</p>
                </div>
                 <div className="w-full text-center">
                    <StatBar value={status.experience} maxValue={status.maxExperience} color="bg-yellow-500" label={`Nível ${status.level}`} />
                    <div className="mt-2 p-1 bg-stone-200/50 rounded-md">
                        <span className="font-title font-bold text-stone-700">Pontos de Habilidade: </span>
                        <span className="text-xl font-bold text-yellow-600">{status.skillPoints}</span>
                    </div>
                 </div>
                 <p className="text-stone-700 italic text-center p-3 bg-stone-200/50 rounded-md w-full">"{status.description}"</p>
            </div>

            {/* Coluna Direita - Stats */}
            <div className="md:col-span-2 space-y-6">
                <div className="space-y-3 p-3 bg-stone-200/40 rounded-lg">
                    <h3 className="font-title font-bold text-stone-700 text-lg border-b border-stone-400 pb-1 mb-2">Recursos</h3>
                    <StatBar value={status.health} maxValue={status.maxHealth} color="bg-red-600" label="Vida" />
                    <StatBar value={status.energy} maxValue={status.maxEnergy} color="bg-green-500" label="Energia" />
                    <StatBar value={status.mana} maxValue={status.maxMana} color="bg-blue-600" label="Mana" />
                    {status.maxSanity > 0 && (
                       <StatBar value={status.sanity} maxValue={status.maxSanity} color="bg-purple-600" label="Sanidade" />
                    )}
                </div>
                
                <div className="p-3 bg-stone-200/40 rounded-lg">
                    <h3 className="font-title font-bold text-stone-700 text-lg border-b border-stone-400 pb-1 mb-2">Atributos</h3>
                    <div className="grid grid-cols-3 gap-3">
                       <AttributeDisplay label="Força" value={status.strength} Icon={StrengthIcon} />
                       <AttributeDisplay label="Destreza" value={status.dexterity} Icon={DexterityIcon} />
                       <AttributeDisplay label="Constituição" value={status.constitution} Icon={ConstitutionIcon} />
                       <AttributeDisplay label="Inteligência" value={status.intelligence} Icon={IntelligenceIcon} />
                       <AttributeDisplay label="Sabedoria" value={status.wisdom} Icon={WisdomIcon} />
                       <AttributeDisplay label="Carisma" value={status.charisma} Icon={CharismaIcon} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-stone-200/40 rounded-lg">
                        <h4 className="font-title font-bold text-stone-700 text-sm">Título</h4>
                        <p className="text-stone-800 font-semibold">{status.title || "---"}</p>
                    </div>
                     <div className="p-2 bg-stone-200/40 rounded-lg">
                        <h4 className="font-title font-bold text-stone-700 text-sm">Fama</h4>
                        <p className="text-stone-800 font-semibold">{status.fame || "---"}</p>
                    </div>
                     <div className="p-2 bg-stone-200/40 rounded-lg">
                        <h4 className="font-title font-bold text-stone-700 text-sm">Ouro</h4>
                        <p className="text-stone-800 font-semibold">{status.gold}</p>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
  );
};

export default StatusScreen;