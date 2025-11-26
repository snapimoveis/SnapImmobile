import { GoogleGenAI, Modality } from "@google/genai";

declare const process: any;

// ==============================
// GET API KEY
// ==============================
const getApiKey = () => {
  const localKey = localStorage.getItem("snap_gemini_api_key");
  if (localKey) return localKey;

  return "SUA_KEY_AQUI"; // substitua
};

// ==============================
// CLEAN BASE64
// ==============================
const cleanBase64 = (data: string): string => {
  if (!data) return "";
  return data.split(",")[1] || data;
};

const getMimeType = (data: string): string => {
  if (!data) return "image/jpeg";
  const match = data.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : "image/jpeg";
};

// ==============================
// SUPER PROMPT DINÂMICO
// Ajustado ao novo HP-HDR real
// ==============================
const getEnhancementPrompt = (mode: string) => {
  // Base comum para todos
  const base = `
Tu és o módulo HP-HDR FINAL do Snap Immobile.
A imagem enviada já foi fundida usando 9 exposições reais. NÃO refazes HDR.

**NÃO alteres a composição.**
**NÃO exageres na nitidez.**
**NÃO plastifiques paredes.**
**Preserva a profundidade original.**

A tua tarefa é:

1. **Realçar detalhes preservando naturalidade**
2. **Comprimir highlights** sem estourar branco
3. **Recuperar sombras** até 1.5 stop sem ruído
4. **Nitidez baseada em textura** (sem halos)
5. **Redução de ruído suave**, só onde necessário
6. **Balanço de brancos realista**
7. **Correção leve de perspetiva vertical (lens shift)** 
8. **Aparência fotográfica de DSLR imobiliária**

A saída deve manter look natural, iluminado e premium.
`;

  // Ajustes por modo
  if (mode === "hp_hdr_interior") {
    return `
${base}

MODO: INTERIOR
- Luz suave e uniforme
- Corrigir dominantes quentes
- Preservar textura de paredes brancas
- Contraste médio
- Realçar janelas sem exagero
- Nada de sombras cinza
`;
  }

  if (mode === "hp_hdr_exterior") {
    return `
${base}

MODO: EXTERIOR
- Realçar céu, paredes e materiais exteriores
- Branco limpo, sem clipping
- Contraste moderado
- Evitar "HDR falso"
`;
  }

  return `
${base}

MODO: JANELA FORTE
- Prioridade máxima aos highlights
- Branco inteligente (sem queimar)
- Interior brilhante sem perder vista exterior
- Microcontraste mais forte
- Redução de ruído cuidadosa
`;
};

// ==============================
// ENHANCE IMAGE (FINAL)
// ==============================
export const enhanceImage = async (
  base64Image: string,
  mode: "hp_hdr_interior" | "hp_hdr_exterior" | "hp_hdr_window"
): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = getEnhancementPrompt(mode);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64(base64Image),
              mimeType: getMimeType(base64Image),
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
        mimeType: "image/jpeg",
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const p of parts) {
      if (p.inlineData?.data) {
        return `data:image/jpeg;base64,${p.inlineData.data}`;
      }
    }

    console.warn("AI did not return JPEG, fallback used.");
    return base64Image;
  } catch (e) {
    console.error("Snap HDR Enhance Failed:", e);
    return base64Image;
  }
};

// ==============================
// ERASE / STAGE (intocado)
// ==============================
export const editImageWithPrompt = async (
  base64Image: string,
  prompt: string,
  mode: "ERASE" | "STAGE" = "ERASE"
): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  let systemInstruction = "";

  if (mode === "ERASE") {
    systemInstruction = `
STRICT IMAGE OBJECT REMOVAL
1. Remover tudo o que estiver sob máscara vermelha.
2. Se não houver máscara: remover "${prompt}".
3. Preencher fundo com textura natural.
4. Respeitar iluminação e perspetiva.
`;
  } else {
    systemInstruction = `
VIRTUAL STAGING TASK
Adicionar mobiliário: "${prompt}"
Respeitar luz, textura e perspetiva.
`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64(base64Image),
              mimeType: getMimeType(base64Image),
            },
          },
          { text: systemInstruction },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
        mimeType: "image/jpeg",
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const p of parts) {
      if (p.inlineData?.data) {
        return `data:image/jpeg;base64,${p.inlineData.data}`;
      }
    }

    throw new Error("IA não retornou imagem.");
  } catch (e: any) {
    console.error("Snap AI Editing Failed:", e);
    throw new Error("Falha na IA: " + e.message);
  }
};

// ==============================
// DESCRIÇÃO IMOBILIÁRIA
// ==============================
export const generateDescription = async (
  base64Image: string
): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64(base64Image),
              mimeType: getMimeType(base64Image),
            },
          },
          {
            text: "Descreva esta divisão com frase curta e comercial em Português de Portugal.",
          },
        ],
      },
    });

    return response.text || "Imóvel Snap";
  } catch (e) {
    console.error("Description failed:", e);
    return "Imóvel Snap";
  }
};
