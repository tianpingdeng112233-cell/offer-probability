import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    console.error('Profile not found for user:', user.id, 'Error:', profileError)
    // Don't redirect to /login as user is authenticated - show error instead
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">用户资料加载失败</p>
          <p className="text-sm text-gray-500 mt-2">错误: {profileError?.message || '未找到profile'}</p>
          <p className="text-sm text-gray-400 mt-1">User ID: {user.id}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={profile} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
