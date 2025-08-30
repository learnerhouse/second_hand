import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// 强制动态渲染，因为使用了 cookies
export const dynamic = "force-dynamic"
import { SellerDashboard } from "@/components/seller/seller-dashboard"
import { SellerLayout } from "@/components/seller/seller-layout"

export default async function SellerPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.user_type !== "seller" && profile.user_type !== "admin")) {
    redirect("/marketplace")
  }

  // 获取商家统计数据
  const { data: products } = await supabase
    .from("products")
    .select("id, status, price, view_count, created_at")
    .eq("seller_id", user.id)

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_price, created_at")
    .eq("seller_id", user.id)

  const { data: messages } = await supabase
    .from("messages")
    .select("id, is_read, created_at")
    .eq("receiver_id", user.id)

  return (
    <SellerLayout user={user} profile={profile}>
      <SellerDashboard products={products || []} orders={orders || []} messages={messages || []} />
    </SellerLayout>
  )
}
