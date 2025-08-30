import type React from "react"
import Link from "next/link"
import { UserNav } from "@/components/auth/user-nav"
import { Button } from "@/components/ui/button"
import { Package, Users, MessageSquare, Settings, BarChart3, Home, CheckCircle, FolderTree, Shield } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface AdminLayoutProps {
  children: React.ReactNode
  user: User
  profile: any
}

export function AdminLayout({ children, user, profile }: AdminLayoutProps) {
  const navigation = [
    { name: "仪表板", href: "/admin", icon: BarChart3 },
    { name: "商品审核", href: "/admin/products", icon: CheckCircle },
    { name: "用户管理", href: "/admin/users", icon: Users },
    { name: "分类管理", href: "/admin/categories", icon: FolderTree },
    { name: "订单管理", href: "/admin/orders", icon: Package },
    { name: "消息管理", href: "/admin/messages", icon: MessageSquare },
    { name: "权限管理", href: "/admin/permissions", icon: Shield },
    { name: "系统设置", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                管理后台
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
        <nav className="w-72 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.name}</span>
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
