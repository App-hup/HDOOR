'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Users, LogIn, Plus, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

type Mode = 'select' | 'create' | 'join' | 'login'

export function AuthScreen() {
  const setSession = useAppStore((s) => s.setSession)
  const [mode, setMode] = useState<Mode>('select')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)

  // Create school form
  const [schoolName, setSchoolName] = useState('')
  const [principalName, setPrincipalName] = useState('')
  const [createPin, setCreatePin] = useState('')

  // Join form
  const [joinSchoolCode, setJoinSchoolCode] = useState('')
  const [joinTeacherName, setJoinTeacherName] = useState('')
  const [joinPin, setJoinPin] = useState('')

  // Login form
  const [loginSchoolCode, setLoginSchoolCode] = useState('')
  const [loginPin, setLoginPin] = useState('')

  async function handleCreate() {
    if (!schoolName || !principalName || !createPin) {
      toast.error('جميع الحقول مطلوبة')
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch<{ school: { id: string; code: string; name: string }; teacher: { id: string; code: string; name: string; role: string } }>('/api/school', {
        method: 'POST',
        body: JSON.stringify({ name: schoolName, pin: createPin, teacherName: principalName }),
      })
      setSession({
        schoolCode: res.school.code,
        schoolName: res.school.name,
        schoolId: res.school.id,
        teacherCode: res.teacher.code,
        teacherName: res.teacher.name,
        role: res.teacher.role as 'PRINCIPAL' | 'TEACHER',
      })
      toast.success(`تم إنشاء المدرسة بنجاح! رمز المدرسة: ${res.school.code}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل إنشاء المدرسة')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!joinSchoolCode || !joinTeacherName || !joinPin) {
      toast.error('جميع الحقول مطلوبة')
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch<{ school: { id: string; code: string; name: string }; teacher: { id: string; code: string; name: string; role: string } }>('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ schoolCode: joinSchoolCode, pin: joinPin, teacherName: joinTeacherName }),
      })
      setSession({
        schoolCode: res.school.code,
        schoolName: res.school.name,
        schoolId: res.school.id,
        teacherCode: res.teacher.code,
        teacherName: res.teacher.name,
        role: res.teacher.role as 'PRINCIPAL' | 'TEACHER',
      })
      toast.success(`تم الانضمام بنجاح! رمز المعلم: ${res.teacher.code}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل الانضمام')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    if (!loginSchoolCode || !loginPin) {
      toast.error('جميع الحقول مطلوبة')
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch<{ school: { id: string; code: string; name: string }; teacher: { id: string; code: string; name: string; role: string } }>('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ schoolCode: loginSchoolCode, pin: loginPin }),
      })
      setSession({
        schoolCode: res.school.code,
        schoolName: res.school.name,
        schoolId: res.school.id,
        teacherCode: res.teacher.code,
        teacherName: res.teacher.name,
        role: res.teacher.role as 'PRINCIPAL' | 'TEACHER',
      })
      toast.success(`مرحباً ${res.teacher.name}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/30 mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">نظام إدارة الحضور</h1>
          <p className="text-muted-foreground mt-2">نظام احترافي لإدارة حضور وغياب الطلاب</p>
        </div>

        <Card className="border-0 shadow-xl shadow-teal-500/5 backdrop-blur-sm">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {mode === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={() => setMode('create')}
                    className="w-full h-16 text-base justify-start gap-3 bg-gradient-to-l from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
                    size="lg"
                  >
                    <Plus className="w-5 h-5" />
                    إنشاء حساب مدير مدرسة
                  </Button>
                  <Button
                    onClick={() => setMode('join')}
                    variant="outline"
                    className="w-full h-16 text-base justify-start gap-3 border-teal-200 hover:bg-teal-50 dark:border-teal-900 dark:hover:bg-teal-950"
                    size="lg"
                  >
                    <Users className="w-5 h-5 text-teal-600" />
                    الانضمام كمعلم
                  </Button>
                  <Button
                    onClick={() => setMode('login')}
                    variant="ghost"
                    className="w-full h-14 text-base justify-start gap-3"
                    size="lg"
                  >
                    <LogIn className="w-5 h-5" />
                    تسجيل الدخول بحساب موجود
                  </Button>
                </motion.div>
              )}

              {mode === 'create' && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="icon" onClick={() => setMode('select')} className="h-8 w-8">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-xl font-bold">إنشاء حساب مدير</h2>
                  </div>
                  <div className="space-y-2">
                    <Label>اسم المدرسة</Label>
                    <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="مثال: مدرسة النور الابتدائية" />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم المدير</Label>
                    <Input value={principalName} onChange={(e) => setPrincipalName(e.target.value)} placeholder="الاسم الكامل" />
                  </div>
                  <div className="space-y-2">
                    <Label>رمز PIN (للحماية)</Label>
                    <div className="relative">
                      <Input
                        type={showPin ? 'text' : 'password'}
                        value={createPin}
                        onChange={(e) => setCreatePin(e.target.value)}
                        placeholder="4 أرقام على الأقل"
                      />
                      <Button variant="ghost" size="icon" type="button" className="absolute left-1 top-1 h-8 w-8" onClick={() => setShowPin(!showPin)}>
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={loading} className="w-full h-12 bg-gradient-to-l from-teal-500 to-emerald-600">
                    {loading ? 'جاري الإنشاء...' : 'إنشاء المدرسة'}
                  </Button>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-teal-50 dark:bg-teal-950/30 p-3 rounded-lg">
                    <Sparkles className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <span>سيتم توليد رمز فريد للمدرسة تلقائياً (MTHN-XXXXX) يمكنك مشاركته مع المعلمين</span>
                  </div>
                </motion.div>
              )}

              {mode === 'join' && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="icon" onClick={() => setMode('select')} className="h-8 w-8">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-xl font-bold">الانضمام كمعلم</h2>
                  </div>
                  <div className="space-y-2">
                    <Label>رمز المدرسة</Label>
                    <Input value={joinSchoolCode} onChange={(e) => setJoinSchoolCode(e.target.value.toUpperCase())} placeholder="MTHN-XXXXX" className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم المعلم</Label>
                    <Input value={joinTeacherName} onChange={(e) => setJoinTeacherName(e.target.value)} placeholder="الاسم الكامل" />
                  </div>
                  <div className="space-y-2">
                    <Label>PIN المدرسة</Label>
                    <div className="relative">
                      <Input
                        type={showPin ? 'text' : 'password'}
                        value={joinPin}
                        onChange={(e) => setJoinPin(e.target.value)}
                        placeholder="رمز PIN للمدرسة"
                      />
                      <Button variant="ghost" size="icon" type="button" className="absolute left-1 top-1 h-8 w-8" onClick={() => setShowPin(!showPin)}>
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleJoin} disabled={loading} className="w-full h-12 bg-gradient-to-l from-teal-500 to-emerald-600">
                    {loading ? 'جاري الانضمام...' : 'انضمام للمدرسة'}
                  </Button>
                </motion.div>
              )}

              {mode === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="icon" onClick={() => setMode('select')} className="h-8 w-8">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-xl font-bold">تسجيل الدخول</h2>
                  </div>
                  <div className="space-y-2">
                    <Label>رمز المدرسة</Label>
                    <Input value={loginSchoolCode} onChange={(e) => setLoginSchoolCode(e.target.value.toUpperCase())} placeholder="MTHN-XXXXX" className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label>رمز PIN</Label>
                    <div className="relative">
                      <Input
                        type={showPin ? 'text' : 'password'}
                        value={loginPin}
                        onChange={(e) => setLoginPin(e.target.value)}
                        placeholder="رمز PIN"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      <Button variant="ghost" size="icon" type="button" className="absolute left-1 top-1 h-8 w-8" onClick={() => setShowPin(!showPin)}>
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleLogin} disabled={loading} className="w-full h-12 bg-gradient-to-l from-teal-500 to-emerald-600">
                    {loading ? 'جاري الدخول...' : 'دخول'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          نظام إدارة حضور الطلاب • جميع البيانات محفوظة بأمان
        </p>
      </motion.div>
    </div>
  )
}
