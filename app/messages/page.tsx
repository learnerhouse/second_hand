import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MessagesLayout } from "@/components/messages/messages-layout"
import { MessagesList } from "@/components/messages/messages-list"

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // 获取用户的所有对话
  const { data: conversations } = await supabase
    .from("messages")
    .select(`
      *,
      product:products(id, title, images, price),
      sender:profiles!sender_id(id, full_name, avatar_url),
      receiver:profiles!receiver_id(id, full_name, avatar_url)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  // 按商品和对话伙伴分组对话
  const groupedConversations = new Map()
  conversations?.forEach((message) => {
    const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id
    const key = `${message.product_id}-${partnerId}`

    if (!groupedConversations.has(key)) {
      groupedConversations.set(key, {
        product: message.product,
        partner: message.sender_id === user.id ? message.receiver : message.sender,
        lastMessage: message,
        unreadCount: 0,
        messages: [],
      })
    }

    const conversation = groupedConversations.get(key)
    conversation.messages.push(message)

    // 计算未读消息数
    if (message.receiver_id === user.id && !message.is_read) {
      conversation.unreadCount++
    }

    // 更新最后一条消息
    if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
      conversation.lastMessage = message
    }
  })

  const conversationsList = Array.from(groupedConversations.values())

  return (
    <MessagesLayout user={user} profile={profile}>
      <MessagesList conversations={conversationsList} currentUser={user} />
    </MessagesLayout>
  )
}
