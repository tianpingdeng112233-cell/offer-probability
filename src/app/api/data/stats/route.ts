import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: '用户未找到' }, { status: 400 })

    const { data: records } = await supabase
      .from('offer_records')
      .select('target_school, target_major, application_year, result')
      .eq('tenant_id', profile.tenant_id)

    if (!records || records.length === 0) {
      return NextResponse.json({
        total_records: 0,
        school_count: 0,
        major_count: 0,
        year_range: { min: 0, max: 0 },
        admitted_count: 0,
        rejected_count: 0,
        other_count: 0,
      })
    }

    const schools = new Set(records.map(r => r.target_school))
    const majors = new Set(records.map(r => r.target_major))
    const years = records.map(r => r.application_year).filter(Boolean)

    return NextResponse.json({
      total_records: records.length,
      school_count: schools.size,
      major_count: majors.size,
      year_range: {
        min: years.length > 0 ? Math.min(...years) : 0,
        max: years.length > 0 ? Math.max(...years) : 0,
      },
      admitted_count: records.filter(r => r.result === 'admitted').length,
      rejected_count: records.filter(r => r.result === 'rejected').length,
      other_count: records.filter(r => r.result !== 'admitted' && r.result !== 'rejected').length,
    })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
