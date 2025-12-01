// ... (Mantenha as importações e o início da função App igual) ...

  const handlePhotoCaptured = async (photo: Photo) => {
    if (!currentUser) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
    }

    // Validação básica
    if (!photo || !photo.url) {
        alert("Erro: Dados da foto inválidos.");
        return;
    }

    console.log("📸 Iniciando salvamento...");

    try {
      let targetProject = activeProject;

      // 1. Se não houver projeto, criar um rascunho
      if (!targetProject) {
          console.log("⚠️ Criando rascunho...");
          const draft: Project = {
              id: crypto.randomUUID(),
              userId: currentUser.id,
              title: 'Imóvel Rascunho ' + new Date().toLocaleTimeString(),
              address: 'Localização não definida',
              status: 'In Progress',
              photos: [], // Vazio inicialmente
              createdAt: Date.now(),
              coverImage: '' // Vazio inicialmente
          };
          targetProject = draft;
          // Não salvamos o rascunho vazio ainda, vamos adicionar a foto e salvar tudo junto
      }

      // 2. Prepara o objeto com a nova foto (ainda em Base64 para mostrar na UI rapidamente)
      const updatedPhotosLocal = [...(targetProject.photos || []), photo];
      const projectForUI = {
          ...targetProject,
          photos: updatedPhotosLocal,
          coverImage: targetProject.coverImage || photo.url // Usa a nova foto como capa se não houver
      };

      // 3. Atualiza UI IMEDIATAMENTE (Optimistic Update)
      setActiveProject(projectForUI);
      
      // Se for novo projeto, adiciona à lista; se for existente, atualiza
      if (!activeProject) {
          setProjects([projectForUI, ...projects]);
      } else {
          setProjects(prev => prev.map(p => p.id === targetProject!.id ? projectForUI : p));
      }

      // 4. Salva no Banco de Dados (Isto vai fazer o upload e retornar as URLs curtas)
      console.log("💾 Enviando para Firebase (Upload)...");
      
      // Adicionamos a foto ao projeto original para enviar para o storage
      const projectToSave = {
          ...targetProject,
          photos: [...(targetProject.photos || []), photo],
          coverImage: targetProject.coverImage || photo.url
      };

      const savedProject = await saveProject(projectToSave);
      console.log("✅ Salvo e Upload concluído!");

      // 5. Atualiza a UI com as URLs finais do servidor (para libertar memória)
      setActiveProject(savedProject);
      setProjects(prev => prev.map(p => p.id === savedProject.id ? savedProject : p));

    } catch (e: any) {
      console.error("❌ ERRO CRÍTICO AO SALVAR:", e);
      alert(`Falha ao salvar: ${e.message || "Erro desconhecido"}`);
    }
  };

// ... (Resto do ficheiro igual) ...
