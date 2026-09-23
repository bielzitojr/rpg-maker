import React from 'react';

interface SettingSelectionScreenProps {
  onSelectSetting: (setting: string) => void;
  onBack: () => void;
}

const SettingSelectionScreen: React.FC<SettingSelectionScreenProps> = ({ onSelectSetting, onBack }) => {
  const settings = [
    "Medieval",
    "Steampunk",
    "Cyberpunk",
    "Cósmico",
    "Pós-apocalíptico",
    "Western",
    "Mitológico",
    "Subaquático"
  ];

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-6 animate-fade-in">
        <h2 className="text-2xl md:text-3xl text-amber-100 font-bold mb-4 font-title">Escolha a Ambientação</h2>
        <div className="grid grid-cols-2 gap-4 w-full">
            {settings.map((setting) => (
                <button
                key={setting}
                onClick={() => onSelectSetting(setting)}
                className="w-full px-4 py-4 bg-[#fdf6e3]/90 border border-stone-600 shadow-md text-stone-800 font-bold rounded-md hover:bg-amber-200/90 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-200 text-base md:text-lg font-title"
                >
                {setting}
                </button>
            ))}
        </div>
        <button
            onClick={onBack}
            className="mt-4 w-1/2 px-6 py-3 bg-stone-700/60 border border-stone-500 text-amber-50 font-bold rounded-lg hover:bg-stone-600/80 focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all duration-200 font-title"
        >
            Voltar
        </button>
    </div>
  );
};

export default SettingSelectionScreen;
