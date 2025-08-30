# 商品编辑页面修复

## 问题描述

点击"我的商品"中的编辑按钮时，链接到 `/seller/products/[id]/edit` 页面，但该页面不存在，显示"没有页面"错误。

## 问题分析

通过代码审查发现：

1. **编辑按钮存在**: 在 `components/seller/products-management.tsx` 中，编辑按钮正确链接到 `/seller/products/${product.id}/edit`
2. **编辑页面缺失**: 缺少 `app/seller/products/[id]/edit/page.tsx` 文件
3. **表单组件完整**: `components/seller/product-form.tsx` 已经支持编辑功能
4. **路由结构不完整**: 只有 `/seller/products/new` 页面，缺少编辑页面

## 修复方案

### 1. 创建编辑页面文件

创建了 `app/seller/products/[id]/edit/page.tsx` 文件：

```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SellerLayout } from "@/components/seller/seller-layout"
import { ProductForm } from "@/components/seller/product-form"

// 强制动态渲染，因为使用了 cookies
export const dynamic = 'force-dynamic'

interface EditProductPageProps {
  params: { id: string }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const supabase = await createClient()

  // 获取用户信息
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 获取用户资料
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "seller") {
    redirect("/marketplace")
  }

  // 获取要编辑的商品
  const { data: product, error: productError } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name, icon)
    `)
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .single()

  if (productError || !product) {
    redirect("/seller/products")
  }

  // 获取分类列表
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")

  return (
    <SellerLayout user={user} profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">编辑商品</h1>
          <p className="text-gray-600">修改商品信息</p>
        </div>

        <ProductForm categories={categories || []} product={product} />
      </div>
    </SellerLayout>
  )
}
```

### 2. 优化表单组件

更新了 `components/seller/product-form.tsx` 中的按钮文本，使其在编辑模式下显示正确的文本：

```typescript
// 修复前
<Button type="submit" disabled={isLoading}>
  {isLoading ? "发布中..." : "发布商品"}
</Button>

// 修复后
<Button type="submit" disabled={isLoading}>
  {isLoading ? "保存中..." : (product ? "保存更改" : "发布商品")}
</Button>
```

### 3. 创建目录结构

确保目录结构正确：

```bash
mkdir -p app/seller/products/[id]/edit
```

## 技术实现

### 1. 页面结构

```
app/seller/products/
├── page.tsx                    # 商品列表页面
├── new/
│   └── page.tsx               # 新建商品页面
└── [id]/
    └── edit/
        └── page.tsx           # 编辑商品页面
```

### 2. 权限验证

编辑页面包含完整的权限验证：

- **用户登录检查**: 未登录用户重定向到登录页面
- **卖家身份验证**: 非卖家用户重定向到商城页面
- **商品所有权验证**: 只能编辑自己的商品

### 3. 数据获取

编辑页面正确获取所需数据：

- **商品信息**: 根据 ID 获取商品详情
- **分类列表**: 获取所有活跃分类
- **用户信息**: 获取当前用户和资料信息

### 4. 表单复用

充分利用现有的 `ProductForm` 组件：

- **编辑模式支持**: 组件已支持编辑现有商品
- **数据预填充**: 表单自动填充现有商品数据
- **更新逻辑**: 正确处理商品更新操作

## 功能特性

### ✅ 编辑功能
- 修改商品标题、描述、价格
- 更改商品分类和状况
- 更新商品标签和地区
- 修改商品图片

### 🔒 安全特性
- 用户身份验证
- 卖家权限验证
- 商品所有权验证
- 数据完整性检查

### 📱 用户体验
- 响应式设计
- 表单验证
- 错误处理
- 加载状态

## 测试建议

1. **路由测试**: 验证编辑页面路由是否正常工作
2. **权限测试**: 测试未登录用户和非卖家用户的访问限制
3. **数据测试**: 验证商品数据是否正确预填充到表单
4. **编辑测试**: 测试商品信息的修改和保存功能
5. **导航测试**: 确认编辑完成后正确跳转到商品列表页面

## 总结

通过创建缺失的商品编辑页面，成功修复了"没有页面"的错误。现在卖家可以：

- ✅ 正常访问商品编辑页面
- ✅ 编辑现有商品的所有信息
- ✅ 保存更改并更新商品状态
- ✅ 享受完整的商品管理体验

修复后的编辑页面与现有的新建商品页面保持一致的用户体验，同时提供了完整的权限验证和数据安全保护。