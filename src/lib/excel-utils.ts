'use client'

import * as XLSX from 'xlsx'
import type { Student } from './types'

export interface ExcelStudentRow {
  name: string
  civilId: string
  phone: string
  grade: string
  section: string
}

// Parse Excel file and return student rows
export function parseStudentsExcel(file: File): Promise<ExcelStudentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
        const students: ExcelStudentRow[] = rows.map((row) => {
          const keys = Object.keys(row)
          const getVal = (...names: string[]) => {
            for (const n of names) {
              const found = keys.find((k) => k.trim() === n || k.includes(n))
              if (found && row[found]) return String(row[found]).trim()
            }
            return ''
          }
          return {
            name: getVal('اسم الطالب', 'الاسم', 'name', 'Name'),
            civilId: getVal('السجل المدني', 'الهوية', 'civilId', 'ID'),
            phone: getVal('رقم الجوال', 'الجوال', 'phone', 'Phone'),
            grade: getVal('الصف', 'grade', 'Grade'),
            section: getVal('الفصل', 'section', 'Section'),
          }
        }).filter((s) => s.name)
        resolve(students)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// Export students to Excel
export function exportStudentsExcel(students: Student[], schoolName: string) {
  const data = students.map((s, i) => ({
    'م': i + 1,
    'اسم الطالب': s.name,
    'السجل المدني': s.civilId,
    'رقم الجوال': s.phone,
    'الصف': s.grade,
    'الفصل': s.section,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  // Set RTL
  ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'الطلاب')
  XLSX.writeFile(wb, `طلاب_${schoolName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// Generic export to Excel
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = 'البيانات'
) {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// Download template
export function downloadStudentTemplate() {
  const data = [
    { 'اسم الطالب': 'محمد أحمد علي', 'السجل المدني': '1234567890', 'رقم الجوال': '0512345678', 'الصف': 'الأول', 'الفصل': 'أ' },
    { 'اسم الطالب': 'فاطمة سعد محمد', 'السجل المدني': '0987654321', 'رقم الجوال': '0587654321', 'الصف': 'الثاني', 'الفصل': 'ب' },
  ]
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'نموذج الطلاب')
  XLSX.writeFile(wb, 'نموذج_استيراد_الطلاب.xlsx')
}
