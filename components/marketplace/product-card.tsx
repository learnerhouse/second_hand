import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Product {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  condition?: string
  location?: string
  created_at: string
  seller: {
    full_name?: string
    avatar_url?: string
  }
  category: {
    name: string
    icon?: string
  }
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(price)
  }

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case "new":
        return "bg-green-100 text-green-800"
      case "like_new":
        return "bg-blue-100 text-blue-800"
      case "good":
        return "bg-yellow-100 text-yellow-800"
      case "fair":
        return "bg-orange-100 text-orange-800"
      case "poor":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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

  return (
    <Link href={`/marketplace/product/${product.id}`}>
      <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <AspectRatio ratio={4 / 3}>
            <img
              src={product.images[0] || "/placeholder.svg?height=300&width=400&query=product"}
              alt={product.title}
              className="object-cover w-full h-full rounded-t-lg group-hover:scale-105 transition-transform duration-200"
            />
          </AspectRatio>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs">
                {product.category.icon} {product.category.name}
              </Badge>
              {product.condition && (
                <Badge className={`text-xs ${getConditionColor(product.condition)}`}>
                  {getConditionText(product.condition)}
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.title}
            </h3>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-600">{formatPrice(product.price)}</span>
              {product.location && <span className="text-xs text-gray-500">📍 {product.location}</span>}
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0">
          <div className="flex items-center space-x-2 w-full">
            <Avatar className="h-6 w-6">
              <AvatarImage src={product.seller.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">{product.seller.full_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600 truncate">{product.seller.full_name || "匿名卖家"}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(product.created_at).toLocaleDateString("zh-CN")}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
