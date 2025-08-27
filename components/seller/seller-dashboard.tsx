import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Package, ShoppingCart, MessageSquare, Eye, TrendingUp } from "lucide-react"

interface SellerDashboardProps {
  products: any[]
  orders: any[]
  messages: any[]
}

export function SellerDashboard({ products, orders, messages }: SellerDashboardProps) {
  // 计算统计数据
  const activeProducts = products.filter((p) => p.status === "active").length
  const pendingProducts = products.filter((p) => p.status === "pending").length
  const totalViews = products.reduce((sum, p) => sum + (p.view_count || 0), 0)

  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const totalRevenue = orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total_price, 0)

  const unreadMessages = messages.filter((m) => !m.is_read).length

  const recentProducts = products
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(price)
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      draft: "草稿",
      pending: "待审核",
      active: "已上架",
      sold: "已售出",
      inactive: "已下架",
      rejected: "已拒绝",
    }
    return statusMap[status] || status
  }

  const getOrderStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "待确认",
      confirmed: "已确认",
      shipped: "已发货",
      delivered: "已送达",
      cancelled: "已取消",
      refunded: "已退款",
    }
    return statusMap[status] || status
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
        <p className="text-gray-600">欢迎回到卖家中心，管理您的商品和订单</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在售商品</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">{pendingProducts > 0 && `${pendingProducts} 个待审核`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理订单</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">总订单 {orders.length} 个</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">
              平均每商品 {products.length > 0 ? Math.round(totalViews / products.length) : 0} 次
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{unreadMessages > 0 && `${unreadMessages} 条未读消息`}</p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用功能快速入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/seller/products/new">发布新商品</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/seller/products">管理商品</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/seller/orders">查看订单</Link>
            </Button>
            {unreadMessages > 0 && (
              <Button asChild variant="outline">
                <Link href="/seller/messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  查看消息 ({unreadMessages})
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近商品 */}
        <Card>
          <CardHeader>
            <CardTitle>最近商品</CardTitle>
            <CardDescription>您最近发布的商品</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无商品</p>
            ) : (
              <div className="space-y-4">
                {recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(product.price)} • {getStatusText(product.status)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(product.created_at).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近订单 */}
        <Card>
          <CardHeader>
            <CardTitle>最近订单</CardTitle>
            <CardDescription>您最近收到的订单</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无订单</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">订单 #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(order.total_price)} • {getOrderStatusText(order.status)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString("zh-CN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
