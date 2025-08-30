import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"

interface SearchParams {
  status?: string
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // 允许 admin 与 reviewer 查看订单列表
  const isAdmin = profile?.role === "admin" || profile?.user_type === "admin"
  const isReviewer = profile?.role === "reviewer"
  if (!profile || (!isAdmin && !isReviewer)) {
    redirect("/marketplace")
  }

  // 查询订单
  let query = supabase
    .from("orders")
    .select(`
      *,
      product:products(id, title, images, price),
      buyer:profiles!buyer_id(id, full_name, avatar_url),
      seller:profiles!seller_id(id, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })

  if (searchParams.status && searchParams.status !== "all") {
    query = query.eq("status", searchParams.status)
  }

  const { data: orders } = await query

  return (
    <AdminLayout user={user} profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">订单管理</h1>
          <p className="text-gray-600">查看并处理平台订单</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(orders || []).length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-600">暂无订单</div>
          ) : (
            (orders || []).map((order) => (
              <div key={order.id} className="bg-white rounded-lg border p-4 flex items-start gap-4">
                <img
                  src={order.product?.images?.[0] || "/placeholder.svg?height=60&width=60&query=product"}
                  alt={order.product?.title || "商品"}
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{order.product?.title || "商品"}</h3>
                    <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString("zh-CN")}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    价格：¥{Number(order.total_price || 0).toFixed(2)} × {order.quantity}，状态：{order.status}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    买家：{order.buyer?.full_name || order.buyer?.id} ｜ 卖家：{order.seller?.full_name || order.seller?.id}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

