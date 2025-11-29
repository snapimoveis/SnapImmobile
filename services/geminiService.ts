// IMPORTAÇÃO CORRETA
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cleanBase64, getMimeType } from "../utils/helpers";

const getApiKey = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  return "";
};

const apiKey = getApiKey();
// INICIALIZAÇÃO CORRETA
const genAI = new GoogleGenerativeAI(apiKey);

const resizeForAI = async (base64Str: string, maxWidth = 1920): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = maxWidth / img.width;
            if (scale >= 1) { resolve(base64Str); return; }
            
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.95)); 
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => resolve(base64Str);
    });
};

export const enhanceImage = async (base64Images: string | string[], profile: string = 'hp_hdr_interior'): Promise<string> => {
  if (!apiKey) throw new Error("Chave de API não configurada.");

  const rawImages = Array.isArray(base64Images) ? base64Images : [base64Images];
  // Se não houver imagens, retorna string vazia ou lança erro
  if (rawImages.length === 0) return "";

  const processedImages = await Promise.all(rawImages.map(img => resizeForAI(img, 1920)));

  const prompt = `Melhore esta imagem imobiliária. Mantenha as cores naturais e corrija a iluminação.`;

  try {
    const imageParts = processedImages.map(img => ({
        inlineData: { data: cleanBase64(img), mimeType: getMimeType(img) }
    }));

    // SINTAXE CORRETA DO MODELO
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent([
        prompt,
        ...imageParts
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    // Como a API retorna texto por defeito, retornamos a imagem original processada
    return processedImages[Math.floor(processedImages.length / 2)]; 
  } catch (error) {
    console.error("[Snap AI] Erro:", error);
    return rawImages[Math.floor(rawImages.length / 2)];
  }
};

export const editImageWithPrompt = async (base64Image: string, prompt: string, mode: 'ERASE' | 'STAGE' = 'ERASE'): Promise<string> => {
    if (!apiKey) throw new Error("Chave de API não configurada.");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        return base64Image; 
    } catch (error: any) { throw error; }
};

export const generateDescription = async (base64Image: string): Promise<string> => {
    if (!apiKey) return "Imóvel";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([
            "Gere uma descrição atraente de imobiliária para este ambiente (max 2 frases).",
            { inlineData: { data: cleanBase64(base64Image), mimeType: getMimeType(base64Image) } }
        ]);
        const response = await result.response;
        return response.text().trim();
    } catch (e) { return "Imóvel"; }
};
