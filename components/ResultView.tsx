import React from 'react';
import { Download, RefreshCcw, ArrowLeft, Share2 } from 'lucide-react';

interface ResultViewProps {
  originalImage: string;
  resultImage: string;
  onReset: () => void;
  onDownload: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ originalImage, resultImage, onReset, onDownload }) => {
  return (
    <div className="w-full max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onReset}
          className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft size={20} /> Nuova Trasformazione
        </button>
        <div className="flex items-center gap-2">
             <span className="text-sm font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                Completato
             </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Original */}
        <div className="flex flex-col gap-3 order-2 md:order-1 opacity-80 hover:opacity-100 transition-opacity">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2">Originale</h3>
          <div className="glass-panel p-2 rounded-2xl">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800">
               <img src={originalImage} alt="Originale" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col gap-3 order-1 md:order-2">
          <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider ml-2 flex items-center gap-2">
            <Share2 size={14} /> Risultato Generato
          </h3>
          <div className="glass-panel p-2 rounded-2xl border-violet-500/50 shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)]">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden group bg-slate-900">
               <img src={resultImage} alt="Trasformata" className="w-full h-full object-cover" />
               
               {/* Overlay actions */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                  <p className="text-white text-sm font-medium">Clicca in basso per scaricare</p>
               </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button 
              onClick={onDownload}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-600/20"
            >
              <Download size={20} /> Scarica Immagine
            </button>
            <button 
              onClick={onReset}
              className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-600"
            >
              <RefreshCcw size={20} /> Riprova
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};