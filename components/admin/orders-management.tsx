"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Search, Filter, Package, User, DollarSign, Calendar, Eye, Edit } from "lucide-react"

interface Order {
  id: string
  product_id: string
  buyer_id: string
  seller_id: string
  quantity: number
  total_price: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  shipping_address?: string
  notes?: string
  created_at: string
  updated_at: string
  product?: {
    title: string
    price: number
  }
  buyer?: {
    full_name: string
    email: string
  }
  seller?: {
    full_name: string
    email: string
  }
}

interface OrdersManagementProps {
  orders: Order[]
}

export function OrdersManagement({ orders: initialOrders }: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  // 过滤订单
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.product?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.seller?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.seller?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipping_address?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // 更新订单状态
  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)

      if (error) throw error

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
      toast.success("订单状态更新成功")
    } catch (error) {
      console.error("更新订单状态失败:", error)
      toast.error("更新失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 获取状态统计
  const getStats = () => {
    const total = orders.length
    const pending = orders.filter(o => o.status === 'pending').length
    const confirmed = orders.filter(o => o.status === 'confirmed').length
    const shipped = orders.filter(o => o.status === 'shipped').length
    const delivered = orders.filter(o => o.status === 'delivered').length
    const cancelled = orders.filter(o => o.status === 'cancelled').length
    const refunded = orders.filter(o => o.status === 'refunded').length
    
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + Number(o.total_price), 0)
    
    return { total, pending, confirmed, shipped, delivered, cancelled, refunded, totalRevenue }
  }

  const stats = getStats()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(price)
  }

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { label: '待确认', variant: 'secondary' as const },
      confirmed: { label: '已确认', variant: 'default' as const },
      shipped: { label: '已发货', variant: 'default' as const },
      delivered: { label: '已送达', variant: 'default' as const },
      cancelled: { label: '已取消', variant: 'destructive' as const },
      refunded: { label: '已退款', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusOptions = () => {
    return [
      { value: 'pending', label: '待确认' },
      { value: 'confirmed', label: '已确认' },
      { value: 'shipped', label: '已发货' },
      { value: 'delivered', label: '已送达' },
      { value: 'cancelled', label: '已取消' },
      { value: 'refunded', label: '已退款' }
    ]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">订单管理</h1>
        <p className="text-gray-600">管理系统中的所有订单和交易</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">总订单数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">待处理订单</p>
                <p className="text-2xl font-bold">{stats.pending + stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">已完成订单</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">总收入</p>
                <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索商品标题、买家、卖家或收货地址..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="状态过滤" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部订单</SelectItem>
                  {getStatusOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 订单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || statusFilter !== "all" ? "没有找到匹配的订单" : "暂无订单"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* 订单头部信息 */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">商品:</span>
                          <span>{order.product?.title || '未知商品'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">买家:</span>
                          <span>{order.buyer?.full_name || order.buyer?.email || '未知用户'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">卖家:</span>
                          <span>{order.seller?.full_name || order.seller?.email || '未知用户'}</span>
                        </div>
                      </div>

                      {/* 订单详情 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">数量:</span> {order.quantity}
                        </div>
                        <div>
                          <span className="font-medium">总价:</span> {formatPrice(order.total_price)}
                        </div>
                        <div>
                          <span className="font-medium">状态:</span> {getStatusBadge(order.status)}
                        </div>
                      </div>

                      {/* 收货地址和备注 */}
                      {order.shipping_address && (
                        <div className="text-sm">
                          <span className="font-medium">收货地址:</span> {order.shipping_address}
                        </div>
                      )}
                      
                      {order.notes && (
                        <div className="text-sm">
                          <span className="font-medium">备注:</span> {order.notes}
                        </div>
                      )}

                      {/* 时间信息 */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>创建时间: {formatDate(order.created_at)}</span>
                        <span>更新时间: {formatDate(order.updated_at)}</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Select
                        value={order.status}
                        onValueChange={(value: Order['status']) => handleUpdateStatus(order.id, value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}