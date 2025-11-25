
import { GoogleGenAI, Modality } from "@google/genai";

// Helper to strip base64 prefix if present
const cleanBase64 = (data: string) => {
  return data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

const getMimeType = (data: string) => {
    const match = data.match(/^data:(image\/\w+);base64,/);
    return match ? match[1] : 'image/jpeg';
}

// Helper to get API Key
const getApiKey = (): string => {
    // 1. Check LocalStorage (Manual Override by user if they want their own)
    const localKey = localStorage.getItem('snap_gemini_api_key');
    if (localKey) return localKey;

    // 2. System Default Key (Shared for all testers)
    // This key is baked into the app so it works for everyone immediately via Vercel.
    const systemKey = 'AIzaSyCPcdh9IHT3A2KCFuB4GFdd0skPFcg0FOM';
    
    // 3. Check Environment Variable (Optional override during build)
    return process.env.API_KEY || systemKey;
};

export const enhanceImage = async (base64Image: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
      throw new Error("Chave de API não configurada.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  // SYSTEM / BUILD (ENGINE HDR) — HP-HDR
  const prompt = `
    Tu és o motor HP-HDR (Highlight Priority High Dynamic Range) do Snap Immobile.
    O teu objetivo é preservar 100% dos highlights, mantendo textura, nitidez e contraste natural, sem estourar o branco em nenhum ponto da cena.
    
    Entrada: Uma imagem base representativa de uma pilha de exposições (bracketing).
    
    Segue estritamente este pipeline de fusão com IA:
    1. Highlight Mapping Inteligente: Comprime highlights mantendo textura. Elimina zonas queimadas.
    2. Shadow Recovery Natural: Recupera sombras (2–2.5 stops) sem ruído.
    3. Nitidez Real (Texture-Aware): Sem halos.
    4. Correções Automáticas: Perspetiva (linhas verticais), aberração cromática.
    
    Saída: Uma fotografia HDR imobiliária premium.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64(base64Image),
                mimeType: getMimeType(base64Image),
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
      });
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      return base64Image;
  } catch (error) {
    console.error("Enhance failed:", error);
    throw error;
  }
};

export const editImageWithPrompt = async (base64Image: string, prompt: string, mode: 'ERASE' | 'STAGE' = 'ERASE'): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    let systemInstruction = "";
    
    if (mode === 'ERASE') {
        // IMPROVED MAGIC ERASE PROMPT
        systemInstruction = `
            TASK: SEMANTIC INPAINTING & OBJECT REMOVAL
            INPUT: Image containing a TRANSLUCENT RED MASK overlay.
            
            INSTRUCTIONS:
            1. IDENTIFY the exact pixels covered by the RED overlay.
            2. REMOVE the object(s) completely beneath the red mask.
            3. INPAINT the void using context from the surrounding background (floor patterns, wall textures, baseboards).
            4. BLEND seamlessy.
            5. OUTPUT the clean image WITHOUT any red color remaining.
            
            User request: ${prompt}
        `;
    } else {
        // Virtual Staging
        systemInstruction = `
            TASK: VIRTUAL HOME STAGING
            INSTRUCTIONS:
            1. Analyze room perspective, vanishing points, and light sources.
            2. Insert photorealistic furniture as described.
            3. Ensure correct scale and contact shadows.
            User request: ${prompt}
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: cleanBase64(base64Image),
                    mimeType: getMimeType(base64Image),
                  },
                },
                {
                  text: systemInstruction,
                },
              ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
          });
          
          const parts = response.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                  return `data:image/png;base64,${part.inlineData.data}`;
              }
          }
          throw new Error("No image generated from edit");
    } catch (error) {
        console.error("Edit failed:", error);
        throw error;
    }
};

export const generateDescription = async (base64Image: string): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64Image), mimeType: getMimeType(base64Image) } },
                    { text: "Descreva esta divisão imobiliária numa frase curta e comercial em Português de Portugal." }
                ]
            }
        });
        return response.text || "Pré-visualização da Sala";
    } catch (e) {
        return "Pré-visualização da Sala";
    }
}
