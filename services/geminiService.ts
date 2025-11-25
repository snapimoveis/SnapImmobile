import { GoogleGenAI, Modality } from "@google/genai";

// Helper to strip base64 prefix if present
const cleanBase64 = (data: string) => {
  return data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

const getMimeType = (data: string) => {
    const match = data.match(/^data:(image\/\w+);base64,/);
    return match ? match[1] : 'image/jpeg';
}

export const enhanceImage = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
      console.error("API Key missing. Please set API_KEY in your environment variables.");
      throw new Error("Chave de API não configurada. Contacte o suporte.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  // SYSTEM / BUILD (ENGINE HDR) — HP-HDR (Highlight Priority High Dynamic Range)
  const prompt = `
    Tu és o motor HP-HDR (Highlight Priority High Dynamic Range) do Snap Immobile.
    O teu objetivo é preservar 100% dos highlights, mantendo textura, nitidez e contraste natural, sem estourar o branco em nenhum ponto da cena.
    
    Entrada: Uma imagem base representativa de uma pilha de exposições (bracketing).
    
    Segue estritamente este pipeline de fusão com IA para atingir o resultado HP-HDR:
    
    1. **Highlight Mapping Inteligente**:
       - Comprime highlights mantendo textura visível.
       - Elimina zonas queimadas (janelas, paredes brancas sob luz direta).
       - Preserva detalhes em brancos fortes (cortinas, vistas exteriores).
       - Mantém tons naturais sem "cinzentar" a imagem.
       
    2. **Shadow Recovery Natural**:
       - Recupera sombras de forma natural (2–2.5 stops).
       - Zero ruído, zero "cinza sujo".
       
    3. **Nitidez Real (Texture-Aware)**:
       - Aplica nitidez calculada com base em microtexturas.
       - Sem halos, sem oversharpening artificial.
       
    4. **Correções Automáticas**:
       - Alinhamento perfeito e correção de perspetiva (linhas verticais e horizontais).
       - Remoção de aberração cromática.
       - Correção de balanço de brancos para neutralidade.
    
    Saída: Uma fotografia HDR absolutamente impecável, com highlights preservados, detalhes no branco, sombras naturais, zero ruído e aparência luxuosa de fotografia profissional imobiliária (Estética Nodalview Premium).
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
      throw new Error("No image generated");
  } catch (error) {
    console.error("Enhance failed:", error);
    throw error;
  }
};

export const editImageWithPrompt = async (base64Image: string, prompt: string, mode: 'ERASE' | 'STAGE' = 'ERASE'): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not configured");

    const ai = new GoogleGenAI({ apiKey });
    
    // Architecture Implementation for Advanced Editing
    let systemInstruction = "";
    
    if (mode === 'ERASE') {
        // Magic Erase (Inpainting) with Red Mask Awareness
        systemInstruction = "És um especialista em Inpainting Semântico. O utilizador marcou o objeto a remover com uma sobreposição VERMELHA TRANSLÚCIDA. DETETA A ÁREA VERMELHA. Remove o objeto sob a máscara vermelha e preenche o vazio perfeitamente com a textura do fundo circundante (chão, parede, etc.). Garante que não resta nenhum vestígio vermelho.";
    } else {
        // Virtual Staging
        systemInstruction = "És um especialista em Design de Interiores e Renderização 3D. Analisa a perspetiva da sala (pontos de fuga), fontes de luz e suavidade das sombras. Insere mobília 3D fotorrealista que corresponda perfeitamente à escala e iluminação da cena.";
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
                  text: `${systemInstruction} \n\n Pedido Específico: ${prompt}`,
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
          throw new Error("No image generated from edit");
    } catch (error) {
        console.error("Edit failed:", error);
        throw error;
    }
};

export const generateDescription = async (base64Image: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Imóvel";

    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64Image), mimeType: getMimeType(base64Image) } },
                    { text: "Realize uma análise semântica desta foto imobiliária. Identifique o tipo de divisão e as principais características arquitetónicas (ex: chão de madeira, janelas salientes, tetos altos). Resuma numa frase profissional de listagem em Português de Portugal." }
                ]
            }
        });
        return response.text || "Pré-visualização da Sala";
    } catch (e) {
        console.warn("Description generation failed", e);
        return "Pré-visualização da Sala";
    }
}