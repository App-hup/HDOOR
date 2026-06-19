import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolFromHeaders } from '@/lib/server-utils'

// GET school settings (levels + info)
export async function GET(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const teachers = await db.teacher.findMany({
      where: { schoolId: school.id },
      select: { id: true, code: true, name: true, role: true, createdAt: true },
    })
    return NextResponse.json({
      school: {
        id: school.id,
        code: school.code,
        name: school.name,
        levelsJson: school.levelsJson,
      },
      teachers,
    })
  } catch (e) {
    console.error('Get settings error:', e)
    return NextResponse.json({ error: 'فشل جلب الإعدادات' }, { status: 500 })
  }
}

// PUT update school settings (name, levels, pin)
export async function PUT(req: NextRequest) {
  try {
    const school = await getSchoolFromHeaders(req.headers)
    if (!school) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const body = await req.json()
    const { name, levelsJson, pin } = body as { name?: string; levelsJson?: string; pin?: string }

    const data: Record<string, string> = {}
    if (name) data.name = name
    if (levelsJson) {
      // Validate JSON
      try { JSON.parse(levelsJson) } catch { return NextResponse.json({ error: 'صيغة المستويات غير صحيحة' }, { status: 400 }) }
      data.levelsJson = levelsJson
    }
    if (pin) {
      if (pin.length < 4) return NextResponse.json({ error: 'PIN يجب أن يكون 4 أرقام على الأقل' }, { status: 400 })
      data.pin = pin
    }

    const updated = await db.school.update({ where: { id: school.id }, data })
    return NextResponse.json({ school: { id: updated.id, code: updated.code, name: updated.name, levelsJson: updated.levelsJson } })
  } catch (e) {
    console.error('Update settings error:', e)
    return NextResponse.json({ error: 'فشل تحديث الإعدادات' }, { status: 500 })
  }
}
