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
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("Auth error:", userError)
    redirect("/auth/login")
  }

  if (!user) {
    console.log("No user found, redirecting to login")
    redirect("/auth/login")
  }

  console.log("User authenticated:", user.id)

  // 获取用户资料
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Profile error:", profileError)
    redirect("/marketplace")
  }

  if (!profile) {
    console.log("No profile found, redirecting to marketplace")
    redirect("/marketplace")
  }

  console.log("User profile:", { user_type: profile.user_type, email: profile.email })

  // 检查用户是否有权限编辑商品（现在所有user角色都可以）
  if (!profile) {
    console.log("No profile found, redirecting to marketplace")
    redirect("/marketplace")
  }

  console.log("User profile:", { user_type: profile.user_type, email: profile.email })

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

  if (productError) {
    console.error("Product query error:", productError)
    redirect("/seller/products")
  }

  if (!product) {
    console.log("Product not found or not owned by user, redirecting to products list")
    redirect("/seller/products")
  }

  console.log("Product found:", { id: product.id, title: product.title, status: product.status })

  // 获取分类列表
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")

  if (categoriesError) {
    console.error("Categories error:", categoriesError)
    // 不重定向，使用空数组
  }

  return (
    <SellerLayout user={user} profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">编辑商品</h1>
          <p className="text-gray-600">修改商品信息</p>
          <div className="mt-2 text-sm text-gray-500">
            商品ID: {params.id} | 状态: {product.status}
          </div>
        </div>

        <ProductForm categories={categories || []} product={product} />
      </div>
    </SellerLayout>
  )
}