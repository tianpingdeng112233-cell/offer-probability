import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

    // RLS ensures tenant isolation, but also verify user belongs to same tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: '用户未找到' }, { status: 400 })

    const { data: query, error } = await supabase
      .from('queries')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (error || !query) {
      return NextResponse.json({ error: '查询不存在' }, { status: 404 })
    }

    return NextResponse.json(query)
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
