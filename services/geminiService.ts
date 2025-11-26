import { GoogleGenAI, Modality } from "@google/genai";

declare const process: any;

// Helper to safely get the key
const getApiKey = () => {
    // 1. Tenta localStorage (se o usuário definiu uma chave própria nas configs)
    const localKey = localStorage.getItem('snap_gemini_api_key');
    if (localKey) return localKey;

    // 2. HARDCODED KEY - Fallback garantido para testers
    return 'AIzaSyCPcdh9IHT3A2KCFuB4GFdd0skPFcg0FOM';
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

export const enhanceImage = async (base64Image: string, profile: 'hp_hdr_interior' | 'hp_hdr_exterior' | 'hp_hdr_window' = 'hp_hdr_interior'): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
      throw new Error("API Key não encontrada. Configure nas Definições.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  let contextInstruction = "";
  if (profile === 'hp_hdr_interior') {
      contextInstruction = "Contexto: Interior de Imóvel. Maximizar iluminação natural, suavizar sombras fortes de mobília.";
  } else if (profile === 'hp_hdr_exterior') {
      contextInstruction = "Contexto: Exterior/Fachada. Recuperar céu azul (não estourado), detalhe na sombra da fachada.";
  } else if (profile === 'hp_hdr_window') {
      contextInstruction = "Contexto: Interior com Janela Forte. Balancear luz interior com vista exterior. NÃO estourar a janela.";
  }

  const prompt = `
    SYSTEM / BUILD (ENGINE HDR)
    Tu és o motor HP-HDR (Highlight Priority High Dynamic Range) do Snap Immobile.
    ${contextInstruction}
    O teu objetivo é preservar 100% dos highlights, mantendo textura, nitidez e contraste natural, sem estourar o branco em nenhum ponto da cena.

    Pipeline de Fusão HP-HDR:
    1. **Highlight Mapping Inteligente**: Comprime highlights mantendo textura, elimina zonas queimadas, preserva detalhes em brancos fortes.
    2. **Shadow Recovery Natural**: Recupera sombras até 2 stops sem ruído ou "cinza sujo".
    3. **Nitidez Real (Texture-Aware)**: Nitidez calculada com base em microtexturas, sem halos ou oversharpening.
    4. **Correções Automáticas**: Perspetiva (linhas verticais), aberração cromática, balanço de brancos e microcontraste.

    Saída:
    Gera uma imagem HP-HDR Final com zero branco estourado, textura preservada, nitidez impecável e estética de fotografia imobiliária premium.
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
        // More aggressive, strict technical prompt for Inpainting
        systemInstruction = `
            STRICT TASK: IMAGE INPAINTING / OBJECT REMOVAL
            
            INPUT ANALYSIS:
            - Look for a semi-transparent RED MASK overlay on the original image.
            - The RED MASK indicates the exact pixels to be erased.
            
            INSTRUCTIONS:
            1. REMOVE everything covered by the RED MASK.
            2. If no red mask is found, remove the object described as: "${prompt}".
            3. INPAINT the removed area to match the surrounding background texture, lighting, and perspective.
            4. The result must look natural, as if the object never existed.
            
            OUTPUT:
            - Return ONLY the final processed image.
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