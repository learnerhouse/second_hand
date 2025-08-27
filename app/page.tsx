import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // 根据用户类型重定向到相应界面
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

    if (profile?.user_type === "admin") {
      redirect("/admin")
    } else if (profile?.user_type === "seller") {
      redirect("/seller")
    } else {
      redirect("/marketplace")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">欢迎来到二手交易平台</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">发现优质二手物品，分享专业技能，展示精美手工艺品</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="text-4xl mb-4">📦</div>
              <CardTitle>二手物品</CardTitle>
              <CardDescription>发现各种优质二手商品，环保又实惠</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="text-4xl mb-4">🛠️</div>
              <CardTitle>技能服务</CardTitle>
              <CardDescription>分享你的专业技能，或找到需要的服务</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="text-4xl mb-4">🎨</div>
              <CardTitle>手工艺品</CardTitle>
              <CardDescription>展示和购买独特的手工制作艺术品</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/auth/login">登录</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/sign-up">注册</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            <Link href="/marketplace" className="text-blue-600 hover:underline">
              先浏览商品
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
