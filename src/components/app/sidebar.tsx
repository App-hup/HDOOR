'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Users, Clock, FileText, CalendarClock, MailOpen,
  BarChart3, ClipboardList, Settings, LogOut, Menu, X,
  GraduationCap, Moon, Sun, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import type { SectionType } from '@/lib/types'
import { useTheme } from 'next-themes'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

const navItems: { id: SectionType; label: string; icon: typeof Home; color: string }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home, color: 'text-teal-600' },
  { id: 'students', label: 'الطلاب', icon: Users, color: 'text-emerald-600' },
  { id: 'attendance', label: 'التأخير والغياب', icon: Clock, color: 'text-amber-600' },
  { id: 'notes', label: 'الملاحظات', icon: FileText, color: 'text-purple-600' },
  { id: 'permissions', label: 'الاستئذانات', icon: CalendarClock, color: 'text-cyan-600' },
  { id: 'excuses', label: 'الأعذار', icon: MailOpen, color: 'text-rose-600' },
  { id: 'analytics', label: 'الإحصائيات', icon: BarChart3, color: 'text-orange-600' },
  { id: 'reports', label: 'التقارير', icon: ClipboardList, color: 'text-green-600' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, color: 'text-slate-600' },
]

export function Sidebar() {
  const { section, setSection, sidebarOpen, setSidebarOpen, session, logout } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-50 h-screen w-72 shrink-0 bg-sidebar border-l border-sidebar-border transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo header */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md shadow-teal-500/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base truncate">{session?.schoolName || 'نظام الحضور'}</h1>
              <p className="text-xs text-muted-foreground font-mono truncate">{session?.schoolCode}</p>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* User badge */}
        <div className="p-4">
          <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/40">
              <Shield className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.teacherName}</p>
              <p className="text-xs text-muted-foreground">
                {session?.role === 'PRINCIPAL' ? 'مدير المدرسة' : 'معلم'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = section === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setSection(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-l from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/30'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-white' : item.color}`} />
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
          </Button>

          <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد تسجيل الخروج</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم مسح جميع البيانات المحلية من هذا الجهاز. البيانات السحابية محفوظة ويمكنك الدخول مرة أخرى برمز المدرسة و PIN.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => { logout(); setConfirmLogout(false) }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  نعم، سجل الخروج
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>
    </>
  )
}

export function MobileHeader() {
  const { setSidebarOpen, session, section } = useAppStore()
  const current = navItems.find((n) => n.id === section)
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
        <Menu className="w-5 h-5" />
      </Button>
      <div className="flex items-center gap-2">
        {current && <current.icon className="w-5 h-5 text-teal-600" />}
        <span className="font-medium">{current?.label}</span>
      </div>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
        <GraduationCap className="w-5 h-5 text-white" />
      </div>
    </header>
  )
}
