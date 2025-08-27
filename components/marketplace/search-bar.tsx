"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"
import { AdvancedSearch } from "./advanced-search"

interface SearchBarProps {
  initialSearch?: string
}

export function SearchBar({ initialSearch = "" }: SearchBarProps) {
  const [search, setSearch] = useState(initialSearch)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()

  const searchParamsString = searchParams.toString()

  useEffect(() => {
    console.log("[v0] SearchBar useEffect triggered with params:", searchParamsString)

    const filters: string[] = []
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const condition = searchParams.get("condition")
    const location = searchParams.get("location")
    const sort = searchParams.get("sort")

    if (minPrice || maxPrice) {
      filters.push(`价格: ¥${minPrice || 0} - ¥${maxPrice || "∞"}`)
    }
    if (condition) {
      const conditionMap: Record<string, string> = {
        new: "全新",
        like_new: "几乎全新",
        good: "良好",
        fair: "一般",
        poor: "较差",
      }
      filters.push(`状态: ${conditionMap[condition] || condition}`)
    }
    if (location) filters.push(`地区: ${location}`)
    if (sort) {
      const sortMap: Record<string, string> = {
        newest: "最新发布",
        price_low: "价格从低到高",
        price_high: "价格从高到低",
        popular: "最受欢迎",
      }
      filters.push(`排序: ${sortMap[sort] || sort}`)
    }

    console.log("[v0] Setting active filters:", filters)
    setActiveFilters(filters)
  }, [searchParamsString]) // Use string instead of object reference

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())

    if (search.trim()) {
      params.set("search", search.trim())
    } else {
      params.delete("search")
    }

    params.delete("page")
    router.push(`/marketplace?${params.toString()}`)
  }

  const removeFilter = (filterType: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (filterType.startsWith("价格")) {
      params.delete("minPrice")
      params.delete("maxPrice")
    } else if (filterType.startsWith("状态")) {
      params.delete("condition")
    } else if (filterType.startsWith("地区")) {
      params.delete("location")
    } else if (filterType.startsWith("排序")) {
      params.delete("sort")
    }

    params.delete("page")
    router.push(`/marketplace?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <Input
            type="text"
            placeholder="搜索商品、技能或手工艺品..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          筛选
        </Button>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {filter}
              <button onClick={() => removeFilter(filter)} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <AdvancedSearch isOpen={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
    </div>
  )
}
