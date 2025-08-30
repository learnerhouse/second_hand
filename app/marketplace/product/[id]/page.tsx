import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/marketplace/product-detail"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { ViewCountTracker } from "@/components/marketplace/view-count-tracker"

// 强制动态渲染，因为使用了 cookies
export const dynamic = 'force-dynamic'

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

  // 优先获取公开商品（active）
  const { data: activeProduct } = await supabase
    .from("products")
    .select(`
      *,
      seller:profiles!seller_id(id, full_name, avatar_url, phone, created_at),
      category:categories(name, icon)
    `)
    .eq("id", params.id)
    .eq("status", "active")
    .maybeSingle()

  let product = activeProduct

  // 若不是公开商品，且当前用户为所有者，则允许查看
  if (!product && user) {
    const { data: ownerProduct } = await supabase
      .from("products")
      .select(`
        *,
        seller:profiles!seller_id(id, full_name, avatar_url, phone, created_at),
        category:categories(name, icon)
      `)
      .eq("id", params.id)
      .eq("seller_id", user.id)
      .maybeSingle()
    product = ownerProduct || null
  }

  if (!product) {
    notFound()
  }

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

  const isOwner = user && product.seller_id === user.id

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader user={user} profile={profile} />
      
      {/* 浏览次数跟踪器 */}
      <ViewCountTracker
        productId={product.id}
        initialViewCount={product.view_count || 0}
        isOwner={isOwner}
        isActive={product.status === "active"}
      />
      
      <ProductDetail
        product={product}
        relatedProducts={relatedProducts || []}
        currentUser={user}
        currentProfile={profile}
      />
    </div>
  )
}
