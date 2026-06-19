import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolFromHeaders } from '@/lib/server-utils'

// Bulk import students
export async function POST(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const body = await req.json()
    const { students } = body as { students: { name: string; civilId: string; phone: string; grade: string; section: string }[] }

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للاستيراد' }, { status: 400 })
    }

    const valid = students.filter((s) => s.name && s.name.trim())
    if (valid.length === 0) {
      return NextResponse.json({ error: 'لا توجد أسماء صالحة' }, { status: 400 })
    }

    const result = await db.student.createMany({
      data: valid.map((s) => ({
        name: s.name.trim(),
        civilId: (s.civilId || '').trim(),
        phone: (s.phone || '').trim(),
        grade: (s.grade || '').trim() || 'غير محدد',
        section: (s.section || '').trim() || 'غير محدد',
        schoolId: school.id,
      })),
    })

    return NextResponse.json({ count: result.count })
  } catch (e) {
    console.error('Import students error:', e)
    return NextResponse.json({ error: 'فشل استيراد الطلاب' }, { status: 500 })
  }
}
