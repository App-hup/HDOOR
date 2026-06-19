'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Settings, School, Shield, Users, Save, KeyRound, Copy,
  Smartphone, Apple, Share2, Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export function SettingsSection() {
  const session = useAppStore((s) => s.session)
  const queryClient = useQueryClient()
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [pin, setPin] = useState('')

  const { data, isLoading } = useQuery<{
    school: { id: string; code: string; name: string; levelsJson: string }
    teachers: { id: string; code: string; name: string; role: string; createdAt: string }[]
  }>({
    queryKey: ['settings'],
    queryFn: () => apiFetch('/api/settings', {}, session),
  })

  const schoolName = nameDraft !== null ? nameDraft : (data?.school.name || '')

  const updateMutation = useMutation({
    mutationFn: (payload: { name?: string; pin?: string }) =>
      apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(payload) }, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('تم حفظ الإعدادات')
      setPin('')
      setNameDraft(null)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'فشل الحفظ'),
  })

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    toast.success('تم النسخ')
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-600" />
          الإعدادات
        </h2>
        <p className="text-sm text-muted-foreground mt-1">إدارة بيانات المدرسة والحساب</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : data ? (
        <>
          {/* School info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <School className="w-4 h-4 text-teal-600" />
                معلومات المدرسة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <Label className="text-xs text-muted-foreground">رمز المدرسة</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm font-mono font-bold">{data.school.code}</code>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(data.school.code)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">شاركه مع المعلمين للانضمام</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <Label className="text-xs text-muted-foreground">رمز المعلم الخاص بك</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm font-mono font-bold">{session?.teacherCode}</code>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(session?.teacherCode || '')}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{session?.role === 'PRINCIPAL' ? 'مدير المدرسة' : 'معلم'}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>اسم المدرسة</Label>
                <Input value={schoolName} onChange={(e) => setNameDraft(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  تغيير PIN (اتركه فارغاً لعدم التغيير)
                </Label>
                <Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
              </div>

              <Button
                onClick={() => updateMutation.mutate({ name: schoolName, ...(pin ? { pin } : {}) })}
                disabled={updateMutation.isPending}
                className="bg-gradient-to-l from-teal-500 to-emerald-600"
              >
                <Save className="w-4 h-4 ml-1" />
                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </CardContent>
          </Card>

          {/* Teachers list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                المعلمون المسجلون ({data.teachers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.teachers.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.role === 'PRINCIPAL' ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <Shield className={`w-4 h-4 ${t.role === 'PRINCIPAL' ? 'text-teal-600' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.code}</p>
                    </div>
                    <Badge variant={t.role === 'PRINCIPAL' ? 'default' : 'secondary'} className={t.role === 'PRINCIPAL' ? 'bg-teal-600' : ''}>
                      {t.role === 'PRINCIPAL' ? 'مدير' : 'معلم'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PWA Install guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-teal-600" />
                تثبيت التطبيق على الشاشة الرئيسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Apple className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">تثبيت على iOS (Safari)</p>
                    <ol className="text-xs text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                      <li>افتح التطبيق في متصفح Safari</li>
                      <li>اضغط على زر المشاركة <Share2 className="w-3 h-3 inline" /></li>
                      <li>اختر "إضافة إلى الشاشة الرئيسية"</li>
                      <li>اضغط "إضافة"</li>
                    </ol>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">تثبيت على Android (Chrome)</p>
                    <ol className="text-xs text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                      <li>افتح التطبيق في متصفح Chrome</li>
                      <li>اضغط على القائمة (⋮) في الأعلى</li>
                      <li>اختر "تثبيت التطبيق"</li>
                      <li>اضغط "تثبيت"</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
