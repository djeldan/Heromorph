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
  
  if (!apiKey) {
    throw new Error("API Key non trovata. Assicurati di aver configurato la variabile d'ambiente API_KEY.");
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

  // Aumentato a 5 tentativi con backoff esponenziale per gestire meglio i limiti di quota
  const MAX_RETRIES = 5;
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
      
      throw new Error("Nessuna immagine generata. Riprova con una descrizione diversa.");

    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      const isRetryable = error.message?.includes("429") || error.message?.includes("503");

      if (isRetryable && attempt < MAX_RETRIES) {
        // Exponential backoff: 2s, 4s, 8s, 16s... + jitter casuale
        const baseDelay = 1000 * Math.pow(2, attempt);
        const jitter = Math.random() * 1000;
        const delayTime = baseDelay + jitter;
        const seconds = Math.ceil(delayTime / 1000);

        const retryMsg = `Server molto occupato. Riprovo automaticamente tra ${seconds} secondi... (Tentativo ${attempt}/${MAX_RETRIES})`;
        console.log(retryMsg);
        
        if (onStatusUpdate) {
          onStatusUpdate(retryMsg);
        }
        
        await wait(delayTime);
        continue;
      } else {
        break;
      }
    }
  }

  console.error("Gemini API Error Final:", lastError);
  
  let errorMessage = "Si è verificato un errore durante la trasformazione.";
  
  if (lastError?.message?.includes("400")) {
    errorMessage = "Errore nell'immagine inviata o nella richiesta. Riprova con un'altra foto.";
  } else if (lastError?.message?.includes("429")) {
    errorMessage = "Il server è sovraccarico per troppe richieste. Attendi un minuto e riprova più tardi.";
  } else if (lastError?.message?.includes("SAFETY")) {
    errorMessage = "L'immagine o la descrizione violano le policy di sicurezza. Riprova.";
  } else if (lastError?.message?.includes("API Key")) {
      errorMessage = lastError.message;
  }
  
  throw new Error(errorMessage);
};