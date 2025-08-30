import { createClient } from "@/lib/supabase/server"
import { ProductGrid } from "@/components/marketplace/product-grid"
import { CategoryFilter } from "@/components/marketplace/category-filter"
import { SearchBar } from "@/components/marketplace/search-bar"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"

// 强制动态渲染，因为使用了 cookies
export const dynamic = 'force-dynamic'

interface SearchParams {
  category?: string
  search?: string
  page?: string
  sort?: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let profile = null
    if (user) {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      profile = data
    }

    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")

    // 计算各分类商品数量（仅统计上架 active 商品）
    const { data: productCats } = await supabase
      .from("products")
      .select("category_id")
      .eq("status", "active")

    const countMap = new Map<string, number>()
    ;(productCats || []).forEach((row: any) => {
      if (!row?.category_id) return
      countMap.set(row.category_id, (countMap.get(row.category_id) || 0) + 1)
    })
    const categoriesWithCount = (categories || []).map((c: any) => ({ ...c, count: countMap.get(c.id) || 0 }))

    let query = supabase
      .from("products")
      .select(`
        *,
        seller:profiles!seller_id(full_name, avatar_url),
        category:categories(name, icon)
      `)
      .eq("status", "active")

    if (searchParams.category) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(searchParams.category)
      if (isUUID) {
        query = query.eq("category_id", searchParams.category)
      } else {
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id")
          .eq("name", searchParams.category)
          .single()
        if (categoryData) {
          query = query.eq("category_id", categoryData.id)
        } else {
          query = query.eq("category_id", "00000000-0000-0000-0000-000000000000")
        }
      }
    }

    if (searchParams.search) {
      query = query.or(`title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
    }

    const sort = searchParams.sort || "created_at"
    if (sort === "price_asc") {
      query = query.order("price", { ascending: true })
    } else if (sort === "price_desc") {
      query = query.order("price", { ascending: false })
    } else if (sort === "popular") {
      query = query.order("view_count", { ascending: false })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    const { data: products, error } = await query

    if (error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
            <p className="text-gray-600 mb-4">无法加载商品数据，请稍后重试</p>
            <p className="text-sm text-gray-500">错误信息: {error.message}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <MarketplaceHeader user={user} profile={profile} />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">商品市场</h1>
            <SearchBar initialSearch={searchParams.search} />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-64 flex-shrink-0">
              <CategoryFilter
                categories={categoriesWithCount}
                selectedCategory={searchParams.category}
                totalCount={products?.length || 0}
              />
            </div>

            <div className="flex-1">
              {!products || products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无商品</h3>
                  <p className="text-gray-500 mb-6">目前还没有商品发布，请稍后再来查看</p>
                </div>
              ) : (
                <ProductGrid products={products} currentSort={searchParams.sort} />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">系统错误</h2>
          <p className="text-gray-600 mb-4">页面加载时发生了意外错误</p>
          <p className="text-sm text-gray-500">请刷新页面重试</p>
        </div>
      </div>
    )
  }
}
 
