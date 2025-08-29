import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SellerLayout } from "@/components/seller/seller-layout"
import { ProductsManagement } from "@/components/seller/products-management"

export default async function MyProductsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: products } = await supabase
    .from("products")
    .select(`*, category:categories(name, icon)`) 
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <SellerLayout user={user} profile={profile}>
      <ProductsManagement products={products || []} />
    </SellerLayout>
  )
}

