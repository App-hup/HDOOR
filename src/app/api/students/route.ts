import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolFromHeaders, todayStr } from '@/lib/server-utils'

// List students with optional filters
export async function GET(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') || ''
    const grade = searchParams.get('grade') || ''
    const section = searchParams.get('section') || ''

    const where: Record<string, unknown> = { schoolId: school.id }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { civilId: { contains: search } },
        { phone: { contains: search } },
      ]
    }
    if (grade) where.grade = grade
    if (section) where.section = section

    const students = await db.student.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ students })
  } catch (e) {
    console.error('List students error:', e)
    return NextResponse.json({ error: 'فشل جلب الطلاب' }, { status: 500 })
  }
}

// Add a new student
export async function POST(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const body = await req.json()
    const { name, civilId, phone, grade, section } = body
    if (!name || !grade || !section) {
      return NextResponse.json({ error: 'الاسم والصف والفصل مطلوبة' }, { status: 400 })
    }
    const student = await db.student.create({
      data: {
        name,
        civilId: civilId || '',
        phone: phone || '',
        grade,
        section,
        schoolId: school.id,
      },
    })
    return NextResponse.json({ student })
  } catch (e) {
    console.error('Create student error:', e)
    return NextResponse.json({ error: 'فشل إضافة الطالب' }, { status: 500 })
  }
}

// Update a student
export async function PUT(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const body = await req.json()
    const { id, name, civilId, phone, grade, section } = body
    if (!id) {
      return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 })
    }
    const existing = await db.student.findFirst({ where: { id, schoolId: school.id } })
    if (!existing) {
      return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
    }
    const student = await db.student.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        civilId: civilId ?? existing.civilId,
        phone: phone ?? existing.phone,
        grade: grade ?? existing.grade,
        section: section ?? existing.section,
      },
    })
    return NextResponse.json({ student })
  } catch (e) {
    console.error('Update student error:', e)
    return NextResponse.json({ error: 'فشل تعديل الطالب' }, { status: 500 })
  }
}

// Delete a student (or all)
export async function DELETE(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const { searchParams } = req.nextUrl
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    if (all === '1') {
      await db.student.deleteMany({ where: { schoolId: school.id } })
      return NextResponse.json({ success: true, message: 'تم حذف جميع الطلاب' })
    }

    if (!id) {
      return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 })
    }
    await db.student.deleteMany({ where: { id, schoolId: school.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete student error:', e)
    return NextResponse.json({ error: 'فشل حذف الطالب' }, { status: 500 })
  }
}
