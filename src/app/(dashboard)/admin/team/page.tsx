'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Member {
  id: string
  name: string
  email: string
  role: string
  status: string
  last_active_at: string | null
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    const res = await fetch('/api/team/members')
    const data = await res.json()
    setMembers(data.members || [])
    setLoading(false)
  }

  const handleInvite = async () => {
    setInviting(true)
    const res = await fetch('/api/auth/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: inviteName, email: inviteEmail }),
    })
    if (res.ok) {
      setOpen(false)
      setInviteName('')
      setInviteEmail('')
      fetchMembers()
    } else {
      const data = await res.json()
      alert(data.error || '邀请失败')
    }
    setInviting(false)
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active'
    await fetch(`/api/team/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchMembers()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">团队管理</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            添加顾问
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加顾问</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>顾问姓名 *</Label>
                <Input placeholder="请输入姓名" value={inviteName} onChange={e => setInviteName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>邮箱地址 *</Label>
                <Input type="email" placeholder="请输入邮箱" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleInvite} disabled={inviting || !inviteName || !inviteEmail}>
                  {inviting ? '发送中...' : '发送邀请'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        {loading ? (
          <CardContent className="py-12 text-center text-gray-500">加载中...</CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">姓名</th>
                  <th className="px-4 py-3 font-medium">邮箱</th>
                  <th className="px-4 py-3 font-medium">角色</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">最后活跃</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{m.role === 'admin' ? '管理员' : '顾问'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={m.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-100'}>
                        {m.status === 'active' ? '活跃' : '已停用'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {m.last_active_at ? new Date(m.last_active_at).toLocaleDateString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {m.role !== 'admin' && (
                        <button
                          onClick={() => toggleStatus(m.id, m.status)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          {m.status === 'active' ? '停用' : '启用'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
