export type WatermarkPosition = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';

interface WatermarkOptions {
    opacity: number;
    position: WatermarkPosition;
    scale: number; // Porcentagem da largura da imagem base (0.1 a 1.0)
    margin: number; // Margem em pixels
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
    });
};

export const applyWatermarkToImage = async (
    baseImageUrl: string,
    watermarkUrl: string,
    options: WatermarkOptions
): Promise<string> => {
    try {
        // Carrega as duas imagens em paralelo
        const [baseImg, watermarkImg] = await Promise.all([
            loadImage(baseImageUrl),
            loadImage(watermarkUrl)
        ]);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Não foi possível criar o contexto do Canvas');

        // Configura o canvas com o tamanho original da foto
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;

        // 1. Desenha a imagem base
        ctx.drawImage(baseImg, 0, 0);

        // 2. Calcula dimensões da marca d'água
        // A marca d'agua será proporcional à largura da imagem base
        const wmWidth = baseImg.width * options.scale;
        // Mantém a proporção (aspect ratio) da marca d'água
        const aspectRatio = watermarkImg.width / watermarkImg.height;
        const wmHeight = wmWidth / aspectRatio;

        // 3. Calcula a posição (X, Y)
        let x = 0;
        let y = 0;
        const margin = options.margin;

        switch (options.position) {
            case 'top-left':
                x = margin;
                y = margin;
                break;
            case 'top-right':
                x = canvas.width - wmWidth - margin;
                y = margin;
                break;
            case 'bottom-left':
                x = margin;
                y = canvas.height - wmHeight - margin;
                break;
            case 'bottom-right':
                x = canvas.width - wmWidth - margin;
                y = canvas.height - wmHeight - margin;
                break;
            case 'center':
                x = (canvas.width - wmWidth) / 2;
                y = (canvas.height - wmHeight) / 2;
                break;
        }

        // 4. Aplica a marca d'água com opacidade
        ctx.globalAlpha = options.opacity;
        ctx.drawImage(watermarkImg, x, y, wmWidth, wmHeight);
        
        // Retorna opacidade ao normal para boas práticas
        ctx.globalAlpha = 1.0;

        // 5. Retorna em alta qualidade
        return canvas.toDataURL('image/jpeg', 0.95);

    } catch (error) {
        console.error("Erro ao aplicar marca d'água:", error);
        return baseImageUrl; // Fallback: retorna imagem original se falhar
    }
};
