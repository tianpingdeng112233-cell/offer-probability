import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const { rows, mapping } = await request.json()

    if (!rows || !mapping) {
      return NextResponse.json({ error: '缺少数据' }, { status: 400 })
    }

    let success = 0
    let skipped = 0

    const records = []
    for (const row of rows) {
      const record: Record<string, unknown> = {
        tenant_id: profile.tenant_id,
        uploaded_by: user.id,
      }

      // Map Excel columns to system fields
      for (const [excelCol, systemField] of Object.entries(mapping)) {
        const value = row[excelCol]
        if (value !== undefined && value !== null && value !== '') {
          record[systemField as string] = value
        }
      }

      // Validate required fields
      const required = ['undergraduate_school', 'undergraduate_major', 'gpa', 'language_type', 'language_score', 'target_school', 'target_major', 'target_degree', 'application_year', 'result']
      const hasRequired = required.every(f => record[f] !== undefined && record[f] !== '')

      if (!hasRequired) {
        skipped++
        continue
      }

      // Normalize data with NaN validation
      record.gpa = parseFloat(String(record.gpa))
      record.language_score = parseFloat(String(record.language_score))
      record.application_year = parseInt(String(record.application_year))
      if (record.gre_gmat_score) record.gre_gmat_score = parseFloat(String(record.gre_gmat_score))

      // Skip records with invalid numeric values
      if (isNaN(record.gpa as number) || isNaN(record.language_score as number) || isNaN(record.application_year as number)) {
        skipped++
        continue
      }

      // Normalize result
      const resultMap: Record<string, string> = {
        '录取': 'admitted', 'admitted': 'admitted', 'offer': 'admitted', 'accept': 'admitted',
        '拒绝': 'rejected', 'rejected': 'rejected', 'reject': 'rejected', 'rej': 'rejected',
        '等待': 'waitlisted', 'waitlisted': 'waitlisted', 'waitlist': 'waitlisted',
        '撤回': 'withdrawn', 'withdrawn': 'withdrawn', 'withdraw': 'withdrawn',
      }
      record.result = resultMap[String(record.result).toLowerCase().trim()] || record.result

      // Normalize degree
      const degreeMap: Record<string, string> = {
        '硕士': 'master', 'master': 'master', 'msc': 'master', 'ma': 'master',
        '博士': 'phd', 'phd': 'phd', 'doctorate': 'phd',
        '本科': 'bachelor', 'bachelor': 'bachelor', 'bs': 'bachelor', 'ba': 'bachelor',
      }
      record.target_degree = degreeMap[String(record.target_degree).toLowerCase().trim()] || record.target_degree

      // Default gpa_scale
      if (!record.gpa_scale) {
        const gpa = record.gpa as number
        if (gpa > 5) record.gpa_scale = '100'
        else if (gpa > 4) record.gpa_scale = '5.0'
        else record.gpa_scale = '4.0'
      }

      // Default language_type
      if (!record.language_type || !['IELTS', 'TOEFL'].includes(String(record.language_type).toUpperCase())) {
        const score = record.language_score as number
        record.language_type = score > 9 ? 'TOEFL' : 'IELTS'
      } else {
        record.language_type = String(record.language_type).toUpperCase()
      }

      // Handle background_tags
      if (record.background_tags && typeof record.background_tags === 'string') {
        record.background_tags = String(record.background_tags).split(/[,，、;；]/).map((t: string) => t.trim()).filter(Boolean)
      } else if (!record.background_tags) {
        record.background_tags = []
      }

      records.push(record)
      success++
    }

    // Batch insert
    if (records.length > 0) {
      const { error } = await supabase.from('offer_records').insert(records)
      if (error) {
        return NextResponse.json({ error: '导入失败: ' + error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success, skipped })
  } catch (e) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
