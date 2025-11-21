import React from 'react';
import { Download, RefreshCcw, ArrowLeft } from 'lucide-react';

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
          className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} /> Indietro
        </button>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
          Missione Compiuta!
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Original */}
        <div className="flex flex-col gap-3">
          <div className="glass-panel p-2 rounded-2xl">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
               <img src={originalImage} alt="Originale" className="w-full h-full object-cover opacity-80" />
               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider border border-white/10">
                 Originale
               </div>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col gap-3">
          <div className="glass-panel p-2 rounded-2xl border-violet-500/30 shadow-2xl shadow-violet-900/20">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden group">
               <img src={resultImage} alt="Trasformata" className="w-full h-full object-cover" />
               <div className="absolute top-4 left-4 bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                 Eroe
               </div>
            </div>
          </div>
          
          <div className="flex gap-4 mt-4">
            <button 
              onClick={onDownload}
              className="flex-1 bg-white text-slate-900 hover:bg-slate-100 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download size={20} /> Scarica HD
            </button>
            <button 
              onClick={onReset}
              className="flex-1 bg-slate-800 text-white hover:bg-slate-700 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-600"
            >
              <RefreshCcw size={20} /> Riprova
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
