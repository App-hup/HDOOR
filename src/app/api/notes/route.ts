import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolFromHeaders } from '@/lib/server-utils'

// GET notes
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

    const notes = await db.note.findMany({
      where,
      include: { student: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ notes })
  } catch (e) {
    console.error('List notes error:', e)
    return NextResponse.json({ error: 'فشل جلب الملاحظات' }, { status: 500 })
  }
}

// POST save notes (bulk for multiple students)
export async function POST(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const body = await req.json()
    const { date, content, studentIds } = body as { date: string; content: string; studentIds: string[] }

    if (!date || !content || !studentIds?.length) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 })
    }

    const validStudents = await db.student.findMany({
      where: { id: { in: studentIds }, schoolId: school.id },
      select: { id: true },
    })

    await db.note.createMany({
      data: validStudents.map((s) => ({
        studentId: s.id,
        schoolId: school.id,
        date,
        content,
      })),
    })

    return NextResponse.json({ count: validStudents.length })
  } catch (e) {
    console.error('Save notes error:', e)
    return NextResponse.json({ error: 'فشل حفظ الملاحظات' }, { status: 500 })
  }
}

// DELETE a note
export async function DELETE(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
    await db.note.deleteMany({ where: { id, schoolId: school.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete note error:', e)
    return NextResponse.json({ error: 'فشل حذف الملاحظة' }, { status: 500 })
  }
}
