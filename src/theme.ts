// theme.ts – controlo automático de tema

export function applySystemTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (prefersDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

// Listener para quando o usuário muda o tema do telefone
export function listenToThemeChanges() {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = (e: MediaQueryListEvent) => {
    if (e.matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  media.addEventListener("change", handler);
}
