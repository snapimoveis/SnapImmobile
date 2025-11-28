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

// --- FUNÇÃO AUXILIAR DE REDIMENSIONAMENTO ---
const resizeForAI = async (base64Str: string, maxWidth = 1280): Promise<string> => {
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
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.90)); 
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

  // Otimização de tamanho
  const processedImages = await Promise.all(rawImages.map(img => resizeForAI(img, 1280)));

  const contextMap: any = {
      'hp_hdr_interior': "CONTEXTO: Interior Imobiliário. Foco: Equilíbrio e Naturalidade.",
      'hp_hdr_exterior': "CONTEXTO: Fachada Exterior.",
      'hp_hdr_window': "CONTEXTO: Interior com janela."
  };

  const contextInstruction = contextMap[profile] || contextMap['hp_hdr_interior'];

  // PROMPT CALIBRADO V4 (NATURAL PRO BALANCE)
  // Menos agressivo que o V3, mais luminoso que o V2. O ponto ideal.
  const prompt = `
    SYSTEM: SNAP FUSION ENGINE (BALANCED PRO).
    ${contextInstruction}
    
    INPUT: 3 Bracketed Exposures.
    ESTRITAMENTE PROIBIDO: MUDAR O FORMATO (4:3). NUNCA RECORTAR.

    TAREFA DE PROCESSAMENTO "NATURAL BRIGHT LOOK":
    
    1. ILUMINAÇÃO (EQUILIBRADA):
       - Aumente a exposição em +1.3 EV. A imagem deve ser clara, mas NÃO "queimada".
       - Levante os tons médios para ver detalhes, mas MANTENHA SOMBRAS SUAVES debaixo dos móveis para dar volume 3D.
       - A sala deve parecer iluminada por luz natural suave, não por um flash nuclear.

    2. COR (BRANCOS LIMPOS, MADEIRA QUENTE):
       - As paredes e teto devem ser NEUTROS (Branco/Cinzento Claro). Remova o amarelo APENAS das paredes.
       - MANTENHA o tom quente e rico da madeira no chão. Não deixe o chão cinzento.
       - O resultado deve ser acolhedor ("Cozy") mas limpo.

    3. TEXTURA:
       - Aplique nitidez ("Structure") no chão e nos tecidos do sofá/cadeira.
       - A imagem deve ter definição, sem parecer artificial.

    4. JANELAS:
       - Recupere a vista da janela usando a exposição escura.

    RESULTADO: Uma imagem imobiliária profissional, luminosa e realista.
    RETORNA APENAS A IMAGEM FINAL EM 4:3.
  `;

  try {
    const imageParts = processedImages.map(img => ({
        inlineData: { data: cleanBase64(img), mimeType: getMimeType(img) }
    }));

    console.log(`[Snap AI] A enviar ${imageParts.length} imagens para fusão equilibrada...`);

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
