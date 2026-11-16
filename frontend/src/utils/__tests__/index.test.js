import { describe, it, expect } from 'vitest'
import { convertDate, convertHours, isValidDate, calculateAge } from '../index.js'

describe('convertDate', () => {
  it('should return undefined for falsy input', () => {
    expect(convertDate(null)).toBeUndefined()
    expect(convertDate(undefined)).toBeUndefined()
    expect(convertDate('')).toBeUndefined()
  })

  it('should format a valid date string', () => {
    const result = convertDate('2024-06-15T14:30:00Z')
    expect(result).toBeDefined()
    expect(result).toContain('às')
  })

  it('should return a string with date and time', () => {
    const result = convertDate('2024-01-01T10:00:00')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('convertHours', () => {
  it('should convert 0 ms to 0h 0m 0s', () => {
    expect(convertHours(0)).toBe('0h 0m 0s')
  })

  it('should convert 3600000 ms to 1h 0m 0s', () => {
    expect(convertHours(3600000)).toBe('1h 0m 0s')
  })

  it('should convert 3661000 ms to 1h 1m 1s', () => {
    expect(convertHours(3661000)).toBe('1h 1m 1s')
  })

  it('should handle minutes only', () => {
    expect(convertHours(300000)).toBe('0h 5m 0s')
  })

  it('should handle seconds only', () => {
    expect(convertHours(45000)).toBe('0h 0m 45s')
  })
})

describe('isValidDate', () => {
  it('should return true for valid date strings', () => {
    expect(isValidDate('2024-01-01')).toBe(true)
    expect(isValidDate('2024-06-15T14:30:00Z')).toBe(true)
  })

  it('should return false for invalid date strings', () => {
    expect(isValidDate('not-a-date')).toBe(false)
    expect(isValidDate('abc')).toBe(false)
  })

  it('should return true for Date object string representation', () => {
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
    const birthDate = `${birthYear}-01-01`
    const age = calculateAge(birthDate)
    // Age should be 30 or 29 depending on current date
    expect(age).toBeGreaterThanOrEqual(29)
    expect(age).toBeLessThanOrEqual(30)
  })

  it('should handle birthday not yet passed this year', () => {
    const today = new Date()
    const futureMonth = today.getMonth() + 2 // 2 months from now
    if (futureMonth <= 12) {
      const birthYear = today.getFullYear() - 25
      const birthDate = `${birthYear}-${String(futureMonth).padStart(2, '0')}-28`
      const age = calculateAge(birthDate)
      expect(age).toBe(24)
    }
  })

  it('should return 0 for a baby born this year', () => {
    const today = new Date()
    const birthDate = `${today.getFullYear()}-01-01`
    const age = calculateAge(birthDate)
    expect(age).toBeGreaterThanOrEqual(0)
    expect(age).toBeLessThanOrEqual(1)
  })
})
