"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, X, Eye, Star, ArrowUp, ArrowDown } from "lucide-react"

interface Product {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  status: string
  is_featured: boolean
  sort_order: number
  view_count: number
  created_at: string
  seller: {
    full_name?: string
    email: string
    avatar_url?: string
  }
  category: {
    name: string
    icon?: string
  }
}

interface ProductsReviewProps {
  products: Product[]
  currentStatus?: string
}

export function ProductsReview({ products, currentStatus = "all" }: ProductsReviewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams()
    if (status !== "all") {
      params.set("status", status)
    }
    router.push(`/admin/products?${params.toString()}`)
  }

  const handleApprove = async (productId: string) => {
    setIsLoading(productId)
    try {
      const { error } = await supabase.from("products").update({ status: "active" }).eq("id", productId)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error approving product:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleReject = async (productId: string) => {
    setIsLoading(productId)
    try {
      const { error } = await supabase.from("products").update({ status: "rejected" }).eq("id", productId)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error rejecting product:", error)
    } finally {
      setIsLoading(null)
      setRejectReason("")
      setSelectedProduct(null)
    }
  }

  const handleToggleFeatured = async (productId: string, isFeatured: boolean) => {
    setIsLoading(productId)
    try {
      const { error } = await supabase.from("products").update({ is_featured: !isFeatured }).eq("id", productId)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating featured status:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleSortOrder = async (productId: string, direction: "up" | "down") => {
    setIsLoading(productId)
    try {
      const product = products.find((p) => p.id === productId)
      if (!product) return

      const newSortOrder = direction === "up" ? product.sort_order + 1 : product.sort_order - 1
      const { error } = await supabase.from("products").update({ sort_order: newSortOrder }).eq("id", productId)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating sort order:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "sold":
        return "bg-blue-100 text-blue-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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

  const filteredProducts = products.filter((product) => {
    if (currentStatus === "all" || !currentStatus) return true
    return product.status === currentStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">商品审核</h1>
          <p className="text-gray-600">审核和管理平台上的所有商品</p>
        </div>
      </div>

      {/* 状态筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">状态筛选：</span>
            <Select value={currentStatus || "all"} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="active">已上架</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="sold">已售出</SelectItem>
                <SelectItem value="inactive">已下架</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">共 {filteredProducts.length} 个商品</span>
          </div>
        </CardContent>
      </Card>

      {/* 商品列表 */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无商品</h3>
              <p className="text-gray-600">当前筛选条件下没有找到商品</p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={product.images[0] || "/placeholder.svg?height=80&width=80&query=product"}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
                          {product.is_featured && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              推荐
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            {product.category.icon} {product.category.name}
                          </span>
                          <span>卖家：{product.seller.full_name || product.seller.email}</span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {product.view_count || 0} 次浏览
                          </span>
                          <span>{new Date(product.created_at).toLocaleDateString("zh-CN")}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-blue-600 mb-2">{formatPrice(product.price)}</p>
                        <Badge className={getStatusColor(product.status)}>{getStatusText(product.status)}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSortOrder(product.id, "up")}
                      disabled={isLoading === product.id}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSortOrder(product.id, "down")}
                      disabled={isLoading === product.id}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFeatured(product.id, product.is_featured)}
                      disabled={isLoading === product.id}
                      className={product.is_featured ? "bg-yellow-50 text-yellow-700" : "bg-transparent"}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {product.is_featured ? "取消推荐" : "设为推荐"}
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={`/marketplace/product/${product.id}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        查看
                      </a>
                    </Button>

                    {product.status === "pending" && (
                      <>
                        <Button
                          onClick={() => handleApprove(product.id)}
                          disabled={isLoading === product.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          批准
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              拒绝
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>拒绝商品</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-gray-600">请说明拒绝原因（可选）：</p>
                              <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="拒绝原因..."
                                rows={3}
                              />
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                                  取消
                                </Button>
                                <Button
                                  onClick={() => selectedProduct && handleReject(selectedProduct.id)}
                                  disabled={isLoading === selectedProduct?.id}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  确认拒绝
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
