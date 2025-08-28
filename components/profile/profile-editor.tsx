"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface ProfileEditorProps {
  profile: {
    id: string
    email?: string
    full_name?: string
    phone?: string
    address?: string
    user_type: string
  }
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile.full_name || "")
  const [phone, setPhone] = useState(profile.phone || "")
  const [address, setAddress] = useState(profile.address || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, address })
        .eq("id", profile.id)
      if (error) throw error
      setSaved(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>编辑资料</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" value={profile.email || ""} disabled />
            </div>
            <div>
              <Label htmlFor="userType">用户类型</Label>
              <Input id="userType" value={profile.user_type} disabled />
            </div>
            <div>
              <Label htmlFor="fullName">姓名</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">手机号</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">地址</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">已保存</p>}
          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

