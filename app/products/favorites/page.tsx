import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountLayout } from "@/components/account/account-layout"
import { ProductGrid } from "@/components/marketplace/product-grid"

export default async function FavoritesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: favorites } = await supabase
    .from("favorites")
    .select("product:products(*, seller:profiles!seller_id(full_name, avatar_url), category:categories(name, icon))")
    .eq("user_id", user.id)

  const products = (favorites || []).map((f: any) => f.product)

  return (
    <AccountLayout user={user} profile={profile}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">我的收藏</h1>
        <ProductGrid products={products || []} />
      </div>
    </AccountLayout>
  )
}

