import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { PermissionsManagement } from "@/components/admin/permissions-management"

export default async function AdminPermissionsPage() {
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
    .select("*")
    .order("created_at", { ascending: false })

  // 获取所有角色
  const { data: roles } = await supabase
    .from("roles")
    .select("*")
    .order("name")

  // 获取所有权限
  const { data: permissions } = await supabase
    .from("permissions")
    .select("*")
    .order("name")

  // 获取角色权限关联
  const { data: rolePermissions } = await supabase
    .from("role_permissions")
    .select("*")

  return (
    <AdminLayout user={user} profile={profile}>
      <PermissionsManagement 
        users={users || []} 
        roles={roles || []} 
        permissions={permissions || []} 
        rolePermissions={rolePermissions || []} 
      />
    </AdminLayout>
  )
}