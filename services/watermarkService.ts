
export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

interface WatermarkOptions {
    opacity: number; // 0 to 1
    position: WatermarkPosition;
    scale: number; // Scale relative to image width (e.g., 0.2 = 20% of width)
    margin: number; // Margin in pixels
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Critical for Firebase Storage images
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
};

export const applyWatermarkToImage = async (
    baseImageUrl: string,
    watermarkUrl: string,
    options: WatermarkOptions
): Promise<string> => {
    try {
        const [baseImg, wmImg] = await Promise.all([
            loadImage(baseImageUrl),
            loadImage(watermarkUrl)
        ]);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) throw new Error("Could not get canvas context");

        // Set canvas dimensions to match base image
        canvas.width = baseImg.naturalWidth;
        canvas.height = baseImg.naturalHeight;

        // Draw Base Image
        ctx.drawImage(baseImg, 0, 0);

        // Calculate Watermark Dimensions
        // We want the watermark to be a percentage of the base image width
        // Typically 20-30% width looks good
        const wmAspectRatio = wmImg.naturalWidth / wmImg.naturalHeight;
        const wmWidth = canvas.width * options.scale;
        const wmHeight = wmWidth / wmAspectRatio;

        // Calculate Position
        let x = 0;
        let y = 0;
        const margin = canvas.width * 0.03; // 3% margin relative to image width

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

        // Apply Opacity
        ctx.globalAlpha = options.opacity;

        // Draw Watermark
        ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);

        // Reset Opacity for good measure
        ctx.globalAlpha = 1.0;

        // Export
        return canvas.toDataURL('image/jpeg', 0.95);

    } catch (error) {
        console.error("Error applying watermark:", error);
        // Fallback: return original image if watermark fails
        return baseImageUrl;
    }
};
