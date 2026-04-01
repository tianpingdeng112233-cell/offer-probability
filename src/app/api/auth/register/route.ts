import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { orgName, email, password } = await request.json()

    if (!orgName || !email || !password) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 })
    }

    // Check if org name already exists
    const { data: existingOrg } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('name', orgName)
      .single()

    if (existingOrg) {
      return NextResponse.json({ error: '机构名称已存在' }, { status: 400 })
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({ name: orgName })
      .select()
      .single()

    if (tenantError) {
      return NextResponse.json({ error: '创建机构失败' }, { status: 500 })
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      // Cleanup tenant
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile
    await supabaseAdmin.from('profiles').insert({
      id: authUser.user.id,
      tenant_id: tenant.id,
      name: email.split('@')[0],
      role: 'admin',
      status: 'active',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
