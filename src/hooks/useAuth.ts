import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { applyAuthSession, authRedirectUrl, initializeAuth, clearAuthCallbackError } from '@/lib/auth'

export function useAuthInit() {
  useEffect(() => { void initializeAuth() }, [])
}

export async function sendMagicLink(email: string) {
  await initializeAuth()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: authRedirectUrl() },
  })
  if (error) throw error
}

export async function verifyEmailCode(email: string, token: string) {
  await initializeAuth()
  const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' })
  if (error) throw error
  if (!data.session) throw new Error('验证码未返回有效会话，请重新发送邮件。')
  clearAuthCallbackError()
  applyAuthSession(data.session)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  applyAuthSession(null)
}

export async function signInWithPassword(email: string, password: string) {
  await initializeAuth()
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
  if (!data.session) throw new Error('登录未返回有效会话，请重试。')
  clearAuthCallbackError()
  applyAuthSession(data.session)
  return data
}

export async function signUpWithPassword(email: string, password: string) {
  await initializeAuth()
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(), password,
    options: { emailRedirectTo: authRedirectUrl() },
  })
  if (error) throw error
  if (!data.session && data.user?.identities?.length === 0) {
    throw new Error('该邮箱已注册，请直接登录或使用魔法链接')
  }
  if (data.session) {
    clearAuthCallbackError()
    applyAuthSession(data.session)
  }
  return data
}

export async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo: authRedirectUrl() })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

/** Route context props may lag behind a synchronous SIGNED_IN event. */
export async function getCurrentAuth() {
  await initializeAuth()
  return useAuthStore.getState()
}
