import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import notFound from '@/pages/notFound.vue'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'index', component: { template: '<div>inicio</div>' } },
      { path: '/:pathMatch(.*)*', name: 'notFound', component: notFound },
    ],
  })
}

describe('pagina nao encontrada', () => {
  it('mostra o endereco pedido e volta ao inicio', async () => {
    const router = makeRouter()
    router.push('/nao/existe?x=1')
    await router.isReady()
    const wrapper = mount(notFound, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Página não encontrada')
    expect(wrapper.text()).toContain('/nao/existe?x=1')

    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('index')
  })
})
