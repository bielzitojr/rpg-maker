import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen animate-fade-in">
      <style>{`
        @keyframes fill-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .progress-bar-fill {
          animation: fill-bar 3s ease-out forwards;
        }
      `}</style>
      <h1 className="text-4xl md:text-6xl text-amber-100 mb-8 font-title" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
        RPG Maker
      </h1>
      <div className="w-full max-w-md bg-stone-800/50 border-2 border-amber-300/30 rounded-full p-1">
        <div className="h-4 bg-amber-500 rounded-full progress-bar-fill"></div>
      </div>
      <p className="text-amber-100 mt-4 text-lg">Forjando os Reinos...</p>
    </div>
  );
};

export default LoadingScreen;