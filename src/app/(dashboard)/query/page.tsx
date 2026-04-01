'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BACKGROUND_TAGS, GPA_SCALES, LANGUAGE_TYPES, DEGREE_TYPES } from '@/lib/constants'
import type { QueryInput } from '@/types'

export default function QueryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [form, setForm] = useState({
    undergraduate_school: '',
    undergraduate_major: '',
    gpa: '',
    gpa_scale: '4.0',
    language_type: 'IELTS',
    language_score: '',
    gre_gmat_score: '',
    target_school: '',
    target_major: '',
    target_degree: 'master',
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleReset = () => {
    setForm({
      undergraduate_school: '',
      undergraduate_major: '',
      gpa: '',
      gpa_scale: '4.0',
      language_type: 'IELTS',
      language_score: '',
      gre_gmat_score: '',
      target_school: '',
      target_major: '',
      target_degree: 'master',
    })
    setSelectedTags([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const input: QueryInput = {
      undergraduate_school: form.undergraduate_school,
      undergraduate_major: form.undergraduate_major,
      gpa: parseFloat(form.gpa),
      gpa_scale: form.gpa_scale as QueryInput['gpa_scale'],
      language_type: form.language_type as QueryInput['language_type'],
      language_score: parseFloat(form.language_score),
      gre_gmat_score: form.gre_gmat_score ? parseFloat(form.gre_gmat_score) : undefined,
      target_school: form.target_school,
      target_major: form.target_major,
      target_degree: form.target_degree as QueryInput['target_degree'],
      background_tags: selectedTags.length > 0 ? selectedTags : undefined,
    }

    try {
      const res = await fetch('/api/query/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '分析失败')
        setLoading(false)
        return
      }

      router.push(`/query/result/${data.id}`)
    } catch {
      alert('网络错误，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">录取概率查询</h1>
        <p className="mt-1 text-sm text-gray-500">输入学生背景信息，获取AI概率分析和相似案例推荐</p>
      </div>

      {loading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-lg font-medium text-gray-900">正在分析中...</p>
            <p className="mt-1 text-sm text-gray-500">AI正在基于历史数据进行概率计算，请稍候</p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card className="mb-6 border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">学生背景信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>本科院校 *</Label>
                  <Input placeholder="输入院校名称" value={form.undergraduate_school} onChange={e => handleChange('undergraduate_school', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>本科专业 *</Label>
                  <Input placeholder="如：计算机科学" value={form.undergraduate_major} onChange={e => handleChange('undergraduate_major', e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>GPA *</Label>
                  <Input type="number" step="0.01" placeholder="如：3.5" value={form.gpa} onChange={e => handleChange('gpa', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>GPA制式 *</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs" value={form.gpa_scale} onChange={e => handleChange('gpa_scale', e.target.value)}>
                    {GPA_SCALES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>语言考试 *</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs" value={form.language_type} onChange={e => handleChange('language_type', e.target.value)}>
                    {LANGUAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>语言总分 *</Label>
                  <Input type="number" step="0.5" placeholder="如：7.0" value={form.language_score} onChange={e => handleChange('language_score', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>GRE/GMAT</Label>
                  <Input type="number" placeholder="选填" value={form.gre_gmat_score} onChange={e => handleChange('gre_gmat_score', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>目标学位 *</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs" value={form.target_degree} onChange={e => handleChange('target_degree', e.target.value)}>
                    {DEGREE_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <CardTitle className="mb-4 text-lg">申请目标</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>目标学校 *</Label>
                    <Input placeholder="输入学校名称" value={form.target_school} onChange={e => handleChange('target_school', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>目标专业 *</Label>
                    <Input placeholder="如：Data Science" value={form.target_major} onChange={e => handleChange('target_major', e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Label className="mb-2 block">背景标签（选填）</Label>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUND_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleReset}>
              清空重填
            </Button>
            <Button type="submit" className="bg-blue-600 px-8 hover:bg-blue-700" size="lg">
              开始分析
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
