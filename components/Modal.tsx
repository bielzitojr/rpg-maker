import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="w-full max-w-2xl lg:max-w-4xl xl:max-w-6xl flex flex-col gap-6 bg-[#fdf6e3] text-stone-800 border-double border-8 border-stone-600 rounded-lg p-6 shadow-2xl shadow-black/50 max-h-[80vh]"
        onClick={(e) => e.stopPropagation()} // Impede o fechamento ao clicar dentro do modal
      >
        <div className="flex justify-between items-center border-b-2 border-stone-400 pb-2">
            <h2 id="modal-title" className="text-3xl md:text-4xl text-stone-900 font-bold font-title">{title}</h2>
            <button
                onClick={onClose}
                className="text-stone-600 hover:text-stone-900 font-bold text-2xl"
                aria-label="Fechar"
            >
                &times;
            </button>
        </div>
        <div className="overflow-y-auto">
            {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;