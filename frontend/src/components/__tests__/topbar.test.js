import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import topbar from '@/components/topbar.vue'
import { envFlag } from '@/utils/index.js'

const mockConfig = vi.hoisted(() => ({ showLogo: true }))
vi.mock('@/config.js', () => ({ default: mockConfig }))

describe('topbar', () => {
  it('mostra o logo por padrao', () => {
    mockConfig.showLogo = true
    expect(mount(topbar).find('img.logo').exists()).toBe(true)
  })

  it('oculta o logo com VITE_SHOW_LOGO=false', () => {
    mockConfig.showLogo = false
    const wrapper = mount(topbar)
    expect(wrapper.find('img.logo').exists()).toBe(false)
    expect(wrapper.find('.topbar').exists()).toBe(false)
  })
})

describe('envFlag', () => {
  it('ausente ou vazio usa o padrao', () => {
    expect(envFlag(undefined, true)).toBe(true)
    expect(envFlag('', true)).toBe(true)
    expect(envFlag('  ', false)).toBe(false)
  })

  it('reconhece valores falsos', () => {
    for (const v of ['false', 'FALSE', '0', 'nao', 'não', 'off', ' false ']) {
      expect(envFlag(v, true)).toBe(false)
    }
  })

  it('reconhece valores verdadeiros', () => {
    for (const v of ['true', '1', 'sim', 'on']) {
      expect(envFlag(v, false)).toBe(true)
    }
  })

  it('valor desconhecido usa o padrao', () => {
    expect(envFlag('talvez', true)).toBe(true)
  })
})
