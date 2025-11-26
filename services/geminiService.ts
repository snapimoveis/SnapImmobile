import { GoogleAI } from "@google/generative-ai";

// ------------------------------------------
// API KEY MANAGER
// ------------------------------------------
const getApiKey = () => {
  const localKey = localStorage.getItem("snap_gemini_api_key");
  if (localKey) return localKey;

  // Fallback temporário
  return "AIzaSyCPcdh9IHT3A2KCFuB4GFdd0skPFcg0FOM";
};

// ------------------------------------------
// HELPERS
// ------------------------------------------
const cleanBase64 = (data: string) => {
  if (!data) return "";
  return data.split(",")[1] || data;
};

const getMimeType = (base64: string) => {
  if (!base64) return "image/jpeg";
  const match = base64.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : "image/jpeg";
};

// ------------------------------------------
// HDR PROFILES
// ------------------------------------------
export const HDR_PROFILES: Record<string, string> = {
  hp_hdr_interior: `
    Modo: INTERIOR HP-HDR
    
    - Prioridade: sombras limpas, remoção de ruído, brancos suaves 
    - Preserva detalhe em superfícies brancas sem tons estourados
    - Iluminação natural suave (look imobiliário premium)
    - Remove colorações artificiais (verde/amarelo)
    - Mantém contraste suave e textura realista
  `,

  hp_hdr_exterior: `
    Modo: EXTERIOR HP-HDR
    
    - Prioridade: céu equilibrado, paredes brancas sem estourar
    - Redução de brilho especular excessivo
    - Realce de textura em pavimentos e paredes
    - Cores realistas com leve punch imobiliário
    - Mantém micro-contrast responsável
  `,

  hp_hdr_window: `
    Modo AUTOMÁTICO: JANELA FORTE HP-HDR
    
    - Atenua highlights intensos da janela virada ao sol
    - Recupera textura externa sem criar halos
    - Mantém sombras internas naturais (sem gray-wash)
    - White balance dual-region (interior + janela)
    - Resolve diferenciais de 6+ EV mantendo naturalidade
  `
};

// ------------------------------------------
// MAIN HDR ENHANCER
// ------------------------------------------
export const enhanceImage = async (
  base64Image: string,
  mode: "hp_hdr_interior" | "hp_hdr_exterior" | "hp_hdr_window"
): Promise<string> => {

  const apiKey = getApiKey();
  const genAI = new GoogleAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-image" });

  const profileText = HDR_PROFILES[mode] ?? HDR_PROFILES.hp_hdr_interior;

  const systemPrompt = `
    SNAP IMMOBILE — MOTOR HP-HDR

    Objetivo:
    - Preservar textura.
    - Eliminar brilho estourado (highlight recovery).
    - Recuperar sombras até 2–3EV sem ruído.
    - Corrigir perspectiva vertical.
    - Manter cor imobiliária Premium (clean whites + real estate tones).
    
    Perfil aplicado:
    ${profileText}

    Output obrigatório:
    - Uma imagem única, limpa, fotográfica, natural.
    - Zero halos, zero artefactos, zero washout.
  `;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64(base64Image),
                mimeType: getMimeType(base64Image),
              },
            },
            { text: systemPrompt }
          ]
        }
      ],
      // ⚠️ CONFIG LIMPA e compatível com API nova
      generationConfig: {
        temperature: 0.2,
      }
    });

    const imagePart = result?.response?.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );

    if (imagePart?.inlineData?.data) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }

    console.warn("AI did not return an image — returning original");
    return base64Image;

  } catch (err) {
    console.error("HDR Enhance Error:", err);
    return base64Image;
  }
};

// ------------------------------------------
// MAGIC ERASE & VIRTUAL STAGING
// ------------------------------------------
export const editImageWithPrompt = async (
  base64Image: string,
  userPrompt: string,
  mode: "ERASE" | "STAGE"
): Promise<string> => {
  const apiKey = getApiKey();
  const genAI = new GoogleAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-image" });

  const mime = getMimeType(base64Image);

  const systemInstruction =
    mode === "ERASE"
      ? `
        STRICT INPAINTING — OBJECT REMOVAL

        - A área a remover está marcada com máscara vermelha.
        - Remove 100% dos pixels vermelhos.
        - Reconstrói fundo com continuidade de textura e luz.
        - Zero artefactos, zero borrões.
      `
      : `
        VIRTUAL HOME STAGING — ADD FURNITURE

        - Adicionar: ${userPrompt}
        - Ajustar perspectiva ao piso
        - Aplicar sombras reais de contacto
        - Manter estética imobiliária moderna
      `;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64(base64Image),
                mimeType: mime,
              },
            },
            { text: systemInstruction }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    });

    const part = result?.response?.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );

    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }

    throw new Error("AI returned no inlineData image");

  } catch (e: any) {
    console.error("Edit Error", e);
    throw new Error("Falha ao processar IA. Tente novamente.");
  }
};

// ------------------------------------------
// DESCRIPTION GENERATOR
// ------------------------------------------
export const generateDescription = async (
  base64Image: string
): Promise<string> => {

  const apiKey = getApiKey();
  const genAI = new GoogleAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const res = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64(base64Image),
                mimeType: getMimeType(base64Image),
              },
            },
            {
              text: `
                Descreve esta divisão imobiliária numa frase curta, apelativa
                e comercial, usando Português de Portugal. A descrição deve 
                valorizar os pontos fortes do espaço.
              `,
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
      }
    });

    return res?.response?.text() || "Imóvel Snap";

  } catch (e) {
    console.error("Description error:", e);
    return "Imóvel Snap";
  }
};
