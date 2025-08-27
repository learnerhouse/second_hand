"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { ProductCard } from "./product-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface ProductGridProps {
  products: Product[]
  currentSort?: string
}

export function ProductGrid({ products, currentSort = "created_at" }: ProductGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", sort)
    params.delete("page") // 重置页码
    router.push(`/marketplace?${params.toString()}`)
  }

  return (
    <div>
      {/* 排序选择器 */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">找到 {products.length} 个商品</p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">排序：</span>
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">最新发布</SelectItem>
              <SelectItem value="price_asc">价格从低到高</SelectItem>
              <SelectItem value="price_desc">价格从高到低</SelectItem>
              <SelectItem value="popular">最受欢迎</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 商品网格 */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关商品</h3>
          <p className="text-gray-600">尝试调整搜索条件或浏览其他分类</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
