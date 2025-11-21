import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingViewProps {
  message?: string;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full text-center p-8 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-violet-400 animate-spin relative z-10" />
      </div>
      <h3 className="text-2xl font-bold text-white mt-8 mb-2">Trasformazione in corso...</h3>
      <p className="text-slate-400 max-w-sm transition-all duration-300">
        {message || "L'IA sta analizzando i tuoi tratti e applicando il costume da eroe. Potrebbe volerci qualche secondo."}
      </p>
      <div className="mt-8 w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 animate-pulse-glow w-1/2 rounded-full animate-[shimmer_1.5s_infinite]"></div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};