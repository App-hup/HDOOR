import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolFromHeaders, todayStr } from '@/lib/server-utils'
import { lastNMonths, isSameMonth } from '@/lib/date-utils'

export async function GET(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const today = todayStr()
    const students = await db.student.findMany({
      where: { schoolId: school.id },
      include: {
        lateRecords: true,
        absenceRecords: true,
      },
    })

    const todayLate = await db.lateRecord.count({ where: { schoolId: school.id, date: today } })
    const todayAbsence = await db.absenceRecord.count({ where: { schoolId: school.id, date: today } })
    const todayNotes = await db.note.count({ where: { schoolId: school.id, date: today } })
    const todayPermissions = await db.permission.count({ where: { schoolId: school.id, date: today } })
    const pendingExcuses = await db.excuse.count({ where: { schoolId: school.id, status: 'PENDING' } })

    const totalStudents = students.length
    // Today's attendance = total - (absent) - (we don't double count late as absent)
    const attendanceRate = totalStudents > 0
      ? Math.round(((totalStudents - todayAbsence) / totalStudents) * 100)
      : 0
    const absenceRate = totalStudents > 0 ? Math.round((todayAbsence / totalStudents) * 100) : 0
    const lateRate = totalStudents > 0 ? Math.round((todayLate / totalStudents) * 100) : 0

    // Absence levels distribution
    const levels = JSON.parse(school.levelsJson || '[]') as { level: number; name: string; minDays: number; maxDays: number; color: string }[]
    const studentAbsenceCounts = students.map((s) => {
      const count = s.absenceRecords.length
      let level = levels[0]
      for (const l of levels) {
        if (count >= l.minDays && count <= l.maxDays) { level = l; break }
      }
      return { student: s, count, level }
    })

    const levelDistribution = levels.map((l) => ({
      ...l,
      count: studentAbsenceCounts.filter((s) => s.level.level === l.level).length,
    }))

    // Monthly trend (last 6 months)
    const months = lastNMonths(6)
    const allLateRecords = await db.lateRecord.findMany({ where: { schoolId: school.id } })
    const allAbsenceRecords = await db.absenceRecord.findMany({ where: { schoolId: school.id } })

    const monthlyData = months.map((m) => ({
      label: m.label,
      late: allLateRecords.filter((r) => isSameMonth(r.date, m.key)).length,
      absence: allAbsenceRecords.filter((r) => isSameMonth(r.date, m.key)).length,
    }))

    // Grade distribution
    const gradeMap = new Map<string, number>()
    for (const s of students) {
      const key = `${s.grade} - ${s.section}`
      gradeMap.set(key, (gradeMap.get(key) || 0) + 1)
    }
    const gradeDistribution = Array.from(gradeMap.entries()).map(([name, count]) => ({ name, count }))

    // Top absent students
    const topAbsent = studentAbsenceCounts
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((s) => ({ name: s.student.name, grade: s.student.grade, section: s.student.section, count: s.count, level: s.level }))

    return NextResponse.json({
      stats: {
        totalStudents,
        todayLate,
        todayAbsence,
        todayNotes,
        todayPermissions,
        pendingExcuses,
        attendanceRate,
        absenceRate,
        lateRate,
      },
      levels,
      levelDistribution,
      monthlyData,
      gradeDistribution,
      topAbsent,
      studentAbsenceCounts: studentAbsenceCounts.map((s) => ({
        id: s.student.id,
        name: s.student.name,
        grade: s.student.grade,
        section: s.student.section,
        absenceCount: s.count,
        lateCount: s.student.lateRecords.length,
        level: s.level,
      })),
    })
  } catch (e) {
    console.error('Analytics error:', e)
    return NextResponse.json({ error: 'فشل جلب الإحصائيات' }, { status: 500 })
  }
}
