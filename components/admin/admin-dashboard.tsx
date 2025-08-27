import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Package, Users, ShoppingCart, TrendingUp, AlertCircle } from "lucide-react"

interface AdminDashboardProps {
  products: any[]
  users: any[]
  orders: any[]
  messages: any[]
}

export function AdminDashboard({ products, users, orders, messages }: AdminDashboardProps) {
  // 计算统计数据
  const totalProducts = products.length
  const pendingProducts = products.filter((p) => p.status === "pending").length
  const activeProducts = products.filter((p) => p.status === "active").length

  const totalUsers = users.length
  const sellers = users.filter((u) => u.user_type === "seller").length
  const buyers = users.filter((u) => u.user_type === "buyer").length

  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const totalRevenue = orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total_price, 0)

  const totalMessages = messages.length

  // 最近7天的数据
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentProducts = products.filter((p) => new Date(p.created_at) > sevenDaysAgo).length
  const recentUsers = users.filter((u) => new Date(u.created_at) > sevenDaysAgo).length
  const recentOrders = orders.filter((o) => new Date(o.created_at) > sevenDaysAgo).length

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">管理仪表板</h1>
        <p className="text-gray-600">平台运营数据总览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">商品总数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {pendingProducts > 0 && `${pendingProducts} 个待审核`}
              {recentProducts > 0 && ` • 本周新增 ${recentProducts}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">用户总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {sellers} 卖家 • {buyers} 买家
              {recentUsers > 0 && ` • 本周新增 ${recentUsers}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订单总数</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders > 0 && `${pendingOrders} 个待处理`}
              {recentOrders > 0 && ` • 本周新增 ${recentOrders}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平台收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{totalMessages} 条消息</p>
          </CardContent>
        </Card>
      </div>

      {/* 待处理事项 */}
      {(pendingProducts > 0 || pendingOrders > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              待处理事项
            </CardTitle>
            <CardDescription className="text-orange-700">需要您关注的重要事项</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingProducts > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-orange-800">有 {pendingProducts} 个商品待审核</span>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/products?status=pending">立即处理</Link>
                  </Button>
                </div>
              )}
              {pendingOrders > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-orange-800">有 {pendingOrders} 个订单待处理</span>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/orders?status=pending">查看订单</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用管理功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/admin/products">
                <Package className="h-6 w-6 mb-2" />
                商品审核
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/admin/users">
                <Users className="h-6 w-6 mb-2" />
                用户管理
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/admin/categories">
                <Package className="h-6 w-6 mb-2" />
                分类管理
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/admin/settings">
                <Package className="h-6 w-6 mb-2" />
                系统设置
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 数据趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>商品状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">已上架</span>
                <span className="text-sm font-medium">{activeProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">待审核</span>
                <span className="text-sm font-medium text-orange-600">{pendingProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">已售出</span>
                <span className="text-sm font-medium">{products.filter((p) => p.status === "sold").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">已下架</span>
                <span className="text-sm font-medium">{products.filter((p) => p.status === "inactive").length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>用户类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">买家</span>
                <span className="text-sm font-medium">{buyers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">卖家</span>
                <span className="text-sm font-medium">{sellers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">管理员</span>
                <span className="text-sm font-medium">{users.filter((u) => u.user_type === "admin").length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
