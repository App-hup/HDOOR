import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateSchoolCode, generateTeacherCode } from '@/lib/server-utils'

// Create a new school (with principal teacher)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, pin, teacherName } = body as { name: string; pin: string; teacherName: string }

    if (!name || !pin || !teacherName) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }
    if (pin.length < 4) {
      return NextResponse.json({ error: 'يجب أن يكون PIN 4 أرقام على الأقل' }, { status: 400 })
    }

    // Generate unique school code
    let code = generateSchoolCode()
    let exists = await db.school.findUnique({ where: { code } })
    while (exists) {
      code = generateSchoolCode()
      exists = await db.school.findUnique({ where: { code } })
    }

    const school = await db.school.create({
      data: {
        code,
        name,
        pin,
      },
    })

    // Create principal teacher
    const teacherCode = generateTeacherCode(code)
    const teacher = await db.teacher.create({
      data: {
        code: teacherCode,
        name: teacherName,
        pin,
        role: 'PRINCIPAL',
        schoolId: school.id,
      },
    })

    return NextResponse.json({
      school: { id: school.id, code: school.code, name: school.name },
      teacher: { id: teacher.id, code: teacher.code, name: teacher.name, role: teacher.role },
    })
  } catch (e) {
    console.error('Create school error:', e)
    return NextResponse.json({ error: 'فشل إنشاء المدرسة' }, { status: 500 })
  }
}

// Get school info by code
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.json({ error: 'رمز المدرسة مطلوب' }, { status: 400 })
    }
    const school = await db.school.findUnique({
      where: { code },
      select: { id: true, code: true, name: true },
    })
    if (!school) {
      return NextResponse.json({ error: 'المدرسة غير موجودة' }, { status: 404 })
    }
    return NextResponse.json({ school })
  } catch (e) {
    console.error('Get school error:', e)
    return NextResponse.json({ error: 'فشل جلب بيانات المدرسة' }, { status: 500 })
  }
}
