import type React from "react"
import Link from "next/link"
import { UserNav } from "@/components/auth/user-nav"
import { Button } from "@/components/ui/button"
import { Package, Plus, MessageSquare, User, Home } from "lucide-react"
import type { User as SupaUser } from "@supabase/supabase-js"

interface AccountLayoutProps {
  children: React.ReactNode
  user: SupaUser
  profile: any
}

export function AccountLayout({ children, user, profile }: AccountLayoutProps) {
  const navigation = [
    { name: "我的商品", href: "/products/mine", icon: Package },
    { name: "上传商品", href: "/products/new", icon: Plus },
    { name: "消息中心", href: "/messages", icon: MessageSquare },
    { name: "个人资料", href: "/profile", icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/products/mine" className="text-xl font-bold text-gray-900">
                我的账户
              </Link>
              <Button asChild variant="ghost" size="sm">
                <Link href="/marketplace">
                  <Home className="h-4 w-4 mr-2" />
                  返回商城
                </Link>
              </Button>
            </div>
            <UserNav user={user} profile={profile} />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

