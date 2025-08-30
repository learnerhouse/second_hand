import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// 强制动态渲染，因为使用了 cookies
export const dynamic = "force-dynamic"
import { SellerLayout } from "@/components/seller/seller-layout"
import { ProductsManagement } from "@/components/seller/products-management"

export default async function SellerProductsPage() {
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

  // 获取商家的商品
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name, icon)
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <SellerLayout user={user} profile={profile}>
      <ProductsManagement products={products || []} />
    </SellerLayout>
  )
}
