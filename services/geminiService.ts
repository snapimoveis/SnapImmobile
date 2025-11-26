import { GoogleGenerativeAI } from "@google/generative-ai";

// ------------------------------------------
// API KEY MANAGER
// ------------------------------------------
const getApiKey = () => {
  const localKey = localStorage.getItem("snap_gemini_api_key");
  if (localKey) return localKey;
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

- Sombras limpas, sem ruído.
- Brancos suaves sem estourar.
- Tom imobiliário premium.
- Realce de textura natural.
`,

  hp_hdr_exterior: `
Modo: EXTERIOR HP-HDR

- Céu equilibrado.
- Controla brilho especular.
- Paredes brancas sem estourar.
- Textura de pavimentos mais definida.
`,

  hp_hdr_window: `
Modo AUTOMÁTICO: JANELA FORTE HP-HDR

- Recuperação extrema de highlights.
- Correção de janela virada ao sol.
- WB dual (interior + exterior).
- Zero halos e zero washout.
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
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-image"
  });

  const profileText = HDR_PROFILES[mode];

  const systemPrompt = `
SNAP IMMOBILE — MOTOR HP-HDR

Objetivo:
- Preservar textura.
- Eliminar brilho estourado.
- Recuperar sombras até 3EV.
- Corrigir perspectiva vertical.
- Manter estética imobiliária premium.

Perfil selecionado:
${profileText}

Output:
- Imagem limpa, natural, sem halos.
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
              }
            },
            { text: systemPrompt }
          ]
        }
      ],
      generationConfig: { temperature: 0.2 }
    });

    const part = result?.response?.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );

    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }

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
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-image"
  });

  const instruction =
    mode === "ERASE"
      ? `
Remoção de objeto — INPAINTING

- Remover pixels marcados em vermelho.
- Reconstruir fundo com textura correta.
- Zero borrões, zero artefactos.
`
      : `
HOME STAGING VIRTUAL

Adicionar: ${userPrompt}
- Respeitar perspectiva.
- Sombras de contacto reais.
- Estética moderna imobiliária.
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
              }
            },
            { text: instruction }
          ]
        }
      ],
      generationConfig: { temperature: 0.2 }
    });

    const part = result?.response?.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );

    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }

    throw new Error("Sem imagem processada.");
  } catch (e) {
    console.error("Edit Error:", e);
    throw new Error("Falha ao processar IA.");
  }
};

// ------------------------------------------
// DESCRIPTION GENERATOR
// ------------------------------------------
export const generateDescription = async (
  base64Image: string
): Promise<string> => {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
  });

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
              }
            },
            {
              text: `
Descreve esta divisão imobiliária numa frase curta, apelativa e comercial,
usando Português de Portugal, realçando os pontos fortes do imóvel.
`
            }
          ]
        }
      ],
      generationConfig: { temperature: 0.3 }
    });

    return result?.response?.text() || "Imóvel Snap";
  } catch (e) {
    console.error("Description error:", e);
    return "Imóvel Snap";
  }
};
