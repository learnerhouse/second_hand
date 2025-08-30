import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// 强制动态渲染，因为使用了 cookies
export const dynamic = "force-dynamic"
import { AdminLayout } from "@/components/admin/admin-layout"
import { MessagesManagement } from "@/components/admin/messages-management"

export default async function AdminMessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "admin" && profile.user_type !== "admin")) {
    redirect("/marketplace")
  }

  // 获取所有消息
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      product:products(title),
      sender:profiles!messages_sender_id_fkey(full_name, email),
      receiver:profiles!messages_receiver_id_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false })

  return (
    <AdminLayout user={user} profile={profile}>
      <MessagesManagement messages={messages || []} />
    </AdminLayout>
  )
}
