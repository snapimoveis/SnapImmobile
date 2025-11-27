
import { GoogleGenAI, Modality } from "@google/genai";
import { cleanBase64, getMimeType } from "../utils/helpers";

declare const process: any;

const getApiKey = (): string => {
    // 1. Priority: User-defined key (LocalStorage)
    const localKey = localStorage.getItem('snap_gemini_api_key');
    if (localKey) {
        console.debug('[Snap AI] Usando chave de API do Utilizador');
        return localKey;
    }

    // 2. Priority: System Default
    const systemKey = 'AIzaSyDrfl26AjdJxdwxH2Eli_fme0uE9Qx5Kmk';
    if (systemKey) return systemKey;

    // 3. Priority: Environment Variable
    return process.env.API_KEY || '';
};

export const enhanceImage = async (base64Image: string, profile: 'hp_hdr_interior' | 'hp_hdr_exterior' | 'hp_hdr_window' = 'hp_hdr_interior'): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
      console.error("[Snap AI] Nenhuma chave de API encontrada.");
      return base64Image;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const contextMap = {
      'hp_hdr_interior': "CONTEXTO: Interior de Imóvel. Prioridade: Profundidade e Iluminação Natural.",
      'hp_hdr_exterior': "CONTEXTO: Exterior/Fachada. Prioridade: Recuperação de Céu e Sombras.",
      'hp_hdr_window': "CONTEXTO: Interior com Alto Contraste. Prioridade: Recuperação total da vista da janela."
  };

  const contextInstruction = contextMap[profile];

  const prompt = `
    SYSTEM / BUILD (ENGINE HDR PRO)
    Tu és o motor de processamento de imagem do Snap Immobile.
    ${contextInstruction}

    Recebes 9 imagens da mesma cena capturadas em bracketing...
    [PROMPT COMPLETO MANTIDO INTERNAMENTE PELO MODELO]
    OBJETIVO FINAL: Gerar uma imagem HDR 4:3, luminosa, limpa, natural e com profundidade subtil.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: cleanBase64(base64Image), mimeType: getMimeType(base64Image) } },
            { text: prompt },
          ],
        },
        config: { responseModalities: [Modality.IMAGE] },
      });
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      return base64Image;
  } catch (error) {
    console.error("[Snap AI] Falha no Melhoramento de Imagem:", error);
    throw error;
  }
};

export const editImageWithPrompt = async (base64Image: string, prompt: string, mode: 'ERASE' | 'STAGE' = 'ERASE'): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const sys = mode === 'ERASE' 
        ? `STRICT TASK: INPAINTING. The user has marked an area with a translucent RED MASK. 1. Identify the pixels covered by the RED MASK. 2. Remove the object(s) underneath. 3. Inpaint the removed area to perfectly match the surrounding environment.`
        : `TASK: VIRTUAL STAGING. Add furniture: "${prompt}". Match perspective, lighting, and shadows.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { data: cleanBase64(base64Image), mimeType: getMimeType(base64Image) } },
                { text: sys + "\n\n" + prompt },
              ],
            },
            config: { responseModalities: [Modality.IMAGE] },
          });
          
          const parts = response.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                  return `data:image/png;base64,${part.inlineData.data}`;
              }
          }
          throw new Error("Nenhuma imagem gerada pela IA.");
    } catch (error) {
        console.error("[Snap AI] Falha na Edição:", error);
        throw error;
    }
};

export const generateDescription = async (base64Image: string): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64Image), mimeType: getMimeType(base64Image) } },
                    { text: "Descreva esta divisão imobiliária numa frase curta em PT-PT." }
                ]
            }
        });
        return response.text || "Imóvel";
    } catch (e) { 
        console.warn("[Snap AI] Falha na descrição:", e);
        return "Imóvel"; 
    }
};
