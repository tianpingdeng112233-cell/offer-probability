import Anthropic from '@anthropic-ai/sdk'
import type { QueryInput, OfferRecord } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface AnalysisResult {
  probability: number
  reasoning: string
  risks: string
}

export async function analyzeWithAI(
  input: QueryInput,
  matchingRecords: OfferRecord[]
): Promise<AnalysisResult> {
  const admittedCount = matchingRecords.filter(r => r.result === 'admitted').length
  const rejectedCount = matchingRecords.filter(r => r.result === 'rejected').length
  const total = admittedCount + rejectedCount

  // Build records summary for prompt
  const recordsSummary = matchingRecords.slice(0, 30).map(r => (
    `${r.undergraduate_school} | ${r.undergraduate_major} | GPA ${r.gpa}/${r.gpa_scale} | ${r.language_type} ${r.language_score} | ${r.target_school} ${r.target_major} | ${r.result === 'admitted' ? '录取' : '拒绝'} | ${r.application_year}年`
  )).join('\n')

  const prompt = `你是一个留学录取概率分析助手。基于以下历史数据和学生背景，分析录取概率。

## 学生背景
- 本科院校：${input.undergraduate_school}
- 本科专业：${input.undergraduate_major}
- GPA：${input.gpa} / ${input.gpa_scale}
- ${input.language_type}：${input.language_score}
${input.gre_gmat_score ? `- GRE/GMAT：${input.gre_gmat_score}` : ''}
- 目标：${input.target_school} ${input.target_major} ${input.target_degree === 'master' ? '硕士' : input.target_degree === 'phd' ? '博士' : '本科'}
${input.background_tags?.length ? `- 背景标签：${input.background_tags.join('、')}` : ''}

## 匹配的历史数据（共${total}条）
${recordsSummary || '无匹配数据'}

## 统计数据
- 录取：${admittedCount}条
- 拒绝：${rejectedCount}条
- 统计录取率：${total > 0 ? Math.round((admittedCount / total) * 100) : 0}%

## 要求
请基于以上数据，给出：
1. 录取概率（0-100的整数）
2. 概率判断的简短依据（一句话，中文）
3. 需要注意的风险因素（一句话，中文，如果没有风险写"暂无特别风险"）

请仅基于提供的历史数据分析，不要引入外部知识。
以JSON格式返回：{"probability": 78, "reasoning": "...", "risks": "..."}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AnalysisResult
    }

    // Fallback to statistical probability
    return {
      probability: total > 0 ? Math.round((admittedCount / total) * 100) : 50,
      reasoning: `基于${total}条历史数据统计分析`,
      risks: '数据量有限，建议参考更多维度',
    }
  } catch {
    // If AI fails, fall back to pure statistical calculation
    return {
      probability: total > 0 ? Math.round((admittedCount / total) * 100) : 50,
      reasoning: `基于${total}条历史数据统计分析`,
      risks: 'AI分析暂不可用，使用统计概率',
    }
  }
}
