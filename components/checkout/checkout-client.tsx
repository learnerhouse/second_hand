"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CheckoutClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const productId = useMemo(() => searchParams.get("product"), [searchParams])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [address, setAddress] = useState("")

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      if (!productId) {
        router.push("/marketplace")
        return
      }

      const { data } = await supabase
        .from("products")
        .select(`*, seller:profiles!seller_id(id, full_name), category:categories(name)`) 
        .eq("id", productId)
        .single()
      if (data) setProduct(data)
      setLoading(false)
    }
    load()
  }, [productId, router, supabase])

  const total = useMemo(() => {
    if (!product) return 0
    const p = Number(product.price)
    return Math.max(0, Math.round(p * quantity * 100) / 100)
  }, [product, quantity])

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    setPlacing(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("未登录")
      const { error } = await supabase.from("orders").insert([
        {
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller_id,
          quantity,
          total_price: total,
          shipping_address: address || null,
        },
      ])
      if (error) throw error
      router.push("/messages")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  if (loading || !product) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">确认订单</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>收货信息</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={placeOrder} className="space-y-4">
                  <div>
                    <Label htmlFor="address">收货地址</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={placing}>
                    {placing ? "提交中..." : "提交订单"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>订单摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={product.images?.[0] || "/placeholder.svg?height=64&width=64&query=product"}
                    alt={product.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium line-clamp-2">{product.title}</p>
                    <p className="text-sm text-gray-500">{product.category?.name || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">单价</span>
                  <span className="font-medium">￥{Number(product.price).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">数量</span>
                  <div className="flex items-center space-x-2">
                    <Button type="button" variant="outline" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                      -
                    </Button>
                    <Input className="w-16 text-center" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
                    <Button type="button" variant="outline" onClick={() => setQuantity((q) => q + 1)}>
                      +
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">合计</span>
                  <span className="text-lg font-bold text-blue-600">￥{total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

