import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica tutte le variabili d'ambiente disponibili
  // Il terzo parametro '' dice a Vite di caricare TUTTE le variabili, non solo quelle che iniziano con VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Strategia "Cerca ovunque":
  // Netlify o l'utente potrebbero averla chiamata in modi diversi.
  // Cerchiamo in ordine di probabilità.
  const foundKey = env.API_KEY || env.VITE_API_KEY || env.GOOGLE_API_KEY || env.GEMINI_API_KEY || '';

  // Log cruciale per il debug su Netlify (visibile nei log di Build su Netlify)
  if (foundKey) {
    console.log(`[Vite Build] SUCCESS: API Key found! (Starts with ${foundKey.substring(0, 5)}...)`);
  } else {
    console.warn(`[Vite Build] WARNING: No API Key found in environment variables. The app will likely fail at runtime.`);
    console.log('Available Env Vars keys:', Object.keys(env).filter(k => !k.startsWith('npm_')));
  }

  return {
    plugins: [react()],
    define: {
      // Iniettiamo la chiave trovata in modo che sia accessibile nel codice React come process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(foundKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
    }
  }
})