export const BACKGROUND_TAGS = [
  '科研经历',
  '实习经历',
  '竞赛获奖',
  '论文发表',
  '强推荐信',
  '海外交换',
  '工作经历',
] as const

export const GPA_SCALES = [
  { value: '4.0', label: '4.0制' },
  { value: '5.0', label: '5.0制' },
  { value: '100', label: '百分制' },
] as const

export const LANGUAGE_TYPES = [
  { value: 'IELTS', label: 'IELTS' },
  { value: 'TOEFL', label: 'TOEFL' },
] as const

export const DEGREE_TYPES = [
  { value: 'master', label: '硕士' },
  { value: 'phd', label: '博士' },
  { value: 'bachelor', label: '本科' },
] as const

export const CONFIDENCE_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: '高', color: 'text-green-600' },
  medium: { label: '中', color: 'text-yellow-600' },
  low: { label: '低', color: 'text-orange-600' },
  insufficient: { label: '数据不足', color: 'text-red-600' },
}

export const RESULT_LABELS: Record<string, string> = {
  admitted: '录取',
  rejected: '拒绝',
  waitlisted: '等待',
  withdrawn: '撤回',
}

// Standard field names for data import mapping
export const STANDARD_FIELDS = [
  { key: 'student_name', label: '学生姓名', required: false },
  { key: 'undergraduate_school', label: '本科院校', required: true },
  { key: 'undergraduate_major', label: '本科专业', required: true },
  { key: 'gpa', label: 'GPA', required: true },
  { key: 'gpa_scale', label: 'GPA制式', required: false },
  { key: 'language_type', label: '语言考试类型', required: true },
  { key: 'language_score', label: '语言总分', required: true },
  { key: 'gre_gmat_score', label: 'GRE/GMAT分数', required: false },
  { key: 'target_school', label: '目标学校', required: true },
  { key: 'target_major', label: '目标专业', required: true },
  { key: 'target_degree', label: '目标学位', required: true },
  { key: 'application_year', label: '申请年份', required: true },
  { key: 'result', label: '录取结果', required: true },
  { key: 'background_tags', label: '背景标签', required: false },
  { key: 'notes', label: '备注', required: false },
] as const

// Column name synonyms for auto-mapping
export const COLUMN_SYNONYMS: Record<string, string[]> = {
  student_name: ['姓名', '学生姓名', '名字', 'name', 'student_name', 'student name'],
  undergraduate_school: ['本科院校', '本科学校', '院校', '学校', '本科', 'school', 'university', 'undergraduate_school'],
  undergraduate_major: ['本科专业', '专业', 'major', 'undergraduate_major'],
  gpa: ['GPA', '绩点', '平均分', '成绩', 'gpa', 'grade'],
  gpa_scale: ['GPA制式', '制式', 'gpa_scale', 'scale'],
  language_type: ['语言类型', '考试类型', '语言考试', 'language_type', 'language type', 'test type'],
  language_score: ['语言成绩', '语言总分', '雅思', '托福', 'IELTS', 'TOEFL', 'language_score', 'language score'],
  gre_gmat_score: ['GRE', 'GMAT', 'GRE/GMAT', 'gre_gmat_score'],
  target_school: ['目标学校', '申请学校', '申请院校', '目标院校', 'target_school', 'target school'],
  target_major: ['目标专业', '申请专业', 'target_major', 'target major'],
  target_degree: ['学位', '目标学位', '申请学位', 'degree', 'target_degree'],
  application_year: ['年份', '申请年份', 'year', 'application_year'],
  result: ['结果', '录取结果', '申请结果', '录取状态', 'result', 'status', 'outcome'],
  background_tags: ['标签', '背景标签', '背景', 'tags', 'background_tags'],
  notes: ['备注', '说明', 'notes', 'remarks', 'comments'],
}
