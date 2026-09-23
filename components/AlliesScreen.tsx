import React from 'react';
import Modal from './Modal';
import type { Creature } from '../types';

interface AlliesScreenProps {
  allies: Creature[];
  onClose: () => void;
}

const AlliesScreen: React.FC<AlliesScreenProps> = ({ allies, onClose }) => {
  return (
    <Modal title="Aliados" onClose={onClose}>
      {allies.length === 0 ? (
        <p className="text-stone-500 text-center italic">Você está viajando sozinho.</p>
      ) : (
        <ul className="space-y-3">
          {allies.map((ally, index) => (
            <li key={index} className="p-3 bg-stone-200/50 rounded-lg flex items-start gap-4">
              {ally.image ? (
                  <img src={ally.image} alt={ally.name} className="w-16 h-16 rounded-md object-cover border-2 border-stone-400" />
              ) : (
                  <div className="w-16 h-16 rounded-md bg-stone-300 flex items-center justify-center text-center text-stone-500 text-xs p-1">Gerando Imagem...</div>
              )}
              <div className="flex-1">
                  <h3 className="font-bold text-stone-800 font-title text-xl">{ally.name}</h3>
                  <p className="text-stone-600">{ally.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default AlliesScreen;
