"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Package, Eye, ChevronDown, ChevronRight, User } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface SellerMessagesListProps {
  groupedMessages: Record<string, { product: any; messages: any[] }>
  totalMessages: number
  unreadMessages: number
  totalConversations: number
  currentUser: SupabaseUser
}

export function SellerMessagesList({
  groupedMessages,
  totalMessages,
  unreadMessages,
  totalConversations,
  currentUser
}: SellerMessagesListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

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

  // 获取未读消息数量
  const getUnreadCount = (productId: string) => {
    return groupedMessages[productId]?.messages.filter(m => !m.is_read && m.receiver_id === currentUser.id).length || 0
  }

  // 获取最新消息
  const getLatestMessage = (messages: any[]) => {
    return messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString("zh-CN", { weekday: "short" })
    } else {
      return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
    }
  }

  // 截断文本
  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  // 获取对话伙伴信息
  const getConversationPartner = (messages: any[]) => {
    const otherMessages = messages.filter(m => m.sender_id !== currentUser.id)
    if (otherMessages.length > 0) {
      return otherMessages[0].sender
    }
    return null
  }

  if (Object.keys(groupedMessages).length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无消息</h3>
        <p className="text-gray-600 mb-4">您的商品还没有收到任何消息</p>
        <Link
          href="/marketplace"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          浏览商城
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">消息中心</h1>
        <p className="text-gray-600">管理您商品相关的所有对话</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">总消息数</p>
                <p className="text-2xl font-bold">{totalMessages}</p>
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
                <p className="text-2xl font-bold">{unreadMessages}</p>
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
                <p className="text-2xl font-bold">{totalConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 消息列表 - 按商品分组 */}
      <Card>
        <CardHeader>
          <CardTitle>对话列表 - 按商品分组</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([productId, group]) => {
              const isCollapsed = collapsedGroups.has(productId)
              const unreadCount = getUnreadCount(productId)
              const product = group.product
              const latestMessage = getLatestMessage(group.messages)
              const partner = getConversationPartner(group.messages)
              
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
                      {/* 最新消息预览 */}
                      {latestMessage && (
                        <div className="text-right text-sm text-gray-600 max-w-xs">
                          <p className="truncate">
                            <span className="font-medium">
                              {latestMessage.sender_id === currentUser.id ? '您' : partner?.full_name || '买家'}:
                            </span>
                            {truncateContent(latestMessage.content, 40)}
                          </p>
                          <p className="text-xs text-gray-500">{formatTime(latestMessage.created_at)}</p>
                        </div>
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
                                        <Avatar className="w-6 h-6">
                                          <AvatarImage src={message.sender.avatar_url} />
                                          <AvatarFallback className="text-xs">
                                            {message.sender.full_name?.charAt(0) || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                        {!message.is_read && message.receiver_id === currentUser.id && (
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
                                        <Avatar className="w-6 h-6">
                                          <AvatarImage src={message.receiver.avatar_url} />
                                          <AvatarFallback className="text-xs">
                                            {message.receiver.full_name?.charAt(0) || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                        {!message.is_read && message.receiver_id === currentUser.id && (
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
                                <p className="text-gray-800 text-sm">{message.content}</p>
                              </div>

                              {/* 消息状态和时间 */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-3">
                                  <Badge variant={message.is_read ? "default" : "secondary"} className="text-xs">
                                    {message.is_read ? "已读" : "未读"}
                                  </Badge>
                                  <span>发送时间: {new Date(message.created_at).toLocaleString('zh-CN')}</span>
                                </div>
                              </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex items-center space-x-2 ml-3">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-7 px-2 text-xs"
                              >
                                <Link href={`/messages/${productId}/${message.sender_id === currentUser.id ? message.receiver_id : message.sender_id}`}>
                                  <Eye className="h-3 w-3 mr-1" />
                                  查看对话
                                </Link>
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
        </CardContent>
      </Card>
    </div>
  )
}