import { createClient } from "@/lib/supabase/server"
import { ProductGrid } from "@/components/marketplace/product-grid"
import { CategoryFilter } from "@/components/marketplace/category-filter"
import { SearchBar } from "@/components/marketplace/search-bar"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"

interface SearchParams {
  category?: string
  search?: string
  page?: string
  sort?: string
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  console.log("[v0] Marketplace page starting - Server Component")

  try {
    const supabase = await createClient()
    console.log("[v0] Supabase client created successfully")

    // 获取用户信息（如果已登录）
    console.log("[v0] Fetching user authentication...")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.log("[v0] Auth error:", authError)
    } else {
      console.log("[v0] User status:", user ? "authenticated" : "anonymous")
    }

    let profile = null
    if (user) {
      console.log("[v0] Fetching user profile...")
      const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

      if (profileError) {
        console.log("[v0] Profile fetch error:", profileError)
      } else {
        console.log("[v0] Profile fetched successfully")
        profile = data
      }
    }

    // 获取分类
    console.log("[v0] Fetching categories...")
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")

    if (categoriesError) {
      console.log("[v0] Categories fetch error:", categoriesError)
    } else {
      console.log("[v0] Categories fetched:", categories?.length || 0, "items")
    }

    // 构建商品查询
    console.log("[v0] Building products query with params:", searchParams)
    let query = supabase
      .from("products")
      .select(`
        *,
        seller:profiles!seller_id(full_name, avatar_url),
        category:categories(name, icon)
      `)
      .eq("status", "active")

    // 应用筛选条件
    if (searchParams.category) {
      console.log("[v0] Applying category filter:", searchParams.category)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        searchParams.category,
      )

      if (isUUID) {
        query = query.eq("category_id", searchParams.category)
      } else {
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id")
          .eq("name", searchParams.category)
          .single()

        if (categoryData) {
          console.log("[v0] Found category ID for name:", searchParams.category, "->", categoryData.id)
          query = query.eq("category_id", categoryData.id)
        } else {
          console.log("[v0] Category not found for name:", searchParams.category)
          query = query.eq("category_id", "00000000-0000-0000-0000-000000000000")
        }
      }
    }

    if (searchParams.search) {
      console.log("[v0] Applying search filter:", searchParams.search)
      query = query.or(`title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
    }

    // 应用排序
    const sort = searchParams.sort || "created_at"
    console.log("[v0] Applying sort:", sort)
    if (sort === "price_asc") {
      query = query.order("price", { ascending: true })
    } else if (sort === "price_desc") {
      query = query.order("price", { ascending: false })
    } else if (sort === "popular") {
      query = query.order("view_count", { ascending: false })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    console.log("[v0] Executing products query...")
    const { data: products, error } = await query

    if (error) {
      console.log("[v0] Products fetch error:", error)

      if (
        error.message.includes("does not exist") ||
        error.message.includes("schema cache") ||
        error.code === "42P01" // PostgreSQL表不存在错误代码
      ) {
        console.log("[v0] Database tables not found, showing initialization page")
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 1.79 4 4 4h8c0-2.21-1.79-4-4-4H4V7z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 3v18l-8-4V7l8-4z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">数据库初始化</h1>
                <p className="text-gray-600">请按照以下步骤创建数据库表结构</p>
              </div>

              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">需要运行数据库脚本</h3>
                      <p className="text-sm text-amber-700 mt-1">数据库表尚未创建，请按顺序运行以下SQL脚本</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">执行步骤：</h3>
                  <div className="space-y-3">
                    {[
                      { step: 1, file: "scripts/001_create_users_profiles.sql", desc: "创建用户配置表" },
                      { step: 2, file: "scripts/002_create_categories.sql", desc: "创建商品分类表" },
                      { step: 3, file: "scripts/003_create_products.sql", desc: "创建商品信息表" },
                      { step: 4, file: "scripts/004_create_messages.sql", desc: "创建消息系统表" },
                      { step: 5, file: "scripts/005_create_orders.sql", desc: "创建订单管理表" },
                      { step: 6, file: "scripts/006_create_triggers.sql", desc: "创建数据库触发器" },
                    ].map((item) => (
                      <div key={item.step} className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {item.step}
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.file}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">提示</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        运行完所有脚本后，刷新页面即可正常使用二手交易平台的所有功能。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      if (error.message.includes("infinite recursion") || error.message.includes("policy")) {
        console.log("[v0] Database policy error, showing policy fix message")
        return (
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">数据库策略错误</h1>
                <p className="text-gray-600">数据库行级安全策略需要修复</p>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">RLS策略错误</h3>
                      <p className="text-sm text-red-700 mt-1">检测到数据库行级安全策略中的无限递归错误</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">修复步骤：</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">scripts/007_fix_rls_policies.sql</p>
                        <p className="text-xs text-gray-500">修复RLS策略中的无限递归问题</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">scripts/008_insert_test_data.sql</p>
                        <p className="text-xs text-gray-500">插入测试数据</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>错误详情:</strong> {error.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // 其他错误显示通用错误页面
      console.log("[v0] Showing generic error page")
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
            <p className="text-gray-600 mb-4">无法加载商品数据，请稍后重试</p>
            <p className="text-sm text-gray-500">错误信息: {error.message}</p>
          </div>
        </div>
      )
    }

    console.log("[v0] Products fetched successfully:", products?.length || 0, "items")

    return (
      <div className="min-h-screen bg-gray-50">
        <MarketplaceHeader user={user} profile={profile} />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">商品市场</h1>
            <SearchBar initialSearch={searchParams.search} />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* 侧边栏筛选 */}
            <div className="lg:w-64 flex-shrink-0">
              <CategoryFilter categories={categories || []} selectedCategory={searchParams.category} />
            </div>

            {/* 商品网格 */}
            <div className="flex-1">
              {!products || products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
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
    console.log("[v0] Unexpected error in marketplace page:", error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">系统错误</h2>
          <p className="text-gray-600 mb-4">页面加载时发生了意外错误</p>
          <p className="text-sm text-gray-500">请刷新页面重试</p>
        </div>
      </div>
    )
  }
}
