import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/marketplace/product-detail"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // 获取用户信息
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  }

  // 获取商品详情
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      seller:profiles!seller_id(id, full_name, avatar_url, phone, created_at),
      category:categories(name, icon)
    `)
    .eq("id", params.id)
    .eq("status", "active")
    .single()

  if (error || !product) {
    notFound()
  }

  // 增加浏览次数
  await supabase
    .from("products")
    .update({ view_count: (product.view_count || 0) + 1 })
    .eq("id", params.id)

  // 获取相关商品
  const { data: relatedProducts } = await supabase
    .from("products")
    .select(`
      *,
      seller:profiles!seller_id(full_name, avatar_url),
      category:categories(name, icon)
    `)
    .eq("category_id", product.category_id)
    .eq("status", "active")
    .neq("id", params.id)
    .limit(4)

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader user={user} profile={profile} />
      <ProductDetail
        product={product}
        relatedProducts={relatedProducts || []}
        currentUser={user}
        currentProfile={profile}
      />
    </div>
  )
}
