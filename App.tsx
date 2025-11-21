import React, { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { HeroSelector } from './components/HeroSelector';
import { ProcessingView } from './components/ProcessingView';
import { ResultView } from './components/ResultView';
import { transformToSuperhero } from './services/geminiService';
import { AppStatus } from './types';
import { Wand2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [image, setImage] = useState<string | null>(null);
  
  // State for selection
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelected = (base64: string) => {
    setImage(base64);
    setError(null);
  };

  const handleClearImage = () => {
    setImage(null);
    setCustomPrompt('');
    setStatus(AppStatus.IDLE);
    setError(null);
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
      setError("Per favore scrivi una descrizione per il tuo eroe.");
      return;
    }

    setStatus(AppStatus.PROCESSING);
    setError(null);

    try {
      // Always treat as custom prompt since the preset selector is removed
      const result = await transformToSuperhero(image, customPrompt, true);
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
    // Keep image and settings for easy retry
  };

  const isReady = image && customPrompt.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex flex-col">
      
      <Header />

      <main className="container mx-auto px-4 flex-grow pb-10">
        
        {status === AppStatus.PROCESSING && <ProcessingView />}

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
                      relative overflow-hidden group px-8 py-4 rounded-full font-bold text-lg tracking-wide transition-all duration-300
                      ${isReady
                        ? 'bg-white text-slate-900 hover:scale-105 shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)]' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                    `}
                  >
                    <span className="flex items-center gap-2 relative z-10">
                      <Wand2 className={isReady ? "animate-pulse" : ""} />
                      TRASFORMA ORA
                    </span>
                    {isReady && (
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2 animate-in slide-in-from-bottom-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="w-full py-8 flex justify-center items-center pb-12">
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
      </footer>
    </div>
  );
};

export default App;