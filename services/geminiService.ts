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
  
  // TENTATIVO 1: Variabile d'ambiente (da Netlify/Build)
  let apiKey = process.env.API_KEY;

  // TENTATIVO 2: LocalStorage (Fallback d'emergenza per l'utente)
  if (!apiKey || apiKey.trim() === '') {
    const localKey = localStorage.getItem('HEROMORPH_API_KEY');
    if (localKey && localKey.trim().length > 10) {
      console.log('[GeminiService] Uso chiave di riserva da LocalStorage');
      apiKey = localKey;
    }
  }
  
  // Diagnostica per debug
  const keyStatus = apiKey && apiKey.length > 10 ? "PRESENTE" : "MANCANTE";
  console.log(`[GeminiService] Stato API Key: ${keyStatus}`);

  // 1. Controllo presenza chiave
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      `CHIAVE API MANCANTE. ` +
      `Il server non ha passato la chiave. ` +
      `SOLUZIONE RAPIDA: Apri la console (F12), scrivi "localStorage.setItem('HEROMORPH_API_KEY', 'LA_TUA_CHIAVE')" e ricarica.`
    );
  }

  // 2. Inizializza SDK
  const ai = new GoogleGenAI({ apiKey });

  // Extract MIME type and Clean Base64 data dynamically
  const mimeMatch = imageBase64.match(/^data:(image\/[\w+.-]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const cleanBase64 = imageBase64.replace(/^data:image\/[\w+.-]+;base64,/, '');

  const prompt = `
    Transform the person in this input image into a superhero character based on this description: "${heroPrompt}".
    
    CRITICAL INSTRUCTIONS FOR ULTRA-REALISM:
    1. **IDENTITY PRESERVATION**: You MUST preserve the exact facial features, skin tone, ethnicity, hair color, and eye color of the person in the source image. The face must remain recognizable as the original person.
    2. **NO MASK**: The superhero MUST NOT wear a mask, helmet, or cowl covering the face. The face must be completely uncovered and visible.
    3. **PHOTOREALISTIC STYLE**: Generate an ULTRA-REALISTIC, 8K RAW PHOTOGRAPH.
       - Ensure visible skin pores, texture, and subtle imperfections (do not smooth skin excessively).
       - Realistic lighting (volumetric, dramatic shadows, subsurface scattering).
       - High-quality textures for the costume (metal reflection, fabric weave, leather grain).
    4. **COMPOSITION**: Cinematic DSLR quality, sharp focus on the face, depth of field.
    5. **CONTEXT**: Place them in a fitting environment for the character described.
  `;

  const MAX_RETRIES = 3;
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

      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      if (candidate?.finishReason === "SAFETY") {
        throw new Error("SAFETY_BLOCK");
      }
      
      throw new Error("Il modello ha risposto ma non ha generato l'immagine (Nessun dato visivo).");

    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      const errStr = error.message || error.toString();
      const isQuota = errStr.includes("429") || errStr.includes("Too Many Requests");
      const isBusy = errStr.includes("503") || errStr.includes("Overloaded");
      const isSafety = errStr.includes("SAFETY") || errStr.includes("SAFETY_BLOCK");

      if (isSafety) {
        throw new Error("L'immagine è stata bloccata dai filtri di sicurezza (Safety). Prova con una foto diversa.");
      }

      if ((isQuota || isBusy) && attempt < MAX_RETRIES) {
        const waitTime = 3000 * Math.pow(2, attempt); 
        if (onStatusUpdate) onStatusUpdate(`Server occupato. Riprovo tra ${waitTime/1000}s...`);
        await wait(waitTime);
        continue;
      } else {
        break;
      }
    }
  }
  
  // Gestione Errori Finale
  const errString = lastError?.toString() || "";
  let errorMessage = "Si è verificato un errore imprevisto.";
  
  if (errString.includes("400")) {
    errorMessage = "Errore 400: Immagine non valida o corrotta.";
  } else if (errString.includes("403")) {
    errorMessage = `Errore 403 (Accesso Negato). La chiave API è valida ma rifiutata. Verifica di aver abilitato la "Generative Language API" nel tuo progetto Google Cloud.`;
  } else if (errString.includes("429")) {
    errorMessage = "Errore 429: Limite richieste superato. Attendi qualche minuto.";
  } else if (errString.includes("SAFETY")) {
    errorMessage = "Blocco Sicurezza: Immagine non generata per policy di sicurezza.";
  } else if (errString.includes("fetch")) {
    errorMessage = "Errore di rete. Controlla la connessione.";
  } else {
    errorMessage = lastError?.message || errString;
  }
  
  throw new Error(errorMessage);
};