import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolFromHeaders } from '@/lib/server-utils'

// GET report data based on type and range
export async function GET(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const type = searchParams.get('type') || 'late' // late | absence | notes | comprehensive
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const studentId = searchParams.get('studentId')
    const grade = searchParams.get('grade')
    const section = searchParams.get('section')

    const dateFilter = (field: string) => {
      if (fromDate && toDate) return { AND: [{ [field]: { gte: fromDate } }, { [field]: { lte: toDate } }] }
      if (fromDate) return { [field]: { gte: fromDate } }
      if (toDate) return { [field]: { lte: toDate } }
      return {}
    }

    const studentFilter = studentId ? { studentId } : {}
    const baseWhere = { schoolId: school.id, ...studentFilter }

    let result: Record<string, unknown> = { type, fromDate, toDate, schoolName: school.name }

    if (type === 'late' || type === 'comprehensive') {
      const records = await db.lateRecord.findMany({
        where: { ...baseWhere, ...dateFilter('date') },
        include: { student: true },
        orderBy: { date: 'desc' },
      })
      if (grade) records.filter((r) => r.student.grade === grade)
      result.lateRecords = grade
        ? records.filter((r) => r.student.grade === grade && (!section || r.student.section === section))
        : records
    }

    if (type === 'absence' || type === 'comprehensive') {
      const records = await db.absenceRecord.findMany({
        where: { ...baseWhere, ...dateFilter('date') },
        include: { student: true },
        orderBy: { date: 'desc' },
      })
      result.absenceRecords = grade
        ? records.filter((r) => r.student.grade === grade && (!section || r.student.section === section))
        : records
    }

    if (type === 'notes' || type === 'comprehensive') {
      const records = await db.note.findMany({
        where: { ...baseWhere, ...dateFilter('date') },
        include: { student: true },
        orderBy: { date: 'desc' },
      })
      result.notesRecords = grade
        ? records.filter((r) => r.student.grade === grade && (!section || r.student.section === section))
        : records
    }

    // Comprehensive: include permissions and excuses
    if (type === 'comprehensive') {
      const permissions = await db.permission.findMany({
        where: { ...baseWhere, ...dateFilter('date') },
        include: { student: true },
        orderBy: { date: 'desc' },
      })
      result.permissionRecords = grade
        ? permissions.filter((r) => r.student.grade === grade && (!section || r.student.section === section))
        : permissions
    }

    // Build summary
    const summary: Record<string, number> = {}
    summary.late = (result.lateRecords as unknown[])?.length || 0
    summary.absence = (result.absenceRecords as unknown[])?.length || 0
    summary.notes = (result.notesRecords as unknown[])?.length || 0
    summary.permissions = (result.permissionRecords as unknown[])?.length || 0
    result.summary = summary

    return NextResponse.json(result)
  } catch (e) {
    console.error('Reports error:', e)
    return NextResponse.json({ error: 'فشل جلب التقرير' }, { status: 500 })
  }
}
