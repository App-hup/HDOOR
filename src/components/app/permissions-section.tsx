'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CalendarClock, Calendar, Clock, Plus, Trash2, MessageCircle,
  Users, User, FileText, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { todayStr, currentTimeStr, formatArabicDate, formatArabicDateShort } from '@/lib/date-utils'
import { sendWhatsApp, permissionMessage } from '@/lib/whatsapp'
import { toast } from 'sonner'
import type { Student, Permission } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function PermissionsSection() {
  const session = useAppStore((s) => s.session)
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayStr())
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Fetch permissions for date
  const { data: permsData, isLoading } = useQuery<{ permissions: (Permission & { student: Student })[] }>({
    queryKey: ['permissions', date],
    queryFn: () => apiFetch(`/api/permissions?date=${date}`, {}, session),
  })
  const permissions = permsData?.permissions || []

  const filtered = permissions.filter((p) =>
    !search || p.student.name.includes(search) || p.reason.includes(search)
  )

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/permissions?id=${id}`, { method: 'DELETE' }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success('تم حذف الاستئذان')
    },
  })

  function handleWhatsApp(p: Permission & { student: Student }) {
    if (!p.student.phone) { toast.warning('لا يوجد رقم جوال'); return }
    sendWhatsApp(p.student.phone, permissionMessage(session?.schoolName || 'المدرسة', p.student.name, p.date, p.time, p.reason))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-cyan-600" />
            الاستئذانات
          </h2>
          <p className="text-sm text-muted-foreground mt-1">سجل استئذان الطلاب عند حضور ولي الأمر</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-l from-cyan-500 to-teal-600">
          <Plus className="w-4 h-4 ml-1" /> تسجيل استئذان
        </Button>
      </div>

      {/* Date + search */}
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
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <Label className="text-xs">بحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم الطالب أو السبب..." className="pr-9" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد استئذانات في هذا اليوم</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="divide-y divide-border">
                {filtered.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 flex items-start gap-3 hover:bg-muted/30"
                  >
                    <div className="w-11 h-11 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{p.student.name}</p>
                        <Badge variant="secondary" className="text-xs">{p.student.grade} - {p.student.section}</Badge>
                        <Badge className="bg-cyan-600 text-xs">{p.time}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <User className="w-3.5 h-3.5 inline ml-1" />
                        {p.guardianName || 'ولي الأمر'}
                      </p>
                      <p className="text-sm mt-1 bg-muted/50 rounded-lg p-2">
                        <FileText className="w-3.5 h-3.5 inline ml-1" />
                        {p.reason}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleWhatsApp(p)} title="إرسال واتساب">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(p.id)} title="حذف">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AddPermissionDialog open={addOpen} onOpenChange={setAddOpen} date={date} />
    </div>
  )
}

function AddPermissionDialog({ open, onOpenChange, date }: { open: boolean; onOpenChange: (v: boolean) => void; date: string }) {
  const session = useAppStore((s) => s.session)
  const queryClient = useQueryClient()
  const [studentId, setStudentId] = useState('')
  const [permDate, setPermDate] = useState(date)
  const [time, setTime] = useState(currentTimeStr())
  const [reason, setReason] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [search, setSearch] = useState('')

  const { data: studentsData } = useQuery<{ students: Student[] }>({
    queryKey: ['students-perm', search],
    queryFn: () => apiFetch(`/api/students?${search ? `search=${search}` : ''}`, {}, session),
    enabled: open,
  })
  const students = studentsData?.students || []

  const mutation = useMutation({
    mutationFn: () => apiFetch('/api/permissions', {
      method: 'POST',
      body: JSON.stringify({ studentId, date: permDate, time, reason, guardianName }),
    }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success('تم تسجيل الاستئذان بنجاح')
      setStudentId('')
      setReason('')
      setGuardianName('')
      setTime(currentTimeStr())
      onOpenChange(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'فشل التسجيل'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل استئذان طالب</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>الطالب *</Label>
            <div className="relative mb-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن طالب..." className="pr-9" />
            </div>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="اختر الطالب" /></SelectTrigger>
              <SelectContent>
                {students.slice(0, 50).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} - {s.grade} {s.section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Input type="date" value={permDate} onChange={(e) => setPermDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الساعة *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>اسم ولي الأمر</Label>
            <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="اسم المستأذن" />
          </div>
          <div className="space-y-2">
            <Label>سبب الاستئذان *</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: موعد طبي" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            disabled={mutation.isPending || !studentId || !reason}
            onClick={() => mutation.mutate()}
            className="bg-gradient-to-l from-cyan-500 to-teal-600"
          >
            {mutation.isPending ? 'جاري الحفظ...' : 'تسجيل'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
