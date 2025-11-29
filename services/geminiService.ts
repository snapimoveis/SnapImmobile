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

// --- FUNÇÃO AUXILIAR DE REDIMENSIONAMENTO (Max 1600px para nitidez) ---
const resizeForAI = async (base64Str: string, maxWidth = 1600): Promise<string> => {
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
                // Algoritmo de suavização melhorado para downscaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.92)); 
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
  
  // Usamos 1600px para dar mais dados de textura à IA
  const processedImages = await Promise.all(rawImages.map(img => resizeForAI(img, 1600)));

  const contextMap: any = {
      'hp_hdr_interior': "CONTEXTO: Interior Imobiliário.",
      'hp_hdr_exterior': "CONTEXTO: Fachada Exterior.",
      'hp_hdr_window': "CONTEXTO: Interior com janela."
  };

  const contextInstruction = contextMap[profile] || contextMap['hp_hdr_interior'];

  // PROMPT V10 (AI RECONSTRUCTION & LOGICAL INPAINTING)
  const prompt = `
    SYSTEM: SNAP FUSION ENGINE (AI RECONSTRUCTION MODE).
    ${contextInstruction}
    
    INPUT: 3 Exposures (Dark, Normal, Bright).
    ESTRITAMENTE PROIBIDO: MUDAR O FORMATO (4:3). NUNCA RECORTAR.

    PROBLEMA ATUAL: As imagens de entrada têm micro-tremor (desfoque) e luzes estouradas.
    
    TAREFA: NÃO APENAS FUNDIR. RECONSTRUIR A IMAGEM.
    
    1. RECONSTRUÇÃO DE TEXTURA (CRÍTICO):
       - A imagem parece "soft" devido ao movimento. Use IA para RECONSTRUIR a nitidez perdida.
       - O chão de madeira e os tecidos devem ter textura tátil e definida (micro-detalhe).
       - Simule uma captura feita com tripé e lente prime nítida.

    2. INPAINTING LÓGICO DE LUZES:
       - As lâmpadas e janelas estão "brancas demais".
       - Use a exposição ESCURA para ver o que está lá, e "pinte" (inpaint) os detalhes do filamento da lâmpada ou da vista da janela de volta na imagem final.
       - Elimine o "nevoeiro" (glare) à volta das luzes.

    3. COR E AMBIENTE:
       - Mantenha o contraste rico e as cores quentes naturais (estilo Nodalview).
       - A imagem deve ter "pop" e profundidade 3D.

    RESULTADO: Uma imagem reconstruída, perfeitamente nítida e focada.
    RETORNA APENAS A IMAGEM FINAL EM 4:3.
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
      
      // Fallback
      return rawImages[Math.floor(rawImages.length / 2)]; 
  } catch (error) {
    console.error("[Snap AI] Erro:", error);
    return rawImages[Math.floor(rawImages.length / 2)];
  }
};

// ... (Resto das funções mantém-se igual)
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
