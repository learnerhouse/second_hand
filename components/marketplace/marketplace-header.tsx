import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/auth/user-nav"
import type { User } from "@supabase/supabase-js"

interface MarketplaceHeaderProps {
  user: User | null
  profile?: {
    full_name?: string
    avatar_url?: string
    user_type?: string
    role?: string
  } | null
}

export function MarketplaceHeader({ user, profile }: MarketplaceHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              二手交易平台
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/marketplace" className="text-gray-600 hover:text-gray-900">
                商品市场
              </Link>
              <Link href="/marketplace?category=二手物品" className="text-gray-600 hover:text-gray-900">
                二手物品
              </Link>
              <Link href="/marketplace?category=技能服务" className="text-gray-600 hover:text-gray-900">
                技能服务
              </Link>
              <Link href="/marketplace?category=手工艺品" className="text-gray-600 hover:text-gray-900">
                手工艺品
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button asChild variant="outline">
                  <Link href="/products/mine">我的商品</Link>
                </Button>
                <Button asChild>
                  <Link href="/products/new">上传商品</Link>
                </Button>
                {profile?.role === "admin" || profile?.user_type === "admin" ? (
                  <Button asChild variant="outline">
                    <Link href="/admin">管理后台</Link>
                  </Button>
                ) : null}
                <UserNav user={user} profile={profile} />
              </>
            ) : (
              <div className="space-x-2">
                <Button asChild variant="outline">
                  <Link href="/auth/login">登录</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/sign-up">注册</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
