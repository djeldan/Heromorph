import React from 'react';
import { Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full p-6 flex flex-col items-center justify-center text-center mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/20">
          <Zap className="w-8 h-8 text-white drop-shadow-sm" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          HeroMorph AI
        </h1>
      </div>
      <p className="text-slate-400 max-w-md text-sm md:text-base">
        Carica un selfie, scegli il tuo eroe e lascia che l'IA ti trasformi mantenendo la tua identità.
      </p>
    </header>
  );
};