import { api } from "@/services/api.js";

// Envia a imagem crua (o backend confere se e PNG, JPG ou WebP)
export async function uploadLogo(file) {
  try {
    return await api.put(`/api/branding/logo`, file, {
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });
  } catch (error) {
    return error.response;
  }
}

export async function removeLogo() {
  try {
    return await api.delete(`/api/branding/logo`);
  } catch (error) {
    return error.response;
  }
}

export async function saveCompanyName(companyName) {
  try {
    return await api.put(`/api/branding/company`, { companyName });
  } catch (error) {
    return error.response;
  }
}
