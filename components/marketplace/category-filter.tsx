"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  icon?: string
  count?: number
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory?: string
  totalCount?: number
}

export function CategoryFilter({ categories, selectedCategory, totalCount }: CategoryFilterProps) {
  const searchParams = useSearchParams()

  const createCategoryUrl = (categoryId?: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (categoryId) {
      params.set("category", categoryId)
    } else {
      params.delete("category")
    }

    params.delete("page")
    return `/marketplace?${params.toString()}`
  }

  const computedTotal =
    typeof totalCount === "number" ? totalCount : categories.reduce((sum, cat) => sum + (cat.count || 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>商品分类</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link
          href={createCategoryUrl()}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border",
            !selectedCategory && "bg-blue-50 text-blue-700 border-blue-200",
          )}
        >
          <span className="font-medium">全部商品</span>
          <Badge variant="secondary" className="ml-2">
            {computedTotal}
          </Badge>
        </Link>

        {categories.map((category) => (
          <Link
            key={category.id}
            href={createCategoryUrl(category.id)}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border",
              selectedCategory === category.id && "bg-blue-50 text-blue-700 border-blue-200",
            )}
          >
            <div className="flex items-center space-x-3">
              {category.icon && <span className="text-lg">{category.icon}</span>}
              <span className="font-medium">{category.name}</span>
            </div>
            {category.count !== undefined && (
              <Badge variant="secondary" className="ml-2">
                {category.count}
              </Badge>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
