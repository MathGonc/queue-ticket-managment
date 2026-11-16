import { describe, it, expect } from 'vitest'
import { convertDate, convertHours, isValidDate, calculateAge } from '@/utils/index.js'

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
