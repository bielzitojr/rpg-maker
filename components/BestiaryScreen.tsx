import React from 'react';
import Modal from './Modal';
import { Creature, KnownInfo } from '../types';
// Fix: Corrected import path for icons.
import { HealthIcon, WeaknessIcon, AbilitiesIcon, LootIcon, HabitatIcon, LoreIcon, MagicIcon } from './icons/index';

interface BestiaryScreenProps {
  creatures: Creature[];
  onClose: () => void;
}

const InfoSection: React.FC<{ title: string; Icon: React.FC<{className?: string}>; children: React.ReactNode; }> = ({ title, Icon, children }) => {
    if (!children || (Array.isArray(children) && children.length === 0)) return null;
    return (
        <div>
            <h4 className="font-bold font-title text-stone-700 flex items-center gap-2 mb-1">
                <Icon className="w-5 h-5" />
                {title}
            </h4>
            {children}
        </div>
    );
}

const KnownInfoDisplay: React.FC<{ info: KnownInfo }> = ({ info }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-stone-300">
        <InfoSection title="Vitalidade" Icon={HealthIcon}><p className="text-sm text-stone-600 pl-7">{info.health || '???'}</p></InfoSection>
        <InfoSection title="Energia Mágica" Icon={MagicIcon}><p className="text-sm text-stone-600 pl-7">{info.mana || '???'}</p></InfoSection>
        <InfoSection title="Fraquezas" Icon={WeaknessIcon}>
            <ul className="list-disc list-inside text-sm text-stone-600 pl-7">{info.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </InfoSection>
        <InfoSection title="Habilidades" Icon={AbilitiesIcon}>
            <ul className="list-disc list-inside text-sm text-stone-600 pl-7">{info.abilities?.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </InfoSection>
        <InfoSection title="Loot Potencial" Icon={LootIcon}>
            <ul className="list-disc list-inside text-sm text-stone-600 pl-7">{info.loot?.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </InfoSection>
        <InfoSection title="Habitat" Icon={HabitatIcon}><p className="text-sm text-stone-600 pl-7">{info.habitat || '???'}</p></InfoSection>
        <div className="sm:col-span-2">
            <InfoSection title="Lore" Icon={LoreIcon}><p className="text-sm text-stone-600 italic pl-7">{info.lore || '???'}</p></InfoSection>
        </div>
    </div>
);

const BestiaryScreen: React.FC<BestiaryScreenProps> = ({ creatures, onClose }) => {
  return (
    <Modal title="Bestiário" onClose={onClose}>
      {creatures.length === 0 ? (
        <p className="text-stone-500 text-center italic">Você ainda não encontrou nenhuma criatura.</p>
      ) : (
        <ul className="space-y-4">
          {creatures.map((creature, index) => (
            <li key={index} className="p-4 bg-stone-200/50 rounded-lg shadow-sm">
              <div className="flex items-start gap-4">
                  {creature.image ? (
                      <img src={creature.image} alt={creature.name} className="w-24 h-24 rounded-lg object-cover border-2 border-stone-400" />
                  ) : (
                      <div className="w-24 h-24 rounded-lg bg-stone-300 flex items-center justify-center text-center text-stone-500 text-xs p-2">Gerando Imagem...</div>
                  )}
                  <div className="flex-1">
                      <h3 className="font-bold text-stone-800 font-title text-2xl">{creature.name}</h3>
                      <p className="text-stone-600 text-sm italic mt-1">{creature.description}</p>
                  </div>
              </div>
              <KnownInfoDisplay info={creature.knownInfo} />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default BestiaryScreen;