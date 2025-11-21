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
  
  // HARDCODED KEY: Soluzione definitiva per bypassare problemi di build/deploy
  const apiKey = 'AIzaSyAQlDBCCSIkxNglU02ADJD7AI8gP84KEns';

  if (!apiKey) {
    throw new Error("Chiave API mancante.");
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
    1. Keep the person's facial identity recognizable (this is a fictional character creation task).
    2. Create a high-quality, photorealistic image (8k, detailed texture).
    3. The character should be wearing the costume described.
    4. Ensure the face is visible.
    5. Output ONLY the generated image.
  `;

  const MAX_RETRIES = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (onStatusUpdate) onStatusUpdate(attempt > 1 ? `Riprovo... (Tentativo ${attempt})` : "Generazione in corso...");
      
      console.log(`[Gemini] Sending request, attempt ${attempt}...`);

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

      console.log("[Gemini] Response received");

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts;
      let textResponse = "";

      // Check for safety blocking
      if (candidate?.finishReason === "SAFETY") {
        throw new Error("Safety Block: L'immagine è stata bloccata dai filtri di sicurezza. Prova con una foto diversa (es. meno pelle esposta) o un prompt più semplice.");
      }

      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            console.log("[Gemini] Image data found");
            return `data:image/png;base64,${part.inlineData.data}`;
          }
          if (part.text) {
            textResponse += part.text;
          }
        }
      }

      if (textResponse) {
        console.warn("[Gemini] Text only response:", textResponse);
        // Se il modello risponde con testo invece di immagine
        throw new Error(`Il modello non ha generato un'immagine, ma ha detto: "${textResponse.substring(0, 200)}..."`);
      }
      
      throw new Error("Il modello non ha restituito né un'immagine né un errore chiaro.");

    } catch (error: any) {
      lastError = error;
      console.error(`[Gemini] Attempt ${attempt} failed:`, error);

      // Non ritentare se è un errore di sicurezza o di richiesta non valida
      const msg = error.message || "";
      if (msg.includes("Safety") || msg.includes("400") || msg.includes("403")) {
        break;
      }

      if (attempt < MAX_RETRIES) {
        const waitTime = 2000 * attempt;
        await wait(waitTime);
      }
    }
  }
  
  // Gestione Errori Finale più chiara
  const errStr = lastError?.toString() || "";
  
  if (errStr.includes("403")) {
    throw new Error("Errore Chiave API (403). La chiave potrebbe essere errata o il servizio Gemini API non abilitato su Google Cloud.");
  } else if (errStr.includes("429")) {
    throw new Error("Troppe richieste (429). Riprova tra un minuto.");
  } else if (errStr.includes("503")) {
    throw new Error("Servizio sovraccarico (503). Riprova tra poco.");
  }
  
  throw new Error(lastError?.message || "Errore sconosciuto durante la generazione.");
};