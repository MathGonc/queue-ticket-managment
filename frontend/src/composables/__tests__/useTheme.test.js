import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

// O modulo guarda estado global: cada teste carrega uma copia nova
async function loadTheme({ systemDark = false, stored = null } = {}) {
  vi.resetModules()
  localStorage.clear()
  if (stored) localStorage.setItem('theme', stored)
  const listeners = []
  window.matchMedia = vi.fn(() => ({
    matches: systemDark,
    addEventListener: (_, fn) => listeners.push(fn),
  }))
  const { useTheme } = await import('@/composables/useTheme.js')
  const api = useTheme()
  const changeSystem = async (dark) => { listeners.forEach((fn) => fn({ matches: dark })); await nextTick() }
  return { ...api, changeSystem }
}

const htmlTheme = () => document.documentElement.getAttribute('data-bs-theme')

describe('tema', () => {
  beforeEach(() => document.documentElement.removeAttribute('data-bs-theme'))

  it('segue o sistema por padrao e acompanha a troca ao vivo', async () => {
    const t = await loadTheme({ systemDark: true })
    expect(t.theme.value).toBe('dark')
    expect(htmlTheme()).toBe('dark')
    await t.changeSystem(false)
    expect(t.theme.value).toBe('light')
    expect(htmlTheme()).toBe('light')
  })

  it('o botao grava a escolha neste navegador', async () => {
    const t = await loadTheme({ systemDark: false })
    t.toggleTheme()
    await nextTick()
    expect(t.theme.value).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    await t.changeSystem(false)
    expect(t.theme.value).toBe('dark')
  })

  it('voltar ao mesmo tema do sistema apaga a preferencia', async () => {
    const t = await loadTheme({ systemDark: false, stored: 'dark' })
    expect(t.theme.value).toBe('dark')
    t.toggleTheme()
    await nextTick()
    expect(t.theme.value).toBe('light')
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('o painel da TV fica sempre claro', async () => {
    const t = await loadTheme({ systemDark: true, stored: 'dark' })
    t.setForceLight(true)
    await nextTick()
    expect(htmlTheme()).toBe('light')
    t.setForceLight(false)
    await nextTick()
    expect(htmlTheme()).toBe('dark')
  })
})
