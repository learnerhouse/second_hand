"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"

interface NewMessageFormProps {
  product: any
  seller: any
  currentUser: User
}

export function NewMessageForm({ product, seller, currentUser }: NewMessageFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("messages").insert([
        {
          product_id: product.id,
          sender_id: currentUser.id,
          receiver_id: seller.id,
          content: message.trim(),
        },
      ])

      if (error) throw error

      // 重定向到对话页面
      const conversationId = `${product.id}-${seller.id}`
      router.push(`/messages/${conversationId}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(price)
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href={`/marketplace/product/${product.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回商品页面
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">联系卖家</h1>
        <p className="text-gray-600">向卖家询问商品相关问题</p>
      </div>

      <div className="space-y-6">
        {/* 商品信息 */}
        <Card>
          <CardHeader>
            <CardTitle>商品信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <img
                src={product.images[0] || "/placeholder.svg?height=80&width=80&query=product"}
                alt={product.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
                <p className="text-xl font-bold text-blue-600 mb-2">{formatPrice(product.price)}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {product.category.icon} {product.category.name}
                  </Badge>
                  {product.condition && <Badge variant="outline">{getConditionText(product.condition)}</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 卖家信息 */}
        <Card>
          <CardHeader>
            <CardTitle>卖家信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={seller.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{seller.full_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{seller.full_name || "卖家"}</p>
                <p className="text-sm text-gray-600">
                  {seller.user_type === "seller" ? "认证卖家" : "个人卖家"}
                  {seller.is_verified && " • 已验证"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 发送消息 */}
        <Card>
          <CardHeader>
            <CardTitle>发送消息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="请输入您想询问的问题，例如：
• 商品的具体状况如何？
• 是否支持当面交易？
• 价格是否还能商量？
• 什么时候可以看货？"
                  rows={6}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end space-x-2">
                <Button asChild variant="outline">
                  <Link href={`/marketplace/product/${product.id}`}>取消</Link>
                </Button>
                <Button type="submit" disabled={!message.trim() || isLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? "发送中..." : "发送消息"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
