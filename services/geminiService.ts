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
  
  // DEBUG: Loggare (parzialmente) cosa vede l'app
  const keyStatus = apiKey 
    ? `Presente (inizia con ${apiKey.substring(0, 4)}...)` 
    : "ASSENTE/UNDEFINED";
    
  console.log(`[GeminiService] Controllo API Key: ${keyStatus}`);

  // Controllo rigoroso della Chiave API per debugging su Netlify
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(`CONFIGURAZIONE MANCANTE (Status: ${keyStatus}). L'app non trova la chiave API. Su Netlify, assicurati che la variabile sia 'API_KEY' (o 'VITE_API_KEY') e fai un REDEPLOY (Clear cache and deploy site) dopo averla inserita.`);
  }

  if (!apiKey.startsWith("AIza")) {
    throw new Error(`CHIAVE NON VALIDA (Status: ${keyStatus}). La chiave rilevata non sembra una chiave Google valida (deve iniziare con 'AIza'). Controlla di non aver incollato spazi extra o virgolette su Netlify.`);
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
  // Il piano free ha limiti di circa 15 RPM (Requests Per Minute).
  // Se facciamo retry troppo veloci, bruciamo la quota in un attimo.
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
      
      // Se arriviamo qui, il modello ha risposto ma senza immagine (forse solo testo o safety block)
      // Controlliamo se c'è un finishReason di sicurezza
      if (candidate?.finishReason === "SAFETY") {
        throw new Error("SAFETY_BLOCK");
      }
      
      throw new Error("Il modello ha risposto ma non ha generato l'immagine. Riprova.");

    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      // Gestione specifica errori
      const isQuotaError = error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.message?.includes("Resource has been exhausted");
      const isServerBusy = error.message?.includes("503") || error.message?.includes("Overloaded");
      const isSafety = error.message?.includes("SAFETY");

      if (isSafety) {
        throw new Error("L'immagine è stata bloccata dai filtri di sicurezza di Google. Prova con una foto diversa o una posa meno 'aggressiva'.");
      }

      if ((isQuotaError || isServerBusy) && attempt < MAX_RETRIES) {
        // Aumento i tempi di attesa: 8s, 15s, 22s per Netlify Free Tier
        const waitTime = 7000 * attempt; 
        const seconds = waitTime / 1000;

        const retryMsg = isQuotaError 
          ? `Traffico intenso (Limite Free Tier). Attendo ${seconds}s per ricaricare i token... (Tentativo ${attempt}/${MAX_RETRIES})`
          : `Server Google occupato. Riprovo tra ${seconds}s... (Tentativo ${attempt}/${MAX_RETRIES})`;
        
        if (onStatusUpdate) onStatusUpdate(retryMsg);
        await wait(waitTime);
        continue;
      } else {
        // Errore non recuperabile o tentativi finiti
        break;
      }
    }
  }

  console.error("Gemini API Error Final:", lastError);
  
  // Messaggi utente finali chiari
  let errorMessage = "Si è verificato un errore imprevisto.";
  const errString = lastError?.toString() || "";
  
  if (errString.includes("400")) {
    errorMessage = "Immagine non valida o corrotta. Prova a ricaricare la pagina o usare un'altra foto.";
  } else if (errString.includes("403")) {
    errorMessage = `Accesso Negato (403). La Chiave API (${keyStatus}) potrebbe non essere abilitata per Gemini API o il progetto Google Cloud ha problemi di fatturazione.`;
  } else if (errString.includes("429") || errString.includes("Resource has been exhausted")) {
    errorMessage = "Troppe richieste in poco tempo. Il piano gratuito di Google ha un limite. Attendi 1 minuto completo e riprova.";
  } else if (errString.includes("SAFETY") || errString.includes("blocked")) {
    errorMessage = "L'immagine generata violava le policy di sicurezza (violenza, contenuti espliciti, ecc). Riprova con un prompt più tranquillo.";
  } else if (errString.includes("API Key")) {
      errorMessage = "Problema Chiave API. Verifica le variabili d'ambiente su Netlify.";
  } else if (errString.includes("fetch failed")) {
      errorMessage = "Errore di connessione. Controlla la tua rete.";
  } else {
      errorMessage = `Errore API: ${lastError?.message || errString}`;
  }
  
  throw new Error(errorMessage);
};