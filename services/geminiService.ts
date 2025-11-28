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

// --- AGORA ACEITA ARRAY DE IMAGENS ---
export const enhanceImage = async (base64Images: string | string[], profile: string = 'hp_hdr_interior'): Promise<string> => {
  if (!apiKey) throw new Error("Chave de API não configurada.");

  // Garante que é sempre um array para processamento
  const images = Array.isArray(base64Images) ? base64Images : [base64Images];

  const contextMap: any = {
      'hp_hdr_interior': "CONTEXTO: Interior. Foco: Textura extrema no piso e luzes controladas.",
      'hp_hdr_exterior': "CONTEXTO: Fachada. Foco: Céu azul e sombras detalhadas.",
      'hp_hdr_window': "CONTEXTO: Contra-luz. Foco: Recuperação total da vista."
  };

  const contextInstruction = contextMap[profile] || contextMap['hp_hdr_interior'];

  // Prompt estrito para 4:3 e Nodalview Style (V2 - High Texture)
  const prompt = `
    SYSTEM: SNAP FUSION ENGINE (PRO TEXTURE & LIGHT).
    ${contextInstruction}
    
    ESTRITAMENTE PROIBIDO: MUDAR O FORMATO DA IMAGEM.
    A SAÍDA DEVE SER EXATAMENTE 4:3 (ASPECT RATIO ORIGINAL).
    NUNCA CONVERTER PARA 16:9. NUNCA RECORTAR (CROP).

    TAREFA DE PROCESSAMENTO "SNAP LOOK":
    
    1. TEXTURA E NITIDEZ (PRIORIDADE #1):
       - A imagem atual está demasiado suave. APLIQUE "STRUCTURE" e "CLARITY" FORTES.
       - O chão (madeira/piso) tem de parecer "crocante" e tátil. Realce os veios da madeira.
       - Aplique "High Pass Sharpening" inteligente nas arestas e texturas.

    2. CONTROLO DE LUZES (PRIORIDADE #2):
       - Elimine qualquer "Glow" ou "Halo" à volta das luzes do teto.
       - As luzes devem ser pontos definidos, não manchas brancas difusas.
       - Use as exposições escuras (-4 EV) para recuperar a cor dentro da lâmpada.

    3. CONTRASTE E PRETO:
       - Mantenha o brilho alto (Midtone Lift), mas certifique-se que os pretos continuam pretos (Black Point).
       - Evite o aspeto "cinzento lavado" nas sombras. Contraste local alto.

    4. GEOMETRIA:
       - Mantém 100% da geometria e aparência real (4:3).

    RESULTADO: Uma imagem com "Pop", textura nítida no chão e luzes contidas.
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
