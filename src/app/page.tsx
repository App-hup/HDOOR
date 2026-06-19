'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { AuthScreen } from '@/components/app/auth-screen'
import { Sidebar, MobileHeader } from '@/components/app/sidebar'
import { HomeSection } from '@/components/app/home-section'
import { StudentsSection } from '@/components/app/students-section'
import { AttendanceSection } from '@/components/app/attendance-section'
import { NotesSection } from '@/components/app/notes-section'
import { PermissionsSection } from '@/components/app/permissions-section'
import { ExcusesSection } from '@/components/app/excuses-section'
import { AnalyticsSection } from '@/components/app/analytics-section'
import { ReportsSection } from '@/components/app/reports-section'
import { SettingsSection } from '@/components/app/settings-section'
import { ExcuseForm } from '@/components/app/excuse-form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GraduationCap } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const searchParams = useSearchParams()
  const excuseCode = searchParams.get('excuse')
  const { session, section } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Public excuse form (no auth needed)
  if (excuseCode) {
    return <ExcuseForm schoolCode={excuseCode} />
  }

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GraduationCap className="w-12 h-12 text-teal-600 animate-pulse" />
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return <AuthScreen />
  }

  // Main app
  const sections: Record<string, React.ReactNode> = {
    home: <HomeSection />,
    students: <StudentsSection />,
    attendance: <AttendanceSection />,
    notes: <NotesSection />,
    permissions: <PermissionsSection />,
    excuses: <ExcusesSection />,
    analytics: <AnalyticsSection />,
    reports: <ReportsSection />,
    settings: <SettingsSection />,
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
          {sections[section] || sections.home}
        </main>
        <footer className="mt-auto border-t border-border bg-muted/30 py-3 px-4 text-center text-xs text-muted-foreground no-print">
          <p>نظام إدارة حضور الطلاب • {session.schoolName} • {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <GraduationCap className="w-12 h-12 text-teal-600 animate-pulse" />
        </div>
      }>
        <AppContent />
      </Suspense>
    </QueryClientProvider>
  )
}
