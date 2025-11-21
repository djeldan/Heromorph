import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client
// NOTE: process.env.API_KEY is injected by the environment via Vite
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transforms the user's image into a superhero version using Gemini 2.5 Flash Image.
 * 
 * @param imageBase64 - The base64 string of the source image.
 * @param heroPrompt - The description of the superhero style.
 * @returns The base64 string of the generated image.
 */
export const transformToSuperhero = async (
  imageBase64: string, 
  heroPrompt: string
): Promise<string> => {
  
  // Extract MIME type and Clean Base64 data dynamically
  // Format expected: "data:image/jpeg;base64,/9j/4AAQSku..."
  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  
  // Remove the data URL prefix to get raw base64
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

  // Construct a prompt that emphasizes preserving identity and ULTRA-REALISM
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, // Dynamically set correct mime type (png/jpeg/webp)
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    // Iterate through parts to find the image
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts;

    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          // Gemini usually returns jpeg or png, but we can default to png for safety in display
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Nessuna immagine generata. Riprova con una descrizione diversa.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Better error message for user
    let errorMessage = "Si è verificato un errore durante la trasformazione.";
    if (error.message?.includes("400")) {
      errorMessage = "Errore nell'immagine inviata o nella richiesta. Riprova con un'altra foto.";
    } else if (error.message?.includes("429")) {
      errorMessage = "Troppe richieste. Attendi qualche secondo e riprova.";
    } else if (error.message?.includes("SAFETY")) {
      errorMessage = "L'immagine o la descrizione violano le policy di sicurezza. Riprova.";
    }
    
    throw new Error(errorMessage);
  }
};