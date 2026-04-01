import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
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

    const { name, email } = await request.json()
    if (!name || !email) {
      return NextResponse.json({ error: '请填写姓名和邮箱' }, { status: 400 })
    }

    // Create auth user with random password (user will reset via email)
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1'
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile
    await supabaseAdmin.from('profiles').insert({
      id: authUser.user.id,
      tenant_id: profile.tenant_id,
      name,
      role: 'consultant',
      status: 'active',
    })

    // Send password reset email so consultant can set their own password
    await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
