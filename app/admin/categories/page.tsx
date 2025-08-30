import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { CategoriesManagement } from "@/components/admin/categories-management"

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "admin" && profile.user_type !== "admin")) {
    redirect("/marketplace")
  }

  // 获取所有分类
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <AdminLayout user={user} profile={profile}>
      <CategoriesManagement categories={categories || []} />
    </AdminLayout>
  )
}