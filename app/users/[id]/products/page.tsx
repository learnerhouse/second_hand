import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductGrid } from "@/components/marketplace/product-grid"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"

export default async function UserProductsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null }

  const { data: seller } = await supabase.from("profiles").select("*").eq("id", params.id).maybeSingle()
  if (!seller) notFound()

  const { data: products } = await supabase
    .from("products")
    .select(`*, seller:profiles!seller_id(full_name, avatar_url), category:categories(name, icon)`) 
    .eq("seller_id", params.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader user={user} profile={profile} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{seller.full_name || "用户"} 的在售商品</h1>
        </div>
        <ProductGrid products={products || []} />
      </div>
    </div>
  )
}

