import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// 强制动态渲染，因为使用了 cookies
export const dynamic = "force-dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileEditor } from "@/components/profile/profile-editor"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">个人资料</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium">{profile?.email || user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">姓名</p>
                <p className="font-medium">{profile?.full_name || "未填写"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">手机号</p>
                <p className="font-medium">{profile?.phone || "未填写"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">用户类型</p>
                <p className="font-medium">
                  {profile?.user_type === "admin" ? "管理员" : profile?.user_type === "seller" ? "卖家" : "买家"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">地址</p>
                <p className="font-medium">{profile?.address || "未填写"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ProfileEditor
          profile={{
            id: user.id,
            email: profile?.email || user.email || undefined,
            full_name: profile?.full_name || undefined,
            phone: profile?.phone || undefined,
            address: profile?.address || undefined,
            user_type: profile?.user_type || "buyer",
          }}
        />
      </div>
    </div>
  )
}

