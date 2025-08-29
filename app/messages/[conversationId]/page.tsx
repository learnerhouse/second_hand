import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { MessagesLayout } from "@/components/messages/messages-layout"
import { ConversationView } from "@/components/messages/conversation-view"

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // 解析对话ID（下划线分隔，避免与 UUID 的连字符冲突）
  let productId: string | undefined
  let partnerId: string | undefined
  if (params.conversationId.includes("_")) {
    ;[productId, partnerId] = params.conversationId.split("_")
  } else if (params.conversationId.includes("-")) {
    // 兼容旧链接
    const parts = params.conversationId.split("-")
    productId = parts.slice(0, 5).join("-")
    partnerId = parts.slice(5).join("-")
  }

  if (!productId || !partnerId) {
    notFound()
  }

  // 获取商品信息（若因RLS不可见，则使用占位数据继续展示对话）
  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      seller:profiles!seller_id(id, full_name, avatar_url),
      category:categories(name, icon)
    `)
    .eq("id", productId)
    .single()
  

  // 获取对话伙伴信息（若不可见则使用占位对象，避免 404）
  const { data: partnerData } = await supabase.from("profiles").select("*").eq("id", partnerId).maybeSingle()
  const partner = partnerData || { id: partnerId, full_name: "用户", avatar_url: null }

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
        product={
          product || {
            id: productId,
            title: "商品不可见或已下架",
            images: [],
            price: 0,
            location: undefined,
            condition: undefined,
            category: { name: "-", icon: "" },
            seller: { id: partnerId, full_name: partner?.full_name, avatar_url: partner?.avatar_url },
          }
        }
        partner={partner}
        messages={messages || []}
        currentUser={user}
        currentProfile={profile}
      />
    </MessagesLayout>
  )
}
