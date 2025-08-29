"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { ProductCard } from "./product-card"
import { MessageCircle, Heart, Share2, MapPin, Calendar, Eye } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface ProductDetailProps {
  product: any
  relatedProducts: any[]
  currentUser: User | null
  currentProfile: any
}

export function ProductDetail({ product, relatedProducts, currentUser, currentProfile }: ProductDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(price)
  }

  const getConditionText = (condition?: string) => {
    switch (condition) {
      case "new":
        return "全新"
      case "like_new":
        return "几乎全新"
      case "good":
        return "良好"
      case "fair":
        return "一般"
      case "poor":
        return "较差"
      default:
        return "未知"
    }
  }

  const handleContactSeller = () => {
    if (!currentUser) {
      router.push("/auth/login")
      return
    }
    // 这里将在消息功能中实现
    router.push(`/messages/new?product=${product.id}&seller=${product.seller.id}`)
  }

  const handleBuyNow = () => {
    if (!currentUser) {
      router.push("/auth/login")
      return
    }
    // 这里将实现购买功能
    router.push(`/checkout?product=${product.id}`)
  }

  useEffect(() => {
    const loadFavorite = async () => {
      if (!currentUser) return
      const { data } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", currentUser.id)
        .eq("product_id", product.id)
        .maybeSingle()
      setIsFavorited(!!data)
    }
    loadFavorite()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, product.id])

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      router.push("/auth/login")
      return
    }
    if (favLoading) return
    setFavLoading(true)
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("product_id", product.id)
        if (error) throw error
        setIsFavorited(false)
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert([{ user_id: currentUser.id, product_id: product.id }])
        if (error) throw error
        setIsFavorited(true)
      }
    } catch (e) {
      // 可添加 UI 提示
    } finally {
      setFavLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* 商品图片 */}
        <div className="space-y-4">
          <AspectRatio ratio={4 / 3}>
            <img
              src={product.images[selectedImageIndex] || "/placeholder.svg?height=400&width=600&query=product"}
              alt={product.title}
              className="object-cover w-full h-full rounded-lg"
            />
          </AspectRatio>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square rounded-md overflow-hidden border-2 ${
                    selectedImageIndex === index ? "border-blue-500" : "border-gray-200"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg?height=100&width=100&query=thumbnail"}
                    alt={`${product.title} ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary">
                {product.category.icon} {product.category.name}
              </Badge>
              {product.condition && <Badge variant="outline">{getConditionText(product.condition)}</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
            <p className="text-4xl font-bold text-blue-600 mb-4">{formatPrice(product.price)}</p>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {product.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{product.location}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(product.created_at).toLocaleDateString("zh-CN")}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{product.view_count || 0} 次浏览</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mb-2">商品描述</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* 卖家信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">卖家信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={product.seller.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{product.seller.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{product.seller.full_name || "匿名卖家"}</p>
                  <p className="text-sm text-gray-600">
                    加入时间：{new Date(product.seller.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="space-y-3">
            {currentUser?.id !== product.seller.id ? (
              <>
                <Button onClick={handleBuyNow} size="lg" className="w-full">
                  立即购买
                </Button>
                <Button onClick={handleContactSeller} variant="outline" size="lg" className="w-full bg-transparent">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  联系卖家
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="lg" className="w-full bg-transparent">
                <a href="/seller">管理商品</a>
              </Button>
            )}

            <div className="flex space-x-2">
              <Button onClick={handleToggleFavorite} variant="outline" size="sm" className={`flex-1 ${isFavorited ? "text-red-600" : ""} bg-transparent`} disabled={favLoading}>
                <Heart className="h-4 w-4 mr-2" />
                {isFavorited ? "已收藏" : "收藏"}
              </Button>
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 相关商品 */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">相关商品</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
