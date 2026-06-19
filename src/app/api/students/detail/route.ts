import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolFromHeaders } from '@/lib/server-utils'

// Get detailed record for a single student
export async function GET(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 })
    }
    const student = await db.student.findFirst({
      where: { id, schoolId: school.id },
      include: {
        lateRecords: { orderBy: { date: 'desc' } },
        absenceRecords: { orderBy: { date: 'desc' } },
        notes: { orderBy: { date: 'desc' } },
        permissions: { orderBy: { date: 'desc' } },
      },
    })
    if (!student) {
      return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
    }
    return NextResponse.json({ student })
  } catch (e) {
    console.error('Student detail error:', e)
    return NextResponse.json({ error: 'فشل جلب سجل الطالب' }, { status: 500 })
  }
}
