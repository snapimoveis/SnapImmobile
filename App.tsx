// ... (Mantenha os imports como estão, substitua apenas a função handleLoginSubmit)

  const handleLoginSubmit = async (email: string, password?: string) => {
      try {
          console.log("Iniciando login...");
          const user = await loginUser(email, password);
          console.log("Login sucesso:", user);
          
          saveUserSession(user);
          setCurrentUser(user);
          
          try {
            const userProjects = await getUserProjects(user.id);
            setProjects(userProjects);
          } catch (projError) {
            console.error("Erro ao carregar projetos (mas login OK):", projError);
            // Não bloqueia o login se falhar projetos
          }
          
          setCurrentRoute(AppRoute.DASHBOARD);
      } catch (e: any) {
          console.error("Erro detalhado no login:", e);
          
          let msg = "Falha no login.";
          
          // Erros comuns do Firebase
          if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
              msg = "E-mail ou senha incorretos.";
          } else if (e.code === 'auth/too-many-requests') {
              msg = "Muitas tentativas falhadas. Tente novamente mais tarde.";
          } else if (e.message && e.message.includes('DEVICE_NOT_ALLOWED')) {
              msg = "Acesso bloqueado: Esta conta está vinculada a outro dispositivo.";
          } else if (e.message && e.message.includes('network-request-failed')) {
             msg = "Erro de conexão. Verifique a sua internet.";
          } else if (e.message && e.message.includes('403')) {
             msg = "Acesso negado pelo servidor (Domínio não autorizado).";
          }
          
          alert(msg);
      }
  };

// ... (Resto do App.tsx)
