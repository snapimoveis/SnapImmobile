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

  const images = Array.isArray(base64Images) ? base64Images : [base64Images];

  // Instruções específicas baseadas na análise visual
  const contextMap: any = {
      'hp_hdr_interior': "CONTEXTO: Interior Imobiliário. PROBLEMA COMUM: Imagens saem escuras e sem textura no chão.",
      'hp_hdr_exterior': "CONTEXTO: Fachada Exterior. Foco: Céu azul vibrante e sombras recuperadas.",
      'hp_hdr_window': "CONTEXTO: Contra-luz Intenso. Foco: Igualar a luz interior com a exterior."
  };

  const contextInstruction = contextMap[profile] || contextMap['hp_hdr_interior'];

  const prompt = `
    SYSTEM: SNAP FUSION ENGINE (PRO REAL ESTATE TUNING).
    ${contextInstruction}
    
    OBJETIVO VISUAL: REPLICAR O LOOK "NODALVIEW" (Brilhante, Nítido, Profundo).

    ESTRITAMENTE PROIBIDO: 
    - MUDAR O FORMATO (Mantenha 4:3).
    - CORTAR (CROP).
    - ALUCINAR OBJETOS.

    TAREFA DE PROCESSAMENTO (Prioridade Máxima):
    
    1. ILUMINAÇÃO (CRÍTICO): 
       - A imagem de entrada tende a ser escura. APLIQUE UM "MIDTONE LIFT" FORTE.
       - Abra as sombras agressivamente (Shadow Recovery) para ver detalhes nos cantos escuros e debaixo de móveis.
       - O histograma deve ser equilibrado e luminoso, não escuro.

    2. TEXTURA E PROFUNDIDADE (CRÍTICO):
       - O chão e tecidos parecem "lisos" demais. CORRIJA ISSO.
       - Aplique MICRO-CONTRASTE (Clarity/Structure) forte no piso, tapetes e madeiras.
       - Quero sentir a textura tátil dos materiais. Isso cria a profundidade 3D.

    3. COR:
       - Corrija tendências de verde/azul (Tint).
       - Aqueça ligeiramente a imagem para um tom neutro e acolhedor (White Balance).

    4. FUSÃO HDR:
       - Use as exposições mais escuras APENAS para recuperar o que está "estourado" (lâmpadas, janelas).
       - Mantenha as lâmpadas com cor, não manchas brancas.

    RESUMO: Quero uma imagem final CLARA, VIBRANTE e com TEXTURA "CROCANTE" no chão.
    RETORNA APENAS A IMAGEM FINAL EM 4:3.
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
      return images[Math.floor(images.length / 2)];
  } catch (error) {
    console.error("[Snap AI] Falha na Fusão HDR:", error);
    throw error;
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
