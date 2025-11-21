import { GoogleGenAI } from "@google/genai";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Transforms the user's image into a superhero version using Gemini 2.5 Flash Image.
 * 
 * @param imageBase64 - The base64 string of the source image.
 * @param heroPrompt - The description of the superhero style.
 * @param onStatusUpdate - Optional callback to report retry status to UI.
 * @returns The base64 string of the generated image.
 */
export const transformToSuperhero = async (
  imageBase64: string, 
  heroPrompt: string,
  onStatusUpdate?: (message: string) => void
): Promise<string> => {
  
  const apiKey = process.env.API_KEY;
  
  // DEBUG: Loggare cosa vede l'app (sicuro, mostra solo i primi caratteri)
  const keyPreview = apiKey && apiKey.length > 5 
    ? `${apiKey.substring(0, 5)}...` 
    : (apiKey ? "TOO_SHORT" : "UNDEFINED");
    
  console.log(`[GeminiService] API Key Status: ${apiKey ? 'PRESENT' : 'MISSING'} (Value: ${keyPreview})`);

  // Controllo rigoroso della Chiave API per debugging su Netlify
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(`ERRORE CONFIGURAZIONE: L'app non trova la chiave API. Se l'hai inserita su Netlify, devi fare un nuovo 'Trigger Deploy' > 'Clear cache and deploy site' per applicarla.`);
  }

  if (!apiKey.startsWith("AIza")) {
    throw new Error(`CHIAVE NON VALIDA (Vedo: ${keyPreview}). La chiave rilevata non sembra valida (deve iniziare con 'AIza'). Controlla spazi vuoti su Netlify.`);
  }

  const ai = new GoogleGenAI({ apiKey });

  // Extract MIME type and Clean Base64 data dynamically
  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

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

  // Strategia Retry Conservativa per Piano Gratuito su Netlify
  // Il piano free ha limiti severi. Aumentiamo i tempi di attesa.
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
      
      // Se arriviamo qui, il modello ha risposto ma senza immagine
      if (candidate?.finishReason === "SAFETY") {
        throw new Error("SAFETY_BLOCK");
      }
      
      throw new Error("Il modello ha risposto ma non ha generato l'immagine. Riprova.");

    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      const isQuotaError = error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.message?.includes("Resource has been exhausted");
      const isServerBusy = error.message?.includes("503") || error.message?.includes("Overloaded");
      const isSafety = error.message?.includes("SAFETY");

      if (isSafety) {
        throw new Error("L'immagine è stata bloccata dai filtri di sicurezza (Safety). Prova con una foto diversa.");
      }

      if ((isQuotaError || isServerBusy) && attempt < MAX_RETRIES) {
        // Aumento drastico dei tempi di attesa per evitare il ban temporaneo
        const waitTime = 10000 * attempt; // 10s, 20s, 30s
        const seconds = waitTime / 1000;

        const retryMsg = `Server occupato o Limite Traffico. Attendo ${seconds} secondi... (Tentativo ${attempt}/${MAX_RETRIES})`;
        
        if (onStatusUpdate) onStatusUpdate(retryMsg);
        await wait(waitTime);
        continue;
      } else {
        break;
      }
    }
  }

  console.error("Gemini API Error Final:", lastError);
  
  // Traduzione errori per l'utente
  let errorMessage = "Si è verificato un errore imprevisto.";
  const errString = lastError?.toString() || "";
  
  if (errString.includes("400")) {
    errorMessage = "Richiesta non valida (400). L'immagine potrebbe essere troppo grande o corrotta.";
  } else if (errString.includes("403")) {
    errorMessage = `Accesso Negato (403). La chiave API è corretta (${keyPreview}) ma potrebbe non essere abilitata per questo modello o il progetto Google Cloud non ha il billing collegato (necessario per alcuni modelli).`;
  } else if (errString.includes("429") || errString.includes("exhausted")) {
    errorMessage = "Limite richieste superato (429). Il piano gratuito permette poche immagini al minuto. Attendi 60 secondi e riprova.";
  } else if (errString.includes("SAFETY")) {
    errorMessage = "Blocco Sicurezza: L'IA ha ritenuto l'immagine o il prompt inappropriati.";
  } else if (errString.includes("ERRORE CONFIGURAZIONE") || errString.includes("CHIAVE NON VALIDA")) {
    errorMessage = lastError.message; // Messaggio custom creato sopra
  } else if (errString.includes("fetch")) {
    errorMessage = "Errore di connessione. Controlla la rete.";
  } else {
    errorMessage = `Errore API: ${lastError?.message || errString}`;
  }
  
  throw new Error(errorMessage);
};