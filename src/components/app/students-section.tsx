'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus, Search, Pencil, Trash2, Upload, Download, Users,
  FileSpreadsheet, X, Phone, IdCard, GraduationCap, History,
  Clock, UserX, FileText, CalendarClock, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiFetch, apiUpload } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { parseStudentsExcel, exportStudentsExcel, downloadStudentTemplate } from '@/lib/excel-utils'
import { formatArabicDateShort } from '@/lib/date-utils'
import type { Student } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function StudentsSection() {
  const session = useAppStore((s) => s.session)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)

  const { data, isLoading } = useQuery<{ students: Student[] }>({
    queryKey: ['students', search, gradeFilter, sectionFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (gradeFilter !== 'all') params.set('grade', gradeFilter)
      if (sectionFilter !== 'all') params.set('section', sectionFilter)
      return apiFetch(`/api/students?${params}`, {}, session)
    },
  })

  const students = data?.students || []

  const grades = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s) => set.add(s.grade))
    return Array.from(set).sort()
  }, [students])

  const sections = useMemo(() => {
    const set = new Set<string>()
    if (gradeFilter !== 'all') {
      students.forEach((s) => { if (s.grade === gradeFilter) set.add(s.section) })
    } else {
      students.forEach((s) => set.add(s.section))
    }
    return Array.from(set).sort()
  }, [students, gradeFilter])

  const addMutation = useMutation({
    mutationFn: (data: Omit<Student, 'id' | 'schoolId' | 'createdAt'>) =>
      apiFetch('/api/students', { method: 'POST', body: JSON.stringify(data) }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success('تم إضافة الطالب بنجاح')
      setAddOpen(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'فشل الإضافة'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Student> & { id: string }) =>
      apiFetch('/api/students', { method: 'PUT', body: JSON.stringify(data) }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('تم تعديل البيانات بنجاح')
      setEditStudent(null)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'فشل التعديل'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/students?id=${id}`, { method: 'DELETE' }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success('تم حذف الطالب')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'فشل الحذف'),
  })

  const deleteAllMutation = useMutation({
    mutationFn: () => apiFetch(`/api/students?all=1`, { method: 'DELETE' }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success('تم حذف جميع الطلاب')
      setDeleteAllOpen(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'فشل الحذف'),
  })

  function handleExport() {
    if (students.length === 0) {
      toast.error('لا يوجد طلاب للتصدير')
      return
    }
    exportStudentsExcel(students, session?.schoolName || 'المدرسة')
    toast.success('تم تصدير البيانات بنجاح')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            إدارة الطلاب
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {students.length} طالب مسجل
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadStudentTemplate}>
            <FileSpreadsheet className="w-4 h-4 ml-1" /> نموذج
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 ml-1" /> تصدير
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 ml-1" /> استيراد
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="bg-gradient-to-l from-teal-500 to-emerald-600">
            <Plus className="w-4 h-4 ml-1" /> إضافة طالب
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو السجل المدني أو الجوال..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الصف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصفوف</SelectItem>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="الفصل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفصول</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {students.length > 0 && (
              <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 ml-1" /> حذف الكل
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      حذف جميع الطلاب
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف جميع الطلاب وسجلاتهم (تأخير، غياب، ملاحظات، استئذانات) نهائياً. لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAllMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      نعم، احذف الكل
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد طلاب مسجلون</p>
              <p className="text-sm mt-1">ابدأ بإضافة طالب جديد أو استيراد من Excel</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-right p-3 font-medium">#</th>
                    <th className="text-right p-3 font-medium">الاسم</th>
                    <th className="text-right p-3 font-medium hidden md:table-cell">السجل المدني</th>
                    <th className="text-right p-3 font-medium hidden lg:table-cell">الجوال</th>
                    <th className="text-right p-3 font-medium">الصف</th>
                    <th className="text-right p-3 font-medium">الفصل</th>
                    <th className="text-center p-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground num-font">{i + 1}</td>
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 hidden md:table-cell font-mono text-xs">{s.civilId || '-'}</td>
                      <td className="p-3 hidden lg:table-cell font-mono text-xs">{s.phone || '-'}</td>
                      <td className="p-3"><Badge variant="secondary">{s.grade}</Badge></td>
                      <td className="p-3"><Badge variant="outline">{s.section}</Badge></td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailStudent(s)} title="السجل التفصيلي">
                            <History className="w-4 h-4 text-cyan-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditStudent(s)} title="تعديل">
                            <Pencil className="w-4 h-4 text-amber-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(s.id)} title="حذف">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <StudentFormDialog
        key={`add-${addOpen}`}
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(data) => addMutation.mutate(data)}
        loading={addMutation.isPending}
      />

      {/* Edit Dialog */}
      <StudentFormDialog
        key={`edit-${editStudent?.id || 'none'}`}
        open={!!editStudent}
        onOpenChange={(open) => !open && setEditStudent(null)}
        student={editStudent}
        onSubmit={(data) => editStudent && updateMutation.mutate({ ...data, id: editStudent.id })}
        loading={updateMutation.isPending}
      />

      {/* Import Dialog */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Detail Dialog */}
      {detailStudent && (
        <StudentDetailDialog
          student={detailStudent}
          open={!!detailStudent}
          onOpenChange={(open) => !open && setDetailStudent(null)}
        />
      )}
    </div>
  )
}

// Student Form Dialog
function StudentFormDialog({
  open, onOpenChange, student, onSubmit, loading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  student?: Student | null
  onSubmit: (data: { name: string; civilId: string; phone: string; grade: string; section: string }) => void
  loading: boolean
}) {
  const [name, setName] = useState(student?.name || '')
  const [civilId, setCivilId] = useState(student?.civilId || '')
  const [phone, setPhone] = useState(student?.phone || '')
  const [grade, setGrade] = useState(student?.grade || '')
  const [section, setSection] = useState(student?.section || '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{student ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>اسم الطالب *</Label>
            <div className="relative">
              <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" className="pr-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>السجل المدني</Label>
              <div className="relative">
                <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={civilId} onChange={(e) => setCivilId(e.target.value)} placeholder="10 أرقام" className="pr-9 font-mono" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>رقم الجوال</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" className="pr-9 font-mono" dir="ltr" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الصف *</Label>
              <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="مثال: الأول" />
            </div>
            <div className="space-y-2">
              <Label>الفصل *</Label>
              <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="مثال: أ" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            disabled={loading || !name || !grade || !section}
            onClick={() => onSubmit({ name, civilId, phone, grade, section })}
            className="bg-gradient-to-l from-teal-500 to-emerald-600"
          >
            {loading ? 'جاري الحفظ...' : student ? 'حفظ التعديلات' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Import Dialog
function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const session = useAppStore((s) => s.session)
  const queryClient = useQueryClient()
  const [parsed, setParsed] = useState<{ name: string; civilId: string; phone: string; grade: string; section: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setLoading(true)
    try {
      const rows = await parseStudentsExcel(file)
      setParsed(rows)
      if (rows.length === 0) toast.warning('لم يتم العثور على بيانات صالحة')
      else toast.success(`تم قراءة ${rows.length} طالب`)
    } catch (err) {
      toast.error('فشل قراءة الملف')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const importMutation = useMutation({
    mutationFn: (students: typeof parsed) =>
      apiFetch('/api/students/import', { method: 'POST', body: JSON.stringify({ students }) }, session),
    onSuccess: (res: { count: number }) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success(`تم استيراد ${res.count} طالب بنجاح`)
      setParsed([])
      setFileName('')
      onOpenChange(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'فشل الاستيراد'),
  })

  function handleClose(v: boolean) {
    if (!v) {
      setParsed([])
      setFileName('')
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>استيراد الطلاب من Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              className="hidden"
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-teal-500 mb-2" />
              <p className="font-medium">{fileName || 'اختر ملف Excel'}</p>
              <p className="text-xs text-muted-foreground mt-1">الأعمدة: اسم الطالب، السجل المدني، رقم الجوال، الصف، الفصل</p>
            </label>
          </div>

          {loading && (
            <div className="text-center text-sm text-muted-foreground">جاري قراءة الملف...</div>
          )}

          {parsed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">معاينة البيانات ({parsed.length} طالب)</p>
                <Button variant="ghost" size="sm" onClick={() => setParsed([])}>
                  <X className="w-4 h-4 ml-1" /> مسح
                </Button>
              </div>
              <ScrollArea className="h-64 rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-right p-2 font-medium">#</th>
                      <th className="text-right p-2 font-medium">الاسم</th>
                      <th className="text-right p-2 font-medium hidden sm:table-cell">السجل</th>
                      <th className="text-right p-2 font-medium hidden sm:table-cell">الجوال</th>
                      <th className="text-right p-2 font-medium">الصف</th>
                      <th className="text-right p-2 font-medium">الفصل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 num-font">{i + 1}</td>
                        <td className="p-2">{s.name}</td>
                        <td className="p-2 hidden sm:table-cell font-mono text-xs">{s.civilId}</td>
                        <td className="p-2 hidden sm:table-cell font-mono text-xs">{s.phone}</td>
                        <td className="p-2">{s.grade}</td>
                        <td className="p-2">{s.section}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>يمكنك تحميل النموذج أعلاه وملء البيانات ثم استيراده. سيتم إنشاء الصفوف والفصول تلقائياً.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>إلغاء</Button>
          <Button
            disabled={parsed.length === 0 || importMutation.isPending}
            onClick={() => importMutation.mutate(parsed)}
            className="bg-gradient-to-l from-teal-500 to-emerald-600"
          >
            {importMutation.isPending ? 'جاري الاستيراد...' : `استيراد ${parsed.length} طالب`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Student Detail Dialog
function StudentDetailDialog({
  student, open, onOpenChange,
}: {
  student: Student
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const session = useAppStore((s) => s.session)
  const { data, isLoading } = useQuery({
    queryKey: ['student-detail', student.id],
    queryFn: () => apiFetch<{ student: Student & { lateRecords: { id: string; date: string }[]; absenceRecords: { id: string; date: string }[]; notes: { id: string; date: string; content: string }[]; permissions: { id: string; date: string; time: string; reason: string }[] } }>(`/api/students/detail?id=${student.id}`, {}, session),
    enabled: open,
  })

  const detail = data?.student

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            {student.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">السجل المدني</p>
              <p className="font-mono text-sm mt-1">{student.civilId || '-'}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">الجوال</p>
              <p className="font-mono text-sm mt-1" dir="ltr">{student.phone || '-'}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">الصف</p>
              <p className="text-sm font-medium mt-1">{student.grade}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">الفصل</p>
              <p className="text-sm font-medium mt-1">{student.section}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detail ? (
            <>
              {/* Stats summary */}
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-center">
                  <Clock className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                  <p className="num-font text-xl font-bold text-amber-700 dark:text-amber-300">{detail.lateRecords.length}</p>
                  <p className="text-xs text-muted-foreground">تأخير</p>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-center">
                  <UserX className="w-5 h-5 mx-auto text-red-600 mb-1" />
                  <p className="num-font text-xl font-bold text-red-700 dark:text-red-300">{detail.absenceRecords.length}</p>
                  <p className="text-xs text-muted-foreground">غياب</p>
                </div>
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3 text-center">
                  <FileText className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                  <p className="num-font text-xl font-bold text-purple-700 dark:text-purple-300">{detail.notes.length}</p>
                  <p className="text-xs text-muted-foreground">ملاحظات</p>
                </div>
                <div className="rounded-lg bg-cyan-50 dark:bg-cyan-950/30 p-3 text-center">
                  <CalendarClock className="w-5 h-5 mx-auto text-cyan-600 mb-1" />
                  <p className="num-font text-xl font-bold text-cyan-700 dark:text-cyan-300">{detail.permissions.length}</p>
                  <p className="text-xs text-muted-foreground">استئذان</p>
                </div>
              </div>

              {/* Records tabs */}
              <ScrollArea className="h-64 rounded-lg border">
                <div className="p-3 space-y-3">
                  {detail.lateRecords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-amber-600 mb-1">سجل التأخير</p>
                      {detail.lateRecords.map((r) => (
                        <div key={r.id} className="text-sm py-1 border-b border-border/50 flex justify-between">
                          <span>{formatArabicDateShort(r.date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {detail.absenceRecords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">سجل الغياب</p>
                      {detail.absenceRecords.map((r) => (
                        <div key={r.id} className="text-sm py-1 border-b border-border/50 flex justify-between">
                          <span>{formatArabicDateShort(r.date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {detail.notes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-purple-600 mb-1">الملاحظات</p>
                      {detail.notes.map((n) => (
                        <div key={n.id} className="text-sm py-1 border-b border-border/50">
                          <span className="text-xs text-muted-foreground">{formatArabicDateShort(n.date)}: </span>
                          {n.content}
                        </div>
                      ))}
                    </div>
                  )}
                  {detail.permissions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-cyan-600 mb-1">الاستئذانات</p>
                      {detail.permissions.map((p) => (
                        <div key={p.id} className="text-sm py-1 border-b border-border/50">
                          <span className="text-xs text-muted-foreground">{formatArabicDateShort(p.date)} ({p.time}): </span>
                          {p.reason}
                        </div>
                      ))}
                    </div>
                  )}
                  {detail.lateRecords.length === 0 && detail.absenceRecords.length === 0 && detail.notes.length === 0 && detail.permissions.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 text-sm">لا توجد سجلات</div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
