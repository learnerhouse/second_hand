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

  // 若仍不可见，且当前用户是该商品的买家（已下单），也允许查看（例如已售出）
  if (!product && user) {
    const { data: buyerOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("product_id", params.id)
      .eq("buyer_id", user.id)
      .maybeSingle()

    if (buyerOrder) {
      const { data: buyerViewProduct } = await supabase
        .from("products")
        .select(`
          *,
          seller:profiles!seller_id(id, full_name, avatar_url, phone, created_at),
          category:categories(name, icon)
        `)
        .eq("id", params.id)
        .maybeSingle()
      product = buyerViewProduct || null
    }
  }

  if (!product) {
    notFound()
  }

  // 增加浏览次数
  const isOwner = user && product.seller_id === user.id
  if (!isOwner && product.status === "active") {
    const { error: viewErr } = await supabase
      .from("products")
      .update({ view_count: (product.view_count || 0) + 1 })
      .eq("id", params.id)
    // 忽略 RLS 导致的更新失败，避免影响详情页访问
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
