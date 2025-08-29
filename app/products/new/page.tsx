import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountLayout } from "@/components/account/account-layout"
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

  // 任何已登录用户都可以上传商品

  // 获取分类
  const { data: categories } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order")

  return (
    <AccountLayout user={user} profile={profile}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">发布新商品</h1>
          <p className="text-gray-600">填写商品信息并发布到市场</p>
        </div>
        <ProductForm categories={categories || []} />
      </div>
    </AccountLayout>
  )
}

