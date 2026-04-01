import type { OfferRecord, QueryInput } from '@/types'

export function calculateSimilarity(input: QueryInput, record: OfferRecord): number {
  let score = 0

  // Same target school + major = 40 points
  const schoolMatch = input.target_school.toLowerCase().trim() === record.target_school.toLowerCase().trim()
  const majorMatch = input.target_major.toLowerCase().trim() === record.target_major.toLowerCase().trim()
  if (schoolMatch && majorMatch) score += 40
  else if (schoolMatch) score += 25
  else if (majorMatch) score += 15

  // Same degree = 10 points
  if (input.target_degree === record.target_degree) score += 10

  // GPA closeness = 20 points (normalize to 4.0 scale)
  const normalizeGpa = (gpa: number, scale: string) => {
    if (scale === '100') return (gpa / 100) * 4.0
    if (scale === '5.0') return (gpa / 5.0) * 4.0
    return gpa
  }
  const inputGpa = normalizeGpa(input.gpa, input.gpa_scale)
  const recordGpa = normalizeGpa(record.gpa, record.gpa_scale)
  const gpaDiff = Math.abs(inputGpa - recordGpa)
  if (gpaDiff <= 0.1) score += 20
  else if (gpaDiff <= 0.3) score += 15
  else if (gpaDiff <= 0.5) score += 10
  else if (gpaDiff <= 1.0) score += 5

  // Language score closeness = 15 points
  const normalizeLanguage = (score: number, type: string) => {
    if (type === 'TOEFL') return (score / 120) * 9 // Convert to IELTS scale
    return score
  }
  const inputLang = normalizeLanguage(input.language_score, input.language_type)
  const recordLang = normalizeLanguage(record.language_score, record.language_type)
  const langDiff = Math.abs(inputLang - recordLang)
  if (langDiff <= 0.25) score += 15
  else if (langDiff <= 0.5) score += 10
  else if (langDiff <= 1.0) score += 5

  // Background tags overlap = 5 points
  if (input.background_tags && record.background_tags) {
    const overlap = input.background_tags.filter(t => record.background_tags.includes(t)).length
    const maxTags = Math.max(input.background_tags.length, record.background_tags.length, 1)
    score += Math.round((overlap / maxTags) * 5)
  }

  // Undergraduate school tier similarity = 10 points (simplified)
  if (input.undergraduate_school === record.undergraduate_school) score += 10
  else score += 3 // some base points since we can't do tier matching without external data

  return Math.min(score, 100)
}

export function findSimilarCases(input: QueryInput, records: OfferRecord[], limit: number = 5) {
  const scored = records
    .filter(r => r.result === 'admitted' || r.result === 'rejected') // Only include definitive results
    .map(r => ({
      record: r,
      similarity: calculateSimilarity(input, r),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return scored.map(s => ({
    similarity_score: s.similarity,
    undergraduate_school: s.record.undergraduate_school,
    undergraduate_major: s.record.undergraduate_major,
    gpa: s.record.gpa,
    gpa_scale: s.record.gpa_scale,
    language_type: s.record.language_type,
    language_score: s.record.language_score,
    target_school: s.record.target_school,
    target_major: s.record.target_major,
    application_year: s.record.application_year,
    result: s.record.result as 'admitted' | 'rejected',
    background_tags: s.record.background_tags || [],
  }))
}
