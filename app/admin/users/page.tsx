import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// 强制动态渲染，因为使用了 cookies
export const dynamic = "force-dynamic"
import { AdminLayout } from "@/components/admin/admin-layout"
import { UsersManagement } from "@/components/admin/users-management"

export default async function AdminUsersPage() {
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

  // 获取所有用户
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, phone, address, user_type, role, is_verified, created_at")
    .order("created_at", { ascending: false })

  return (
    <AdminLayout user={user} profile={profile}>
      <UsersManagement users={users || []} />
    </AdminLayout>
  )
}
