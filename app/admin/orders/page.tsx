import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// 强制动态渲染，因为使用了 cookies
export const dynamic = "force-dynamic"
import { AdminLayout } from "@/components/admin/admin-layout"
import { OrdersManagement } from "@/components/admin/orders-management"

export default async function AdminOrdersPage() {
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

  // 获取所有订单
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      product:products(title, price),
      buyer:profiles!orders_buyer_id_fkey(full_name, email),
      seller:profiles!orders_seller_id_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false })

  return (
    <AdminLayout user={user} profile={profile}>
      <OrdersManagement orders={orders || []} />
    </AdminLayout>
  )
}
