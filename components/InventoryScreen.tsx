import React from 'react';
import Modal from './Modal';
import { Item, ItemType } from '../types';
// Fix: Corrected import path for icons.
import { WeaponIcon, ArmorIcon, ConsumableIcon, QuestIcon, KeyIcon, OtherIcon } from './icons/index';

interface InventoryScreenProps {
  items: Item[];
  onClose: () => void;
}

const getIconForType = (type: ItemType) => {
    const iconProps = { className: "w-6 h-6 text-stone-600" };
    switch(type) {
        case 'Arma': return <WeaponIcon {...iconProps} />;
        case 'Armadura': return <ArmorIcon {...iconProps} />;
        case 'Consumível': return <ConsumableIcon {...iconProps} />;
        case 'Missão': return <QuestIcon {...iconProps} />;
        case 'Chave': return <KeyIcon {...iconProps} />;
        default: return <OtherIcon {...iconProps} />;
    }
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ items, onClose }) => {
  const groupedItems = items.reduce((acc, item) => {
    const type = item.type || 'Outro';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {} as Record<ItemType, Item[]>);

  const categoryOrder: ItemType[] = ['Arma', 'Armadura', 'Consumível', 'Missão', 'Chave', 'Outro'];

  return (
    <Modal title="Inventário" onClose={onClose}>
      {items.length === 0 ? (
        <p className="text-stone-500 text-center italic">Sua bolsa está vazia.</p>
      ) : (
        <div className="space-y-6">
          {categoryOrder.map(category => {
            if (groupedItems[category] && groupedItems[category].length > 0) {
              return (
                <div key={category}>
                  <h2 className="text-2xl font-bold font-title text-stone-700 border-b-2 border-stone-400 pb-1 mb-3 flex items-center gap-3">
                    {getIconForType(category)}
                    {category}
                  </h2>
                  <ul className="space-y-3">
                    {groupedItems[category].map((item, index) => (
                      <li key={`${item.name}-${index}`} className="p-3 bg-stone-200/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-stone-800 font-title text-xl">{item.name}</h3>
                          {item.quantity > 1 && <span className="text-sm font-bold text-stone-600 bg-stone-300 px-2 py-0.5 rounded-full">x{item.quantity}</span>}
                        </div>
                        <p className="text-stone-600 text-sm mt-1">{item.description}</p>
                        {item.type === 'Arma' && item.damage && (
                          <p className="text-sm font-bold text-stone-800 mt-2">Dano: <span className="font-mono bg-stone-300 px-2 py-0.5 rounded">{item.damage}</span></p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </Modal>
  );
};

export default InventoryScreen;