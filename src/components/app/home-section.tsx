'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users, Clock, UserX, FileText, CalendarClock, MailOpen,
  TrendingUp, TrendingDown, ArrowLeft, Plus, Upload, BarChart3
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { formatArabicDate, todayStr } from '@/lib/date-utils'
import type { DashboardStats } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

interface AnalyticsResponse {
  stats: DashboardStats & { totalStudents: number }
}

export function HomeSection() {
  const session = useAppStore((s) => s.session)
  const setSection = useAppStore((s) => s.setSection)

  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ['analytics-summary'],
    queryFn: () => apiFetch('/api/analytics', {}, session),
    refetchInterval: 30000,
  })

  const stats = data?.stats

  const statCards = [
    {
      label: 'إجمالي الطلاب',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      gradient: 'from-teal-500 to-emerald-600',
      iconBg: 'bg-teal-100 dark:bg-teal-900/40',
      iconColor: 'text-teal-600',
      section: 'students' as const,
    },
    {
      label: 'الحضور اليوم',
      value: stats ? stats.totalStudents - stats.todayAbsence : 0,
      sub: `${stats?.attendanceRate ?? 0}%`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-green-600',
      section: 'attendance' as const,
    },
    {
      label: 'التأخير اليومي',
      value: stats?.todayLate ?? 0,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600',
      section: 'attendance' as const,
    },
    {
      label: 'الغياب اليومي',
      value: stats?.todayAbsence ?? 0,
      sub: `${stats?.absenceRate ?? 0}%`,
      icon: UserX,
      gradient: 'from-red-500 to-rose-600',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600',
      section: 'attendance' as const,
    },
    {
      label: 'الملاحظات اليومية',
      value: stats?.todayNotes ?? 0,
      icon: FileText,
      gradient: 'from-purple-500 to-violet-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600',
      section: 'notes' as const,
    },
    {
      label: 'الاستئذانات اليوم',
      value: stats?.todayPermissions ?? 0,
      icon: CalendarClock,
      gradient: 'from-cyan-500 to-blue-500',
      iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
      iconColor: 'text-cyan-600',
      section: 'permissions' as const,
    },
  ]

  const quickActions = [
    { label: 'إضافة طالب', icon: Plus, section: 'students' as const, desc: 'أضف طالباً جديداً' },
    { label: 'تسجيل التأخير', icon: Clock, section: 'attendance' as const, desc: 'سجل تأخير الطلاب' },
    { label: 'تسجيل الغياب', icon: UserX, section: 'attendance' as const, desc: 'سجل غياب الطلاب' },
    { label: 'إضافة ملاحظة', icon: FileText, section: 'notes' as const, desc: 'أضف ملاحظة لطالب' },
    { label: 'تسجيل استئذان', icon: CalendarClock, section: 'permissions' as const, desc: 'سجل استئذان طالب' },
    { label: 'عرض الإحصائيات', icon: BarChart3, section: 'analytics' as const, desc: 'تحليلات شاملة' },
    { label: 'استيراد طلاب', icon: Upload, section: 'students' as const, desc: 'من ملف Excel' },
    { label: 'عرض الأعذار', icon: MailOpen, section: 'excuses' as const, desc: `(${stats?.pendingExcuses ?? 0} قيد الانتظار)` },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-teal-500 to-emerald-600 p-6 text-white shadow-xl shadow-teal-500/20"
      >
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-white/5 rounded-full" />
        <div className="relative">
          <h2 className="text-2xl font-bold mb-1">مرحباً، {session?.teacherName} 👋</h2>
          <p className="text-white/80">{formatArabicDate(todayStr())}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm">
              {session?.schoolName}
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-mono">
              {session?.schoolCode}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow group h-full"
                onClick={() => setSection(card.section)}
              >
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <Skeleton className="h-7 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ) : (
                    <>
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.iconBg} mb-2 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                      <div className="num-font text-2xl font-bold">{card.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
                      {card.sub && (
                        <div className="text-xs font-medium text-teal-600 mt-1">{card.sub}</div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-lg font-bold mb-3">إجراءات سريعة</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 text-center hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 group"
                  onClick={() => setSection(action.section)}
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.desc}</div>
                  </div>
                </Button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Pending alerts */}
      {stats && stats.pendingExcuses > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <MailOpen className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="font-medium text-rose-900 dark:text-rose-200">يوجد {stats.pendingExcuses} عذر قيد الانتظار</p>
              <p className="text-sm text-rose-700 dark:text-rose-300">يرجى مراجعة أعذار أولياء الأمور</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-100" onClick={() => setSection('excuses')}>
            عرض <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </motion.div>
      )}
    </div>
  )
}
