import { GoogleGenAI } from "@google/genai";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Transforms the user's image into a superhero version using Gemini 2.5 Flash Image.
 */
export const transformToSuperhero = async (
  imageBase64: string, 
  heroPrompt: string,
  onStatusUpdate?: (message: string) => void
): Promise<string> => {
  
  // La chiave viene iniettata da Vite (vedi vite.config.ts)
  // Se Vite ha fatto il suo dovere, questa variabile contiene la chiave (o quella dell'utente hardcoded)
  let apiKey = process.env.API_KEY;

  // Fallback estremo su LocalStorage se qualcosa va storto col build
  if (!apiKey || apiKey.trim() === '') {
    apiKey = localStorage.getItem('HEROMORPH_API_KEY') || '';
  }

  if (!apiKey) {
    throw new Error("Configurazione API incompleta. Impossibile contattare il server AI.");
  }

  // Inizializza SDK
  const ai = new GoogleGenAI({ apiKey });

  // Extract MIME type and Clean Base64 data dynamically
  const mimeMatch = imageBase64.match(/^data:(image\/[\w+.-]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const cleanBase64 = imageBase64.replace(/^data:image\/[\w+.-]+;base64,/, '');

  const prompt = `
    Transform the person in this input image into a superhero character based on this description: "${heroPrompt}".
    
    INSTRUCTIONS:
    1. Keep the person's facial identity recognizable.
    2. Create a high-quality, photorealistic image (8k, detailed texture).
    3. The character should be wearing the costume described.
    4. Ensure the face is visible (no full masks covering the face).
  `;

  const MAX_RETRIES = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            },
            {
              text: prompt
            }
          ]
        }
      });

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts;
      let textResponse = "";

      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
          if (part.text) {
            textResponse += part.text;
          }
        }
      }
      
      if (candidate?.finishReason === "SAFETY") {
        throw new Error("L'immagine è stata bloccata dai filtri di sicurezza (Safety). Prova una foto diversa o una descrizione meno aggressiva.");
      }

      if (textResponse) {
        // Se il modello risponde con testo invece di immagine, mostralo all'utente
        // Spesso dice "I cannot generate images of real people" se la policy è stretta
        throw new Error(`Il modello ha risposto: "${textResponse.substring(0, 150)}..."`);
      }
      
      throw new Error("Il modello non ha generato dati visivi.");

    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      // Non ritentare se è un errore di sicurezza o di richiesta non valida
      if (error.message.includes("Safety") || error.message.includes("Il modello ha risposto")) {
        break;
      }

      if (attempt < MAX_RETRIES) {
        const waitTime = 2000 * attempt;
        if (onStatusUpdate) onStatusUpdate(`Riprovo... (Tentativo ${attempt}/${MAX_RETRIES})`);
        await wait(waitTime);
      }
    }
  }
  
  // Gestione Errori Finale più chiara
  const errStr = lastError?.toString() || "";
  
  if (errStr.includes("403")) {
    throw new Error("Errore Chiave API (403). La chiave potrebbe non essere abilitata per questo servizio.");
  } else if (errStr.includes("429")) {
    throw new Error("Troppe richieste (429). Riprova tra un minuto.");
  }
  
  throw new Error(lastError?.message || "Errore durante la generazione.");
};