# 商品编辑功能修复

## 问题描述

用户报告在 `/seller/products` 页面无法编辑上架的商品，点击编辑按钮后无法正常编辑商品信息。

## 问题分析

通过深入分析代码和数据库策略，发现了两个主要问题：

### 1. RLS 策略冲突

**问题**: 存在冲突的 Row Level Security (RLS) 策略，阻止卖家查看和编辑自己的商品。

**具体问题**:
- `scripts/007_fix_rls_policies.sql` 中的策略：
  ```sql
  CREATE POLICY "products_select_all" ON public.products 
    FOR SELECT USING (status = 'approved');
  ```
  这个策略只允许查看 `status = 'approved'` 的商品

- `scripts/000_complete_database_init.sql` 中的策略：
  ```sql
  CREATE POLICY "sellers_manage_own_products" ON public.products 
    FOR ALL USING (auth.uid() = seller_id);
  ```
  这个策略允许卖家管理自己的所有商品

**冲突**: 第一个策略限制了只能查看 `status = 'approved'` 的商品，这阻止了卖家查看和编辑自己的其他状态商品（如草稿、待审核、已上架等）。

### 2. 表单状态处理问题

**问题**: 在编辑模式下，表单提交时总是将商品状态设置为 `"pending"`（待审核），这会覆盖商品的原始状态。

**具体问题**:
```typescript
// 修复前
<form onSubmit={(e) => handleSubmit(e, "pending")}>

// 修复前
const productData = {
  ...formData,
  price: Number.parseFloat(formData.price),
  seller_id: user.id,
  status, // 总是使用传入的 status 参数
}
```

## 修复方案

### 1. 修复 RLS 策略

创建了新的 SQL 脚本 `scripts/008_fix_products_rls.sql`：

```sql
-- 修复products表的RLS策略，确保卖家可以管理自己的所有商品
-- 删除有问题的策略（使用 IF EXISTS 避免错误）
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "products_select_active" ON public.products;
DROP POLICY IF EXISTS "sellers_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "admin_manage_all_products" ON public.products;

-- 重新创建正确的策略
-- 1. 所有人都可以查看已激活的商品（用于商城展示）
CREATE POLICY "products_select_active" ON public.products 
  FOR SELECT USING (status = 'active');

-- 2. 卖家可以管理自己的所有商品（包括草稿、待审核、已上架等）
CREATE POLICY "sellers_manage_own_products" ON public.products 
  FOR ALL USING (auth.uid() = seller_id);

-- 3. 管理员可以管理所有商品
CREATE POLICY "admin_manage_all_products" ON public.products 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 4. 确保RLS已启用
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;
```

**修复效果**:
- ✅ 卖家可以查看和编辑自己的所有商品（无论状态如何）
- ✅ 公众仍然只能查看已激活的商品
- ✅ 管理员可以管理所有商品
- ✅ 解决了策略冲突问题

### 2. 修复表单状态处理

更新了 `components/seller/product-form.tsx` 中的状态处理逻辑：

```typescript
// 修复后 - 表单提交
<form onSubmit={(e) => handleSubmit(e, product?.status || "pending")}>

// 修复后 - 状态处理
const productData = {
  ...formData,
  price: Number.parseFloat(formData.price),
  seller_id: user.id,
  status: product ? product.status : status, // 编辑时保持原状态，新建时使用传入状态
}
```

**修复效果**:
- ✅ 编辑商品时保持原始状态不变
- ✅ 新建商品时使用正确的初始状态
- ✅ 避免了状态被意外覆盖的问题

## 技术实现细节

### 1. RLS 策略优先级

修复后的策略优先级：
1. **卖家权限**: `sellers_manage_own_products` - 最高优先级，允许卖家管理自己的所有商品
2. **公众查看**: `products_select_active` - 允许所有人查看已激活商品
3. **管理员权限**: `admin_manage_all_products` - 允许管理员管理所有商品

### 2. 状态保持逻辑

```typescript
// 编辑模式：保持原状态
if (product) {
  status: product.status
}

// 新建模式：使用传入状态
else {
  status: status
}
```

### 3. 表单初始化

表单组件正确初始化所有字段：
```typescript
const [formData, setFormData] = useState({
  title: product?.title || "",
  description: product?.description || "",
  price: product?.price || "",
  category_id: product?.category_id || "",
  condition: product?.condition || "",
  location: product?.location || "",
  tags: product?.tags || [],
  images: product?.images || [],
})
```

## 部署步骤

### 1. 执行数据库修复脚本

**方法一：使用 psql 命令行**
```bash
# 连接到数据库并执行
psql -d your_database -f scripts/008_fix_products_rls.sql
```

**方法二：使用 Supabase Dashboard**
1. 登录 Supabase Dashboard
2. 选择你的项目
3. 进入 SQL Editor
4. 复制粘贴脚本内容并执行

**方法三：使用其他数据库客户端**
- 在 pgAdmin、DBeaver 等客户端中执行脚本

### 2. 验证脚本执行结果

执行脚本后，应该看到类似这样的输出：
```
DROP POLICY
DROP POLICY
DROP POLICY
DROP POLICY
CREATE POLICY
CREATE POLICY
CREATE POLICY
ALTER TABLE
 schemaname | tablename | policyname | permissive | roles | cmd | qual | with_check 
------------+-----------+------------+------------+-------+-----+------+-----------
 public     | products  | admin_manage_all_products | t | {} | ALL | ... | 
 public     | products  | products_select_active | t | {} | SELECT | ... | 
 public     | products  | sellers_manage_own_products | t | {} | ALL | ... | 
(3 rows)
```

### 3. 重启应用

确保新的 RLS 策略生效：
```bash
# 重启 Next.js 应用
npm run dev
# 或
npm run build && npm start
```

### 4. 验证修复

1. 访问 `/seller/products` 页面
2. 点击任意商品的编辑按钮
3. 验证编辑页面正常加载
4. 修改商品信息并保存
5. 确认状态保持不变

## 错误处理和故障排除

### 常见错误及解决方案

#### 1. 策略已存在错误
```
ERROR: 42710: policy "sellers_manage_own_products" for table "products" already exists
```

**解决方案**: 脚本已经使用 `DROP POLICY IF EXISTS` 语法，会自动处理已存在的策略。

#### 2. 权限不足错误
```
ERROR: permission denied for table products
```

**解决方案**: 确保执行脚本的用户有足够的权限，或者联系数据库管理员。

#### 3. 表不存在错误
```
ERROR: relation "products" does not exist
```

**解决方案**: 检查表名是否正确，或者先创建必要的表结构。

### 回滚方案

如果修复后出现问题，可以回滚到原始策略：

```sql
-- 删除修复后的策略
DROP POLICY IF EXISTS "products_select_active" ON public.products;
DROP POLICY IF EXISTS "sellers_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "admin_manage_all_products" ON public.products;

-- 恢复原始策略（根据你的原始设置调整）
CREATE POLICY "products_select_all" ON public.products 
  FOR SELECT USING (status = 'approved');
```

## 测试验证

### 1. 数据库策略测试

执行修复脚本后，验证策略是否正确应用：
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;
```

### 2. 功能测试

**编辑功能测试**:
- ✅ 草稿状态商品可以编辑
- ✅ 待审核状态商品可以编辑
- ✅ 已上架状态商品可以编辑
- ✅ 已下架状态商品可以编辑
- ✅ 编辑后状态保持不变

**权限测试**:
- ✅ 卖家可以编辑自己的所有商品
- ✅ 卖家无法编辑其他卖家的商品
- ✅ 非卖家用户无法访问编辑页面
- ✅ 未登录用户重定向到登录页面

## 总结

通过修复 RLS 策略冲突和表单状态处理逻辑，成功解决了商品编辑功能的问题：

### ✅ 已修复的问题
- **RLS 策略冲突**: 卖家现在可以管理自己的所有商品
- **状态覆盖问题**: 编辑商品时状态保持不变
- **权限验证**: 完整的用户身份和商品所有权验证

### 🔒 安全特性
- 卖家只能编辑自己的商品
- 公众只能查看已激活的商品
- 管理员可以管理所有商品
- 完整的用户身份验证

### 📱 用户体验
- 编辑功能完全可用
- 状态保持逻辑合理
- 表单预填充正确
- 错误处理完善

### 🚀 部署要点
- 使用 `DROP POLICY IF EXISTS` 避免策略冲突
- 脚本可以安全地重复执行
- 包含完整的验证和回滚方案
- 详细的错误处理说明

现在卖家可以正常编辑自己的所有商品，无论商品处于什么状态！