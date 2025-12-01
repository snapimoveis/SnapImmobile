// ... (Mantenha os imports iguais, apenas atualize a função handlePhotoCaptured)

  const handlePhotoCaptured = async (photo: Photo) => {
    if (!currentUser) {
        alert("Erro: Utilizador não autenticado. Faça login novamente.");
        return;
    }
    
    console.log("📸 Iniciando processo de salvamento da foto:", photo.id);

    try {
      // Caso 1: Criar Projeto Rascunho se não existir
      if (!activeProject) {
          console.log("⚠️ Nenhum projeto ativo. Criando rascunho...");
          const draft: Project = {
              id: crypto.randomUUID(),
              userId: currentUser.id,
              title: 'Imóvel Rascunho ' + new Date().toLocaleTimeString(),
              address: 'Localização não definida',
              status: 'In Progress',
              photos: [photo], // A foto vai aqui
              createdAt: Date.now(),
              coverImage: photo.url
          };
          
          // Salva no Firestore
          const savedDraft = await saveProject(draft); 
          console.log("✅ Projeto Rascunho criado com sucesso:", savedDraft.id);
          
          // Atualiza Estado
          setProjects([savedDraft, ...projects]);
          setActiveProject(savedDraft);
          return;
      }

      // Caso 2: Adicionar ao Projeto Existente
      console.log("📂 Adicionando ao projeto:", activeProject.title);
      
      // Gera descrição em background (não bloqueia o salvamento)
      generateDescription(photo.url).then((desc) => {
          console.log("🤖 Descrição IA:", desc);
      }).catch(err => console.warn("⚠️ Erro na descrição IA (ignorado):", err));

      // Cria o objeto atualizado
      const updatedProject = {
          ...activeProject,
          photos: [...activeProject.photos, photo],
          // Se não tiver capa, usa esta foto
          coverImage: activeProject.coverImage || photo.url 
      };

      // Atualiza o estado local imediatamente (UI mais rápida)
      setActiveProject(updatedProject);
      
      // Persiste no Firestore
      await saveProject(updatedProject);
      console.log("✅ Foto salva no projeto com sucesso!");

      // Atualiza a lista geral de projetos
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));

    } catch (e: any) {
      console.error("❌ ERRO CRÍTICO AO SALVAR FOTO:", e);
      
      if (e.code === 'permission-denied') {
          alert("Erro de Permissão: O Firebase bloqueou o salvamento. Verifique se está logado.");
      } else if (e.code === 'storage/quota-exceeded') {
          alert("Erro: Cota de armazenamento excedida.");
      } else {
          alert(`Erro ao salvar a foto: ${e.message || e}`);
      }
    }
  };

// ... (Resto do ficheiro igual)
