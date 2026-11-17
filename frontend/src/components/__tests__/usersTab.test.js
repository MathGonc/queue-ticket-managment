import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  getUsers: vi.fn(),
  updateUser: vi.fn(),
  registerUser: vi.fn(),
  deleteUser: vi.fn(),
}))
vi.mock('@/controllers/userController.js', () => api)
vi.mock('@/services/notify.js', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import UsersTab from '@/components/config/UsersTab.vue'

const USERS = [
  { _id: 'u1', username: 'Ana Souza', login: 'ana.souza', role: 2 },
  { _id: 'u2', username: 'Admin', login: 'admin.geral', role: 3 },
]

async function mountTab() {
  const wrapper = mount(UsersTab, { attachTo: document.body, global: { stubs: { teleport: true } } })
  await flushPromises()
  return wrapper
}

const editButton = (wrapper, i = 0) => wrapper.findAll('button').filter((b) => b.text() === 'Editar')[i]

describe('usuarios: editar em janela', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    api.getUsers.mockResolvedValue({ data: { users: USERS } })
    api.updateUser.mockReset()
  })

  it('abre a janela com os dados do usuario e fecha com Esc', async () => {
    const wrapper = await mountTab()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    await editButton(wrapper).trigger('click')
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(wrapper.find('#edit-username').element.value).toBe('Ana Souza')
    expect(wrapper.find('#edit-login').element.value).toBe('ana.souza')

    await wrapper.find('.user-modal').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('salva so a senha quando preenchida e fecha a janela', async () => {
    api.updateUser.mockResolvedValue({ status: 200 })
    const wrapper = await mountTab()
    await editButton(wrapper, 1).trigger('click')

    await wrapper.find('#edit-username').setValue('Administrador')
    await wrapper.find('form.modal-content').trigger('submit')
    await flushPromises()

    expect(api.updateUser).toHaveBeenCalledWith('u2', { username: 'Administrador', login: 'admin.geral', role: '3' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('erro ao salvar mantem a janela aberta', async () => {
    api.updateUser.mockResolvedValue({ status: 400, data: { errors: [{ msg: 'Login invalido' }] } })
    const wrapper = await mountTab()
    await editButton(wrapper).trigger('click')
    await wrapper.find('#edit-password').setValue('nova123')
    await wrapper.find('form.modal-content').trigger('submit')
    await flushPromises()

    expect(api.updateUser).toHaveBeenCalledWith('u1', { username: 'Ana Souza', login: 'ana.souza', role: '2', password: 'nova123' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
