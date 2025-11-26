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
Modo AUTOMÁTICO: JANELA FORTE H
