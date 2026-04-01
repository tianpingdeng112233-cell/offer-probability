'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { DataStats } from '@/types'

export default function DataPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DataStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">数据管理</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.open('/api/data/template', '_blank')}>
            下载模板
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/admin/data/upload')}>
            上传数据
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : !stats || stats.total_records === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">暂无数据</h3>
            <p className="mt-1 text-sm text-gray-500">上传您的历史offer数据，开始使用概率分析功能</p>
            <div className="mt-4 flex justify-center gap-3">
              <Button variant="outline" onClick={() => window.open('/api/data/template', '_blank')}>
                下载模板
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/admin/data/upload')}>
                上传数据
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-4 gap-4">
            {[
              { label: '总数据条数', value: stats.total_records.toLocaleString() },
              { label: '覆盖学校', value: stats.school_count },
              { label: '覆盖专业', value: stats.major_count },
              { label: '数据时间跨度', value: `${stats.year_range.min}-${stats.year_range.max}` },
            ].map(s => (
              <Card key={s.label} className="border-0 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-gray-900">{s.value}</div>
                  <div className="mt-1 text-sm text-gray-500">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">录取率概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                    <circle
                      cx="50" cy="50" r="40" fill="none" stroke="#1a73e8" strokeWidth="12"
                      strokeDasharray={`${(stats.admitted_count / (stats.admitted_count + stats.rejected_count + stats.other_count)) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-xl font-bold">{Math.round((stats.admitted_count / (stats.admitted_count + stats.rejected_count + stats.other_count)) * 100)}%</div>
                    <div className="text-xs text-gray-500">录取率</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>录取：{stats.admitted_count} 条</div>
                  <div>拒绝：{stats.rejected_count} 条</div>
                  <div>其他：{stats.other_count} 条</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
