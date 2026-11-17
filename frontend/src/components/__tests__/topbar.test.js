import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import topbar from '@/components/topbar.vue'
import { escapeHtml } from '@/utils/index.js'

const branding = vi.hoisted(() => ({ companyName: null, logoUrl: null }))
vi.mock('@/composables/useBranding.js', () => ({
  useBranding: () => ({ companyName: branding.companyName, logoUrl: branding.logoUrl }),
}))

describe('topbar', () => {
  it('mostra o logo importado com o nome da empresa como texto alternativo', () => {
    branding.companyName = ref('Defensoria Teste')
    branding.logoUrl = ref('http://x:3030/api/branding/logo?v=1')
    const img = mount(topbar).find('img.logo')
    expect(img.attributes('src')).toBe('http://x:3030/api/branding/logo?v=1')
    expect(img.attributes('alt')).toBe('Defensoria Teste')
  })

  it('sem logo importado, o topo fica vazio', () => {
    branding.companyName = ref('')
    branding.logoUrl = ref(null)
    const wrapper = mount(topbar)
    expect(wrapper.find('.topbar').exists()).toBe(false)
  })
})

describe('escapeHtml', () => {
  it('neutraliza HTML no nome da empresa (PDF)', () => {
    expect(escapeHtml('<b>"A" & \'B\'</b>')).toBe('&lt;b&gt;&quot;A&quot; &amp; &#39;B&#39;&lt;/b&gt;')
    expect(escapeHtml(null)).toBe('')
  })
})
