import { useState, useCallback } from 'react'
import { api } from '../lib/api'
import { saveToken, clearToken, isAuthenticated } from '../lib/auth'

export function useAuth() {
  const [authed, setAuthed] = useState(isAuthenticated)

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await api.auth.login(email, password)
    saveToken(token)
    setAuthed(true)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { token } = await api.auth.register(email, password)
    saveToken(token)
    setAuthed(true)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setAuthed(false)
  }, [])

  return { authed, login, register, logout }
}
