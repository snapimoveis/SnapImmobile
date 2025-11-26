import { GoogleGenAI, Modality } from "@google/genai";

declare const process: any;

const getApiKey = () => {
    const localKey = localStorage.getItem('snap_gemini_api_key');
    if (localKey) return localKey;
    // Fallback to hardcoded key if process.env fails
    return process.env.API_KEY || 'AIzaSyDrfl26AjdJxdwxH2Eli_fme0uE9Qx5Kmk';
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
    SYSTEM / BUILD (ENGINE HDR PRO)
    Tu és o motor de processamento de imagem do Snap Immobile.
    ${contextInstruction}

    Recebes 9 imagens da mesma cena capturadas em bracketing, sempre na seguinte ordem:
    EV -4, EV -3, EV -2, EV -1, EV 0, EV +1, EV +2, EV +3, EV +4.

    O objectivo é gerar uma única imagem final com HDR profissional e profundidade natural, semelhante ao resultado da plataforma Nodalview.

    1. Formato e Geometria (ESSENCIAL)
    • Mantém exactamente a proporção original da captura (normalmente 4:3).
    • Nunca converter para 16:9, nunca cortar ou esticar.
    • Mantém a geometria da sala 100% fiel.
    • Não alterar perspectiva, distância focal, FOV ou ângulos.
    • Não aplicar qualquer tipo de distorção de lente.

    2. Fusão HDR a partir das 9 exposições

    Utiliza a sequência de EV para reconstruir um HDR real:
    • As exposições negativas (EV -4 a EV -1) devem recuperar detalhes das áreas muito claras, como lâmpadas e janelas.
    • A exposição EV 0 define a cor base, o equilíbrio geral e a geometria.
    • As exposições positivas (+1 a +4) devem iluminar as áreas escuras mantendo aspecto natural.
    • Não criar halos nem brilho artificial.
    • Preserva 100% dos detalhes, tanto nas sombras como nos highlights.
    • Reduz o ruído das exposições positivas sem destruir textura.

    3. Profundidade Estilo Nodalview

    Aumenta a sensação de profundidade de forma subtil, apenas através de:
    • microcontraste local
    • separação tonal suave entre planos próximos e distantes
    • sombras naturais ligeiramente mais definidas
    • nitidez seletiva apenas em superfícies com textura (como o piso)
    • nenhuma alteração de geometria ou FOV

    Nunca exagerar — o efeito deve ser natural, realista e profissional.

    4. Brilho e Iluminação

    O brilho deve seguir o estilo profissional:
    • Elevar suavemente os tons médios (midtone lift) para melhorar luminosidade global.
    • Abrir as sombras profundas de forma inteligente sem achatar a imagem.
    • Preservar highlights das luzes internas sem estourar.
    • Manter cores reais, sem filtros artificiais.
    • Garantir um aspecto limpo, brilhante, nítido e natural.

    5. Qualidade Final

    A imagem final deve ser:
    • brilhante, com boa visibilidade mesmo em zonas pouco iluminadas
    • profunda, com sensação espacial real
    • sem ruído, sem granulação
    • com texturas naturais preservadas
    • pronta para fotografia imobiliária profissional
    • fiel ao ambiente real visto pela câmera

    Nunca fazer
    • não esticar, cortar ou mudar proporções
    • não alterar cores originais
    • não exagerar no contraste
    • não aplicar filtros cinematográficos
    • não suavizar demais (evitar “look IA”)
    • não distorcer paredes ou linhas retas

    OBJETIVO FINAL
    Gerar uma imagem HDR 4:3, luminosa, limpa, natural e com profundidade subtil, com qualidade semelhante ou superior a uma imagem produzida pelo sistema Nodalview.
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