import { GoogleGenAI, Modality } from "@google/genai";

declare const process: any;

const getApiKey = () => {
    const localKey = localStorage.getItem('snap_gemini_api_key');
    if (localKey) return localKey;
    // Fallback to hardcoded key if process.env fails
    return process.env.API_KEY || 'AIzaSyCPcdh9IHT3A2KCFuB4GFdd0skPFcg0FOM';
};

const cleanBase64 = (data: string) => {
  if (!data) return '';
  return data.split(',')[1] || data;
};

const getMimeType = (data: string) => {
    if (!data) return 'image/jpeg';
    const match = data.match(/^data:(image\/\w+);base64,/);
    return match ? match[1] : 'image/jpeg';
}

export const enhanceImage = async (base64Image: string, profile: 'hp_hdr_interior' | 'hp_hdr_exterior' | 'hp_hdr_window' = 'hp_hdr_interior'): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  let contextInstruction = "";
  if (profile === 'hp_hdr_interior') {
      contextInstruction = "Contexto: Interior de Imóvel. Maximizar iluminação natural, suavizar sombras.";
  } else if (profile === 'hp_hdr_exterior') {
      contextInstruction = "Contexto: Exterior/Fachada. Recuperar céu azul, detalhe na sombra.";
  } else if (profile === 'hp_hdr_window') {
      contextInstruction = "Contexto: Interior com Janela Forte. Balancear luz interior com vista exterior.";
  }

  const prompt = `
    SYSTEM / BUILD (ENGINE HDR)
    Tu és o motor HP-HDR (Highlight Priority High Dynamic Range).
    ${contextInstruction}
    Objetivo: Preservar 100% dos highlights, manter textura, nitidez e contraste natural. Zero branco estourado.
    
    Pipeline:
    1. Highlight Mapping Inteligente.
    2. Shadow Recovery Natural.
    3. Nitidez Real (Texture-Aware).
    4. Correção de Perspetiva Vertical.
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
  } catch (error: any) {
    console.error("AI Enhancement Failed:", error);
    throw error;
  }
};

export const editImageWithPrompt = async (base64Image: string, prompt: string, mode: 'ERASE' | 'STAGE' = 'ERASE'): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const sys = mode === 'ERASE' 
        ? `STRICT TASK: INPAINTING. Look for RED MASK. Remove content under mask. Fill with background.`
        : `TASK: VIRTUAL STAGING. Add furniture: "${prompt}". Match perspective.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { data: cleanBase64(base64Image), mimeType: getMimeType(base64Image) } },
                { text: sys },
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
          throw new Error("No image generated");
    } catch (error: any) {
        console.error("Edit Failed:", error);
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
    } catch (e) { return "Imóvel"; }
}