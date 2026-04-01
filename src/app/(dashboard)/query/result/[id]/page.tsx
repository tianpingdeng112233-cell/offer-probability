import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResultDisplay } from '@/components/query/ResultDisplay'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: query } = await supabase
    .from('queries')
    .select('*')
    .eq('id', id)
    .single()

  if (!query) redirect('/query')

  return <ResultDisplay query={query} />
}
