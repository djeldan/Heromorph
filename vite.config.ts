import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica le variabili d'ambiente (incluso quelle di Netlify)
  // Fix: Cast process to any to avoid TS error regarding cwd() method
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Sostituisce process.env.API_KEY con il valore reale durante la build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})