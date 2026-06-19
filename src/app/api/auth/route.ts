import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateTeacherCode } from '@/lib/server-utils'

// Login with school code + PIN (finds principal or teacher)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { schoolCode, pin, teacherName } = body as {
      schoolCode: string
      pin: string
      teacherName?: string
    }

    if (!schoolCode || !pin) {
      return NextResponse.json({ error: 'الرمز و PIN مطلوبان' }, { status: 400 })
    }

    const school = await db.school.findUnique({
      where: { code: schoolCode },
      include: { teachers: true },
    })
    if (!school) {
      return NextResponse.json({ error: 'المدرسة غير موجودة' }, { status: 404 })
    }

    // If teacherName provided => join as new teacher
    if (teacherName) {
      if (school.pin !== pin) {
        return NextResponse.json({ error: 'PIN المدرسة غير صحيح' }, { status: 401 })
      }
      let teacherCode = generateTeacherCode(schoolCode)
      let exists = await db.teacher.findUnique({ where: { code: teacherCode } })
      while (exists) {
        teacherCode = generateTeacherCode(schoolCode)
        exists = await db.teacher.findUnique({ where: { code: teacherCode } })
      }
      const teacher = await db.teacher.create({
        data: {
          code: teacherCode,
          name: teacherName,
          pin,
          role: 'TEACHER',
          schoolId: school.id,
        },
      })
      return NextResponse.json({
        school: { id: school.id, code: school.code, name: school.name },
        teacher: { id: teacher.id, code: teacher.code, name: teacher.name, role: teacher.role },
      })
    }

    // Login: try to find a teacher with this PIN (principal first)
    const teacher = school.teachers.find((t) => t.pin === pin) || school.teachers.find((t) => t.role === 'PRINCIPAL')
    if (!teacher) {
      return NextResponse.json({ error: 'PIN غير صحيح' }, { status: 401 })
    }
    if (teacher.pin !== pin) {
      return NextResponse.json({ error: 'PIN غير صحيح' }, { status: 401 })
    }

    return NextResponse.json({
      school: { id: school.id, code: school.code, name: school.name },
      teacher: { id: teacher.id, code: teacher.code, name: teacher.name, role: teacher.role },
    })
  } catch (e) {
    console.error('Auth error:', e)
    return NextResponse.json({ error: 'فشل تسجيل الدخول' }, { status: 500 })
  }
}
