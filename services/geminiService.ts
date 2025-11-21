import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Transforms the user's image into a superhero version using Gemini 2.5 Flash Image.
 */
export const transformToSuperhero = async (
  imageBase64: string, 
  heroPrompt: string,
  onStatusUpdate?: (message: string) => void
): Promise<string> => {
  
  // API Key must be obtained exclusively from process.env.API_KEY
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Chiave API mancante. Assicurati che process.env.API_KEY sia impostato.");
  }

  // Inizializza SDK
  const ai = new GoogleGenAI({ apiKey });

  // Extract MIME type and Clean Base64 data dynamically
  const mimeMatch = imageBase64.match(/^data:(image\/[\w+.-]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const cleanBase64 = imageBase64.replace(/^data:image\/[\w+.-]+;base64,/, '');

  // Prompt ottimizzato per evitare blocchi "Identity"
  // Chiediamo di creare un personaggio "ispirato" alla posa, non di modificare la persona.
  const prompt = `
    You are a digital artist. Create a high-quality, photorealistic superhero image based on the input image.
    
    Target Character Description: "${heroPrompt}".
    
    Instructions:
    1. Use the input image ONLY as a reference for the POSE and COMPOSITION.
    2. The output must be a fictional character/superhero.
    3. Do not attempt to preserve the exact facial identity of the real person to avoid safety filters, but keep the general likeness/gender/expression.
    4. High detail, 8k resolution, cinematic lighting.
    5. Output ONLY the generated image.
  `;

  const MAX_RETRIES = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (onStatusUpdate) onStatusUpdate(attempt > 1 ? `Riprovo con parametri diversi... (Tentativo ${attempt})` : "Generazione artistica in corso...");
      
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
        },
        config: {
          // CRITICO: Disabilitiamo i filtri di sicurezza per permettere la trasformazione
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ],
          // Aumentiamo la creatività
          temperature: 0.9
        }
      });

      console.log("[Gemini] Response received");

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts;
      
      // Check for safety blocking explicit reason
      if (candidate?.finishReason === "SAFETY") {
         console.warn("[Gemini] Safety Block Triggered explicitly");
         throw new Error("Filtro Sicurezza Google: L'immagine è stata bloccata. Prova un prompt meno specifico o una posa diversa.");
      }

      let textResponse = "";

      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            console.log("[Gemini] Image data found successfully");
            return `data:image/png;base64,${part.inlineData.data}`;
          }
          if (part.text) {
            textResponse += part.text;
          }
        }
      }

      if (textResponse) {
        console.warn("[Gemini] Text only response:", textResponse);
        // Fallback intelligente: se il modello si rifiuta a parole
        if (textResponse.includes("cannot") || textResponse.includes("identity") || textResponse.includes("real person")) {
             throw new Error("Il modello si rifiuta di processare persone reali per policy di sicurezza. Riprova con un prompt diverso.");
        }
        throw new Error(`Il modello ha risposto con testo invece che con un'immagine: "${textResponse.substring(0, 100)}..."`);
      }
      
      throw new Error("Risposta vuota dal modello.");

    } catch (error: any) {
      lastError = error;
      console.error(`[Gemini] Attempt ${attempt} failed:`, error);

      // Se è un errore 400/403, è inutile riprovare
      const msg = error.message || "";
      if (msg.includes("400") || msg.includes("403") || msg.includes("API key")) {
        break;
      }

      if (attempt < MAX_RETRIES) {
        await wait(2000);
      }
    }
  }
  
  // Messaggi di errore user-friendly
  const errStr = lastError?.toString() || "";
  
  if (errStr.includes("403")) {
    throw new Error("Errore 403: La chiave API non è abilitata o è limitata. Verifica che 'Generative Language API' sia attivo su Google Cloud Console.");
  } else if (errStr.includes("400")) {
    throw new Error("Errore 400: L'immagine potrebbe essere corrotta o il formato non supportato.");
  } else if (errStr.includes("503") || errStr.includes("500")) {
    throw new Error("Errore Server Google (503): Il servizio è momentaneamente sovraccarico. Riprova tra 1 minuto.");
  }
  
  throw new Error(lastError?.message || "Non è stato possibile generare l'immagine. Riprova più tardi.");
};