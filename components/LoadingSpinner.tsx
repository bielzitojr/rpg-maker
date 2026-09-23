import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-t-4 border-amber-400"></div>
        <p className="text-amber-200">O mundo está se materializando...</p>
    </div>
  );
};

export default LoadingSpinner;