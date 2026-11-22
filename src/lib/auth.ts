import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useAuthStore } from '@/store/authStore'

// Capture callback parameters before the router replaces the entry URL.
const entryUrl = new URL(window.location.href)
const callbackKeys = ['code', 'token_hash', 'access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'type', 'error', 'error_code', 'error_description', 'provider_token', 'provider_refresh_token']
let initialization: Promise<void> | undefined
let initialized = false
let callbackError: string | null = null

export function authErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  const message = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) return '邮箱或密码不正确。若之前只使用魔法链接，请先登录后在“我的”中设置密码。'
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) return '邮箱尚未验证，请先打开验证邮件中的链接，再登录。'
  if (code === 'otp_expired' || /expired|invalid.*(token|otp)|token.*invalid/i.test(message)) return '登录链接已失效或已使用，请重新发送邮件并打开最新的链接。'
  if (/code verifier|pkce|flow_state/i.test(code + ' ' + message)) return '此链接需要在发送邮件时使用的同一浏览器中打开。请返回该浏览器，或重新发送魔法链接。'
  if (code === 'user_already_exists' || /already registered/i.test(message)) return '该邮箱已注册，请直接登录或使用魔法链接。'
  if (code === 'weak_password') return '密码不符合安全要求，请使用至少 8 位并符合服务端密码策略的密码。'
  if (/rate_limit|over_.*limit/.test(code) || /rate limit|too many requests/i.test(message)) return '请求过于频繁，请稍后再试。'
  if (/signup_disabled|email_provider_disabled/.test(code)) return '当前服务端未开启邮箱注册或邮箱登录，请联系管理员检查认证配置。'
  if (/fetch|network|timeout/i.test(message)) return '无法连接认证服务，请检查网络后重试。'
  return message || '认证失败，请重试。'
}

export function applyAuthSession(session: Session | null) {
  useAuthStore.setState({ session, user: session?.user ?? null, loading: false })
}

function cleanCallbackUrl() {
  const url = new URL(window.location.href)
  callbackKeys.forEach((key) => url.searchParams.delete(key))
  const hash = new URLSearchParams(url.hash.slice(1))
  callbackKeys.forEach((key) => hash.delete(key))
  url.hash = hash.toString() ? `#${hash}` : ''
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
}

export function clearAuthCallbackError() {
  callbackError = null
}

export function getAuthCallbackError() {
  return callbackError
}

/** Single bootstrap shared by React and route guards; each callback is consumed once. */
export function initializeAuth(): Promise<void> {
  if (initialization) return initialization
  // Keep this callback synchronous: calling another auth method while the SDK
  // invokes subscribers can deadlock its internal session lock.
  supabase.auth.onAuthStateChange((_event, session) => {
    if (initialized) applyAuthSession(session)
  })
  initialization = (async () => {
    const params = new URLSearchParams(entryUrl.search)
    const hash = new URLSearchParams(entryUrl.hash.slice(1))
    const param = (key: string) => params.get(key) ?? hash.get(key)
    const isCallback = callbackKeys.some((key) => params.has(key) || hash.has(key))
    try {
      const { error: initializationError } = await supabase.auth.initialize()
      if (param('error') || param('error_description')) {
        throw { code: param('error_code'), message: param('error_description') ?? '邮件验证失败，请重新发送链接。' }
      }
      if (initializationError) throw initializationError
      if (param('code')) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(param('code')!)
        if (error) throw error
        if (!data.session) throw new Error('登录授权码未返回有效会话，请重新发送邮件。')
      } else if (param('access_token') || param('refresh_token')) {
        if (!param('access_token') || !param('refresh_token')) throw new Error('登录链接缺少会话凭据，请重新发送邮件。')
        const { data, error } = await supabase.auth.setSession({
          access_token: param('access_token')!, refresh_token: param('refresh_token')!,
        })
        if (error) throw error
        if (!data.session) throw new Error('登录链接未返回有效会话，请重新发送邮件。')
      } else if (param('token_hash')) {
        const type = param('type')
        if (type !== 'signup' && type !== 'magiclink' && type !== 'email') throw new Error('此验证链接类型不适用于登录，请重新发送登录邮件。')
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: param('token_hash')!, type })
        if (error) throw error
        if (!data.session) throw new Error('邮箱已验证，但未建立登录会话。请使用邮箱和密码登录，或重新发送魔法链接。')
      }
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      if (isCallback && !data.session) {
        if (param('code')) throw new Error('缺少 PKCE code verifier，请在发送邮件时的同一浏览器中打开链接。')
        throw new Error('邮箱可能已激活，但链接未返回登录会话。请重新发送魔法链接，或使用密码登录。')
      }
      applyAuthSession(data.session)
    } catch (error) {
      callbackError = authErrorMessage(error)
      // Do not destroy a previously valid local session on an invalid email link.
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
      applyAuthSession(data.session)
    } finally {
      initialized = true
      if (isCallback) cleanCallbackUrl()
      useAuthStore.setState({ loading: false })
    }
  })()
  return initialization
}

export function authRedirectUrl() {
  return `${window.location.origin}/auth/callback`
}
