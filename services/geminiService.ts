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
// Mantemos o resize para garantir velocidade e evitar erros de memória
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
      'hp_hdr_interior': "CONTEXTO: Interior Imobiliário com iluminação mista.",
      'hp_hdr_exterior': "CONTEXTO: Fachada Exterior.",
      'hp_hdr_window': "CONTEXTO: Interior com janela."
  };

  const contextInstruction = contextMap[profile] || contextMap['hp_hdr_interior'];

  // PROMPT CALIBRADO V4 (BALANCED PRO LOOK)
  // Menos agressivo que a V3, focado em naturalidade e textura.
  const prompt = `
    SYSTEM: EXPERT REAL ESTATE RETOUCHER.
    ${contextInstruction}
    
    INPUT: 3 Bracketed Exposures (Dark, Normal, Bright).
    
    TAREFA: CRIAR UMA FUSÃO HDR NATURAL E ELEGANTE (Estilo Editorial).
    
    1. ILUMINAÇÃO (EQUILÍBRIO):
       - Aumente a exposição em +1.0 EV (Brilhante, mas não exagerado).
       - Levante as sombras suavemente para revelar detalhes, mas mantenha os pretos ricos (não lavados).
       - A imagem deve ter contraste local vibrante.

    2. COR (NEUTRALIDADE QUENTE):
       - Corrija o excesso de amarelo das luzes artificiais, mas NÃO deixe a imagem fria/azul.
       - Mantenha uma temperatura acolhedora e neutra. Paredes brancas devem parecer brancas naturais.

    3. TEXTURA (DEFINIÇÃO):
       - Aplique "Structure" no piso e tecidos para realçar a qualidade dos materiais.
       - A imagem deve ser nítida e cristalina.

    4. GEOMETRIA:
       - Mantenha o formato 4:3. Não corte nem distorça.

    RESULTADO: Uma imagem imobiliária profissional, equilibrada e realista.
    RETORNA APENAS A IMAGEM FINAL.
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

// ... (Resto das funções editImageWithPrompt e generateDescription mantêm-se iguais) ...
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
