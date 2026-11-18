import { describe, it, expect } from 'vitest'
import { convertDate, convertHours, isValidDate, calculateAge, shortDateTime, toDateOnly, fromDateOnly, visitText, visitHistoryText, formatCpf, notesText, matchesSearch, timeWithDay, firstWord } from '@/utils/index.js'

describe('Utils', () => {
  describe('convertDate', () => {
    it('should return undefined for falsy input', () => {
      expect(convertDate(null)).toBeUndefined()
      expect(convertDate(undefined)).toBeUndefined()
      expect(convertDate('')).toBeUndefined()
    })

    it('should format a valid date string', () => {
      const result = convertDate('2024-03-15T14:30:00Z')
      expect(result).toBeDefined()
      expect(result).toContain('às')
    })

    it('should format a Date object', () => {
      const date = new Date(2024, 2, 15, 10, 30, 0)
      const result = convertDate(date)
      expect(result).toBeDefined()
      expect(result).toContain('às')
    })

    it('should truncate result to 19 characters', () => {
      const result = convertDate('2024-03-15T14:30:00Z')
      expect(result.length).toBeLessThanOrEqual(19)
    })
  })

  describe('convertHours', () => {
    it('should convert 0 ms to 0h 0m 0s', () => {
      expect(convertHours(0)).toBe('0h 0m 0s')
    })

    it('should convert 3661000 ms to 1h 1m 1s', () => {
      expect(convertHours(3661000)).toBe('1h 1m 1s')
    })

    it('should convert 7200000 ms to 2h 0m 0s', () => {
      expect(convertHours(7200000)).toBe('2h 0m 0s')
    })

    it('should convert 90000 ms to 0h 1m 30s', () => {
      expect(convertHours(90000)).toBe('0h 1m 30s')
    })

    it('should handle large values', () => {
      // 25 hours, 30 minutes, 45 seconds
      const ms = (25 * 3600 + 30 * 60 + 45) * 1000
      expect(convertHours(ms)).toBe('25h 30m 45s')
    })
  })

  describe('isValidDate', () => {
    it('should return true for valid date strings', () => {
      expect(isValidDate('2024-03-15')).toBe(true)
      expect(isValidDate('2024-01-01T00:00:00Z')).toBe(true)
      expect(isValidDate('March 15, 2024')).toBe(true)
    })

    it('should return false for invalid date strings', () => {
      expect(isValidDate('not-a-date')).toBe(false)
      expect(isValidDate('abc')).toBe(false)
      expect(isValidDate('')).toBe(false)
    })

    it('should return true for Date objects passed as strings', () => {
      expect(isValidDate(new Date().toISOString())).toBe(true)
    })
  })

  describe('calculateAge', () => {
    it('should return false for null input', () => {
      expect(calculateAge(null)).toBe(false)
    })

    it('should calculate age correctly', () => {
      const today = new Date()
      const birthYear = today.getFullYear() - 30
      const birthDate = new Date(birthYear, 0, 1) // Jan 1, 30 years ago
      const age = calculateAge(birthDate.toISOString())
      expect(age).toBe(30)
    })

    it('should account for birthday not yet passed this year', () => {
      const today = new Date()
      // Set birthday to next month (hasn't happened yet this year)
      const futureMonth = today.getMonth() + 2 // +2 to ensure it's in the future
      const birthYear = today.getFullYear() - 25
      
      if (futureMonth <= 12) {
        const birthDate = new Date(birthYear, futureMonth - 1, 15)
        const age = calculateAge(birthDate.toISOString())
        expect(age).toBe(24) // Not yet 25
      }
    })

    it('should handle age 0 for babies', () => {
      const today = new Date()
      const recentBirth = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const age = calculateAge(recentBirth.toISOString())
      expect(age).toBe(0)
    })

    it('should handle elderly ages', () => {
      const today = new Date()
      const birthDate = new Date(today.getFullYear() - 85, 0, 1)
      const age = calculateAge(birthDate.toISOString())
      expect(age).toBe(85)
    })
  })
})

describe('shortDateTime', () => {
  const now = new Date(2026, 10, 16, 22, 0)
  it('hoje, ontem e outros dias numa linha curta', () => {
    expect(shortDateTime(new Date(2026, 10, 16, 21, 29), now)).toBe('hoje às 21:29')
    expect(shortDateTime(new Date(2026, 10, 15, 8, 5), now)).toBe('ontem às 08:05')
    expect(shortDateTime(new Date(2026, 10, 9, 14, 40), now)).toBe('09/11 às 14:40')
  })
  it('sem data ou data invalida: vazio', () => {
    expect(shortDateTime(null, now)).toBe('')
    expect(shortDateTime('xx', now)).toBe('')
  })
})

describe('data de nascimento como dia (AAAA-MM-DD)', () => {
  it('ida e volta pela data local, sem mudar de dia', () => {
    const d = new Date(1950, 2, 3, 23, 30)
    expect(toDateOnly(d)).toBe('1950-03-03')
    const back = fromDateOnly('1950-03-03')
    expect([back.getFullYear(), back.getMonth(), back.getDate()]).toEqual([1950, 2, 3])
  })

  it('vazio ou invalido vira null', () => {
    expect(toDateOnly(null)).toBe(null)
    expect(toDateOnly('xx')).toBe(null)
    expect(fromDateOnly('')).toBe(null)
    expect(fromDateOnly('03/03/1950')).toBe(null)
  })
})

describe('textos de visitas', () => {
  const anterior = { data: new Date(2026, 9, 3, 10), tipo: 'RETORNO' }

  it('triagem e barra lateral', () => {
    expect(visitText({ numero: 4, anterior })).toBe('4ª visita · última em 03/10/2026 (RETORNO)')
    expect(visitText({ numero: 1 })).toBe('1ª visita (primeira vez)')
    // Senha antiga na barra: a pessoa ja voltou depois
    expect(visitText({ numero: 2, total: 3, anterior: { ...anterior, tipo: '' } })).toBe('2ª de 3 visitas · última em 03/10/2026')
  })

  it('historico: esta visita e o total de hoje', () => {
    expect(visitHistoryText({ numero: 3, total: 7, primeira: new Date(2023, 6, 17, 9), ultima: new Date(2026, 10, 10, 9) }))
      .toBe('3ª de 7 visitas · primeira em 17/07/2023 · última em 10/11/2026')
    expect(visitHistoryText({ numero: 1, total: 1, primeira: new Date(), ultima: new Date() })).toBe('Única visita')
  })
})

describe('CPF formatado e anotacoes do (i)', () => {
  it('formata 11 digitos e deixa o resto como veio', () => {
    expect(formatCpf('07787808136')).toBe('077.878.081-36')
    expect(formatCpf('136068')).toBe('136068')
  })

  it('uma linha por anotacao, so as preenchidas', () => {
    expect(notesText({ notaTriagem: 'chegou cedo', notaAtendimento: 'trouxe RG' })).toBe('Triagem: chegou cedo\nAtendimento: trouxe RG')
    expect(notesText({ notaTriagem: '', notaAtendimento: 'x' })).toBe('Atendimento: x')
    expect(notesText({})).toBe('')
  })
})

describe('busca que filtra enquanto digita', () => {
  const campos = ['MARIA DA CONCEIÇÃO', '12345678901', 54, 'RETORNO']
  it('cada palavra em algum campo, sem acento nem maiuscula', () => {
    expect(matchesSearch(campos, 'conceicao maria')).toBe(true)
    expect(matchesSearch(campos, 'retorno')).toBe(true)
    expect(matchesSearch(campos, 'joao')).toBe(false)
    expect(matchesSearch(campos, '')).toBe(true)
  })
  it('CPF com ou sem pontuacao e numero da senha', () => {
    expect(matchesSearch(campos, '123.456')).toBe(true)
    expect(matchesSearch(campos, '54')).toBe(true)
  })
})

describe('cartoes da barra lateral', () => {
  const now = new Date(2026, 10, 17, 18, 0)
  it('hora com o dia entre parenteses', () => {
    expect(timeWithDay(new Date(2026, 10, 17, 17, 35), now)).toBe('17:35 (hoje)')
    expect(timeWithDay(new Date(2026, 10, 16, 16, 0), now)).toBe('16:00 (ontem)')
    expect(timeWithDay(new Date(2026, 10, 9, 14, 40), now)).toBe('14:40 (09/11)')
  })
  it('so o primeiro nome', () => {
    expect(firstWord('Andre de Lima')).toBe('Andre')
    expect(firstWord('')).toBe('')
  })
})
