import React, { useState } from 'react';
import Modal from './Modal';
import type { EnemyInCombat } from '../services/geminiService';

interface MasterCombatPanelProps {
  enemies: EnemyInCombat[];
  onAddEnemy: (name: string, maxHealth: number) => void;
  onUpdateHealth: (id: string, newHealth: number) => void;
  onRemoveEnemy: (id: string) => void;
  onClose: () => void;
}

const MasterCombatPanel: React.FC<MasterCombatPanelProps> = ({ enemies, onAddEnemy, onUpdateHealth, onRemoveEnemy, onClose }) => {
    const [newName, setNewName] = useState('');
    const [newMaxHealth, setNewMaxHealth] = useState(10);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim() && newMaxHealth > 0) {
            onAddEnemy(newName.trim(), newMaxHealth);
            setNewName('');
            setNewMaxHealth(10);
        }
    };
    
    const handleHealthChange = (id: string, currentHealth: number, delta: number) => {
        onUpdateHealth(id, currentHealth + delta);
    };

    return (
        <Modal title="Painel de Combate do Mestre" onClose={onClose}>
            {enemies.length === 0 ? (
                <p className="text-stone-500 text-center italic">Nenhum inimigo em combate.</p>
            ) : (
                <ul className="space-y-3 mb-6 max-h-80 overflow-y-auto p-2">
                    {enemies.map((enemy) => (
                        <li key={enemy.id} className="p-3 bg-red-100/70 border border-red-300 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="font-bold text-red-900 font-title text-lg">{enemy.name}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleHealthChange(enemy.id, enemy.health, -1)} className="px-2 font-bold bg-red-300 rounded">-</button>
                                <input
                                    type="number"
                                    value={enemy.health}
                                    onChange={(e) => onUpdateHealth(enemy.id, parseInt(e.target.value, 10) || 0)}
                                    className="w-16 text-center font-bold bg-white border border-red-400 rounded"
                                />
                                <span>/ {enemy.maxHealth}</span>
                                <button onClick={() => handleHealthChange(enemy.id, enemy.health, 1)} className="px-2 font-bold bg-green-300 rounded">+</button>
                            </div>
                            <button onClick={() => onRemoveEnemy(enemy.id)} className="text-xs px-3 py-1 bg-red-700 text-white rounded hover:bg-red-600">Remover</button>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={handleAdd} className="mt-4 pt-4 border-t-2 border-stone-300 flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-grow">
                    <label htmlFor="enemyName" className="text-sm font-bold text-stone-700">Nome do Inimigo</label>
                    <input
                        id="enemyName"
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full mt-1 p-2 bg-stone-100 border border-stone-300 rounded"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="maxHealth" className="text-sm font-bold text-stone-700">Vida Máxima</label>
                    <input
                        id="maxHealth"
                        type="number"
                        value={newMaxHealth}
                        onChange={(e) => setNewMaxHealth(parseInt(e.target.value, 10) || 1)}
                        className="w-full sm:w-24 mt-1 p-2 bg-stone-100 border border-stone-300 rounded"
                        required
                    />
                </div>
                <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-amber-700 text-white font-bold rounded hover:bg-amber-600">Adicionar Inimigo</button>
            </form>
        </Modal>
    );
};

export default MasterCombatPanel;