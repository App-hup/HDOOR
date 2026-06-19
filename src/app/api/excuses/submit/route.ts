import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public endpoint: parent submits an excuse (no auth header needed)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { schoolCode, studentName, grade, absenceDate, daysCount, reason, attachment } = body as {
      schoolCode: string
      studentName: string
      grade?: string
      absenceDate: string
      daysCount: number
      reason: string
      attachment?: string | null
    }

    if (!schoolCode || !studentName || !absenceDate || !reason) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 })
    }

    const school = await db.school.findUnique({ where: { code: schoolCode } })
    if (!school) {
      return NextResponse.json({ error: 'رمز المدرسة غير صحيح' }, { status: 404 })
    }

    const excuse = await db.excuse.create({
      data: {
        schoolId: school.id,
        studentName: studentName.trim(),
        grade: (grade || '').trim(),
        absenceDate,
        daysCount: Number(daysCount) || 1,
        reason: reason.trim(),
        attachment: attachment || null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, id: excuse.id })
  } catch (e) {
    console.error('Submit excuse error:', e)
    return NextResponse.json({ error: 'فشل إرسال العذر' }, { status: 500 })
  }
}

// Public endpoint: verify school code exists
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'الرمز مطلوب' }, { status: 400 })
    const school = await db.school.findUnique({
      where: { code },
      select: { name: true },
    })
    if (!school) return NextResponse.json({ error: 'المدرسة غير موجودة' }, { status: 404 })
    return NextResponse.json({ school })
  } catch (e) {
    console.error('Verify school error:', e)
    return NextResponse.json({ error: 'فشل التحقق' }, { status: 500 })
  }
}
