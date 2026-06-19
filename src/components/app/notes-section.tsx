'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText, Calendar, Save, MessageCircle, Users, CheckCheck,
  XCircle, Trash2, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { todayStr, formatArabicDate, formatArabicDateShort } from '@/lib/date-utils'
import { sendWhatsApp, noteMessage } from '@/lib/whatsapp'
import { toast } from 'sonner'
import type { Student, Note } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function NotesSection() {
  const session = useAppStore((s) => s.session)
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayStr())
  const [grade, setGrade] = useState('all')
  const [section, setSection] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [content, setContent] = useState('')

  // Fetch students
  const { data: studentsData } = useQuery<{ students: Student[] }>({
    queryKey: ['students-notes', grade, section],
    queryFn: () => {
      const params = new URLSearchParams()
      if (grade !== 'all') params.set('grade', grade)
      if (section !== 'all') params.set('section', section)
      return apiFetch(`/api/students?${params}`, {}, session)
    },
  })
  const students = studentsData?.students || []

  const grades = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s) => set.add(s.grade))
    return Array.from(set).sort()
  }, [students])

  const sections = useMemo(() => {
    const set = new Set<string>()
    if (grade !== 'all') students.forEach((s) => { if (s.grade === grade) set.add(s.section) })
    else students.forEach((s) => set.add(s.section))
    return Array.from(set).sort()
  }, [students, grade])

  const filteredStudents = students.filter((s) =>
    (grade === 'all' || s.grade === grade) &&
    (section === 'all' || s.section === section)
  )

  // Fetch notes for date
  const { data: notesData, isLoading: notesLoading } = useQuery<{ notes: (Note & { student: Student })[] }>({
    queryKey: ['notes', date],
    queryFn: () => apiFetch(`/api/notes?date=${date}`, {}, session),
  })
  const notes = notesData?.notes || []

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/notes', { method: 'POST', body: JSON.stringify({ date, content, studentIds: Array.from(selected) }) }, session),
    onSuccess: (res: { count: number }) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success(`تم حفظ الملاحظة لـ ${res.count} طالب`)
      setSelected(new Set())
      setContent('')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'فشل الحفظ'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/notes?id=${id}`, { method: 'DELETE' }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success('تم حذف الملاحظة')
    },
  })

  function toggleAll() {
    if (selected.size === filteredStudents.length) setSelected(new Set())
    else setSelected(new Set(filteredStudents.map((s) => s.id)))
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function handleSave() {
    if (selected.size === 0) { toast.warning('اختر طالباً واحداً على الأقل'); return }
    if (!content.trim()) { toast.warning('اكتب نص الملاحظة'); return }
    saveMutation.mutate()
  }

  function handleWhatsApp(note: Note & { student: Student }) {
    if (!note.student.phone) { toast.warning('لا يوجد رقم جوال'); return }
    sendWhatsApp(note.student.phone, noteMessage(session?.schoolName || 'المدرسة', note.student.name, note.content, note.date))
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-600" />
          إدارة الملاحظات
        </h2>
        <p className="text-sm text-muted-foreground mt-1">أضف ملاحظات على الطلاب وأرسلها عبر واتساب</p>
      </div>

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
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصفوف</SelectItem>
                  {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الفصل</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selected.size === filteredStudents.length && filteredStudents.length > 0 ? (
                <><XCircle className="w-4 h-4 ml-1" /> إلغاء التحديد</>
              ) : (
                <><CheckCheck className="w-4 h-4 ml-1" /> تحديد الكل</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Students selection + note input */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                الطلاب ({selected.size} محدد)
              </h3>
            </div>
            <ScrollArea className="h-48 rounded-lg border">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">لا يوجد طلاب</div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredStudents.map((s) => (
                    <label key={s.id} className={`flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/30 ${selected.has(s.id) ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''}`}>
                      <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.grade} - {s.section}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="space-y-2">
              <Label>نص الملاحظة</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب الملاحظة هنا... سيتم إرسال نفس الملاحظة لجميع الطلاب المحددين"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending || selected.size === 0 || !content.trim()}
                className="flex-1 bg-gradient-to-l from-purple-500 to-violet-600"
              >
                <Save className="w-4 h-4 ml-1" />
                {saveMutation.isPending ? 'جاري الحفظ...' : `حفظ لـ ${selected.size} طالب`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Saved notes for the date */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              ملاحظات اليوم ({notes.length})
            </h3>
            {notesLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : notes.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                لا توجد ملاحظات في هذا اليوم
              </div>
            ) : (
              <ScrollArea className="h-80 rounded-lg border">
                <div className="divide-y divide-border">
                  {notes.map((n) => (
                    <div key={n.id} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{n.student.name}</p>
                          <p className="text-xs text-muted-foreground">{n.student.grade} - {n.student.section}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleWhatsApp(n)} title="إرسال واتساب">
                            <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(n.id)} title="حذف">
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm bg-muted/50 rounded-lg p-2">{n.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
