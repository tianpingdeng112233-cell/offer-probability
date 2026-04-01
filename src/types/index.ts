export type UserRole = 'admin' | 'consultant'
export type UserStatus = 'active' | 'disabled'
export type GpaScale = '4.0' | '5.0' | '100'
export type LanguageType = 'IELTS' | 'TOEFL'
export type TargetDegree = 'bachelor' | 'master' | 'phd'
export type OfferResult = 'admitted' | 'rejected' | 'waitlisted' | 'withdrawn'
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient'

export interface Tenant {
  id: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  tenant_id: string
  name: string
  role: UserRole
  status: UserStatus
  last_active_at: string | null
  created_at: string
}

export interface OfferRecord {
  id: string
  tenant_id: string
  uploaded_by: string
  student_name?: string
  undergraduate_school: string
  undergraduate_major: string
  gpa: number
  gpa_scale: GpaScale
  language_type: LanguageType
  language_score: number
  gre_gmat_score?: number
  target_school: string
  target_major: string
  target_degree: TargetDegree
  application_year: number
  result: OfferResult
  background_tags: string[]
  notes?: string
  created_at: string
}

export interface QueryInput {
  undergraduate_school: string
  undergraduate_major: string
  gpa: number
  gpa_scale: GpaScale
  language_type: LanguageType
  language_score: number
  gre_gmat_score?: number
  target_school: string
  target_major: string
  target_degree: TargetDegree
  background_tags?: string[]
}

export interface SimilarCase {
  similarity_score: number
  undergraduate_school: string
  undergraduate_major: string
  gpa: number
  gpa_scale: string
  language_type: string
  language_score: number
  target_school: string
  target_major: string
  application_year: number
  result: 'admitted' | 'rejected'
  background_tags: string[]
}

export interface QueryResult {
  id: string
  tenant_id: string
  consultant_id: string
  input_data: QueryInput
  probability: number | null
  confidence_level: ConfidenceLevel
  similar_cases: SimilarCase[]
  result_summary: string
  data_basis: string
  created_at: string
}

export interface DataStats {
  total_records: number
  school_count: number
  major_count: number
  year_range: { min: number; max: number }
  admitted_count: number
  rejected_count: number
  other_count: number
}

export interface FieldMapping {
  excel_column: string
  system_field: string | null
  auto_matched: boolean
}
