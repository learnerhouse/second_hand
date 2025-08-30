import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// 强制动态渲染，因为使用了 cookies
export const dynamic = "force-dynamic"
import { SellerLayout } from "@/components/seller/seller-layout"
import { SellerMessagesList } from "@/components/seller/seller-messages-list"

export default async function SellerMessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/marketplace")
  }

  // 获取用户作为卖家的所有商品
  const { data: userProducts } = await supabase
    .from("products")
    .select("id, title, images")
    .eq("seller_id", user.id)

  if (!userProducts || userProducts.length === 0) {
    return (
      <SellerLayout user={user} profile={profile}>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无商品</h3>
          <p className="text-gray-600 mb-4">您还没有发布商品，无法接收消息</p>
          <a
            href="/seller/products/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            发布商品
          </a>
        </div>
      </SellerLayout>
    )
  }

  // 获取所有与用户商品相关的消息
  const productIds = userProducts.map(p => p.id)
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      product:products(id, title, images),
      sender:profiles!sender_id(id, full_name, email, avatar_url),
      receiver:profiles!receiver_id(id, full_name, email, avatar_url)
    `)
    .in("product_id", productIds)
    .order("created_at", { ascending: false })

  // 按商品分组消息
  const groupedMessages = messages?.reduce((groups, message) => {
    const productId = message.product_id
    if (!groups[productId]) {
      groups[productId] = {
        product: message.product,
        messages: []
      }
    }
    groups[productId].messages.push(message)
    return groups
  }, {} as Record<string, { product: any; messages: any[] }>) || {}

  // 获取对话统计
  const totalMessages = messages?.length || 0
  const unreadMessages = messages?.filter(m => !m.is_read && m.receiver_id === user.id).length || 0
  const totalConversations = Object.keys(groupedMessages).length

  return (
    <SellerLayout user={user} profile={profile}>
      <SellerMessagesList
        groupedMessages={groupedMessages}
        totalMessages={totalMessages}
        unreadMessages={unreadMessages}
        totalConversations={totalConversations}
        currentUser={user}
      />
    </SellerLayout>
  )
}