import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica le variabili dal file .env (se in locale)
  // @ts-ignore - process.cwd() esiste in Node ma TS a volte si lamenta in config vite
  const env = loadEnv(mode, process.cwd(), '');
  
  // Cerca la chiave API in vari punti
  // process.env ha priorità per Netlify/CI
  const apiKey = process.env.API_KEY || env.API_KEY || process.env.VITE_API_KEY || env.VITE_API_KEY || '';

  // Log (visibile solo nella console di build di Netlify)
  if (!apiKey) {
    console.warn('⚠️ ATTENZIONE: Nessuna API_KEY trovata durante la build. L\'app richiederà una chiave manuale o fallirà.');
  } else {
    console.log('✅ API_KEY rilevata correttamente durante la build.');
  }

  return {
    plugins: [react()],
    define: {
      // Inietta la variabile nel codice frontend
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  }
})