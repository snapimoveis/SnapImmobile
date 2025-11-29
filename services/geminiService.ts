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

// --- REDIMENSIONAMENTO (Aumentado para 1920px para melhor textura em madeira/tecidos) ---
const resizeForAI = async (base64Str: string, maxWidth = 1920): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = maxWidth / img.width;
            if (scale >= 1) { resolve(base64Str); return; }
            
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Algoritmo 'high' preserva melhor as linhas retas da arquitetura
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Compressão leve (0.95) para não perder dados de cor nas sombras
                resolve(canvas.toDataURL('image/jpeg', 0.95)); 
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => resolve(base64Str);
    });
};

export const enhanceImage = async (base64Images: string | string[], profile: string = 'hp_hdr_interior'): Promise<string> => {
  if (!apiKey) throw new Error("Chave de API não configurada.");

  const rawImages = Array.isArray(base64Images) ? base64Images : [base64Images];
  
  // Processamento paralelo das imagens
  const processedImages = await Promise.all(rawImages.map(img => resizeForAI(img, 1920)));

  const contextMap: any = {
      'hp_hdr_interior': "CONTEXTO: Fotografia de Interiores de Alto Padrão.",
      'hp_hdr_exterior': "CONTEXTO: Fachada Arquitetónica Exterior.",
      'hp_hdr_window': "CONTEXTO: Interior com forte contraluz (Janela)."
  };

  const contextInstruction = contextMap[profile] || contextMap['hp_hdr_interior'];

  // PROMPT V12 (FOCADO EM "WARM COZY LOOK" & "HIGHLIGHT RECOVERY")
  const prompt = `
    ROLE: Professional Real Estate Retoucher (Architectural Digest Style).
    ${contextInstruction}
    
    INPUT: A bracketing stack of 3 images (Underexposed, Normal, Overexposed).
    
    CRITICAL INSTRUCTION ON COLOR: 
    The input images intentionally have a WARM/GOLDEN color grading applied. 
    DO NOT "CORRECT" THE WHITE BALANCE TO NEUTRAL GREY. 
    PRESERVE and ENHANCE the warm, cozy, welcoming atmosphere.

    TASKS:
    
    1. INTELLIGENT HDR MERGE (THE "LIGHTS" FIX):
       - Use the UNDEREXPOSED (Dark) image data to recover details in bright light fixtures (ceiling spots) and windows.
       - Apply a soft "Highlight Roll-off". Light sources should glow softly, NOT clip to pure white.
       - Eliminate any "hazy halo" around ceiling lights.
    
    2. TEXTURE RECONSTRUCTION (SHARPNESS):
       - The floor is wood. It must look tactile and sharp.
       - The furniture (sofa) is fabric. Enhance the micro-contrast of the fabric.
       - Output must be razor-sharp, simulating a tripod shot with a prime lens.
       
    3. ATMOSPHERE:
       - Style: "Hygge", inviting, warm.
       - Shadows: Lift the shadows slightly to show details in corners, but keep black points rich (don't make it flat).
    
    OUTPUT: A single, high-fidelity image in 4:3 aspect ratio. NO cropping.
  `;

  try {
    const imageParts = processedImages.map(img => ({
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
      
      return rawImages[Math.floor(rawImages.length / 2)]; 
  } catch (error) {
    console.error("[Snap AI] Erro:", error);
    return rawImages[Math.floor(rawImages.length / 2)];
  }
};

export const editImageWithPrompt = async (base64Image: string, prompt: string, mode: 'ERASE' | 'STAGE' = 'ERASE'): Promise<string> => {
    if (!apiKey) throw new Error("Chave de API não configurada.");
    const sys = mode === 'ERASE' 
        ? `TASK: REAL ESTATE INPAINTING. Remove objects marked by RED STROKES. Fill the empty space seamlessly matching the surrounding floor/wall texture.`
        : `TASK: VIRTUAL STAGING. Add realistic furniture: "${prompt}". Maintain perspective and lighting consistent with the room.`;

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
                parts: [{ inlineData: { data: cleanBase64(base64Image), mimeType: getMimeType(base64Image) } }, { text: "Gere uma descrição atraente de imobiliária para este ambiente (max 2 frases)." }]
            }
        });
        return response.text ? response.text.trim() : "Imóvel";
    } catch (e) { return "Imóvel"; }
};
