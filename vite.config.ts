import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on mode (development/production)
  // process.cwd() is safe to use here in Node context of Vite config
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Expose env variables to the client securely
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
    }
  }
})