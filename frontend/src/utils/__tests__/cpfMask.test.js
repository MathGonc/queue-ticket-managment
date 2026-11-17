import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CpfInput from './fixtures/CpfInput.vue'
import { onlyDigits, isValidCpf } from '@/utils/index.js'

describe('isValidCpf', () => {
  it('aceita CPF com digitos verificadores certos, com ou sem mascara', () => {
    expect(isValidCpf('11122233396')).toBe(true)
    expect(isValidCpf('111.222.333-96')).toBe(true)
    // 1o digito verificador com resto 10 vira 0
    expect(isValidCpf('22233344405')).toBe(true)
  })

  it('recusa digito verificador errado, incompleto, repetido e vazio', () => {
    expect(isValidCpf('11122233344')).toBe(false)
    expect(isValidCpf('11122233395')).toBe(false)
    expect(isValidCpf('1112223339')).toBe(false)
    expect(isValidCpf('11111111111')).toBe(false)
    expect(isValidCpf('')).toBe(false)
    expect(isValidCpf(null)).toBe(false)
  })
})

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
