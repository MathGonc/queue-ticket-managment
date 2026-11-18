import { ref } from "vue";
import { publicSocket } from "@/socket.js";
import { getTiposAtendimento } from "@/controllers/globalController.js";
import { TIPOS } from "@/utils/tipos.js";

// Tipos de atendimento em uso (editaveis em Configuracoes). Uma lista so para
// o app inteiro; recarrega quando um admin salva em qualquer tela.
const tipos = ref([...TIPOS]);
let loaded = false;

export async function reloadTipos() {
  try {
    tipos.value = await getTiposAtendimento();
  } catch {
    // Sem conexao: fica a ultima lista (ou a padrao)
  }
}

publicSocket.on("tiposAtualizados", reloadTipos);

export function useTipos() {
  if (!loaded) {
    loaded = true;
    reloadTipos();
  }
  return { tipos, reloadTipos };
}
