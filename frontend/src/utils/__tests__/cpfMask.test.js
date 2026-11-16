import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CpfInput from './fixtures/CpfInput.vue'
import { onlyDigits } from '@/utils/index.js'

describe('onlyDigits', () => {
  it('remove pontuacao do CPF', () => {
    expect(onlyDigits('123.456.789-01')).toBe('12345678901')
  })

  it('trata vazio e nulo', () => {
    expect(onlyDigits('')).toBe('')
    expect(onlyDigits(null)).toBe('')
    expect(onlyDigits(undefined)).toBe('')
  })
})

describe('CPF na triagem (maska 3)', () => {
  it('mascara o valor digitado e o envio extrai so os digitos', async () => {
    const wrapper = mount(CpfInput)
    await wrapper.find('input').setValue('12345678901')
    await nextTick()

    expect(wrapper.vm.docNumber.masked).toBe('123.456.789-01')
    expect(onlyDigits(wrapper.vm.docNumber.masked)).toBe('12345678901')
  })
})
