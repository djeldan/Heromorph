import React from 'react';
import { Sparkles, Search } from 'lucide-react';

interface HeroSelectorProps {
  customPrompt: string;
  onCustomChange: (text: string) => void;
}

export const HeroSelector: React.FC<HeroSelectorProps> = ({ 
  customPrompt, 
  onCustomChange
}) => {

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-in slide-in-from-bottom-4 duration-500 delay-150">
      
      {/* Input Personalizzato - Unica opzione rimasta */}
      <div className="glass-panel rounded-2xl p-8 border-t-4 border-t-violet-500 bg-slate-800/80 shadow-xl shadow-violet-500/10 transition-all duration-300 hover:shadow-violet-500/20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Crea il tuo Eroe</h3>
              <p className="text-slate-400 text-sm">Descrivi come vuoi apparire</p>
            </div>
          </div>
          
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
            </div>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder="Es: Iron Man futuristico, Cavaliere medievale oscuro, Mago cyberpunk..."
              className="w-full bg-slate-900 border border-slate-700 text-white text-lg rounded-xl pl-12 pr-4 py-5 focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-slate-600 transition-all shadow-inner"
              autoFocus
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggerimenti:</span>
            {['Cyborg', 'Samurai', 'Jedi', 'Vichingo', 'Elfo'].map((tag) => (
              <button
                key={tag}
                onClick={() => onCustomChange(tag)}
                className="text-xs bg-slate-800 hover:bg-violet-600/30 hover:text-violet-300 text-slate-400 px-3 py-1 rounded-full border border-slate-700 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};