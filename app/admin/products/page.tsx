import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ProductsReview } from "@/components/admin/products-review"

interface SearchParams {
  status?: string
  page?: string
}

export default async function AdminProductsPage({
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

  // 允许 admin 与 reviewer 访问商品审核页；兼容旧的 user_type=admin
  const isAdmin = profile?.role === "admin" || profile?.user_type === "admin"
  const isReviewer = profile?.role === "reviewer"
  if (!profile || (!isAdmin && !isReviewer)) {
    redirect("/marketplace")
  }

  // 构建商品查询
  let query = supabase
    .from("products")
    .select(`
      *,
      seller:profiles!seller_id(full_name, email, avatar_url),
      category:categories(name, icon)
    `)
    .order("created_at", { ascending: false })

  // 应用状态筛选
  if (searchParams.status && searchParams.status !== "all") {
    query = query.eq("status", searchParams.status)
  }

  const { data: products } = await query

  return (
    <AdminLayout user={user} profile={profile}>
      <ProductsReview products={products || []} currentStatus={searchParams.status} />
    </AdminLayout>
  )
}
