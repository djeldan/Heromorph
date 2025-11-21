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
  
  const apiKey = process.env.API_KEY;
  
  // DIAGNOSTICA AVANZATA PER L'UTENTE
  const keyLen = apiKey ? apiKey.length : 0;
  const keyStart = apiKey && keyLen > 4 ? apiKey.substring(0, 4) : 'N/A';
  const keyStatus = !apiKey ? "MANCANTE (Undefined)" : (apiKey.trim() === "" ? "VUOTA (Empty String)" : "PRESENTE");
  
  console.log(`[GeminiService] Key Status: ${keyStatus}, Start: ${keyStart}`);

  // 1. Controllo presenza chiave
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      `ERRORE CONFIGURAZIONE (Key: ${keyStatus}). ` +
      `L'app non vede la chiave API. ` +
      `AZIONE RICHIESTA: Vai su Netlify > Deploys > 'Trigger deploy' > 'Clear cache and deploy site'.`
    );
  }

  // 2. Controllo formato chiave (Le chiavi Google iniziano quasi sempre con AIza)
  if (!apiKey.startsWith("AIza")) {
    throw new Error(
      `CHIAVE NON VALIDA (Inizia con: '${keyStart}'). ` +
      `La chiave rilevata non sembra una chiave Google Gemini valida. Controlla di non aver incollato spazi vuoti su Netlify.`
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  // Extract MIME type and Clean Base64 data dynamically
  // Improved regex to handle more mime types
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
      
      throw new Error("Il modello ha risposto ma non ha generato l'immagine.");

    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      const isQuotaError = error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.message?.includes("exhausted");
      const isServerBusy = error.message?.includes("503") || error.message?.includes("Overloaded");
      const isSafety = error.message?.includes("SAFETY") || error.message?.includes("SAFETY_BLOCK");

      if (isSafety) {
        throw new Error("L'immagine è stata bloccata dai filtri di sicurezza (Safety). Prova con una foto diversa o un prompt meno aggressivo.");
      }

      if ((isQuotaError || isServerBusy) && attempt < MAX_RETRIES) {
        const waitTime = 5000 * Math.pow(2, attempt); // Exponential backoff: 10s, 20s...
        const seconds = waitTime / 1000;
        const retryMsg = `Server occupato o Limite Traffico. Riprovo tra ${seconds}s... (Tentativo ${attempt}/${MAX_RETRIES})`;
        
        if (onStatusUpdate) onStatusUpdate(retryMsg);
        await wait(waitTime);
        continue;
      } else {
        break;
      }
    }
  }
  
  // Traduzione errori finale
  const errString = lastError?.toString() || "";
  let errorMessage = "Si è verificato un errore imprevisto.";
  
  if (errString.includes("400")) {
    errorMessage = "Richiesta non valida (400). L'immagine potrebbe essere corrotta o il formato non supportato.";
  } else if (errString.includes("403")) {
    errorMessage = `Accesso Negato (403). La chiave API è presente (${keyStart}...) ma rifiutata da Google. Verifica di aver abilitato la 'Gemini API' nel Google Cloud Console e di avere il Billing attivo (necessario per alcuni modelli).`;
  } else if (errString.includes("429") || errString.includes("exhausted")) {
    errorMessage = "Limite richieste superato (429). Il piano gratuito ha raggiunto il limite. Attendi 60 secondi.";
  } else if (errString.includes("SAFETY")) {
    errorMessage = "Blocco Sicurezza: L'IA ha rifiutato di generare l'immagine per motivi di sicurezza.";
  } else if (errString.includes("ERRORE CONFIGURAZIONE") || errString.includes("CHIAVE NON VALIDA")) {
    errorMessage = lastError.message; 
  } else if (errString.includes("fetch") || errString.includes("Network")) {
    errorMessage = "Errore di connessione. Controlla la tua rete.";
  } else {
    errorMessage = `Errore Tecnico: ${lastError?.message || errString}`;
  }
  
  throw new Error(errorMessage);
};