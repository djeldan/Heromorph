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
      
      {/* Input Personalizzato */}
      <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-violet-500 bg-slate-800/80 transition-colors duration-300">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="text-violet-400 w-5 h-5" />
          <h3 className="text-lg font-medium text-slate-200">Descrivi il tuo Eroe</h3>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="Es: Iron Man, Batman, una guerriera amazzone in armatura d'oro..."
            className="w-full bg-slate-900/70 border border-slate-600 text-white text-lg rounded-xl pl-10 pr-4 py-4 focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-slate-500 transition-all"
          />
        </div>
        <p className="text-slate-400 text-sm mt-3 ml-1 leading-relaxed">
          Scrivi il nome di un supereroe o descrivi dettagliatamente il costume e i poteri per la tua trasformazione.
        </p>
      </div>
    </div>
  );
};