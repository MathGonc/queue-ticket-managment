import { ref } from 'vue'
import {
  getUsers,
  updateUser,
  deleteUser,
  registerUser
} from '@/controllers/userController.js'

export function useUsers() {
  const users = ref([])
  const loading = ref(false)

  async function loadUsers() {
    loading.value = true
    try {
      const response = await getUsers()
      users.value = response.data
      return response
    } finally {
      loading.value = false
    }
  }

  async function editUser(id, userData) {
    loading.value = true
    try {
      const response = await updateUser(id, userData)
      return response
    } finally {
      loading.value = false
    }
  }

  async function removeUser(id) {
    loading.value = true
    try {
      const response = await deleteUser(id)
      return response
    } finally {
      loading.value = false
    }
  }

  async function createUser(data) {
    loading.value = true
    try {
      const response = await registerUser(data)
      return response
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    loadUsers,
    editUser,
    removeUser,
    createUser,
  }
}
