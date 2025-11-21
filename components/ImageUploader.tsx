import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  selectedImage: string | null;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, selectedImage, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageSelected(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  if (selectedImage) {
    return (
      <div className="glass-panel rounded-2xl p-4 relative w-full max-w-md mx-auto animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClear}
          className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
        >
          <X size={20} />
        </button>
        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-700">
          <img src={selectedImage} alt="Uploaded" className="w-full h-full object-cover" />
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">Foto originale caricata</p>
      </div>
    );
  }

  return (
    <div 
      className={`glass-panel rounded-2xl p-8 w-full max-w-md mx-auto border-2 border-dashed transition-all duration-300 cursor-pointer group
        ${isDragging ? 'border-violet-500 bg-violet-500/10' : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800/50'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`p-4 rounded-full bg-slate-800 transition-transform duration-300 group-hover:scale-110 ${isDragging ? 'text-violet-400' : 'text-slate-400'}`}>
          {isDragging ? <ImageIcon size={48} /> : <Upload size={48} />}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Carica la tua foto</h3>
          <p className="text-sm text-slate-500 mt-1">Trascina o clicca per selezionare</p>
          <p className="text-xs text-slate-600 mt-2">Consigliato: Primo piano chiaro, buona luce</p>
        </div>
      </div>
    </div>
  );
};
