import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"

// 强制动态渲染，因为使用了 cookies
export const dynamic = "force-dynamic"
import { MessagesLayout } from "@/components/messages/messages-layout"
import { ConversationView } from "@/components/messages/conversation-view"

export default async function ConversationPage({
  params,
}: {
  params: { productId: string; partnerId: string }
}) {
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

  const { productId, partnerId } = params

  // 获取商品信息
  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      seller:profiles!seller_id(id, full_name, avatar_url),
      category:categories(name, icon)
    `)
    .eq("id", productId)
    .single()

  if (!product) {
    notFound()
  }

  // 获取对话伙伴信息
  const { data: partner } = await supabase.from("profiles").select("*").eq("id", partnerId).single()

  if (!partner) {
    notFound()
  }

  // 验证用户是否有权限查看这个对话
  const isProductOwner = product.seller_id === user.id
  const isPartner = partnerId === user.id
  const isBuyer = !isProductOwner && user.id !== partnerId

  if (!isProductOwner && !isPartner && !isBuyer) {
    redirect("/marketplace")
  }

  // 获取对话消息
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!sender_id(id, full_name, avatar_url)
    `)
    .eq("product_id", productId)
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`,
    )
    .order("created_at", { ascending: true })

  // 标记消息为已读
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("product_id", productId)
    .eq("sender_id", partnerId)
    .eq("receiver_id", user.id)
    .eq("is_read", false)

  return (
    <MessagesLayout user={user} profile={profile}>
      <ConversationView
        product={product}
        partner={partner}
        messages={messages || []}
        currentUser={user}
        currentProfile={profile}
      />
    </MessagesLayout>
  )
}