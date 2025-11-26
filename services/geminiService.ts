import { GoogleGenAI, Modality } from "@google/genai";

declare const process: any;

const getApiKey = () => {
    const localKey = localStorage.getItem('snap_gemini_api_key');
    if (localKey) return localKey;
    // Fallback to hardcoded key if process.env fails
    return process.env.API_KEY || 'AIzaSyAuQJmnHcJLkTJNRGfAhYMCZYN1FQ4PSN4';
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
      contextInstruction = "CONTEXTO: Interior de Imóvel. Prioridade: Profundidade e Iluminação Natural.";
  } else if (profile === 'hp_hdr_exterior') {
      contextInstruction = "CONTEXTO: Exterior/Fachada. Prioridade: Recuperação de Céu e Sombras.";
  } else if (profile === 'hp_hdr_window') {
      contextInstruction = "CONTEXTO: Interior com Alto Contraste. Prioridade: Recuperação total da vista da janela.";
  }

  const prompt = `
    SYSTEM / BUILD (ENGINE HDR NODALVIEW-STYLE)
    Tu és o motor de processamento de imagem do Snap Immobile.
    ${contextInstruction}

    Este modelo deve processar imagens do app Snap Immobile utilizando bracketing de 9 exposições e manter 100% da geometria e aparência real do ambiente.
    A imagem final deve ser sempre retornada no formato original do ficheiro (normalmente 4:3 no iPhone), sem recorte, sem esticar e sem converter para 16:9.

    1. Formato e FOV (ESSENCIAL)
    • Manter exatamente a proporção original da captura (4:3).
    • Nunca cortar, esticar ou converter para 16:9.
    • Preservar todos os metadados EXIF.
    • Nunca alterar o campo de visão, distância focal, nem perspectiva.
    • Respeitar a geometria original da sala.

    2. HDR PROFISSIONAL com 9 exposições
    As exposições esperadas/simuladas são: –4 EV, –3 EV, –2 EV, –1 EV, 0 EV, +1 EV, +2 EV, +3 EV, +4 EV
    O sistema deve:
    • Combinar as 9 exposições preservando dynamic range real.
    • Usar exposições negativas para recuperar highlights (janelas).
    • Usar exposições positivas para iluminar sombras.
    • Zero halos, zero brilho artificial.
    • Preservar cor e balanço de branco naturais.
    • Reduzir ruído nas exposições mais altas (+3 e +4 EV) sem borrar textura.

    3. PROFUNDIDADE REAL (estilo Nodalview)
    A profundidade deve ser aumentada de forma sutil e natural, usando apenas:
    • microcontraste no piso e superfícies texturizadas
    • separação tonal suave entre planos próximos e distantes
    • sombras naturais um pouco mais definidas nos objetos distantes
    • nitidez seletiva apenas onde há textura real
    • reforço leve de textura no piso para criar sensação de espaço

    Nunca alterar:
    • perspectiva
    • ângulo de captura
    • distâncias entre objetos
    • proporções da sala
    • distorção de lente original
    A profundidade deve ser igual ou superior à do Nodalview, porém natural.

    4. ILUMINAÇÃO
    • Iluminar suavemente áreas escuras sem clarear demais.
    • Preservar brilho natural das luzes internas.
    • Nunca saturar ou criar “glow” artificial.
    • Manter cor real do ambiente.

    5. QUALIDADE FINAL
    A imagem final deve ser:
    • limpa, sem ruído
    • com textura realista
    • com profundidade visível
    • com HDR equilibrado
    • fiel ao ambiente
    • pronta para uso imobiliário profissional

    6. O QUE NUNCA FAZER
    • Não alterar formato da imagem.
    • Não converter para widescreen.
    • Não mudar cores.
    • Não modificar sombras reais.
    • Não remover elementos do ambiente.
    • Não distorcer a lente.
    • Não aplicar filtros estilísticos.

    7. OBJETIVO FINAL
    Gerar automaticamente uma imagem HDR imobiliária de alta qualidade, no formato original da captura, com profundidade semelhante ao Nodalview, textura realista e geometria 100% preservada.
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
        ? `STRICT TASK: INPAINTING. Look for RED MASK overlay. Remove ONLY the content under the red mask. Reconstruct the background (wall, floor, texture) naturally to fill the void. Do NOT alter the rest of the image.`
        : `TASK: VIRTUAL STAGING. Add furniture: "${prompt}". Match perspective, lighting, and shadows of the room.`;

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