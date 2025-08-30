import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SellerLayout } from "@/components/seller/seller-layout"
import { ProductForm } from "@/components/seller/product-form"

// 强制动态渲染，因为使用了 cookies
export const dynamic = 'force-dynamic'

interface EditProductPageProps {
  params: { id: string }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const supabase = await createClient()

  // 获取用户信息
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 获取用户资料
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "seller") {
    redirect("/marketplace")
  }

  // 获取要编辑的商品
  const { data: product, error: productError } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name, icon)
    `)
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .single()

  if (productError || !product) {
    redirect("/seller/products")
  }

  // 获取分类列表
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")

  return (
    <SellerLayout user={user} profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">编辑商品</h1>
          <p className="text-gray-600">修改商品信息</p>
        </div>

        <ProductForm categories={categories || []} product={product} />
      </div>
    </SellerLayout>
  )
}