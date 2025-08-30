import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// 强制动态渲染，因为使用了 cookies
export const dynamic = "force-dynamic"
import { AdminLayout } from "@/components/admin/admin-layout"
import { SystemSettings } from "@/components/admin/system-settings"

export default async function AdminSettingsPage() {
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

  // 获取系统设置
  const { data: systemSettings } = await supabase
    .from("system_settings")
    .select("*")
    .single()

  return (
    <AdminLayout user={user} profile={profile}>
      <SystemSettings initialSettings={systemSettings} />
    </AdminLayout>
  )
}
