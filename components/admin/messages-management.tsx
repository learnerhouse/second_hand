"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Search, Filter, Eye, Trash2, MessageSquare, User, Package } from "lucide-react"

interface Message {
  id: string
  product_id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  product?: {
    title: string
  }
  sender?: {
    full_name: string
    email: string
  }
  receiver?: {
    full_name: string
    email: string
  }
}

interface MessagesManagementProps {
  messages: Message[]
}

export function MessagesManagement({ messages: initialMessages }: MessagesManagementProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"count" | "latest">("count")
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  // 过滤消息
  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.product?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.receiver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.receiver?.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "read" && message.is_read) ||
      (statusFilter === "unread" && !message.is_read)

    return matchesSearch && matchesStatus
  })

  // 按商品分组消息
  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const productTitle = message.product?.title || '未知商品'
    if (!groups[productTitle]) {
      groups[productTitle] = []
    }
    groups[productTitle].push(message)
    return groups
  }, {} as Record<string, Message[]>)

  // 排序分组后的消息
  const sortedGroupedMessages = Object.entries(groupedMessages).sort(([, messagesA], [, messagesB]) => {
    if (sortBy === "count") {
      // 按消息数量排序（降序）
      return messagesB.length - messagesA.length
    } else {
      // 按最新消息时间排序（降序）
      const latestTimeA = Math.max(...messagesA.map(m => new Date(m.created_at).getTime()))
      const latestTimeB = Math.max(...messagesB.map(m => new Date(m.created_at).getTime()))
      return latestTimeB - latestTimeA
    }
  })

  // 获取分组统计
  const getGroupStats = () => {
    const totalGroups = Object.keys(groupedMessages).length
    const totalMessages = filteredMessages.length
    const totalUnread = filteredMessages.filter(m => !m.is_read).length
    
    return { totalGroups, totalMessages, totalUnread }
  }

  // 标记消息为已读
  const handleMarkAsRead = async (messageId: string) => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId)

      if (error) throw error

      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ))
      toast.success("消息已标记为已读")
    } catch (error) {
      console.error("标记已读失败:", error)
      toast.error("操作失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 批量标记商品的所有消息为已读
  const handleMarkAllAsRead = async (productTitle: string) => {
    const productMessages = groupedMessages[productTitle] || []
    const unreadMessages = productMessages.filter(m => !m.is_read)
    
    if (unreadMessages.length === 0) {
      toast.info("该商品没有未读消息")
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .in('id', unreadMessages.map(m => m.id))

      if (error) throw error

      setMessages(messages.map(msg => 
        unreadMessages.some(um => um.id === msg.id) ? { ...msg, is_read: true } : msg
      ))
      toast.success(`已将 ${unreadMessages.length} 条消息标记为已读`)
    } catch (error) {
      console.error("批量标记已读失败:", error)
      toast.error("操作失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 删除消息
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("确定要删除这条消息吗？删除后无法恢复。")) return

    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)

      if (error) throw error

      setMessages(messages.filter(msg => msg.id !== messageId))
      toast.success("消息删除成功")
    } catch (error) {
      console.error("删除消息失败:", error)
      toast.error("删除失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 获取状态统计
  const getStats = () => {
    const total = messages.length
    const read = messages.filter(m => m.is_read).length
    const unread = total - read
    
    return { total, read, unread }
  }

  const stats = getStats()
  const groupStats = getGroupStats()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">消息管理</h1>
        <p className="text-gray-600">管理系统中的所有用户消息和对话</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">总消息数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">已读消息</p>
                <p className="text-2xl font-bold">{stats.read}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">未读消息</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">商品对话数</p>
                <p className="text-2xl font-bold">{groupStats.totalGroups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索消息内容、商品标题、用户名或邮箱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="状态过滤" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部消息</SelectItem>
                  <SelectItem value="read">已读消息</SelectItem>
                  <SelectItem value="unread">未读消息</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-gray-400" />
              <Select value={sortBy} onValueChange={(value: "count" | "latest") => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">按消息数量</SelectItem>
                  <SelectItem value="latest">按最新消息</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 消息列表 - 按商品分组 */}
      <Card>
        <CardHeader>
          <CardTitle>消息列表 - 按商品分组</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedMessages).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || statusFilter !== "all" ? "没有找到匹配的消息" : "暂无消息"}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedGroupedMessages.map(([productTitle, productMessages]) => (
                <div key={productTitle} className="border rounded-lg p-4 bg-gray-50">
                  {/* 商品标题和统计 */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{productTitle}</h3>
                      <Badge variant="outline" className="ml-2">
                        {productMessages.length} 条消息
                      </Badge>
                      <Badge variant="secondary" className="ml-2">
                        {productMessages.filter(m => !m.is_read).length} 条未读
                      </Badge>
                    </div>
                    
                    {/* 批量操作按钮 */}
                    <div className="flex items-center space-x-2">
                      {productMessages.filter(m => !m.is_read).length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAllAsRead(productTitle)}
                          disabled={isLoading}
                          className="h-8 px-3 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          全部标记已读
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 该商品的所有消息 */}
                  <div className="space-y-3">
                    {productMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            {/* 消息头部信息 */}
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">发送者:</span>
                                <span>{message.sender?.full_name || message.sender?.email || '未知用户'}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">接收者:</span>
                                <span>{message.receiver?.full_name || message.receiver?.email || '未知用户'}</span>
                              </div>
                            </div>

                            {/* 消息内容 */}
                            <div className="bg-gray-50 rounded-md p-2">
                              <p className="text-gray-800 text-sm">{truncateContent(message.content, 80)}</p>
                            </div>

                            {/* 消息状态和时间 */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-3">
                                <Badge variant={message.is_read ? "default" : "secondary"} className="text-xs">
                                  {message.is_read ? "已读" : "未读"}
                                </Badge>
                                <span>发送时间: {formatDate(message.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex items-center space-x-2 ml-3">
                            {!message.is_read && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsRead(message.id)}
                                disabled={isLoading}
                                className="h-7 px-2 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                已读
                              </Button>
                            )}
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMessage(message.id)}
                              disabled={isLoading}
                              className="h-7 px-2 text-xs"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              删除
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}