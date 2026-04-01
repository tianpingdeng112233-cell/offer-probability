import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

    const { data: members } = await supabase
      .from('profiles')
      .select('id, name, role, status, last_active_at, created_at')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at')

    // We need emails from auth - fetch via service role if available
    // For now, return profiles without email (would need admin API)
    const membersWithEmail = (members || []).map(m => ({
      ...m,
      email: '', // Would need service role to fetch from auth.users
    }))

    return NextResponse.json({ members: membersWithEmail })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
