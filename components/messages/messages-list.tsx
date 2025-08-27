import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@supabase/supabase-js"

interface Conversation {
  product: {
    id: string
    title: string
    images: string[]
    price: number
  }
  partner: {
    id: string
    full_name?: string
    avatar_url?: string
  }
  lastMessage: {
    id: string
    content: string
    created_at: string
    sender_id: string
  }
  unreadCount: number
  messages: any[]
}

interface MessagesListProps {
  conversations: Conversation[]
  currentUser: User
}

export function MessagesList({ conversations, currentUser }: MessagesListProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(price)
  }

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">消息中心</h1>
        <p className="text-gray-600">与买家和卖家的对话记录</p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无消息</h3>
            <p className="text-gray-600 mb-4">开始浏览商品并与卖家交流吧</p>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              浏览商品
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => {
            const conversationId = `${conversation.product.id}-${conversation.partner.id}`
            const isFromCurrentUser = conversation.lastMessage.sender_id === currentUser.id

            return (
              <Link key={conversationId} href={`/messages/${conversationId}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* 商品图片 */}
                      <img
                        src={conversation.product.images[0] || "/placeholder.svg?height=60&width=60&query=product"}
                        alt={conversation.product.title}
                        className="w-15 h-15 object-cover rounded-lg flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                              {conversation.product.title}
                            </h3>
                            <p className="text-sm text-blue-600 font-medium mb-2">
                              {formatPrice(conversation.product.price)}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-500 mb-1">
                              {formatTime(conversation.lastMessage.created_at)}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white">{conversation.unreadCount}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={conversation.partner.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {conversation.partner.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600 mb-1">
                              {isFromCurrentUser ? "我" : conversation.partner.full_name || "对方"}：
                            </p>
                            <p className="text-sm text-gray-800 line-clamp-2">{conversation.lastMessage.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
