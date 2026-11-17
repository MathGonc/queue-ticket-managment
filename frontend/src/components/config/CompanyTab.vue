<template>
  <div class="row justify-content-center g-3">
    <div class="col-12 col-md-auto">
      <div class="menu-default config-card company-card">
        <h5>Logo</h5>
        <div class="logo-preview mb-3">
          <img v-if="logoUrl" :src="logoUrl" :alt="companyName || 'Logo atual'" />
          <span v-else class="text-body-secondary small">Nenhum logo importado. O topo das telas fica sem logo.</span>
        </div>
        <p class="small text-muted-qtm mb-3">
          PNG, JPG ou WebP, até 2 MB. Aparece no topo das telas, no painel e no PDF do histórico.
        </p>
        <input ref="fileInput" type="file" class="d-none" accept="image/png,image/jpeg,image/webp" @change="handleFile" />
        <button type="button" class="btn btn-outline-primary me-2" :disabled="busy" @click="fileInput.click()">
          <Upload :size="16" class="icon" /> {{ logoUrl ? "Trocar logo" : "Importar logo" }}
        </button>
        <button v-if="logoUrl" type="button" class="btn btn-outline-danger" :disabled="busy" @click="handleRemove">
          Remover logo
        </button>
      </div>
    </div>

    <div class="col-12 col-md-auto">
      <div class="menu-default config-card company-card">
        <h5>Empresa</h5>
        <form @submit.prevent="handleSaveName">
          <label class="form-label" for="company-name">Nome da empresa</label>
          <!-- 3 linhas: nomes oficiais costumam ser longos; Enter salva em vez de quebrar linha -->
          <textarea
            id="company-name"
            v-model="nameDraft"
            rows="3"
            maxlength="120"
            class="form-control mb-2"
            placeholder="Ex.: Defensoria Pública da União"
            @keydown.enter.prevent="handleSaveName"></textarea>
          <p class="small text-muted-qtm mb-3">Aparece no cabeçalho do PDF do histórico.</p>
          <button type="submit" class="btn btn-primary" :disabled="busy || nameDraft.replace(/\s+/g, ' ').trim() === companyName">
            Salvar nome
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { Upload } from "lucide-vue-next";
import { toast } from "@/services/notify.js";
import { useBranding } from "@/composables/useBranding.js";
import { uploadLogo, removeLogo, saveCompanyName } from "@/controllers/brandingController.js";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

const { companyName, logoUrl, loadBranding } = useBranding();
const fileInput = ref(null);
const busy = ref(false);
const nameDraft = ref(companyName.value);
watch(companyName, (value) => { nameDraft.value = value; });

async function handleFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (!TYPES.includes(file.type)) return toast.error("Escolha uma imagem PNG, JPG ou WebP.");
  if (file.size > MAX_BYTES) return toast.error("A imagem passa de 2 MB. Reduza o tamanho e tente de novo.");

  busy.value = true;
  const response = await uploadLogo(file);
  busy.value = false;
  if (response?.status === 200) {
    await loadBranding();
    toast.success("Logo importado");
  } else {
    toast.error(response?.data?.error || "Não foi possível importar o logo.");
  }
}

async function handleRemove() {
  if (!confirm("Remover o logo? O topo das telas e o PDF ficam sem logo.")) return;
  busy.value = true;
  const response = await removeLogo();
  busy.value = false;
  if (response?.status === 200) {
    await loadBranding();
    toast.success("Logo removido");
  } else {
    toast.error(response?.data?.error || "Não foi possível remover o logo.");
  }
}

async function handleSaveName() {
  // Texto colado com quebras de linha vira uma linha so
  const name = nameDraft.value.replace(/\s+/g, " ").trim();
  if (busy.value || name === companyName.value) return;
  busy.value = true;
  const response = await saveCompanyName(name);
  busy.value = false;
  if (response?.status === 200) {
    await loadBranding();
    toast.success("Nome da empresa salvo");
  } else {
    toast.error(response?.data?.error || "Não foi possível salvar o nome.");
  }
}
</script>

<style scoped>
.company-card {
  max-width: 460px;
}

.company-card form {
  width: min(400px, 80vw);
}

#company-name {
  resize: none;
}

.logo-preview {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--bs-border-color);
  border-radius: 10px;
  padding: 12px;
}

.logo-preview img {
  max-height: 120px;
  max-width: 100%;
  object-fit: contain;
}

/* Mesma placa clara do topo no tema escuro */
[data-bs-theme="dark"] .logo-preview img {
  background: #eef0f2;
  padding: 6px 14px;
  border-radius: 10px;
}
</style>
