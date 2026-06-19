'use client'

import type { Student } from './types'

function normalizePhone(phone: string): string {
  let p = phone.replace(/\D/g, '')
  // Saudi format: convert 05xxxxxxxx to 9665xxxxxxxx
  if (p.startsWith('0')) p = '966' + p.slice(1)
  else if (p.startsWith('5') && p.length === 9) p = '966' + p
  else if (!p.startsWith('966') && p.length === 9) p = '966' + p
  return p
}

export function sendWhatsApp(phone: string, message: string) {
  const p = normalizePhone(phone)
  const url = `https://wa.me/${p}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

export function sendBulkWhatsApp(students: { name: string; phone: string }[], messageBuilder: (name: string) => string) {
  // Open first one, user can repeat for others
  if (students.length === 0) return
  const first = students[0]
  sendWhatsApp(first.phone, messageBuilder(first.name))
}

export function lateMessage(schoolName: string, studentName: string, date: string): string {
  return `السلام عليكم ورحمة الله وبركاته

نشكركم على متابعتكم المستمرة.

نفيدكم بأن الطالب/ة: ${studentName}
قد تأخر عن الطابور الصباحي بتاريخ: ${date}

نأمل منكم المتابعة لتجنب التأخير المستقبلي.

مع خالص التقدير
${schoolName}`
}

export function absenceMessage(schoolName: string, studentName: string, date: string): string {
  return `السلام عليكم ورحمة الله وبركاته

نشكركم على متابعتكم المستمرة.

نفيدكم بأن الطالب/ة: ${studentName}
لم يحضر للمدرسة بتاريخ: ${date}

نأمل التواصل مع إدارة المدرسة لتوضيح سبب الغياب.

مع خالص التقدير
${schoolName}`
}

export function noteMessage(schoolName: string, studentName: string, note: string, date: string): string {
  return `السلام عليكم ورحمة الله وبركاته

نشكركم على متابعتكم المستمرة.

ملاحظة بخصوص الطالب/ة: ${studentName}
بتاريخ: ${date}

${note}

مع خالص التقدير
${schoolName}`
}

export function permissionMessage(schoolName: string, studentName: string, date: string, time: string, reason: string): string {
  return `السلام عليكم ورحمة الله وبركاته

نفيدكم بأنه تم استئذان الطالب/ة: ${studentName}
بتاريخ: ${date}
الساعة: ${time}
السبب: ${reason}

مع خالص التقدير
${schoolName}`
}
