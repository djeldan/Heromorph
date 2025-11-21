import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica variabili da file .env (se presenti locale)
  // Cast process to any to avoid TS error: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Accedi direttamente alle variabili di processo (fondamentale per Netlify/CI)
  // Usiamo 'as any' per evitare errori TS se i tipi node non sono perfetti nell'ambiente
  const processEnv = process.env as any;

  // Cerca la chiave in tutti i posti possibili, dando priorità all'ambiente di processo (Netlify)
  const foundKey = 
    processEnv.API_KEY || env.API_KEY || 
    processEnv.VITE_API_KEY || env.VITE_API_KEY || 
    processEnv.GOOGLE_API_KEY || env.GOOGLE_API_KEY || 
    '';

  // Log di build per debug (visibile nei log di Netlify)
  if (foundKey && foundKey.length > 10) {
    console.log(`[Vite Build] ✅ API Key rilevata! Inizia con: ${foundKey.substring(0, 5)}...`);
  } else {
    console.error(`[Vite Build] ⚠️ ATTENZIONE: Nessuna API Key trovata durante la build! L'app non funzionerà.`);
    console.log('Variabili disponibili (keys):', Object.keys(processEnv).filter(k => !k.startsWith('npm_')));
  }

  return {
    plugins: [react()],
    define: {
      // Inietta la chiave nel codice client in modo sicuro
      'process.env.API_KEY': JSON.stringify(foundKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
    }
  }
})