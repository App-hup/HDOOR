import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolFromHeaders } from '@/lib/server-utils'

// GET excuses (teacher view)
export async function GET(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { schoolId: school.id }
    if (status) where.status = status

    const excuses = await db.excuse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ excuses })
  } catch (e) {
    console.error('List excuses error:', e)
    return NextResponse.json({ error: 'فشل جلب الأعذار' }, { status: 500 })
  }
}

// PUT update excuse status
export async function PUT(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const body = await req.json()
    const { id, status } = body as { id: string; status: 'PENDING' | 'REVIEWED' }
    if (!id || !status) return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })

    const excuse = await db.excuse.findFirst({ where: { id, schoolId: school.id } })
    if (!excuse) return NextResponse.json({ error: 'العذر غير موجود' }, { status: 404 })

    const updated = await db.excuse.update({ where: { id }, data: { status } })
    return NextResponse.json({ excuse: updated })
  } catch (e) {
    console.error('Update excuse error:', e)
    return NextResponse.json({ error: 'فشل تحديث العذر' }, { status: 500 })
  }
}

// DELETE an excuse
export async function DELETE(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
    await db.excuse.deleteMany({ where: { id, schoolId: school.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete excuse error:', e)
    return NextResponse.json({ error: 'فشل حذف العذر' }, { status: 500 })
  }
}
