'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap, Send, Paperclip, CheckCircle2, Loader2,
  User, Calendar, Clock, FileText, X, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export function ExcuseForm({ schoolCode }: { schoolCode: string }) {
  const [schoolName, setSchoolName] = useState('')
  const [loadingSchool, setLoadingSchool] = useState(true)
  const [schoolNotFound, setSchoolNotFound] = useState(false)

  const [studentName, setStudentName] = useState('')
  const [grade, setGrade] = useState('')
  const [absenceDate, setAbsenceDate] = useState('')
  const [daysCount, setDaysCount] = useState('1')
  const [reason, setReason] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/excuses/submit?code=${schoolCode}`)
        if (!res.ok) { setSchoolNotFound(true); return }
        const data = await res.json()
        setSchoolName(data.school.name)
      } catch {
        setSchoolNotFound(true)
      } finally {
        setLoadingSchool(false)
      }
    }
    verify()
  }, [schoolCode])

  async function handleSubmit() {
    if (!studentName.trim() || !absenceDate || !reason.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setSubmitting(true)
    try {
      let attachmentPath: string | null = null
      if (attachment) {
        const formData = new FormData()
        formData.append('file', attachment)
        const upRes = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!upRes.ok) throw new Error('فشل رفع المرفق')
        const upData = await upRes.json()
        attachmentPath = upData.path
      }

      const res = await fetch('/api/excuses/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolCode,
          studentName,
          grade,
          absenceDate,
          daysCount: Number(daysCount) || 1,
          reason,
          attachment: attachmentPath,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'فشل الإرسال')
      }
      setSubmitted(true)
      toast.success('تم إرسال العذر بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل الإرسال')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingSchool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (schoolNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rose-50 to-red-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-rose-500 mb-4" />
            <h1 className="text-xl font-bold mb-2">الرابط غير صحيح</h1>
            <p className="text-muted-foreground">رمز المدرسة غير موجود. يرجى التأكد من الرابط المرسل من المدرسة.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 to-emerald-50">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </motion.div>
              <h1 className="text-xl font-bold mb-2">تم إرسال العذر بنجاح</h1>
              <p className="text-muted-foreground mb-6">
                تم استلام عذر الغياب بنجاح وسيقوم المعلم بمراجعته. شكراً لتعاونكم.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false)
                  setStudentName('')
                  setGrade('')
                  setAbsenceDate('')
                  setDaysCount('1')
                  setReason('')
                  setAttachment(null)
                }}
              >
                إرسال عذر آخر
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-4">
      <div className="max-w-lg mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/30 mb-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">{schoolName}</h1>
          <p className="text-muted-foreground mt-1">نموذج تقديم عذر الغياب</p>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-6 space-y-5">
            <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-3 text-sm text-teal-800 dark:text-teal-200 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>يرجى تعبئة النموذج بدقة. سيتم مراجعة العذر من قبل المعلم.</span>
            </div>

            <div className="space-y-2">
              <Label>اسم الطالب الرباعي *</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="الاسم الرباعي للطالب" className="pr-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الصف</Label>
                <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="مثال: الأول" />
              </div>
              <div className="space-y-2">
                <Label>عدد أيام الغياب</Label>
                <div className="relative">
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="number" min="1" value={daysCount} onChange={(e) => setDaysCount(e.target.value)} className="pr-9" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>تاريخ الغياب *</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="date" value={absenceDate} onChange={(e) => setAbsenceDate(e.target.value)} className="pr-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>سبب الغياب *</Label>
              <div className="relative">
                <FileText className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اكتب سبب الغياب بالتفصيل" rows={3} className="pr-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>إرفاق مستند (اختياري)</Label>
              {attachment ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Paperclip className="w-4 h-4 text-teal-600" />
                  <span className="text-sm flex-1 truncate">{attachment.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAttachment(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setAttachment(f) }}
                    className="hidden"
                    id="attachment-upload"
                  />
                  <label htmlFor="attachment-upload" className="cursor-pointer text-sm text-muted-foreground hover:text-teal-600">
                    <Paperclip className="w-6 h-6 mx-auto mb-1" />
                    اضغط لإرفاق مستند (صورة أو PDF)
                    <span className="block text-xs mt-1">الحد الأقصى 5 ميجابايت</span>
                  </label>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 bg-gradient-to-l from-teal-500 to-emerald-600"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 ml-1 animate-spin" /> جاري الإرسال...</>
              ) : (
                <><Send className="w-4 h-4 ml-1" /> إرسال العذر</>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {schoolName} • نظام إدارة حضور الطلاب
        </p>
      </div>
    </div>
  )
}
