'use client'

import type { Session } from './types'

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  session?: Session | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (session) {
    headers['x-school-code'] = session.schoolCode
    headers['x-teacher-code'] = session.teacherCode
    headers['x-role'] = session.role
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    let msg = `خطأ في الطلب (${res.status})`
    try {
      const err = await res.json()
      msg = err.error || msg
    } catch {
      // ignore
    }
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function apiUpload<T>(
  url: string,
  formData: FormData,
  session?: Session | null
): Promise<T> {
  const headers: Record<string, string> = {}
  if (session) {
    headers['x-school-code'] = session.schoolCode
    headers['x-teacher-code'] = session.teacherCode
    headers['x-role'] = session.role
  }
  const res = await fetch(url, { method: 'POST', headers, body: formData })
  if (!res.ok) {
    let msg = `خطأ في الطلب (${res.status})`
    try {
      const err = await res.json()
      msg = err.error || msg
    } catch {
      // ignore
    }
    throw new Error(msg)
  }
  return res.json()
}
