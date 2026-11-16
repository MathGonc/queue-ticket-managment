import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuth } from '../auth.js'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('setToken', () => {
    it('should set token in store and localStorage', () => {
      const auth = useAuth()
      auth.setToken('test-token-123')

      expect(auth.token).toBe('test-token-123')
      expect(localStorage.getItem('token')).toBe('test-token-123')
      expect(auth.isAuth).toBe(true)
    })

    it('should overwrite existing token', () => {
      const auth = useAuth()
      auth.setToken('first-token')
      auth.setToken('second-token')

      expect(auth.token).toBe('second-token')
      expect(localStorage.getItem('token')).toBe('second-token')
    })
  })

  describe('clearToken', () => {
    it('should clear token from store and localStorage', () => {
      const auth = useAuth()
      auth.setToken('test-token')
      auth.clearToken()

      expect(auth.token).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
      expect(auth.isAuth).toBe(false)
    })
  })

  describe('setUserData', () => {
    it('should set user data', () => {
      const auth = useAuth()
      const userData = { username: 'testuser', role: 2 }
      auth.setUserData(userData)

      expect(auth.userData).toEqual(userData)
      expect(auth.getUsername).toBe('testuser')
    })

    it('should overwrite existing user data', () => {
      const auth = useAuth()
      auth.setUserData({ username: 'first' })
      auth.setUserData({ username: 'second', role: 3 })

      expect(auth.userData.username).toBe('second')
      expect(auth.userData.role).toBe(3)
    })
  })

  describe('getters', () => {
    it('isAuthenticated should return token value', () => {
      const auth = useAuth()
      expect(auth.isAuthenticated).toBeNull()

      auth.setToken('my-token')
      expect(auth.isAuthenticated).toBe('my-token')
    })

    it('getUsername should return username from userData', () => {
      const auth = useAuth()
      expect(auth.getUsername).toBe('')

      auth.setUserData({ username: 'admin' })
      expect(auth.getUsername).toBe('admin')
    })
  })
})
