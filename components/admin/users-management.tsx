"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Shield, ShieldCheck, ShieldX, Mail, Phone } from "lucide-react"

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone?: string
  address?: string
  user_type: string
  is_verified: boolean
  created_at: string
}

interface UsersManagementProps {
  users: User[]
}

export function UsersManagement({ users }: UsersManagementProps) {
  const router = useRouter()
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = userTypeFilter === "all" || user.user_type === userTypeFilter
    return matchesSearch && matchesType
  })

  const handleChangeUserType = async (userId: string, newType: string) => {
    setIsLoading(userId)
    try {
      const { error } = await supabase.from("profiles").update({ user_type: newType }).eq("id", userId)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating user type:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleToggleVerification = async (userId: string, isVerified: boolean) => {
    setIsLoading(userId)
    try {
      const { error } = await supabase.from("profiles").update({ is_verified: !isVerified }).eq("id", userId)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating verification status:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "seller":
        return "bg-blue-100 text-blue-800"
      case "buyer":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUserTypeText = (userType: string) => {
    const typeMap: { [key: string]: string } = {
      admin: "管理员",
      seller: "卖家",
      buyer: "买家",
    }
    return typeMap[userType] || userType
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-600">管理平台上的所有用户账户</p>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索用户邮箱或姓名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部用户</SelectItem>
                <SelectItem value="buyer">买家</SelectItem>
                <SelectItem value="seller">卖家</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-500 mt-2">共 {filteredUsers.length} 个用户</p>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无用户</h3>
              <p className="text-gray-600">当前筛选条件下没有找到用户</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{user.full_name || "未设置姓名"}</h3>
                          {user.is_verified && (
                            <Badge className="bg-green-100 text-green-800">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              已验证
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              {user.phone}
                            </div>
                          )}
                          {user.address && <p>地址：{user.address}</p>}
                          <p>注册时间：{new Date(user.created_at).toLocaleDateString("zh-CN")}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <Badge className={getUserTypeColor(user.user_type)}>{getUserTypeText(user.user_type)}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVerification(user.id, user.is_verified)}
                      disabled={isLoading === user.id}
                      className={user.is_verified ? "bg-green-50 text-green-700" : "bg-transparent"}
                    >
                      {user.is_verified ? (
                        <ShieldCheck className="h-4 w-4 mr-2" />
                      ) : (
                        <ShieldX className="h-4 w-4 mr-2" />
                      )}
                      {user.is_verified ? "取消验证" : "验证用户"}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                          <Shield className="h-4 w-4 mr-2" />
                          更改权限
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>更改用户权限</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              用户：{selectedUser?.full_name || selectedUser?.email}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                              当前权限：{selectedUser && getUserTypeText(selectedUser.user_type)}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              className="w-full justify-start bg-transparent"
                              onClick={() => selectedUser && handleChangeUserType(selectedUser.id, "buyer")}
                              disabled={isLoading === selectedUser?.id}
                            >
                              设为买家
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full justify-start bg-transparent"
                              onClick={() => selectedUser && handleChangeUserType(selectedUser.id, "seller")}
                              disabled={isLoading === selectedUser?.id}
                            >
                              设为卖家
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full justify-start bg-transparent"
                              onClick={() => selectedUser && handleChangeUserType(selectedUser.id, "admin")}
                              disabled={isLoading === selectedUser?.id}
                            >
                              设为管理员
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <a href={`mailto:${user.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      发送邮件
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
