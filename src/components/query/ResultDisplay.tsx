'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { QueryResult, SimilarCase } from '@/types'
import { CONFIDENCE_LABELS, DEGREE_TYPES } from '@/lib/constants'

interface Props {
  query: QueryResult
}

export function ResultDisplay({ query }: Props) {
  const input = query.input_data
  const degreeLabel = DEGREE_TYPES.find(d => d.value === input.target_degree)?.label || input.target_degree
  const confidenceInfo = CONFIDENCE_LABELS[query.confidence_level] || CONFIDENCE_LABELS.low

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/query" className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        返回查询
      </Link>

      {/* Probability Display */}
      <Card className="mb-6 border-0 shadow-md overflow-hidden">
        <div className="text-center pt-6">
          <p className="text-gray-500">{input.target_school} · {input.target_major} · {degreeLabel}</p>
        </div>
        {query.probability !== null ? (
          <div className="py-10 text-center">
            <div className="text-7xl font-bold text-blue-600">
              {Math.round(query.probability)}
              <span className="text-3xl text-blue-400">%</span>
            </div>
            <p className="mt-2 text-gray-500">预估录取概率</p>
            <Badge variant="outline" className={`mt-3 ${confidenceInfo.color}`}>
              置信度：{confidenceInfo.label}
            </Badge>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-xl text-gray-500">数据不足，无法给出概率</p>
            <p className="mt-1 text-sm text-gray-400">请查看下方相似案例</p>
          </div>
        )}
        <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-500">
          {query.data_basis}
        </div>
      </Card>

      {/* Student Background Summary */}
      <Card className="mb-6 border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">学生背景摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">本科院校</span>
              <p className="font-medium">{input.undergraduate_school}</p>
            </div>
            <div>
              <span className="text-gray-400">本科专业</span>
              <p className="font-medium">{input.undergraduate_major}</p>
            </div>
            <div>
              <span className="text-gray-400">GPA</span>
              <p className="font-medium">{input.gpa} / {input.gpa_scale}</p>
            </div>
            <div>
              <span className="text-gray-400">{input.language_type}</span>
              <p className="font-medium">{input.language_score}</p>
            </div>
            {input.gre_gmat_score && (
              <div>
                <span className="text-gray-400">GRE/GMAT</span>
                <p className="font-medium">{input.gre_gmat_score}</p>
              </div>
            )}
            {input.background_tags && input.background_tags.length > 0 && (
              <div>
                <span className="text-gray-400">背景标签</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {input.background_tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Similar Cases */}
      {query.similar_cases && query.similar_cases.length > 0 && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">相似历史案例</h2>
            <p className="text-sm text-gray-500">以下案例来自本机构历史数据，已做脱敏处理</p>
          </div>

          <div className="space-y-3">
            {query.similar_cases.map((c: SimilarCase, i: number) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">案例 {i + 1}</span>
                      <span className="text-sm text-gray-400">相似度 {c.similarity_score}%</span>
                    </div>
                    <Badge className={c.result === 'admitted' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
                      {c.result === 'admitted' ? '已录取' : '未录取'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">本科院校</span>
                      <p>{c.undergraduate_school}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">GPA</span>
                      <p>{c.gpa} / {c.gpa_scale}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">{c.language_type}</span>
                      <p>{c.language_score}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">目标</span>
                      <p>{c.target_school} · {c.target_major}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">年份</span>
                      <p>{c.application_year}</p>
                    </div>
                    {c.background_tags.length > 0 && (
                      <div>
                        <span className="text-gray-400">背景</span>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {c.background_tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div className="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-400">
        免责声明：本分析结果基于历史数据统计，仅供咨询参考，不构成任何录取承诺。实际录取结果受多种因素影响，包括但不限于申请材料质量、面试表现、当年竞争情况等。
      </div>
    </div>
  )
}
