import React, { useState } from 'react';
import Modal from './Modal';
import type { NotebookData } from '../types';

interface MasterNotebookModalProps {
  notebookData: NotebookData;
  onDataChange: (field: keyof NotebookData, value: string) => void;
  onClose: () => void;
}

type NotebookTab = 'notes' | 'npcs' | 'places' | 'quests';

const MasterNotebookModal: React.FC<MasterNotebookModalProps> = ({ notebookData, onDataChange, onClose }) => {
    const [activeTab, setActiveTab] = useState<NotebookTab>('notes');
    
    const tabs: { key: NotebookTab, label: string }[] = [
        { key: 'notes', label: 'Anotações' },
        { key: 'npcs', label: 'NPCs' },
        { key: 'places', label: 'Lugares' },
        { key: 'quests', label: 'Missões' }
    ];

    const tabButtonClasses = (isActive: boolean) => 
        `px-4 py-2 text-sm font-bold font-title transition-colors duration-200 rounded-t-lg ${
        isActive ? 'border-b-4 border-amber-500 text-amber-600 bg-stone-200/50' : 'text-stone-500 hover:text-stone-800'
        }`;
    
    const currentText = notebookData[activeTab];

    return (
        <Modal title="Caderno do Mestre" onClose={onClose}>
            <div className="w-full flex flex-wrap border-b-2 border-stone-300 mb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={tabButtonClasses(activeTab === tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <textarea
                value={currentText}
                onChange={(e) => onDataChange(activeTab, e.target.value)}
                placeholder={`Anote aqui seus segredos sobre ${tabs.find(t=>t.key === activeTab)?.label.toLowerCase()}...`}
                className="w-full h-96 bg-stone-100 p-3 rounded-md text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-body"
            />
        </Modal>
    );
};

export default MasterNotebookModal;