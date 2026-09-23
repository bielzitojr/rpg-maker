import React from 'react';
// Fix: Corrected import path for icons.
import { StatusIcon, MagicIcon, InventoryIcon, BestiaryIcon, AlliesIcon, MapIcon, SystemIcon, SettingsIcon, HelpIcon } from './icons/index';
import type { ModalType } from '../types';

interface HudProps {
    onHudButtonClick: (modal: ModalType) => void;
    onHelpClick: () => void;
    notifications: Record<string, number>;
    selectedGenre: string;
}

const Hud: React.FC<HudProps> = ({ onHudButtonClick, onHelpClick, notifications, selectedGenre }) => {
    const isIsekai = selectedGenre === 'Isekai';

    const hudItems = [
        { label: 'Status', Icon: StatusIcon, modal: 'Status' as ModalType, action: () => onHudButtonClick('Status') },
        { label: isIsekai ? 'Habilidades' : 'Magias', Icon: MagicIcon, modal: 'Habilidades' as ModalType, action: () => onHudButtonClick('Habilidades') },
        { label: 'Inventário', Icon: InventoryIcon, modal: 'Inventário' as ModalType, action: () => onHudButtonClick('Inventário') },
        { label: 'Bestiário', Icon: BestiaryIcon, modal: 'Bestiário' as ModalType, action: () => onHudButtonClick('Bestiário') },
        { label: 'Aliados', Icon: AlliesIcon, modal: 'Aliados' as ModalType, action: () => onHudButtonClick('Aliados') },
        { label: 'Mapa', Icon: MapIcon, modal: 'Mapa' as ModalType, action: () => onHudButtonClick('Mapa') },
        { label: 'Sistema', Icon: SystemIcon, modal: 'Sistema' as ModalType, action: () => onHudButtonClick('Sistema') },
        { label: 'Configurações', Icon: SettingsIcon, modal: 'Configurações' as ModalType, action: () => onHudButtonClick('Configurações') },
        { label: 'Ajuda', Icon: HelpIcon, modal: null, action: onHelpClick },
    ];

    return (
        <footer className="w-full mt-4">
            <div className="flex justify-center items-center flex-wrap gap-1 md:gap-3 p-2 bg-stone-900/50 border-t-2 border-amber-300/30 rounded-lg">
                {hudItems.map(({ label, Icon, modal, action }) => {
                    const count = modal ? notifications[modal] : 0;
                    return (
                        <div key={label} className="relative">
                            <button 
                                title={label}
                                onClick={action}
                                className="p-2 rounded-md text-amber-200/80 hover:bg-amber-200/10 hover:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors duration-200"
                                aria-label={label}
                            >
                                <Icon className="w-6 h-6 md:w-7 md:h-7" />
                            </button>
                            {count > 0 && (
                                <span className="absolute top-0 right-0 block h-5 w-5 -translate-y-1/2 translate-x-1/2 transform rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-stone-900">
                                    {count > 0 && count < 10 ? count : '9+'}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </footer>
    );
};

export default Hud;