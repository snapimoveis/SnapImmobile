import { GoogleGenAI } from "@google/genai";
import { cleanBase64, getMimeType } from "../utils/helpers";

const getApiKey = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    // @ts-ignore
    return process.env.API_KEY;
  }
  return "";
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

export const enhanceImage = async (base64Images: string | string[], profile: string = 'hp_hdr_interior'): Promise<string> => {
  if (!apiKey) throw new Error("Chave de API não configurada.");

  // Força array
  const images = Array.isArray(base64Images) ? base64Images : [base64Images];

  // Instruções de contexto
  const contextMap: any = {
      'hp_hdr_interior': "Interior Property Photography.",
      'hp_hdr_exterior': "Exterior Property Photography.",
      'hp_hdr_window': "Interior with Window Glare."
  };
  const contextInstruction = contextMap[profile] || contextMap['hp_hdr_interior'];

  // PROMPT V4: FUSÃO TÉCNICA LIMPA (3-Imagens)
  // Menos "agressivo" na linguagem, mais focado na tarefa técnica para evitar rejeição da IA.
  const prompt = `
    TASK: HDR MERGE & ENHANCE.
    CONTEXT: ${contextInstruction}
    
    INPUT: You are receiving 3 bracketed exposures:
    1. Underexposed (Dark) - Contains window details.
    2. Normal Exposure - Base colors.
    3. Overexposed (Bright) - Contains shadow details.

    INSTRUCTIONS:
    1. MERGE these 3 images into a single High Dynamic Range (HDR) image.
    2. WINDOWS: Use the dark exposure to fix "blown out" white windows. I want to see clearly through the glass.
    3. INTERIOR: Use the bright exposure to brighten the room walls and floor significantly (+1.0 EV brightness).
    4. TEXTURE: Apply "Structure" filter to the floor to enhance wood/tile detail.
    5. COLOR: Ensure white walls look white (remove yellow color cast).

    OUTPUT: Return ONLY the final merged image in 4:3 aspect ratio.
  `;

  try {
    const imageParts = images.map(img => ({
        inlineData: { data: cleanBase64(img), mimeType: getMimeType(img) }
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [
            ...imageParts,
            { text: prompt },
          ],
        },
        config: { responseModalities: ['IMAGE'] },
      });
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      
      console.warn("IA falhou em gerar imagem, retornando original.");
      // Fallback para a imagem do meio se falhar
      return images[Math.floor(images.length / 2)];
  } catch (error) {
    console.error("[Snap AI] Falha na Fusão HDR:", error);
    // Em caso de erro, não crasha a app, devolve a original
    return images[Math.floor(images.length / 2)];
  }
};

// ... (editImageWithPrompt e generateDescription mantêm-se iguais) ...
export const editImageWithPrompt = async (base64Image: string, prompt: string, mode: 'ERASE' | 'STAGE' = 'ERASE'): Promise<string> => {
    if (!apiKey) throw new Error("Chave de API não configurada.");
    const sys = mode === 'ERASE' 
        ? `TASK: INPAINTING. Remove objects marked by RED STROKES. Input image HAS red strokes on it. Output: Clean image without strokes.`
        : `TASK: VIRTUAL STAGING. Add: "${prompt}". Maintain aspect ratio.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
              parts: [
                { inlineData: { data: cleanBase64(base64Image), mimeType: getMimeType(base64Image) } },
                { text: sys + " " + prompt },
              ],
            },
            config: { responseModalities: ['IMAGE'] },
          });
          const parts = response.candidates?.[0]?.content?.parts || [];
          const imagePart = parts.find(p => p.inlineData && p.inlineData.data);
          if (imagePart && imagePart.inlineData) return `data:image/png;base64,${imagePart.inlineData.data}`;
          throw new Error("Erro na IA");
    } catch (error: any) { throw error; }
};

export const generateDescription = async (base64Image: string): Promise<string> => {
    if (!apiKey) return "Imóvel";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [{ inlineData: { data: cleanBase64(base64Image), mimeType: getMimeType(base64Image) } }, { text: "Descrição curta do imóvel." }]
            }
        });
        return response.text ? response.text.trim() : "Imóvel";
    } catch (e) { return "Imóvel"; }
};
