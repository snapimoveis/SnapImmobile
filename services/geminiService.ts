import { GoogleGenAI, Modality } from "@google/genai";

// Helper to safely get the key
const getApiKey = () => {
    // 1. Tenta localStorage (se o usuário definiu uma chave própria nas configs)
    const localKey = localStorage.getItem('snap_gemini_api_key');
    if (localKey) return localKey;

    // 2. Fallback para process.env.API_KEY (Definido no vite.config.ts)
    // Assume process.env.API_KEY is available as per Coding Guidelines and Vite config
    return process.env.API_KEY || '';
};

// Helper to strip base64 prefix
const cleanBase64 = (data: string) => {
  if (!data) return '';
  // Remove tudo antes da vírgula (data:image/xyz;base64,)
  return data.split(',')[1] || data;
};

const getMimeType = (data: string) => {
    if (!data) return 'image/jpeg';
    const match = data.match(/^data:(image\/\w+);base64,/);
    return match ? match[1] : 'image/jpeg';
}

export const enhanceImage = async (base64Image: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
      throw new Error("API Key não encontrada. Configure nas Definições.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Tu és o motor HP-HDR (Highlight Priority High Dynamic Range) do Snap Immobile.
    Melhora esta fotografia imobiliária.
    
    Objetivos:
    1. Recuperar sombras sem criar ruído.
    2. Reduzir o brilho excessivo (estouro) nas janelas e luzes.
    3. Corrigir linhas verticais (perspetiva).
    4. Aumentar a nitidez e clareza.
    5. Manter as cores naturais e vibrantes.
    
    Retorna APENAS a imagem melhorada.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64(base64Image),
                mimeType: getMimeType(base64Image),
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
      });
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      
      // Se não gerou imagem, retorna a original
      console.warn("AI did not return an image part, returning original.");
      return base64Image;

  } catch (error: any) {
    console.error("Snap AI Enhancement Failed:", error);
    // Mensagens de erro mais claras para o usuário
    if (error.message?.includes('400')) throw new Error("Erro na imagem (Formato inválido).");
    if (error.message?.includes('403') || error.message?.includes('API key')) throw new Error("Chave de API inválida ou expirada.");
    if (error.message?.includes('429')) throw new Error("Muitos pedidos. Tente novamente em instantes.");
    throw error;
  }
};

export const editImageWithPrompt = async (base64Image: string, prompt: string, mode: 'ERASE' | 'STAGE' = 'ERASE'): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    let systemInstruction = "";
    
    if (mode === 'ERASE') {
        systemInstruction = `
            TASK: MAGIC ERASE / INPAINTING
            INSTRUCTIONS:
            1. Detect areas marked in RED overlay (if any) or identify the object described: "${prompt}".
            2. Remove the object completely.
            3. Fill the empty space seamlessly matching the background texture and lighting.
            4. Return ONLY the processed image.
        `;
    } else {
        systemInstruction = `
            TASK: VIRTUAL STAGING
            INSTRUCTIONS:
            1. Add furniture: "${prompt}".
            2. Match room perspective and lighting.
            3. Return ONLY the processed image.
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: cleanBase64(base64Image),
                    mimeType: getMimeType(base64Image),
                  },
                },
                {
                  text: systemInstruction,
                },
              ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
          });
          
          const parts = response.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                  return `data:image/png;base64,${part.inlineData.data}`;
              }
          }
          throw new Error("A IA não gerou a imagem editada.");
    } catch (error: any) {
        console.error("Snap AI Editing Failed:", error);
        if (error.message?.includes('429')) throw new Error("Servidor ocupado (Quota). Tente já.");
        throw new Error("Falha na edição IA: " + error.message);
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
                    { text: "Descreva esta divisão imobiliária numa frase curta, apelativa e comercial em Português de Portugal. Foque nos pontos fortes." }
                ]
            }
        });
        return response.text || "Imóvel de luxo";
    } catch (e) {
        console.error("Snap AI Description Failed:", e);
        return "Imóvel Snap";
    }
}