import React, { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { HeroSelector } from './components/HeroSelector';
import { ProcessingView } from './components/ProcessingView';
import { ResultView } from './components/ResultView';
import { transformToSuperhero } from './services/geminiService';
import { AppStatus } from './types';
import { Wand2, AlertCircle, Info, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [image, setImage] = useState<string | null>(null);
  
  // State for selection - Solo custom prompt ora
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  const handleImageSelected = (base64: string) => {
    setImage(base64);
    setError(null);
  };

  const handleClearImage = () => {
    setImage(null);
    setCustomPrompt('');
    setStatus(AppStatus.IDLE);
    setError(null);
    setLoadingMessage("");
  };

  const handleCustomChange = (text: string) => {
    setCustomPrompt(text);
    setError(null);
  };

  const handleTransform = async () => {
    if (!image) {
      setError("Per favore carica un'immagine prima.");
      return;
    }
    
    if (!customPrompt.trim()) {
      setError("Per favore descrivi il tuo eroe.");
      return;
    }

    setStatus(AppStatus.PROCESSING);
    setLoadingMessage("L'IA sta analizzando i tuoi tratti e applicando il costume da eroe...");
    setError(null);

    try {
      // Passiamo l'immagine, il prompt e una callback per aggiornare lo stato in caso di retry
      const result = await transformToSuperhero(image, customPrompt, (msg) => {
        setLoadingMessage(msg);
      });
      
      setResultImage(result);
      setStatus(AppStatus.SUCCESS);

    } catch (err: any) {
      setStatus(AppStatus.ERROR);
      setError(err.message || "Si è verificato un errore durante la trasformazione.");
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'hero-morph-result.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setResultImage(null);
    setLoadingMessage("");
    // Manteniamo l'immagine caricata per facilitare nuovi tentativi
  };

  const isReady = image && customPrompt.trim().length > 2;

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex flex-col">
      
      <Header />

      <main className="container mx-auto px-4 flex-grow pb-10">
        
        {status === AppStatus.PROCESSING && (
          <ProcessingView message={loadingMessage} />
        )}

        {status === AppStatus.SUCCESS && resultImage && image && (
          <ResultView 
            originalImage={image} 
            resultImage={resultImage} 
            onReset={handleReset}
            onDownload={handleDownload}
          />
        )}

        {(status === AppStatus.IDLE || status === AppStatus.ERROR) && (
          <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="w-full">
              <ImageUploader 
                onImageSelected={handleImageSelected} 
                selectedImage={image} 
                onClear={handleClearImage}
              />
            </div>

            {image && (
              <div className="w-full flex flex-col items-center">
                <HeroSelector 
                  customPrompt={customPrompt}
                  onCustomChange={handleCustomChange}
                />
                
                <div className="flex justify-center mt-10">
                  <button
                    onClick={handleTransform}
                    disabled={!isReady}
                    className={`
                      relative overflow-hidden group px-10 py-5 rounded-full font-bold text-lg tracking-wide transition-all duration-300 shadow-2xl
                      ${isReady
                        ? 'bg-white text-slate-900 hover:scale-105 shadow-violet-500/50' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}
                    `}
                  >
                    <span className="flex items-center gap-3 relative z-10">
                      <Wand2 className={`w-6 h-6 ${isReady ? "animate-pulse text-violet-600" : ""}`} />
                      GENERA EROE
                    </span>
                    {isReady && (
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-200 via-white to-violet-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay"></div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-8 w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-2">
                <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-2 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-red-400 font-semibold">
                     <AlertCircle size={20} />
                     <span>Errore Generazione</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed pl-8">
                    {error}
                  </p>
                  
                  {(error.includes("CONFIGURAZIONE") || error.includes("CHIAVE") || error.includes("403")) && (
                    <div className="mt-3 pl-8 flex flex-wrap gap-3">
                        <a 
                          href="https://app.netlify.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 transition-colors"
                        >
                          <Settings size={14} /> Vai su Netlify
                        </a>
                        <div className="text-xs text-slate-400 flex items-center">
                           Importante: Dopo aver salvato la Key, fai "Trigger Deploy" {'>'} "Clear cache".
                        </div>
                    </div>
                  )}
                </div>
                
                {(error.includes("Limite") || error.includes("Traffico")) && (
                   <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 flex items-start gap-3 text-xs max-w-2xl mx-auto">
                      <Info size={16} className="flex-shrink-0 mt-0.5" />
                      <p>
                        <strong>Consiglio Pro:</strong> Stai usando il piano gratuito. Aspetta un minuto completo prima di riprovare per ricaricare la tua quota.
                      </p>
                   </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="w-full py-8 flex justify-center items-center pb-12 text-slate-600 text-sm">
        <div className="flex flex-col items-center gap-2">
          <a 
            href="https://www.instagram.com/djeldan_official/"
            target="_blank"
            rel="noopener noreferrer" 
            className="relative group cursor-pointer" 
            title="Visita il profilo Instagram di DDR"
          >
            <div className="absolute -inset-4 bg-violet-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
            <img 
              src="https://i.postimg.cc/HVYg5MNw/Logo-DDR.png"
              alt="Logo-DDR" 
              className="h-12 md:h-14 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300 filter hover:brightness-110"
            />
          </a>
          <span className="opacity-50 mt-2">Powered by Gemini 2.5 Flash</span>
        </div>
      </footer>
    </div>
  );
};

export default App;