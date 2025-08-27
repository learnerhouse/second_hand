import type React from "react"
import Link from "next/link"
import { UserNav } from "@/components/auth/user-nav"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface MessagesLayoutProps {
  children: React.ReactNode
  user: User
  profile: any
}

export function MessagesLayout({ children, user, profile }: MessagesLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/marketplace">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回商城
                </Link>
              </Button>
              <h1 className="text-xl font-bold text-gray-900">消息中心</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/marketplace">
                  <Home className="h-4 w-4 mr-2" />
                  商城首页
                </Link>
              </Button>
              {profile?.user_type === "seller" && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/seller">卖家中心</Link>
                </Button>
              )}
              {profile?.user_type === "admin" && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin">管理后台</Link>
                </Button>
              )}
              <UserNav user={user} profile={profile} />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
