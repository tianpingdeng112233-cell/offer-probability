import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { findSimilarCases } from '@/lib/ai/similarity'
import { analyzeWithAI } from '@/lib/ai/analyze'
import type { QueryInput, ConfidenceLevel } from '@/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: '用户资料未找到' }, { status: 400 })

    const input: QueryInput = await request.json()

    // Fetch matching records from this tenant's data
    // First try exact school+major match, then broader
    let { data: records } = await supabase
      .from('offer_records')
      .select('*')
      .eq('tenant_id', profile.tenant_id)

    if (!records) records = []

    // Filter for relevant records (same target school or major)
    const relevantRecords = records.filter(r =>
      r.target_school.toLowerCase().includes(input.target_school.toLowerCase()) ||
      input.target_school.toLowerCase().includes(r.target_school.toLowerCase()) ||
      r.target_major.toLowerCase().includes(input.target_major.toLowerCase()) ||
      input.target_major.toLowerCase().includes(r.target_major.toLowerCase())
    )

    // Calculate similar cases
    const similarCases = findSimilarCases(input, relevantRecords.length > 0 ? relevantRecords : records)

    // Determine confidence level
    const matchCount = relevantRecords.filter(r => r.result === 'admitted' || r.result === 'rejected').length
    let confidenceLevel: ConfidenceLevel = 'insufficient'
    if (matchCount >= 20) confidenceLevel = 'high'
    else if (matchCount >= 10) confidenceLevel = 'medium'
    else if (matchCount >= 3) confidenceLevel = 'low'

    // AI analysis
    let probability: number | null = null
    let resultSummary = ''

    if (matchCount >= 3) {
      const aiResult = await analyzeWithAI(input, relevantRecords)
      probability = aiResult.probability
      resultSummary = aiResult.reasoning
    }

    // Build data basis text
    const totalRecords = records.length
    const admittedInSimilar = relevantRecords.filter(r => r.result === 'admitted').length
    const totalRelevant = relevantRecords.filter(r => r.result === 'admitted' || r.result === 'rejected').length
    const dataBasis = matchCount >= 3
      ? `基于本机构共${totalRecords}条历史数据分析 · 在与您背景相似的${totalRelevant}位申请者中，${admittedInSimilar}位获得录取`
      : `本机构共${totalRecords}条数据，与该校/专业相关数据较少`

    // Save query record
    const { data: queryRecord, error: insertError } = await supabase
      .from('queries')
      .insert({
        tenant_id: profile.tenant_id,
        consultant_id: user.id,
        input_data: input,
        probability,
        confidence_level: confidenceLevel,
        similar_cases: similarCases,
        result_summary: resultSummary,
        data_basis: dataBasis,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: '保存查询失败' }, { status: 500 })
    }

    return NextResponse.json(queryRecord)
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
