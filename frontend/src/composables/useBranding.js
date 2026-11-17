import { ref, computed } from "vue";
import { api } from "@/services/api.js";
import config from "@/config.js";
import { publicSocket } from "@/socket.js";

// Identidade da empresa: logo (arquivo em data/ no servidor) e nome (config
// global no banco). Carrega uma vez e se atualiza sozinho quando um admin
// troca o logo ou o nome em outra tela (evento receiveUpdateBranding).

const companyName = ref("");
const logoVersion = ref(null);
let started = false;

async function loadBranding() {
  try {
    const { data } = await api.get("/api/branding");
    companyName.value = data.companyName || "";
    logoVersion.value = data.logo?.version ?? null;
  } catch {
    // sem conexao: mantem o que ja tinha
  }
}

// A versao no endereco evita que o navegador mostre o logo antigo do cache
const logoUrl = computed(() =>
  logoVersion.value ? `${config.url_server}/api/branding/logo?v=${logoVersion.value}` : null
);

export function useBranding() {
  if (!started) {
    started = true;
    loadBranding();
    publicSocket.on("receiveUpdateBranding", loadBranding);
  }
  return { companyName, logoUrl, loadBranding };
}
