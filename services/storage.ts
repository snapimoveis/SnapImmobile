// ... (imports e config iguais)

// === HELPER: Upload de Imagem Seguro ===
const uploadImageToStorage = async (base64Image: string | undefined, path: string): Promise<string> => {
    if (!base64Image) return '';
    if (base64Image.startsWith('http') || base64Image.startsWith('https')) return base64Image;
    
    if (!base64Image.startsWith('data:image')) {
        console.warn("Formato de imagem inválido:", base64Image.substring(0, 50));
        return ''; 
    }
    
    try {
        console.log(`Iniciando upload para: ${path}`); // Log de debug
        const storageRef = ref(storage, path);
        
        // Upload da string base64
        const snapshot = await uploadString(storageRef, base64Image, 'data_url');
        console.log('Upload concluído, bytes transferidos:', snapshot.totalBytes);
        
        // Obter a URL pública
        const downloadURL = await getDownloadURL(storageRef);
        console.log('URL de download obtida:', downloadURL);
        
        return downloadURL;
    } catch (error: any) {
        // LOG CRÍTICO: Mostra o erro real do Firebase
        console.error("ERRO DETALHADO NO UPLOAD:", error);
        
        if (error.code === 'storage/unauthorized') {
            throw new Error("Permissão negada no Storage. Verifique as regras no console do Firebase.");
        } else if (error.code === 'storage/canceled') {
            throw new Error("Upload cancelado.");
        } else if (error.code === 'storage/unknown') {
            throw new Error(`Erro desconhecido no Storage: ${error.message}`);
        } else {
            throw new Error(`Falha no upload: ${error.message || error}`);
        }
    }
};

// ... (resto do ficheiro mantém-se igual)
