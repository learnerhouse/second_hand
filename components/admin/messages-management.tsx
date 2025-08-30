"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Search, Filter, Eye, Trash2, MessageSquare, User, Package, ChevronDown, ChevronRight, Bell } from "lucide-react"

interface Message {
  id: string
  product_id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  product?: {
    id: string
    title: string
    images?: string[]
  }
  sender?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  receiver?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

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

  // 按商品ID分组消息
  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const productId = message.product_id || 'unknown'
    if (!groups[productId]) {
      groups[productId] = {
        product: message.product,
        messages: []
      }
    }
    groups[productId].messages.push(message)
    return groups
  }, {} as Record<string, { product?: any; messages: Message[] }>)

  // 排序分组后的消息
  const sortedGroupedMessages = Object.entries(groupedMessages).sort(([, groupA], [, groupB]) => {
    if (sortBy === "count") {
      // 按消息数量排序（降序）
      return groupB.messages.length - groupA.messages.length
    } else {
      // 按最新消息时间排序（降序）
      const latestTimeA = Math.max(...groupA.messages.map(m => new Date(m.created_at).getTime()))
      const latestTimeB = Math.max(...groupB.messages.map(m => new Date(m.created_at).getTime()))
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

  // 切换分组折叠状态
  const toggleGroupCollapse = (productId: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(productId)) {
      newCollapsed.delete(productId)
    } else {
      newCollapsed.add(productId)
    }
    setCollapsedGroups(newCollapsed)
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
  const handleMarkAllAsRead = async (productId: string) => {
    const productMessages = groupedMessages[productId]?.messages || []
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

  // 获取未读消息数量
  const getUnreadCount = (productId: string) => {
    return groupedMessages[productId]?.messages.filter(m => !m.is_read).length || 0
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

      {/* 消息列表 - 按商品ID分组 */}
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
            <div className="space-y-4">
              {sortedGroupedMessages.map(([productId, group]) => {
                const isCollapsed = collapsedGroups.has(productId)
                const unreadCount = getUnreadCount(productId)
                const product = group.product
                
                return (
                  <div key={productId} className="border rounded-lg bg-gray-50">
                    {/* 商品标题和统计 - 可点击折叠 */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleGroupCollapse(productId)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Package className="h-5 w-5 text-blue-600" />
                          {/* 未读消息红点提醒 */}
                          {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {product?.title || `商品 ${productId}`}
                          </h3>
                          <span className="text-sm text-gray-500">(ID: {productId})</span>
                        </div>
                        
                        <Badge variant="outline" className="ml-2">
                          {group.messages.length} 条消息
                        </Badge>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {unreadCount} 条未读
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* 批量操作按钮 */}
                        {unreadCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAllAsRead(productId)
                            }}
                            disabled={isLoading}
                            className="h-8 px-3 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            全部标记已读
                          </Button>
                        )}
                        
                        {/* 折叠/展开图标 */}
                        {isCollapsed ? (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>

                    {/* 该商品的所有消息 - 可折叠 */}
                    {!isCollapsed && (
                      <div className="px-4 pb-4 space-y-3">
                        {group.messages.map((message) => (
                          <div key={message.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                {/* 消息头部信息 */}
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <div className="relative">
                                      <User className="h-4 w-4" />
                                      {/* 发送者头像和未读提醒 */}
                                      {message.sender?.avatar_url && (
                                        <div className="relative inline-block ml-1">
                                          <img 
                                            src={message.sender.avatar_url} 
                                            alt="发送者头像"
                                            className="w-6 h-6 rounded-full"
                                          />
                                          {!message.is_read && message.receiver_id === message.sender_id && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <span className="font-medium">发送者:</span>
                                    <span>{message.sender?.full_name || message.sender?.email || '未知用户'}</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <div className="relative">
                                      <User className="h-4 w-4" />
                                      {/* 接收者头像和未读提醒 */}
                                      {message.receiver?.avatar_url && (
                                        <div className="relative inline-block ml-1">
                                          <img 
                                            src={message.receiver.avatar_url} 
                                            alt="接收者头像"
                                            className="w-6 h-6 rounded-full"
                                          />
                                          {!message.is_read && message.receiver_id !== message.sender_id && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                                          )}
                                        </div>
                                      )}
                                    </div>
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
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}