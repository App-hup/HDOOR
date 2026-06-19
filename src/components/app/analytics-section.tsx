'use client'

import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, TrendingDown, Users, Clock, UserX,
  FileText, Download, Save, AlertCircle
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { exportElementToPDF } from '@/lib/pdf-utils'
import { toast } from 'sonner'
import type { AbsenceLevel } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const levelStyle: Record<string, { bg: string; text: string; emoji: string; chart: string }> = {
  green: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', emoji: '🟢', chart: '#16a34a' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', emoji: '🟡', chart: '#ca8a04' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', emoji: '🟠', chart: '#ea580c' },
  red: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', emoji: '🔴', chart: '#dc2626' },
}

interface AnalyticsData {
  stats: {
    totalStudents: number
    todayLate: number
    todayAbsence: number
    todayNotes: number
    todayPermissions: number
    pendingExcuses: number
    attendanceRate: number
    absenceRate: number
    lateRate: number
  }
  levels: AbsenceLevel[]
  levelDistribution: (AbsenceLevel & { count: number })[]
  monthlyData: { label: string; late: number; absence: number }[]
  gradeDistribution: { name: string; count: number }[]
  topAbsent: { name: string; grade: string; section: string; count: number; level: AbsenceLevel }[]
  studentAbsenceCounts: { id: string; name: string; grade: string; section: string; absenceCount: number; lateCount: number; level: AbsenceLevel }[]
}

export function AnalyticsSection() {
  const session = useAppStore((s) => s.session)
  const queryClient = useQueryClient()
  const reportRef = useRef<HTMLDivElement>(null)
  const [editingLevels, setEditingLevels] = useState(false)
  const [levelsDraft, setLevelsDraft] = useState<AbsenceLevel[]>([])

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics-full'],
    queryFn: () => apiFetch('/api/analytics', {}, session),
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (levelsJson: string) =>
      apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify({ levelsJson }) }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-full'] })
      toast.success('تم حفظ مستويات الغياب')
      setEditingLevels(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'فشل الحفظ'),
  })

  async function handleExportPDF() {
    if (!reportRef.current) return
    toast.info('جاري إنشاء ملف PDF...')
    try {
      await exportElementToPDF(reportRef.current, `إحصائيات_${session?.schoolName}_${new Date().toISOString().slice(0, 10)}`)
      toast.success('تم تصدير التقرير')
    } catch (e) {
      toast.error('فشل تصدير PDF')
      console.error(e)
    }
  }

  function startEditLevels() {
    setLevelsDraft(data ? JSON.parse(JSON.stringify(data.levels)) : [])
    setEditingLevels(true)
  }

  function saveLevels() {
    updateSettingsMutation.mutate(JSON.stringify(levelsDraft))
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  const { stats, levels, levelDistribution, monthlyData, gradeDistribution, topAbsent } = data

  const pieColors = levelDistribution.map((l) => levelStyle[l.color].chart)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            الإحصائيات الشاملة
          </h2>
          <p className="text-sm text-muted-foreground mt-1">تحليلات ورسوم بيانية لأداء الحضور والغياب</p>
        </div>
        <Button onClick={handleExportPDF} variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
          <Download className="w-4 h-4 ml-1" /> تصدير PDF
        </Button>
      </div>

      <div ref={reportRef} className="space-y-4 p-4 bg-background rounded-xl">
        {/* Overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="إجمالي الطلاب" value={stats.totalStudents} icon={Users} color="teal" />
          <StatCard label="نسبة الحضور" value={`${stats.attendanceRate}%`} icon={TrendingUp} color="green" />
          <StatCard label="نسبة الغياب" value={`${stats.absenceRate}%`} icon={TrendingDown} color="red" />
          <StatCard label="نسبة التأخير" value={`${stats.lateRate}%`} icon={Clock} color="amber" />
        </div>

        {/* Absence levels */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              نظام مستويات الغياب
            </CardTitle>
            {editingLevels ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingLevels(false)}>إلغاء</Button>
                <Button size="sm" onClick={saveLevels} disabled={updateSettingsMutation.isPending} className="bg-orange-600 hover:bg-orange-700">
                  <Save className="w-3.5 h-3.5 ml-1" /> {updateSettingsMutation.isPending ? 'جاري...' : 'حفظ'}
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={startEditLevels}>تعديل الحدود</Button>
            )}
          </CardHeader>
          <CardContent>
            {!editingLevels ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {levelDistribution.map((l) => {
                  const style = levelStyle[l.color]
                  return (
                    <div key={l.level} className={`rounded-xl p-4 ${style.bg}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{style.emoji}</span>
                        <span className={`num-font text-2xl font-bold ${style.text}`}>{l.count}</span>
                      </div>
                      <p className={`font-medium ${style.text}`}>{l.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {l.minDays === 999 ? `${l.maxDays}+` : l.maxDays >= 999 ? `${l.minDays}+` : `${l.minDays} - ${l.maxDays} يوم`}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {levelsDraft.map((l, i) => {
                  const style = levelStyle[l.color]
                  return (
                    <div key={l.level} className={`rounded-lg p-3 ${style.bg} flex items-center gap-3 flex-wrap`}>
                      <span className="text-xl">{style.emoji}</span>
                      <div className="flex-1 min-w-[120px]">
                        <Label className="text-xs">المستوى {l.level}</Label>
                        <Input value={l.name} onChange={(e) => {
                          const next = [...levelsDraft]; next[i] = { ...l, name: e.target.value }; setLevelsDraft(next)
                        }} className="h-8" />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs">من</Label>
                        <Input type="number" value={l.minDays} onChange={(e) => {
                          const next = [...levelsDraft]; next[i] = { ...l, minDays: Number(e.target.value) }; setLevelsDraft(next)
                        }} className="h-8" />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs">إلى</Label>
                        <Input type="number" value={l.maxDays} onChange={(e) => {
                          const next = [...levelsDraft]; next[i] = { ...l, maxDays: Number(e.target.value) }; setLevelsDraft(next)
                        }} className="h-8" />
                      </div>
                    </div>
                  )
                })}
                <p className="text-xs text-muted-foreground">استخدم 999 كحد أقصى للمستوى الأخير (يعني بلا حد)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts row 1 */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Monthly trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">الإحصائيات الشهرية (6 أشهر)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="absGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'inherit' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="late" name="تأخير" stroke="#f59e0b" fill="url(#lateGrad)" />
                  <Area type="monotone" dataKey="absence" name="غياب" stroke="#dc2626" fill="url(#absGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Absence levels pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">توزيع مستويات الغياب</CardTitle>
            </CardHeader>
            <CardContent>
              {levelDistribution.every((l) => l.count === 0) ? (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                  لا توجد بيانات غياب
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={levelDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(entry: { name: string; count: number }) => `${entry.name}: ${entry.count}`}
                    >
                      {levelDistribution.map((_, i) => (
                        <Cell key={i} fill={pieColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'inherit' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Grade distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">توزيع الطلاب على الصفوف</CardTitle>
            </CardHeader>
            <CardContent>
              {gradeDistribution.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={gradeDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'inherit' }} />
                    <Bar dataKey="count" name="عدد الطلاب" fill="#0d9488" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top absent students */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">أكثر الطلاب غياباً</CardTitle>
            </CardHeader>
            <CardContent>
              {topAbsent.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات غياب</div>
              ) : (
                <ScrollArea className="h-[260px]">
                  <div className="space-y-2">
                    {topAbsent.map((s, i) => {
                      const style = levelStyle[s.level.color]
                      return (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center num-font font-bold text-sm ${style.bg} ${style.text}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.grade} - {s.section}</p>
                          </div>
                          <div className="text-left">
                            <p className="num-font font-bold text-red-600">{s.count}</p>
                            <p className="text-xs text-muted-foreground">يوم</p>
                          </div>
                          <Badge className={`${style.bg} ${style.text} text-xs`}>{style.emoji}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof Users; color: 'teal' | 'green' | 'red' | 'amber' }) {
  const colors = {
    teal: 'from-teal-500 to-emerald-600',
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-rose-600',
    amber: 'from-amber-500 to-orange-600',
  }
  const iconColors = {
    teal: 'text-teal-600 bg-teal-100 dark:bg-teal-900/40',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/40',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/40',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40',
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="num-font text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
