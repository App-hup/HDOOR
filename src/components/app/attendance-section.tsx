'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Clock, UserX, Calendar, CheckCircle2, Save, MessageCircle,
  Users, Filter, CheckCheck, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { todayStr } from '@/lib/date-utils'
import { sendWhatsApp, lateMessage, absenceMessage } from '@/lib/whatsapp'
import { toast } from 'sonner'
import type { Student } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function AttendanceSection() {
  return (
    <Tabs defaultValue="late" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">التأخير والغياب</h2>
          <p className="text-sm text-muted-foreground mt-1">سجل تأخير وغياب الطلاب يومياً</p>
        </div>
      </div>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="late" className="gap-2">
          <Clock className="w-4 h-4" /> التأخير
        </TabsTrigger>
        <TabsTrigger value="absence" className="gap-2">
          <UserX className="w-4 h-4" /> الغياب
        </TabsTrigger>
      </TabsList>
      <TabsContent value="late">
        <AttendancePanel type="late" />
      </TabsContent>
      <TabsContent value="absence">
        <AttendancePanel type="absence" />
      </TabsContent>
    </Tabs>
  )
}

function AttendancePanel({ type }: { type: 'late' | 'absence' }) {
  const session = useAppStore((s) => s.session)
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayStr())
  const [grade, setGrade] = useState('all')
  const [section, setSection] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const isLate = type === 'late'
  const accent = isLate ? 'amber' : 'red'
  const Icon = isLate ? Clock : UserX

  // Fetch students
  const { data: studentsData, isLoading: studentsLoading } = useQuery<{ students: Student[] }>({
    queryKey: ['students-attendance', grade, section],
    queryFn: () => {
      const params = new URLSearchParams()
      if (grade !== 'all') params.set('grade', grade)
      if (section !== 'all') params.set('section', section)
      return apiFetch(`/api/students?${params}`, {}, session)
    },
  })
  const students = studentsData?.students || []

  // Fetch existing records for this date
  const { data: recordsData } = useQuery({
    queryKey: ['attendance-records', type, date],
    queryFn: () => apiFetch<{ records: { id: string; studentId: string }[] }>(`/api/attendance?type=${type}&date=${date}`, {}, session),
  })

  // Sync selected from records when they change (derived state pattern)
  const [prevRecordsKey, setPrevRecordsKey] = useState<string>('')
  const recordsKey = `${type}-${date}-${recordsData?.records?.length || 0}`
  if (recordsKey !== prevRecordsKey) {
    setPrevRecordsKey(recordsKey)
    setSelected(new Set(recordsData?.records?.map((r) => r.studentId) || []))
  }

  const grades = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s) => set.add(s.grade))
    return Array.from(set).sort()
  }, [students])

  const sections = useMemo(() => {
    const set = new Set<string>()
    if (grade !== 'all') {
      students.forEach((s) => { if (s.grade === grade) set.add(s.section) })
    } else {
      students.forEach((s) => set.add(s.section))
    }
    return Array.from(set).sort()
  }, [students, grade])

  const filteredStudents = students.filter((s) =>
    (grade === 'all' || s.grade === grade) &&
    (section === 'all' || s.section === section)
  )

  const saveMutation = useMutation({
    mutationFn: (studentIds: string[]) =>
      apiFetch('/api/attendance', { method: 'POST', body: JSON.stringify({ type, date, studentIds }) }, session),
    onSuccess: (res: { count: number }) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success(`تم حفظ سجلات ${isLate ? 'التأخير' : 'الغياب'} (${res.count} طالب)`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'فشل الحفظ'),
  })

  function toggleAll() {
    if (selected.size === filteredStudents.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredStudents.map((s) => s.id)))
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function handleSave() {
    saveMutation.mutate(Array.from(selected))
  }

  function handleWhatsApp() {
    if (selected.size === 0) {
      toast.warning('لم يتم تحديد طلاب')
      return
    }
    const selectedStudents = filteredStudents.filter((s) => selected.has(s.id) && s.phone)
    if (selectedStudents.length === 0) {
      toast.warning('لا توجد أرقام جوال للطلاب المحددين')
      return
    }
    // Send to first student, inform user about the rest
    const first = selectedStudents[0]
    const msg = isLate
      ? lateMessage(session?.schoolName || 'المدرسة', first.name, date)
      : absenceMessage(session?.schoolName || 'المدرسة', first.name, date)
    sendWhatsApp(first.phone, msg)
    if (selectedStudents.length > 1) {
      toast.info(`جاري فتح واتساب للطالب الأول. يتبقى ${selectedStudents.length - 1} طالب لإرسال الإشعارات`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">التاريخ</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pr-9 w-[180px]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الصف</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصفوف</SelectItem>
                  {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الفصل</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selected.size === filteredStudents.length && filteredStudents.length > 0 ? (
                  <><XCircle className="w-4 h-4 ml-1" /> إلغاء التحديد</>
                ) : (
                  <><CheckCheck className="w-4 h-4 ml-1" /> تحديد الكل</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats bar */}
      <div className={`rounded-xl p-4 ${isLate ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-red-50 dark:bg-red-950/30'} flex items-center justify-between flex-wrap gap-3`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${isLate ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-red-100 dark:bg-red-900/50'} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${isLate ? 'text-amber-600' : 'text-red-600'}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold num-font ${isLate ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'}`}>
              {selected.size}
            </p>
            <p className="text-sm text-muted-foreground">
              {isLate ? 'متأخر' : 'غائب'} من {filteredStudents.length} طالب
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleWhatsApp}
            disabled={selected.size === 0}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <MessageCircle className="w-4 h-4 ml-1" /> إشعار واتساب
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || selected.size === 0}
            className={isLate ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}
          >
            <Save className="w-4 h-4 ml-1" /> {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ السجل'}
          </Button>
        </div>
      </div>

      {/* Students list */}
      <Card>
        <CardContent className="p-0">
          {studentsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد طلاب</p>
            </div>
          ) : (
            <ScrollArea className="h-[50vh]">
              <div className="divide-y divide-border">
                {filteredStudents.map((s) => {
                  const isChecked = selected.has(s.id)
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors ${isChecked ? (isLate ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-red-50/50 dark:bg-red-950/20') : ''}`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleOne(s.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.grade} - {s.section}</p>
                      </div>
                      {isChecked && (
                        <Badge variant={isLate ? 'default' : 'destructive'} className={isLate ? 'bg-amber-600' : ''}>
                          <CheckCircle2 className="w-3 h-3 ml-1" />
                          {isLate ? 'متأخر' : 'غائب'}
                        </Badge>
                      )}
                    </label>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
