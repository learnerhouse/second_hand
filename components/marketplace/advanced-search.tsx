"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { X, Filter } from "lucide-react"

interface AdvancedSearchProps {
  isOpen: boolean
  onToggle: () => void
}

export function AdvancedSearch({ isOpen, onToggle }: AdvancedSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [priceRange, setPriceRange] = useState([0, 10000])
  const [condition, setCondition] = useState("")
  const [location, setLocation] = useState("")
  const [sortBy, setSortBy] = useState("")

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString())
    if (priceRange[1] < 10000) params.set("maxPrice", priceRange[1].toString())
    if (condition) params.set("condition", condition)
    if (location) params.set("location", location)
    if (sortBy) params.set("sort", sortBy)

    params.delete("page")
    router.push(`/marketplace?${params.toString()}`)
    onToggle()
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("minPrice")
    params.delete("maxPrice")
    params.delete("condition")
    params.delete("location")
    params.delete("sort")
    params.delete("page")

    router.push(`/marketplace?${params.toString()}`)
    setPriceRange([0, 10000])
    setCondition("")
    setLocation("")
    setSortBy("")
  }

  if (!isOpen) return null

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          高级筛选
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 价格范围 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">价格范围</Label>
          <div className="px-3">
            <Slider value={priceRange} onValueChange={setPriceRange} max={10000} step={100} className="w-full" />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>¥{priceRange[0]}</span>
              <span>¥{priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* 商品状态 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">商品状态</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger>
              <SelectValue placeholder="选择商品状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">全新</SelectItem>
              <SelectItem value="like_new">几乎全新</SelectItem>
              <SelectItem value="good">良好</SelectItem>
              <SelectItem value="fair">一般</SelectItem>
              <SelectItem value="poor">较差</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 地区 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">地区</Label>
          <Input placeholder="输入城市或地区" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        {/* 排序方式 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">排序方式</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="选择排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">最新发布</SelectItem>
              <SelectItem value="price_low">价格从低到高</SelectItem>
              <SelectItem value="price_high">价格从高到低</SelectItem>
              <SelectItem value="popular">最受欢迎</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleApplyFilters} className="flex-1">
            应用筛选
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            清除筛选
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
