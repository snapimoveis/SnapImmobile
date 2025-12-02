// geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cleanBase64, getMimeType } from "../utils/helpers";
import { ToolMode } from "../types";

const getApiKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    return import.meta.env.VITE_API_KEY;
  }
  return "";
};

const apiKey = getApiKey();
const genAI = new GoogleGenerativeAI(apiKey);

export const editImageWithPrompt = async (
  base64Image: string,
  prompt: string,
  mode: ToolMode = ToolMode.MAGIC_ERASE
): Promise<string> => {
  if (!apiKey) throw new Error("Chave de API não configurada.");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // FUTURO: aqui você enviará a imagem para o Gemini
    console.log("AI Edit Mode:", mode);

    return base64Image; // placeholder
  } catch (error: any) {
    throw error;
  }
};
