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

// --- CORREÇÃO AQUI: Aceita string OU array de strings ---
export const enhanceImage = async (base64Images: string | string[], profile: string = 'hp_hdr_interior'): Promise<string> => {
  if (!apiKey) throw new Error("Chave de API não configurada.");

  // Garante que é sempre um array para processamento
  const images = Array.isArray(base64Images) ? base64Images : [base64Images];

  const contextMap: any = {
      'hp_hdr_interior': "CONTEXTO: Interior. Foco: Janelas perfeitas e luz natural.",
      'hp_hdr_exterior': "CONTEXTO: Fachada. Foco: Céu azul e sombras detalhadas.",
      'hp_hdr_window': "CONTEXTO: Contra-luz. Foco: Recuperação total da vista."
  };

  const contextInstruction = contextMap[profile] || contextMap['hp_hdr_interior'];

  // Prompt estrito para 4:3 e Nodalview Style
  const prompt = `
    SYSTEM: SNAP FUSION ENGINE (Multi-Exposure Logic).
    ${contextInstruction}
    
    ESTRITAMENTE PROIBIDO: MUDAR O FORMATO DA IMAGEM.
    A SAÍDA DEVE SER EXATAMENTE 4:3 (ASPECT RATIO ORIGINAL).
    NUNCA CONVERTER PARA 16:9. NUNCA RECORTAR (CROP).

    TAREFA (HDR IMOBILIÁRIO PROFISSIONAL):
    1. Geometria: Mantém 100% da geometria e aparência real. Não alterar FOV, distância focal ou perspetiva.
    2. Fusão: Combina as exposições para criar um dynamic range real.
       - Exposições negativas (-4, -2): Recupera 100% dos detalhes nas janelas/luzes.
       - Exposições positivas (+2, +4): Ilumina sombras sem ruído e sem "lavar" a imagem.
    3. Profundidade: Aplica microcontraste subtil no piso e texturas para dar sensação de espaço.
    4. Cor: Balanço de brancos natural. Zero filtros "artísticos".
    
    RESULTADO FINAL: Uma imagem HDR 4:3 pura, luminosa e nítida.
    RETORNA APENAS A IMAGEM FINAL.
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
      // Fallback: retorna a imagem do meio se falhar a geração
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
