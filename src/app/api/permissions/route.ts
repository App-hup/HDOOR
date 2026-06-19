import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolFromHeaders } from '@/lib/server-utils'

// GET permissions
export async function GET(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const { searchParams } = req.nextUrl
    const date = searchParams.get('date')
    const studentId = searchParams.get('studentId')

    const where: Record<string, unknown> = { schoolId: school.id }
    if (date) where.date = date
    if (studentId) where.studentId = studentId

    const permissions = await db.permission.findMany({
      where,
      include: { student: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ permissions })
  } catch (e) {
    console.error('List permissions error:', e)
    return NextResponse.json({ error: 'فشل جلب الاستئذانات' }, { status: 500 })
  }
}

// POST create a permission
export async function POST(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const body = await req.json()
    const { studentId, date, time, reason, guardianName } = body as {
      studentId: string
      date: string
      time: string
      reason: string
      guardianName?: string
    }

    if (!studentId || !date || !time || !reason) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 })
    }

    // Verify student
    const student = await db.student.findFirst({ where: { id: studentId, schoolId: school.id } })
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })

    const permission = await db.permission.create({
      data: {
        studentId,
        schoolId: school.id,
        date,
        time,
        reason,
        guardianName: guardianName || '',
      },
    })
    return NextResponse.json({ permission })
  } catch (e) {
    console.error('Create permission error:', e)
    return NextResponse.json({ error: 'فشل تسجيل الاستئذان' }, { status: 500 })
  }
}

// DELETE a permission
export async function DELETE(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
    await db.permission.deleteMany({ where: { id, schoolId: school.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete permission error:', e)
    return NextResponse.json({ error: 'فشل حذف الاستئذان' }, { status: 500 })
  }
}
