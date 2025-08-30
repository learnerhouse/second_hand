import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// 强制动态渲染，因为使用了 cookies
export const dynamic = "force-dynamic"
import { SellerLayout } from "@/components/seller/seller-layout"
import { ProductForm } from "@/components/seller/product-form"

export default async function NewProductPage() {
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

  // 获取分类
  const { data: categories } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order")

  return (
    <SellerLayout user={user} profile={profile}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">发布新商品</h1>
          <p className="text-gray-600">填写商品信息并发布到市场</p>
        </div>
        <ProductForm categories={categories || []} />
      </div>
    </SellerLayout>
  )
}
