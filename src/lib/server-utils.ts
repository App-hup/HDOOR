import { db } from './db'
import type { Session } from './types'

export async function getSchoolFromHeaders(headers: Headers) {
  const schoolCode = headers.get('x-school-code')
  if (!schoolCode) return null
  const school = await db.school.findUnique({ where: { code: schoolCode } })
  return school
}

export function getSessionFromHeaders(headers: Headers): Omit<Session, 'schoolName' | 'schoolId'> | null {
  const schoolCode = headers.get('x-school-code')
  const teacherCode = headers.get('x-teacher-code')
  const role = headers.get('x-role') as 'PRINCIPAL' | 'TEACHER' | null
  if (!schoolCode || !teacherCode || !role) return null
  return { schoolCode, teacherCode, role }
}

export function generateSchoolCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'MTHN-'
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function generateTeacherCode(schoolCode: string): string {
  const chars = '0123456789'
  let suffix = ''
  for (let i = 0; i < 2; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${schoolCode}-${suffix}`
}

export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
