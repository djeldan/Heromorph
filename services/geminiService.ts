import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client
// NOTE: process.env.API_KEY is injected by the environment
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
  heroPrompt: string,
  isCustom: boolean = false
): Promise<string> => {
  
  // Remove header if present (e.g., "data:image/jpeg;base64,")
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  // Construct a prompt that emphasizes preserving identity and ULTRA-REALISM
  const prompt = `
    Transform the person in this input image into a superhero: ${heroPrompt}.
    
    CRITICAL INSTRUCTIONS FOR ULTRA-REALISM:
    1. **IDENTITY PRESERVATION**: You MUST preserve the exact facial features, skin tone, ethnicity, hair color, and eye color of the person in the source image. The face must remain recognizable as the original person.
    2. **NO MASK**: The superhero MUST NOT wear a mask, helmet, or cowl covering the face. The face must be completely uncovered and visible. If the character usually wears a mask, generate the unmasked version.
    3. **PHOTOREALISTIC STYLE**: Generate an ULTRA-REALISTIC, 8K RAW PHOTOGRAPH.
       - Ensure visible skin pores, texture, and subtle imperfections (do not smooth skin).
       - Realistic lighting (volumetric, dramatic shadows, subsurface scattering).
       - High-quality textures for the costume (metal reflection, fabric weave, leather grain).
    4. **COMPOSITION**: Cinematic DSLR quality, sharp focus on the face, depth of field.
    5. **TRANSFORMATION**: Change the clothing to match the superhero description and place them in a fitting realistic environment.
    
    ${isCustom ? "Follow the user's custom description precisely while strictly maintaining the photorealistic style." : ""}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
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
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Nessuna immagine generata. Riprova con un'altra foto o descrizione.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};