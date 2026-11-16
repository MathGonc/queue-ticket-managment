import { ref } from 'vue'
import {
  loadMonitorConfigs,
  saveMonitorConfigs,
  getGlobalTicketData,
  updateGlobalTicketData,
  resetGlobalTicketData
} from '@/controllers/globalController.js'

export function useGlobal() {
  const monitorConfig = ref(null)
  const globalTicketData = ref(null)
  const loading = ref(false)

  async function fetchMonitorConfigs() {
    loading.value = true
    try {
      const config = await loadMonitorConfigs()
      monitorConfig.value = config
      return config
    } finally {
      loading.value = false
    }
  }

  async function saveConfigs(updatedData) {
    loading.value = true
    try {
      const response = await saveMonitorConfigs(updatedData)
      return response
    } finally {
      loading.value = false
    }
  }

  async function fetchGlobalTicketData() {
    loading.value = true
    try {
      const response = await getGlobalTicketData()
      globalTicketData.value = response.data
      return response
    } finally {
      loading.value = false
    }
  }

  async function updateTicketData(data) {
    loading.value = true
    try {
      const response = await updateGlobalTicketData(data)
      return response
    } finally {
      loading.value = false
    }
  }

  async function resetTicketData() {
    loading.value = true
    try {
      const response = await resetGlobalTicketData()
      globalTicketData.value = null
      return response
    } finally {
      loading.value = false
    }
  }

  return {
    monitorConfig,
    globalTicketData,
    loading,
    fetchMonitorConfigs,
    saveConfigs,
    fetchGlobalTicketData,
    updateTicketData,
    resetTicketData,
  }
}
