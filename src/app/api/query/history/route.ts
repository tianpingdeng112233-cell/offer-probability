import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = 20

    let query = supabase
      .from('queries')
      .select('id, input_data, probability, confidence_level, created_at', { count: 'exact' })
      .eq('consultant_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    const { data: queries, count, error } = await query

    if (error) {
      return NextResponse.json({ error: '查询失败' }, { status: 500 })
    }

    // Filter by search if provided (client-side filter on target_school in input_data)
    let filtered = queries || []
    if (search) {
      filtered = filtered.filter((q: { input_data: { target_school?: string } }) =>
        q.input_data?.target_school?.toLowerCase().includes(search.toLowerCase())
      )
    }

    return NextResponse.json({ queries: filtered, total: count || 0, page, pageSize })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
