import React from 'react';
import { Sparkles, Search, Dice5 } from 'lucide-react';

interface HeroSelectorProps {
  customPrompt: string;
  onCustomChange: (text: string) => void;
}

const RANDOM_IDEAS = [
  "Cyborg futuristico con armatura al neon e occhio bionico",
  "Guerriero vichingo mistico con rune luminose sulla pelle",
  "Mago supremo con tunica stellata e aura arcana",
  "Pilota steampunk con occhialoni e giacca di pelle logora",
  "Elfo oscuro arciere con armatura di ossidiana",
  "Samurai cyberpunk in una Tokyo piovosa",
  "Divinità greca con armatura d'oro e fulmini",
  "Jedi rinnegato con spada laser rossa e cappuccio"
];

export const HeroSelector: React.FC<HeroSelectorProps> = ({ 
  customPrompt, 
  onCustomChange
}) => {

  const handleRandomIdea = () => {
    const random = RANDOM_IDEAS[Math.floor(Math.random() * RANDOM_IDEAS.length)];
    onCustomChange(random);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-in slide-in-from-bottom-4 duration-500 delay-150">
      
      <div className="glass-panel rounded-2xl p-8 border-t-4 border-t-violet-500 bg-slate-800/80 shadow-xl shadow-violet-500/10 transition-all duration-300 hover:shadow-violet-500/20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Identità Segreta</h3>
                <p className="text-slate-400 text-sm">Chi vuoi diventare oggi?</p>
              </div>
            </div>
            <button 
              onClick={handleRandomIdea}
              className="text-xs flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20 hover:bg-violet-500/20"
            >
              <Dice5 size={14} /> Sorprendimi
            </button>
          </div>
          
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
            </div>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder="Es: Iron Man futuristico, Cavaliere oscuro..."
              className="w-full bg-slate-900 border border-slate-700 text-white text-lg rounded-xl pl-12 pr-4 py-5 focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-slate-600 transition-all shadow-inner"
              autoFocus
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-1">Quick Tags:</span>
            {['Sci-Fi', 'Fantasy', 'Marvel Style', 'DC Style', 'Anime'].map((tag) => (
              <button
                key={tag}
                onClick={() => onCustomChange(customPrompt ? `${customPrompt}, ${tag}` : tag)}
                className="text-xs bg-slate-800 hover:bg-violet-600/30 hover:text-violet-300 text-slate-400 px-3 py-1 rounded-full border border-slate-700 transition-colors cursor-pointer active:scale-95"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};