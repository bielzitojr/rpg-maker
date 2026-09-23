import React, { useState } from 'react';

interface UserInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  actionSuggestions?: string[];
  showActionSuggestions?: boolean;
  isPlayerTurn?: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onSubmit, isLoading, actionSuggestions = [], showActionSuggestions = false, isPlayerTurn = true }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    const numericValue = parseInt(trimmedPrompt, 10);

    // Verifica se a entrada é um número correspondente a uma sugestão
    if (
        !isNaN(numericValue) &&
        numericValue >= 1 &&
        numericValue <= actionSuggestions.length
    ) {
        onSubmit(actionSuggestions[numericValue - 1]);
        setPrompt('');
    } else if (trimmedPrompt) { // Se não for, usa o texto como está
        onSubmit(trimmedPrompt);
        setPrompt('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSubmit(suggestion);
    setPrompt('');
  };

  const isDisabled = isLoading || !isPlayerTurn;

  return (
    <div className="w-full">
        {showActionSuggestions && actionSuggestions.length > 0 && !isLoading && (
            <div className="flex flex-wrap justify-center gap-2 mb-2 animate-fade-in">
                {actionSuggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isDisabled}
                        className="px-3 py-1 text-sm bg-stone-700/80 text-amber-100/90 rounded-full hover:bg-stone-600/90 disabled:bg-stone-800 disabled:text-stone-500 transition-colors duration-200"
                    >
                        <span className="font-bold">{index + 1}.</span> {suggestion}
                    </button>
                ))}
            </div>
        )}
        <form onSubmit={handleSubmit} className="w-full">
        <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4 p-2 bg-stone-900/50 border-t-2 border-amber-300/30 rounded-lg">
            <span className="text-amber-200 font-bold hidden sm:block">&gt;</span>
            <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isPlayerTurn ? "O que você faz a seguir?" : "Aguarde seu turno..."}
            disabled={isDisabled}
            className="w-full flex-grow bg-transparent border-0 focus:ring-0 text-amber-50 placeholder-amber-200/50 text-base md:text-lg focus:outline-none px-2 py-1"
            />
            <button
            type="submit"
            disabled={isDisabled}
            className="w-full sm:w-auto px-6 py-2 bg-amber-800 text-amber-50 font-bold rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-stone-600 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
            {isLoading ? '...' : 'Enviar'}
            </button>
        </div>
        </form>
    </div>
  );
};

export default UserInput;
