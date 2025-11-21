import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @ts-ignore - process.cwd() esiste in Node ma TS a volte si lamenta in config vite
  const env = loadEnv(mode, process.cwd(), '');
  
  // Chiave fornita specificamente dall'utente per risolvere i problemi di deploy
  const USER_FALLBACK_KEY = 'AIzaSyAQlDBCCSIkxNglU02ADJD7AI8gP84KEns';
  
  // Cerca la chiave API in vari punti, usando la chiave utente come garanzia
  const apiKey = process.env.API_KEY || env.API_KEY || process.env.VITE_API_KEY || env.VITE_API_KEY || USER_FALLBACK_KEY;

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