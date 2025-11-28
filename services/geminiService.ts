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

  const contextMap: any = {
      'hp_hdr_interior': "CONTEXTO: Interior muito escuro com luz artificial quente.",
      'hp_hdr_exterior': "CONTEXTO: Fachada Exterior.",
      'hp_hdr_window': "CONTEXTO: Interior com contra-luz."
  };

  const contextInstruction = contextMap[profile] || contextMap['hp_hdr_interior'];

  // PROMPT CALIBRADO V3 (RELIGHTING TOTAL / DAYLIGHT SIMULATION)
  // Este prompt é muito mais agressivo para forçar a saída da "escuridão".
  const prompt = `
    SYSTEM: SNAP FUSION ENGINE (DAYLIGHT SIMULATION MODE).
    ${contextInstruction}
    
    ESTRITAMENTE PROIBIDO: MUDAR O FORMATO DA IMAGEM (4:3). NUNCA RECORTAR.

    TAREFA DE PROCESSAMENTO "SNAP FUSION DAYLIGHT LOOK" (V3 - NUCLEAR):
    
    ATENÇÃO: A imagem de entrada está inaceitavelmente escura e amarela.
    A sua tarefa é RE-ILUMINAR a cena completamente.

    1. ILUMINAÇÃO (SIMULAÇÃO DE DIA):
       - IGNORE a iluminação atual. Simule um ambiente de DIA CLARO com muita luz natural.
       - Aumente a exposição dramaticamente (+2.0 EV). A imagem final deve ser MUITO BRILHANTE, quase "high-key".
       - Não quero ver sombras escuras no primeiro plano (chão). Ilumine tudo.

    2. COR E TEMPERATURA (ELIMINAR O AMARELO):
       - Elimine TOTALMENTE a tonalidade amarela/quente das luzes artificiais.
       - A luz deve ser BRANCA PURA e NEUTRA (5500K). Paredes brancas devem ser brancas, não cremes.

    3. TEXTURA E CLARIDADE:
       - Com tanta luz, a textura deve ser super nítida (High Structure).
       - A imagem deve parecer limpa, cristalina e arejada.

    RESULTADO: Uma transformação total para uma imagem de dia, brilhante e branca.
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
