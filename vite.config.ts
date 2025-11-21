import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica tutte le variabili d'ambiente (sia VITE_ che quelle di sistema se possibile)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Cerchiamo la chiave in diverse possibili variabili comuni
  // Questo rende l'app più robusta se l'utente la chiama VITE_API_KEY o GOOGLE_API_KEY
  const foundKey = env.API_KEY || env.VITE_API_KEY || env.GOOGLE_API_KEY || env.GEMINI_API_KEY || '';

  console.log(`[Vite Config] API Key status during build: ${foundKey ? 'Found (starts with ' + foundKey.substring(0,4) + '...)' : 'MISSING'}`);

  return {
    plugins: [react()],
    define: {
      // Iniettiamo la chiave trovata nella variabile standard process.env.API_KEY
      // Così il resto del codice non deve cambiare
      'process.env.API_KEY': JSON.stringify(foundKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
    }
  }
})