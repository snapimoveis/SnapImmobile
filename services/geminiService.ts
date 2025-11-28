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
      'hp_hdr_interior': "CONTEXTO: Interior Imobiliário. PROBLEMA: A imagem está muito escura/pesada.",
      'hp_hdr_exterior': "CONTEXTO: Fachada Exterior. Foco: Céu azul vibrante e sombras recuperadas.",
      'hp_hdr_window': "CONTEXTO: Contra-luz Intenso. Foco: Igualar a luz interior com a exterior."
  };

  const contextInstruction = contextMap[profile] || contextMap['hp_hdr_interior'];

  // PROMPT CALIBRADO V3 (Brilho + Midtones + Marca Própria)
  const prompt = `
    SYSTEM: SNAP FUSION ENGINE (HIGH KEY & TEXTURE).
    ${contextInstruction}
    
    ESTRITAMENTE PROIBIDO: MUDAR O FORMATO DA IMAGEM.
    A SAÍDA DEVE SER EXATAMENTE 4:3.
    NUNCA CONVERTER PARA 16:9. NUNCA RECORTAR.

    TAREFA DE PROCESSAMENTO "SNAP FUSION BRIGHT LOOK":
    
    1. ILUMINAÇÃO (PRIORIDADE ABSOLUTA):
       - AUMENTE A EXPOSIÇÃO GLOBAL (+0.7 EV). A imagem tem de parecer CLARA e AREJADA.
       - LEVANTE OS TONS MÉDIOS (MIDTONE LIFT) AGRESSIVAMENTE. As paredes e móveis devem parecer bem iluminados, não sombrios.
       - ABRA AS SOMBRAS TOTALMENTE. Não quero cantos pretos. Quero ver detalhes debaixo dos móveis.

    2. TEXTURA E NITIDEZ:
       - Mantenha a textura do piso "crocante" (High Clarity/Structure).
       - Aplique nitidez inteligente (Smart Sharpening) para definir arestas.

    3. CONTROLO DE LUZES:
       - Recupere o detalhe DENTRO das luzes do teto (não deixe ser apenas uma mancha branca).
       - Elimine o "nevoeiro" (Dehaze) para que a imagem fique cristalina.

    4. COR:
       - Remova qualquer tonalidade amarelada/esverdeada. Procure um branco puro e neutro.

    RESULTADO: Uma imagem HDR brilhante, aberta, nítida e convidativa.
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
