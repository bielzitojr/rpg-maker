import React, { useState } from 'react';
import { updates } from '../utils/updateNotesData';

interface UpdateNotesScreenProps {
  onBack: () => void;
}

const UpdateNotesScreen: React.FC<UpdateNotesScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState(updates[0].version);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-6 animate-fade-in bg-[var(--surface-color)] text-[var(--surface-text-color)] border-double border-8 border-[var(--border-color)] rounded-lg p-6 shadow-2xl shadow-[var(--shadow-color)]/50">
        <h2 className="text-3xl md:text-4xl font-bold font-title">Notas de Atualização</h2>
        
        <div className="w-full flex flex-wrap border-b-2 border-[var(--border-color)]">
            {updates.map(update => (
                <button
                    key={update.version}
                    onClick={() => setActiveTab(update.version)}
                    className={`px-3 py-2 text-sm md:text-base font-bold font-title transition-colors duration-200 ${activeTab === update.version ? 'border-b-4 border-[var(--primary-accent-color)] text-[var(--primary-accent-color)]' : 'text-stone-400 hover:text-stone-700'}`}
                >
                    {update.version.split(' ')[0]}
                </button>
            ))}
        </div>
        
        <div className="w-full h-[50vh] overflow-y-auto pr-2 text-left">
            {updates.map(update => (
                activeTab === update.version && (
                    <div key={update.version} className="animate-fade-in">
                        <h3 className="text-xl font-bold font-title text-[var(--tertiary-accent-color)]">{update.version}</h3>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            {update.notes.map((note, index) => (
                                <li key={index}>{note}</li>
                            ))}
                        </ul>
                    </div>
                )
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

export default UpdateNotesScreen;