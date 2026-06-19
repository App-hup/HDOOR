'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MailOpen, Link2, Copy, Trash2, CheckCircle2, Clock as ClockIcon,
  Paperclip, ExternalLink, Mail, Filter, Eye, FileText, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { formatArabicDate, formatArabicDateShort, formatArabicDateTime } from '@/lib/date-utils'
import { toast } from 'sonner'
import type { Excuse } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const levelColors: Record<string, string> = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export function ExcusesSection() {
  const session = useAppStore((s) => s.session)
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'REVIEWED'>('all')
  const [viewExcuse, setViewExcuse] = useState<Excuse | null>(null)

  const { data, isLoading } = useQuery<{ excuses: Excuse[] }>({
    queryKey: ['excuses', statusFilter],
    queryFn: () => apiFetch(`/api/excuses?${statusFilter !== 'all' ? `status=${statusFilter}` : ''}`, {}, session),
  })
  const excuses = data?.excuses || []

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PENDING' | 'REVIEWED' }) =>
      apiFetch('/api/excuses', { method: 'PUT', body: JSON.stringify({ id, status }) }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['excuses'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success('تم تحديث الحالة')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/excuses?id=${id}`, { method: 'DELETE' }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['excuses'] })
      toast.success('تم حذف العذر')
    },
  })

  const excuseLink = `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?excuse=${session?.schoolCode || ''}`

  function copyLink() {
    navigator.clipboard.writeText(excuseLink)
    toast.success('تم نسخ الرابط')
  }

  const pendingCount = excuses.filter((e) => e.status === 'PENDING').length

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MailOpen className="w-6 h-6 text-rose-600" />
          الأعذار
        </h2>
        <p className="text-sm text-muted-foreground mt-1">عرض أعذار الغياب المقدمة من أولياء الأمور</p>
      </div>

      {/* Public link card */}
      <Card className="border-rose-200 dark:border-rose-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium">رابط العذر العام لأولياء الأمور</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                أرسل هذا الرابط لأولياء الأمور مرة واحدة في بداية العام الدراسي. يستخدمه ولي الأمر لتقديم عذر الغياب إلكترونياً مع إرفاق المستندات.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <Input readOnly value={excuseLink} className="font-mono text-xs flex-1 min-w-[200px]" dir="ltr" />
                <Button onClick={copyLink} variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50">
                  <Copy className="w-4 h-4 ml-1" /> نسخ الرابط
                </Button>
                <a href={excuseLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost">
                    <ExternalLink className="w-4 h-4 ml-1" /> معاينة
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'PENDING' | 'REVIEWED')}>
        <TabsList>
          <TabsTrigger value="all">الكل ({excuses.length})</TabsTrigger>
          <TabsTrigger value="PENDING">قيد الانتظار ({pendingCount})</TabsTrigger>
          <TabsTrigger value="REVIEWED">تمت المراجعة</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Excuses list */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : excuses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <MailOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد أعذار</p>
            <p className="text-sm mt-1">شارك رابط العذر مع أولياء الأمور لاستقبال الأعذار</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {excuses.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={e.status === 'PENDING' ? 'border-rose-200 dark:border-rose-900' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${e.status === 'PENDING' ? 'bg-rose-100 dark:bg-rose-900/40' : 'bg-green-100 dark:bg-green-900/40'}`}>
                      {e.status === 'PENDING' ? <ClockIcon className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{e.studentName}</p>
                        {e.grade && <Badge variant="secondary" className="text-xs">{e.grade}</Badge>}
                        <Badge variant={e.status === 'PENDING' ? 'destructive' : 'secondary'} className="text-xs">
                          {e.status === 'PENDING' ? 'قيد الانتظار' : 'تمت المراجعة'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatArabicDateShort(e.absenceDate)}</span>
                        <span>عدد الأيام: {e.daysCount}</span>
                        <span className="hidden sm:inline">{formatArabicDateTime(e.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-2 bg-muted/50 rounded-lg p-2 line-clamp-2">{e.reason}</p>
                      {e.attachment && (
                        <a href={e.attachment} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-rose-600 mt-2 hover:underline">
                          <Paperclip className="w-3.5 h-3.5" /> عرض المرفق
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewExcuse(e)} title="عرض">
                        <Eye className="w-4 h-4 text-cyan-600" />
                      </Button>
                      {e.status === 'PENDING' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateMutation.mutate({ id: e.id, status: 'REVIEWED' })} title="تعليم كمراجع">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(e.id)} title="حذف">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* View dialog */}
      {viewExcuse && (
        <Dialog open={!!viewExcuse} onOpenChange={(v) => !v && setViewExcuse(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-rose-600" />
                تفاصيل العذر
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">اسم الطالب</p>
                  <p className="font-medium mt-1">{viewExcuse.studentName}</p>
                </div>
                {viewExcuse.grade && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">الصف</p>
                    <p className="font-medium mt-1">{viewExcuse.grade}</p>
                  </div>
                )}
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">تاريخ الغياب</p>
                  <p className="font-medium mt-1">{formatArabicDate(viewExcuse.absenceDate)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">عدد أيام الغياب</p>
                  <p className="num-font font-medium mt-1">{viewExcuse.daysCount}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">سبب الغياب</p>
                <p className="text-sm">{viewExcuse.reason}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">تاريخ التقديم</p>
                <p className="text-sm">{formatArabicDateTime(viewExcuse.createdAt)}</p>
              </div>
              {viewExcuse.attachment && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-2">المرفق</p>
                  <a href={viewExcuse.attachment} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Paperclip className="w-4 h-4 ml-1" /> فتح المرفق
                    </Button>
                  </a>
                </div>
              )}
              <div className="flex gap-2">
                {viewExcuse.status === 'PENDING' ? (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => { updateMutation.mutate({ id: viewExcuse.id, status: 'REVIEWED' }); setViewExcuse(null) }}
                  >
                    <CheckCircle2 className="w-4 h-4 ml-1" /> تعليم كمراجع
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { updateMutation.mutate({ id: viewExcuse.id, status: 'PENDING' }); setViewExcuse(null) }}
                  >
                    إعادة لقيد الانتظار
                  </Button>
                )}
                <Button variant="outline" onClick={() => setViewExcuse(null)}>إغلاق</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
