import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const headers = [
    '学生姓名', '本科院校', '本科专业', 'GPA', 'GPA制式',
    '语言考试类型', '语言总分', 'GRE/GMAT分数',
    '目标学校', '目标专业', '目标学位', '申请年份',
    '录取结果', '背景标签', '备注'
  ]

  const exampleRows = [
    ['张三', '北京大学', '计算机科学', 3.8, '4.0', 'IELTS', 7.5, 325, 'UCL', 'Data Science', '硕士', 2025, '录取', '科研经历,实习经历', ''],
    ['李四', '浙江大学', '金融学', 85, '100', 'TOEFL', 105, '', 'LSE', 'Finance', '硕士', 2025, '拒绝', '实习经历', '一志愿'],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows])

  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 15 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'offer数据模板')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=offer_data_template.xlsx',
    },
  })
}
