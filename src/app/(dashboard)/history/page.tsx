'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CONFIDENCE_LABELS, DEGREE_TYPES } from '@/lib/constants'

interface HistoryItem {
  id: string
  input_data: {
    target_school: string
    target_major: string
    target_degree: string
  }
  probability: number | null
  confidence_level: string
  created_at: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [queries, setQueries] = useState<HistoryItem[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pageSize = 20

  useEffect(() => {
    fetchHistory()
  }, [page])

  const fetchHistory = async () => {
    setLoading(true)
    const res = await fetch(`/api/query/history?page=${page}&search=${search}`)
    const data = await res.json()
    setQueries(data.queries || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchHistory()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">查询历史</h1>
        <form onSubmit={handleSearch} className="w-64">
          <Input
            placeholder="搜索学校名称..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>
      </div>

      {loading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-gray-500">加载中...</CardContent>
        </Card>
      ) : queries.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">暂无查询记录</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/query')}>
              开始首次分析
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">查询时间</th>
                    <th className="px-4 py-3 font-medium">目标学校</th>
                    <th className="px-4 py-3 font-medium">目标专业</th>
                    <th className="px-4 py-3 font-medium">学位</th>
                    <th className="px-4 py-3 font-medium">概率</th>
                    <th className="px-4 py-3 font-medium">置信度</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {queries.map(q => {
                    const degreeLabel = DEGREE_TYPES.find(d => d.value === q.input_data.target_degree)?.label || ''
                    const confidenceInfo = CONFIDENCE_LABELS[q.confidence_level]
                    return (
                      <tr key={q.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(q.created_at).toLocaleString('zh-CN')}
                        </td>
                        <td className="px-4 py-3 font-medium">{q.input_data.target_school}</td>
                        <td className="px-4 py-3">{q.input_data.target_major}</td>
                        <td className="px-4 py-3">{degreeLabel}</td>
                        <td className="px-4 py-3 font-bold text-blue-600">
                          {q.probability !== null ? `${Math.round(q.probability)}%` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {confidenceInfo && (
                            <span className={`text-xs ${confidenceInfo.color}`}>{confidenceInfo.label}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push(`/query/result/${q.id}`)}
                            className="text-blue-600 hover:text-blue-700 text-xs"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                上一页
              </Button>
              <span className="text-sm text-gray-500">第 {page} / {totalPages} 页</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
