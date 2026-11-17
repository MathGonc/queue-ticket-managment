import { ref, computed, watch } from "vue";

// Tema claro/escuro (modo de cor do Bootstrap 5.3: <html data-bs-theme>).
// - Padrao: segue o tema do Windows/navegador e acompanha a troca ao vivo.
// - O botao sol/lua grava a escolha neste navegador (localStorage). Escolher o
//   mesmo tema do sistema apaga a preferencia (volta a seguir o sistema).
// - O painel da TV (monitor) e sempre claro (forceLight).
// O index.html aplica o tema antes do Vue carregar, para nao piscar.

const STORAGE_KEY = "theme";
const media = typeof window !== "undefined" && window.matchMedia
  ? window.matchMedia("(prefers-color-scheme: dark)")
  : null;

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

const stored = ref(readStored());
const systemDark = ref(Boolean(media?.matches));
const forceLight = ref(false);
media?.addEventListener?.("change", (event) => {
  systemDark.value = event.matches;
});

const systemTheme = computed(() => (systemDark.value ? "dark" : "light"));
const theme = computed(() => (forceLight.value ? "light" : stored.value || systemTheme.value));

watch(
  theme,
  (value) => document.documentElement.setAttribute("data-bs-theme", value),
  { immediate: true }
);

function toggleTheme() {
  const next = theme.value === "dark" ? "light" : "dark";
  stored.value = next === systemTheme.value ? null : next;
  try {
    if (stored.value) localStorage.setItem(STORAGE_KEY, stored.value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sem localStorage: vale so nesta aba
  }
}

function setForceLight(value) {
  forceLight.value = Boolean(value);
}

export function useTheme() {
  return {
    theme,
    isDark: computed(() => theme.value === "dark"),
    toggleTheme,
    setForceLight,
  };
}
