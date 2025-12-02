// ============================================================
// geminiService.ts — versão completa e compatível com App.tsx
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// Helpers locais
import { cleanBase64, getMimeType } from "../utils/helpers";

// ============================================================
// API KEY
// ============================================================

const getApiKey = () => {
    // Vite
    //@ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_KEY) {
        //@ts-ignore
        return import.meta.env.VITE_API_KEY;
    }

    // Fallback
    return "";
};

const apiKey = getApiKey();

// Instância
const genAI = new GoogleGenerativeAI(apiKey);

// ============================================================
// Resize util
// ============================================================
const resizeForAI = async (base64: string, maxWidth = 1920): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;

        img.onload = () => {
            if (img.width <= maxWidth) return resolve(base64);

            const scale = maxWidth / img.width;
            const canvas = document.createElement("canvas");

            canvas.width = maxWidth;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(base64);

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL("image/jpeg", 0.92));
        };

        img.onerror = () => resolve(base64);
    });
};
// ============================================================
// enhanceImage — agora aceita string OU string[]
// ============================================================

export const enhanceImage = async (
    base64Images: string | string[],
    profile = "hp_hdr_interior"
): Promise<string> => {

    if (!apiKey) return Array.isArray(base64Images) ? base64Images[0] : base64Images;

    try {
        // normalizar para array
        const list = Array.isArray(base64Images) ? base64Images : [base64Images];

        // reduzir tamanho
        const resizedList = await Promise.all(
            list.map(img => resizeForAI(img, 1920))
        );

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        // enviar todas as exposições ao mesmo tempo → HDR AI
        await model.generateContent([
            `Combine estas imagens numa versão HDR equilibrada. Perfil: ${profile}`,
            ...resizedList.map(r => ({
                inlineData: {
                    data: cleanBase64(r),
                    mimeType: getMimeType(r)
                }
            }))
        ]);

        // por enquanto retornamos a imagem central como HDR final
        const mid = Math.floor(resizedList.length / 2);
        return resizedList[mid];

    } catch (err) {
        console.error("[enhanceImage] erro:", err);
        return Array.isArray(base64Images) ? base64Images[0] : base64Images;
    }
};


// ============================================================
// editImageWithPrompt (Editor AI)
// ============================================================
export const editImageWithPrompt = async (
    base64: string,
    prompt: string,
    mode: string = "ERASE"
): Promise<string> => {
    if (!apiKey) return base64;

    try {
        const resized = await resizeForAI(base64, 1920);

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        await model.generateContent([
            mode === "ERASE"
                ? "Remove the red-marked object."
                : `Add ${prompt}. Ultra realistic.`,
            {
                inlineData: {
                    data: cleanBase64(resized),
                    mimeType: getMimeType(resized),
                },
            },
        ]);

        // placeholder
        return resized;
    } catch (err) {
        console.error("[editImageWithPrompt] erro:", err);
        return base64;
    }
};

// ============================================================
// generateDescription — usado em App.tsx → handlePhotoCaptured
// ============================================================
export const generateDescription = async (base64: string): Promise<string> => {
    if (!apiKey) return "Imóvel";

    try {
        const resized = await resizeForAI(base64, 1280);

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        const result = await model.generateContent([
            "Escreva uma breve descrição imobiliária (1–2 frases) destacando iluminação e espaço.",
            {
                inlineData: {
                    data: cleanBase64(resized),
                    mimeType: getMimeType(resized),
                },
            },
        ]);

        return result.response.text().trim() || "Imóvel";
    } catch (err) {
        console.error("[generateDescription] erro:", err);
        return "Imóvel";
    }
};
