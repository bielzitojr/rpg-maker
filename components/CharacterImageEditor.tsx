import React, { useState, useRef } from 'react';

interface CharacterImageEditorProps {
  image: string | null;
  isGeneratingImage: boolean;
  onGenerateImage: () => void;
  onImageChange: (base64Image: string) => void;
  onRemoveImage: () => void;
}

const CharacterImageEditor: React.FC<CharacterImageEditorProps> = ({
  image,
  isGeneratingImage,
  onGenerateImage,
  onImageChange,
  onRemoveImage,
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageChange(event.target?.result as string);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    e.preventDefault();
    setIsDragging(true);
    setStartDragPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    if (isDragging) {
      setPosition({ x: e.clientX - startDragPos.x, y: e.clientY - startDragPos.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <>
      <div className="w-48 h-48 bg-stone-900/50 rounded-lg border-2 border-amber-300/30 overflow-hidden relative cursor-grab" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {isGeneratingImage && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
            <p className="text-xs text-amber-200 mt-2">Gerando...</p>
          </div>
        )}
        {image ? (
          <img 
            src={image} 
            alt="Retrato" 
            className="w-full h-full object-cover"
            style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`, cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            draggable="false"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-amber-200/50 text-center p-2">
            <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-xs">Carregue ou gere um retrato</span>
          </div>
        )}
      </div>
      <div className="w-full space-y-2">
        <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-full" />
        <div className="flex flex-col gap-2">
          <button type="button" onClick={onGenerateImage} disabled={isGeneratingImage} className="w-full text-xs py-2 px-2 bg-purple-800/80 text-white rounded hover:bg-purple-700/90 disabled:bg-stone-500">Gerar Imagem com IA</button>
          <div className="flex gap-2">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 text-xs py-1 px-2 bg-blue-800/80 text-white rounded hover:bg-blue-700/90">Carregar</button>
            <button type="button" onClick={onRemoveImage} className="flex-1 text-xs py-1 px-2 bg-red-800/80 text-white rounded hover:bg-red-700/90">Remover</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CharacterImageEditor;
