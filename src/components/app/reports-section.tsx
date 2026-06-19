'use client'

import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ClipboardList, Clock, UserX, FileText, Calendar, Download,
  Printer, FileSpreadsheet, Eye, Users, GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { exportToExcel } from '@/lib/excel-utils'
import { exportElementToPDF, printElement } from '@/lib/pdf-utils'
import { todayStr, formatArabicDate, formatArabicDateShort } from '@/lib/date-utils'
import { toast } from 'sonner'
import type { Student } from '@/lib/types'

type ReportType = 'late' | 'absence' | 'notes' | 'comprehensive'
type RangeType = 'all' | 'range' | 'student'

interface ReportData {
  type: string
  fromDate: string | null
  toDate: string | null
  schoolName: string
  lateRecords?: { id: string; date: string; student: Student }[]
  absenceRecords?: { id: string; date: string; student: Student }[]
  notesRecords?: { id: string; date: string; content: string; student: Student }[]
  permissionRecords?: { id: string; date: string; time: string; reason: string; guardianName: string; student: Student }[]
  summary: { late: number; absence: number; notes: number; permissions: number }
}

const reportTypes: { id: ReportType; label: string; icon: typeof Clock; color: string }[] = [
  { id: 'late', label: 'تقرير التأخير', icon: Clock, color: 'text-amber-600' },
  { id: 'absence', label: 'تقرير الغياب', icon: UserX, color: 'text-red-600' },
  { id: 'notes', label: 'تقرير الملاحظات', icon: FileText, color: 'text-purple-600' },
  { id: 'comprehensive', label: 'تقرير شامل للغائبين', icon: ClipboardList, color: 'text-teal-600' },
]

export function ReportsSection() {
  const session = useAppStore((s) => s.session)
  const [reportType, setReportType] = useState<ReportType>('late')
  const [range, setRange] = useState<RangeType>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [studentId, setStudentId] = useState('')
  const [grade, setGrade] = useState('all')
  const [section, setSection] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // Fetch students for selection
  const { data: studentsData } = useQuery<{ students: Student[] }>({
    queryKey: ['students-report'],
    queryFn: () => apiFetch('/api/students', {}, session),
  })
  const students = studentsData?.students || []

  const grades = Array.from(new Set(students.map((s) => s.grade))).sort()

  const buildParams = () => {
    const p = new URLSearchParams()
    p.set('type', reportType)
    if (range === 'range') { p.set('from', from); p.set('to', to) }
    if (range === 'student') p.set('studentId', studentId)
    if (grade && grade !== 'all') p.set('grade', grade)
    if (section) p.set('section', section)
    return p.toString()
  }

  const { data: reportData, isLoading, refetch } = useQuery<ReportData>({
    queryKey: ['report', reportType, range, from, to, studentId, grade, section],
    queryFn: () => apiFetch(`/api/reports?${buildParams()}`, {}, session),
    enabled: showPreview,
  })

  function handlePreview() {
    if (range === 'range' && (!from || !to)) { toast.warning('حدد نطاق التاريخ'); return }
    if (range === 'student' && !studentId) { toast.warning('اختر طالباً'); return }
    setShowPreview(true)
    setTimeout(() => refetch(), 100)
  }

  async function handlePDF() {
    if (!reportRef.current || !reportData) return
    toast.info('جاري إنشاء PDF...')
    try {
      await exportElementToPDF(reportRef.current, `تقرير_${reportType}_${new Date().toISOString().slice(0, 10)}`)
      toast.success('تم تصدير PDF')
    } catch (e) { toast.error('فشل التصدير'); console.error(e) }
  }

  function handlePrint() {
    if (!reportRef.current) return
    printElement(reportRef.current)
  }

  function handleExcel() {
    if (!reportData) return
    const data: Record<string, unknown>[] = []
    if (reportData.lateRecords) {
      reportData.lateRecords.forEach((r, i) => {
        data.push({ م: i + 1, 'اسم الطالب': r.student.name, الصف: r.student.grade, الفصل: r.student.section, التاريخ: r.date, النوع: 'تأخير' })
      })
    }
    if (reportData.absenceRecords) {
      reportData.absenceRecords.forEach((r, i) => {
        data.push({ م: i + 1, 'اسم الطالب': r.student.name, الصف: r.student.grade, الفصل: r.student.section, التاريخ: r.date, النوع: 'غياب' })
      })
    }
    if (reportData.notesRecords) {
      reportData.notesRecords.forEach((r, i) => {
        data.push({ م: i + 1, 'اسم الطالب': r.student.name, الصف: r.student.grade, الفصل: r.student.section, التاريخ: r.date, النوع: 'ملاحظة', التفاصيل: r.content })
      })
    }
    if (reportData.permissionRecords) {
      reportData.permissionRecords.forEach((r, i) => {
        data.push({ م: i + 1, 'اسم الطالب': r.student.name, الصف: r.student.grade, الفصل: r.student.section, التاريخ: r.date, الوقت: r.time, النوع: 'استئذان', التفاصيل: r.reason })
      })
    }
    if (data.length === 0) { toast.warning('لا توجد بيانات للتصدير'); return }
    exportToExcel(data, `تقرير_${reportType}_${new Date().toISOString().slice(0, 10)}`, 'التقرير')
    toast.success('تم تصدير Excel')
  }

  const selectedStudent = students.find((s) => s.id === studentId)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-green-600" />
          التقارير
        </h2>
        <p className="text-sm text-muted-foreground mt-1">أنواع متعددة من التقارير مع خيارات تصدير متنوعة</p>
      </div>

      {/* Report type selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportTypes.map((rt) => {
          const Icon = rt.icon
          const active = reportType === rt.id
          return (
            <button
              key={rt.id}
              onClick={() => { setReportType(rt.id); setShowPreview(false) }}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                active ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30' : 'border-border hover:border-teal-200'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 ${active ? 'text-teal-600' : rt.color}`} />
              <p className="text-sm font-medium">{rt.label}</p>
            </button>
          )
        })}
      </div>

      {/* Range options */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">نطاق التقرير</Label>
            <Tabs value={range} onValueChange={(v) => setRange(v as RangeType)}>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="all">جميع الطلاب</TabsTrigger>
                <TabsTrigger value="range">نطاق زمني</TabsTrigger>
                <TabsTrigger value="student">طالب محدد</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {range === 'range' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">من تاريخ</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">إلى تاريخ</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
              </div>
            </div>
          )}

          {range === 'student' && (
            <div className="space-y-2">
              <Label className="text-xs">اختر الطالب</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder="اختر طالباً" /></SelectTrigger>
                <SelectContent>
                  {students.slice(0, 100).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} - {s.grade} {s.section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {range !== 'student' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">الصف (اختياري)</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="الكل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الفصل (اختياري)</Label>
                <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="مثال: أ" className="w-[100px]" />
              </div>
            </div>
          )}

          <Button onClick={handlePreview} className="w-full bg-gradient-to-l from-green-500 to-teal-600">
            <Eye className="w-4 h-4 ml-1" /> معاينة التقرير
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Export buttons */}
          <div className="flex flex-wrap gap-2 no-print">
            <Button variant="outline" onClick={handleExcel} disabled={isLoading}>
              <FileSpreadsheet className="w-4 h-4 ml-1" /> Excel
            </Button>
            <Button variant="outline" onClick={handlePDF} disabled={isLoading}>
              <Download className="w-4 h-4 ml-1" /> PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={isLoading}>
              <Printer className="w-4 h-4 ml-1" /> طباعة
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div ref={reportRef} className="p-6 bg-white text-black">
                {/* Report header */}
                <div className="text-center mb-6 pb-4 border-b-2 border-teal-600">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">{reportData?.schoolName || session?.schoolName}</h1>
                      <p className="text-sm text-gray-600">{reportTypes.find((r) => r.id === reportType)?.label}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    تاريخ التقرير: {formatArabicDate(todayStr())}
                    {range === 'range' && reportData?.fromDate && ` | من ${formatArabicDateShort(reportData.fromDate)} إلى ${formatArabicDateShort(reportData.toDate || '')}`}
                    {range === 'student' && selectedStudent && ` | الطالب: ${selectedStudent.name}`}
                  </p>
                </div>

                {isLoading ? (
                  <div className="text-center py-12 text-gray-400">جاري تحميل التقرير...</div>
                ) : !reportData ? (
                  <div className="text-center py-12 text-gray-400">لا توجد بيانات</div>
                ) : (
                  <>
                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                        <p className="num-font text-2xl font-bold text-amber-700">{reportData.summary.late}</p>
                        <p className="text-xs text-gray-600">تأخير</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <p className="num-font text-2xl font-bold text-red-700">{reportData.summary.absence}</p>
                        <p className="text-xs text-gray-600">غياب</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                        <p className="num-font text-2xl font-bold text-purple-700">{reportData.summary.notes}</p>
                        <p className="text-xs text-gray-600">ملاحظات</p>
                      </div>
                      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-center">
                        <p className="num-font text-2xl font-bold text-cyan-700">{reportData.summary.permissions}</p>
                        <p className="text-xs text-gray-600">استئذان</p>
                      </div>
                    </div>

                    {/* Late records */}
                    {reportData.lateRecords && reportData.lateRecords.length > 0 && (
                      <ReportTable title="سجل التأخير" records={reportData.lateRecords.map((r, i) => ({ no: i + 1, name: r.student.name, grade: r.student.grade, section: r.student.section, date: formatArabicDateShort(r.date) }))} headers={['م', 'الاسم', 'الصف', 'الفصل', 'التاريخ']} />
                    )}

                    {/* Absence records */}
                    {reportData.absenceRecords && reportData.absenceRecords.length > 0 && (
                      <ReportTable title="سجل الغياب" records={reportData.absenceRecords.map((r, i) => ({ no: i + 1, name: r.student.name, grade: r.student.grade, section: r.student.section, date: formatArabicDateShort(r.date) }))} headers={['م', 'الاسم', 'الصف', 'الفصل', 'التاريخ']} />
                    )}

                    {/* Notes records */}
                    {reportData.notesRecords && reportData.notesRecords.length > 0 && (
                      <ReportTable title="سجل الملاحظات" records={reportData.notesRecords.map((r, i) => ({ no: i + 1, name: r.student.name, date: formatArabicDateShort(r.date), content: r.content }))} headers={['م', 'الاسم', 'التاريخ', 'الملاحظة']} />
                    )}

                    {/* Permission records */}
                    {reportData.permissionRecords && reportData.permissionRecords.length > 0 && (
                      <ReportTable title="سجل الاستئذانات" records={reportData.permissionRecords.map((r, i) => ({ no: i + 1, name: r.student.name, date: formatArabicDateShort(r.date), time: r.time, reason: r.reason, guardian: r.guardianName }))} headers={['م', 'الاسم', 'التاريخ', 'الوقت', 'السبب', 'ولي الأمر']} />
                    )}

                    {reportData.summary.late + reportData.summary.absence + reportData.summary.notes + reportData.summary.permissions === 0 && (
                      <div className="text-center py-12 text-gray-400">لا توجد سجلات في هذا النطاق</div>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                      <p>تم إنشاء التقرير بواسطة نظام إدارة حضور الطلاب</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

function ReportTable({ title, records, headers }: { title: string; records: Record<string, unknown>[]; headers: string[] }) {
  const keys = ['no', 'name', 'grade', 'section', 'date', 'content', 'time', 'reason', 'guardian']
  return (
    <div className="mb-6">
      <h3 className="font-bold text-sm mb-2 text-teal-700">{title} ({records.length})</h3>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-teal-50">
            {headers.map((h) => (
              <th key={h} className="border border-gray-300 p-2 text-right font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {keys.slice(0, headers.length).map((k) => (
                <td key={k} className="border border-gray-300 p-2">{String(r[k] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
