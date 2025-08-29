import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
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

  // 获取平台统计数据
  const { data: products } = await supabase.from("products").select("id, status, created_at, price")

  const { data: users } = await supabase.from("profiles").select("id, user_type, role, created_at")

  const { data: orders } = await supabase.from("orders").select("id, status, total_price, created_at")

  const { data: messages } = await supabase.from("messages").select("id, created_at")

  return (
    <AdminLayout user={user} profile={profile}>
      <AdminDashboard products={products || []} users={users || []} orders={orders || []} messages={messages || []} />
    </AdminLayout>
  )
}
