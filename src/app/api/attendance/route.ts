import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolFromHeaders, todayStr } from '@/lib/server-utils'

// GET attendance records (late or absence)
export async function GET(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type') || 'late' // late | absence
    const date = searchParams.get('date')
    const studentId = searchParams.get('studentId')

    const where: Record<string, unknown> = { schoolId: school.id }
    if (date) where.date = date
    if (studentId) where.studentId = studentId

    const table = type === 'absence' ? db.absenceRecord : db.lateRecord
    const records = await table.findMany({
      where,
      include: { student: true },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ records })
  } catch (e) {
    console.error('List attendance error:', e)
    return NextResponse.json({ error: 'فشل جلب السجلات' }, { status: 500 })
  }
}

// POST save attendance records (bulk)
export async function POST(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const body = await req.json()
    const { type, date, studentIds } = body as {
      type: 'late' | 'absence'
      date: string
      studentIds: string[]
    }

    if (!type || !date || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
    }
    if (studentIds.length === 0) {
      return NextResponse.json({ error: 'لم يتم تحديد طلاب' }, { status: 400 })
    }

    // Verify students belong to school
    const validStudents = await db.student.findMany({
      where: { id: { in: studentIds }, schoolId: school.id },
      select: { id: true },
    })
    const validIds = validStudents.map((s) => s.id)

    if (type === 'absence') {
      // Remove existing absence records for these students on this date
      await db.absenceRecord.deleteMany({
        where: { schoolId: school.id, date, studentId: { in: validIds } },
      })
      await db.absenceRecord.createMany({
        data: validIds.map((studentId) => ({ studentId, schoolId: school.id, date })),
      })
    } else {
      await db.lateRecord.deleteMany({
        where: { schoolId: school.id, date, studentId: { in: validIds } },
      })
      await db.lateRecord.createMany({
        data: validIds.map((studentId) => ({ studentId, schoolId: school.id, date })),
      })
    }

    return NextResponse.json({ count: validIds.length })
  } catch (e) {
    console.error('Save attendance error:', e)
    return NextResponse.json({ error: 'فشل حفظ السجلات' }, { status: 500 })
  }
}

// DELETE attendance record(s)
export async function DELETE(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type') || 'late'
    const id = searchParams.get('id')

    const table = type === 'absence' ? db.absenceRecord : db.lateRecord
    if (id) {
      await table.deleteMany({ where: { id, schoolId: school.id } })
    } else {
      const date = searchParams.get('date')
      const studentId = searchParams.get('studentId')
      const where: Record<string, unknown> = { schoolId: school.id }
      if (date) where.date = date
      if (studentId) where.studentId = studentId
      await table.deleteMany({ where })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete attendance error:', e)
    return NextResponse.json({ error: 'فشل حذف السجل' }, { status: 500 })
  }
}
