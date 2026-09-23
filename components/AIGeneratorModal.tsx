import React, { useState } from 'react';
import Modal from './Modal';
// Fix: Corrected import path for icons.
import { CopyIcon } from './icons/index';

interface AIGeneratorModalProps {
  onGenerate: (type: 'npc_name' | 'tavern_name' | 'location_description' | 'plot_hook', context: string) => void;
  isLoading: boolean;
  result: string;
  onClose: () => void;
}

type GeneratorType = 'npc_name' | 'tavern_name' | 'location_description' | 'plot_hook';

const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ onGenerate, isLoading, result, onClose }) => {
    const [context, setContext] = useState('');
    const [copied, setCopied] = useState(false);
    
    const generators: { key: GeneratorType, label: string, placeholder: string }[] = [
        { key: 'npc_name', label: 'Nome de NPC', placeholder: 'Ex: um ferreiro anão mal-humorado' },
        { key: 'tavern_name', label: 'Nome de Taverna', placeholder: 'Ex: um bar suspeito no porto' },
        { key: 'location_description', label: 'Descrição de Ambiente', placeholder: 'Ex: uma clareira na floresta ao anoitecer' },
        { key: 'plot_hook', label: 'Gancho de Aventura', placeholder: 'Ex: uma pequena vila com um segredo sombrio' }
    ];

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal title="Geradores Rápidos com IA" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="context" className="block text-sm font-bold text-stone-700 mb-1">Contexto (Opcional)</label>
                    <input
                        id="context"
                        type="text"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Adicione um contexto para um resultado mais específico..."
                        className="w-full bg-stone-100 p-2 rounded-md border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {generators.map(gen => (
                        <button
                            key={gen.key}
                            onClick={() => onGenerate(gen.key, context || gen.placeholder)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-amber-700 text-white font-bold rounded hover:bg-amber-600 disabled:bg-stone-400"
                        >
                            {gen.label}
                        </button>
                    ))}
                </div>
                <div className="mt-4 p-3 bg-stone-200 rounded-md min-h-[150px] relative flex items-center justify-center">
                    {isLoading ? (
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-amber-600"></div>
                    ) : (
                        <>
                            <textarea
                                readOnly
                                value={result}
                                placeholder="O resultado da IA aparecerá aqui..."
                                className="w-full h-full bg-transparent text-stone-800 resize-none border-0 focus:ring-0"
                            />
                            {result && (
                                <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 rounded text-stone-500 hover:bg-stone-300" title="Copiar">
                                    <CopyIcon className="w-5 h-5" isCopied={copied} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default AIGeneratorModal;