"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, ArrowLeft, ShoppingCart } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  is_read: boolean
  sender: {
    id: string
    full_name?: string
    avatar_url?: string
  }
}

interface ConversationViewProps {
  product: any
  partner: any
  messages: Message[]
  currentUser: User
  currentProfile: any
}

export function ConversationView({ product, partner, messages, currentUser, currentProfile }: ConversationViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("messages").insert([
        {
          product_id: product.id,
          sender_id: currentUser.id,
          receiver_id: partner.id,
          content: newMessage.trim(),
        },
      ])

      if (error) throw error

      setNewMessage("")
      router.refresh()
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyNow = () => {
    router.push(`/checkout?product=${product.id}`)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(price)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)

    if (diffInMinutes < 1) {
      return "刚刚"
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}分钟前`
    } else if (diffInMinutes < 24 * 60) {
      return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    }
  }

  const getConditionText = (condition?: string) => {
    switch (condition) {
      case "new":
        return "全新"
      case "like_new":
        return "几乎全新"
      case "good":
        return "良好"
      case "fair":
        return "一般"
      case "poor":
        return "较差"
      default:
        return "未知"
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/messages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回消息列表
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 商品信息 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <h3 className="font-semibold">商品信息</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/marketplace/product/${product.id}`} className="block">
                <img
                  src={product.images[0] || "/placeholder.svg?height=200&width=300&query=product"}
                  alt={product.title}
                  className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity"
                />
              </Link>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h4>
                <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(product.price)}</p>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary">
                    {product.category.icon} {product.category.name}
                  </Badge>
                  {product.condition && <Badge variant="outline">{getConditionText(product.condition)}</Badge>}
                </div>
                {product.location && <p className="text-sm text-gray-600">📍 {product.location}</p>}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={product.seller.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{product.seller.full_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{product.seller.full_name || "卖家"}</p>
                    <p className="text-sm text-gray-600">
                      {product.seller.id === currentUser.id ? "这是您的商品" : "卖家"}
                    </p>
                  </div>
                </div>

                {product.seller.id !== currentUser.id && (
                  <Button onClick={handleBuyNow} className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    立即购买
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 对话区域 */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={partner.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{partner.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{partner.full_name || "用户"}</h3>
                  <p className="text-sm text-gray-600">
                    {partner.user_type === "seller" ? "卖家" : partner.user_type === "admin" ? "管理员" : "买家"}
                  </p>
                </div>
              </div>
            </CardHeader>

            {/* 消息列表 */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-gray-600">还没有消息，开始对话吧！</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isFromCurrentUser = message.sender_id === currentUser.id
                  return (
                    <div key={message.id} className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md`}>
                        {!isFromCurrentUser && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={message.sender.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {message.sender.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`flex flex-col ${isFromCurrentUser ? "items-end" : "items-start"}`}>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isFromCurrentUser
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900 border border-gray-200"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{formatTime(message.created_at)}</p>
                        </div>
                        {isFromCurrentUser && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={currentProfile?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {currentProfile?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* 发送消息 */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="输入消息..."
                  rows={2}
                  className="flex-1 resize-none"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                />
                <Button type="submit" disabled={!newMessage.trim() || isLoading} size="icon" className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-xs text-gray-500 mt-2">按 Enter 发送，Shift + Enter 换行</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
