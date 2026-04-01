'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { STANDARD_FIELDS, COLUMN_SYNONYMS } from '@/lib/constants'
import * as XLSX from 'xlsx'

type Step = 1 | 2 | 3

interface ParsedData {
  headers: string[]
  rows: Record<string, string>[]
}

interface Mapping {
  excelColumn: string
  systemField: string | null
  autoMatched: boolean
}

export default function UploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; skipped: number } | null>(null)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
      const headers = json.length > 0 ? Object.keys(json[0]) : []

      setParsed({ headers, rows: json })

      // Auto-map columns
      const autoMappings = headers.map(h => {
        const lowerH = h.toLowerCase().trim()
        let matched: string | null = null
        for (const [field, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
          if (synonyms.some(s => s.toLowerCase() === lowerH || lowerH.includes(s.toLowerCase()))) {
            matched = field
            break
          }
        }
        return { excelColumn: h, systemField: matched, autoMatched: matched !== null }
      })

      setMappings(autoMappings)
      setStep(2)
    }
    reader.readAsBinaryString(f)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleImport = async () => {
    if (!parsed) return
    setImporting(true)

    const mappingObj: Record<string, string> = {}
    mappings.forEach(m => {
      if (m.systemField) mappingObj[m.excelColumn] = m.systemField
    })

    const res = await fetch('/api/data/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: parsed.rows, mapping: mappingObj }),
    })

    const data = await res.json()
    setResult(data)
    setImporting(false)
    setStep(3)
  }

  const validRows = parsed?.rows.length || 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">上传历史Offer数据</h1>

      {/* Step indicator */}
      <div className="mb-8 flex gap-1">
        {[
          { n: 1, label: '上传文件' },
          { n: 2, label: '字段映射' },
          { n: 3, label: '导入完成' },
        ].map(s => (
          <div
            key={s.n}
            className={`flex-1 rounded-lg py-3 text-center text-sm font-medium ${
              step === s.n ? 'bg-blue-600 text-white' :
              step > s.n ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-400'
            }`}
          >
            {s.n}. {s.label} {step > s.n && '\u2713'}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-lg">选择文件</CardTitle></CardHeader>
          <CardContent>
            <div
              className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-16 transition-colors hover:border-blue-400 hover:bg-blue-50/50"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <svg className="mb-2 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-gray-500">点击或拖拽文件到此处</p>
              <p className="mt-1 text-xs text-gray-400">支持 .xlsx / .xls / .csv，最大10MB</p>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            <p className="text-sm text-gray-500">
              没有模板？
              <a href="/api/data/template" className="ml-1 text-blue-600 hover:text-blue-700">下载标准数据模板</a>
            </p>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">字段映射</CardTitle>
            <p className="text-sm text-gray-500">系统已自动识别列名，请确认映射关系</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Excel列名</th>
                    <th className="px-4 py-2 text-center text-gray-400">&rarr;</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">系统字段</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mappings.map((m, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-medium">{m.excelColumn}</td>
                      <td className="px-4 py-2 text-center text-gray-400">&rarr;</td>
                      <td className="px-4 py-2">
                        <select
                          className="rounded border px-2 py-1 text-sm"
                          value={m.systemField || ''}
                          onChange={e => {
                            const newMappings = [...mappings]
                            newMappings[i] = { ...m, systemField: e.target.value || null, autoMatched: false }
                            setMappings(newMappings)
                          }}
                        >
                          <option value="">跳过</option>
                          {STANDARD_FIELDS.map(f => (
                            <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        {m.systemField ? (
                          m.autoMatched ?
                            <span className="text-green-600 text-xs">{'\u2713'} 自动匹配</span> :
                            <span className="text-blue-600 text-xs">{'\u2713'} 手动映射</span>
                        ) : (
                          <span className="text-gray-400 text-xs">跳过</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
              文件 <strong>{file?.name}</strong> · 共 {validRows} 行数据
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setStep(1); setFile(null); setParsed(null) }}>
                重新上传
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleImport} disabled={importing}>
                {importing ? '导入中...' : `确认导入 ${validRows} 条数据`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && result && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">导入完成</h3>
            <p className="mt-2 text-sm text-gray-500">
              成功导入 <strong>{result.success}</strong> 条数据
              {result.skipped > 0 && `，跳过 ${result.skipped} 条（缺失必填字段）`}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={() => { setStep(1); setFile(null); setParsed(null); setResult(null) }}>
                继续上传
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/admin/data')}>
                返回数据管理
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
