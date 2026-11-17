import { describe, it, expect } from 'vitest'
import { toCsv } from '@/utils/csv.js'

describe('toCsv', () => {
  const columns = [
    { label: 'Nome', value: (r) => r.nome },
    { label: 'Detalhes', value: (r) => r.det },
  ]

  it('comeca com BOM e usa ; e CRLF (Excel em portugues)', () => {
    const csv = toCsv([{ nome: 'Ana', det: 'ok' }], columns)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.slice(1)).toBe('Nome;Detalhes\r\nAna;ok')
  })

  it('protege ; aspas e quebras de linha', () => {
    const csv = toCsv([{ nome: 'a;b', det: 'diz "oi"\nfim' }], columns)
    expect(csv.slice(1).split('\r\n')[1]).toBe('"a;b";"diz ""oi""\nfim"')
  })

  it('nulo e indefinido viram vazio', () => {
    expect(toCsv([{ nome: null, det: undefined }], columns).slice(1).split('\r\n')[1]).toBe(';')
  })
})
