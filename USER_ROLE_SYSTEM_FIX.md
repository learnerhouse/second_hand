# 用户角色系统修复

## 问题描述

用户报告编辑商品时会跳转到首页，经过分析发现是用户角色系统变更导致的问题。

**原始系统**: 区分 `buyer`、`seller`、`admin` 等角色
**新系统**: 只有 `user` 角色，不再区分买家卖家

## 问题分析

### 1. 代码中的角色检查
编辑页面、商品列表页面、新建商品页面都有类似的角色检查：
```typescript
// 修复前
if (!profile || profile.user_type !== "seller") {
  redirect("/marketplace")
}
```

### 2. 数据库策略问题
RLS 策略仍然基于旧的 `seller` 角色系统，导致权限验证失败。

### 3. 跳转原因
- 用户角色检查失败 → 跳转到 `/marketplace`
- 商品查询权限失败 → 跳转到 `/seller/products`
- 最终导致用户被重定向到首页

## 修复方案

### 1. 数据库策略修复

执行 `scripts/012_fix_user_role_system.sql` 脚本：

```sql
-- 清理所有现有策略
DROP POLICY IF EXISTS "sellers_manage_own_products" ON public.products;
-- ... 其他策略

-- 创建新的策略（基于user角色）
-- 1. 所有已认证用户都可以查看商品
CREATE POLICY "users_select_products" ON public.products 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. 用户可以管理自己的商品
CREATE POLICY "users_manage_own_products" ON public.products 
  FOR ALL USING (auth.uid() = seller_id);

-- 3. 所有人都可以查看已激活的商品
CREATE POLICY "public_view_active_products" ON public.products 
  FOR SELECT USING (status = 'active');
```

### 2. 代码逻辑修复

#### **编辑页面** (`app/seller/products/[id]/edit/page.tsx`)
```typescript
// 修复前
if (profile.user_type !== "seller") {
  redirect("/marketplace")
}

// 修复后
// 检查用户是否有权限编辑商品（现在所有user角色都可以）
if (!profile) {
  redirect("/marketplace")
}
```

#### **商品列表页面** (`app/seller/products/page.tsx`)
```typescript
// 修复前
if (!profile || (profile.user_type !== "seller" && profile.user_type !== "admin")) {
  redirect("/marketplace")
}

// 修复后
if (!profile) {
  redirect("/marketplace")
}
// 现在所有user角色都可以管理商品
```

#### **新建商品页面** (`app/seller/products/new/page.tsx`)
```typescript
// 修复前
if (!profile || (profile.user_type !== "seller" && profile.user_type !== "admin")) {
  redirect("/marketplace")
}

// 修复后
if (!profile) {
  redirect("/marketplace")
}
// 现在所有user角色都可以发布商品
```

## 部署步骤

### 1. 执行数据库修复脚本
```bash
# 连接到数据库并执行
psql -d your_database -f scripts/012_fix_user_role_system.sql
```

### 2. 重启应用
```bash
npm run dev
# 或
npm run build && npm start
```

### 3. 验证修复
1. 访问 `/seller/products` 页面
2. 点击任意商品的编辑按钮
3. 验证编辑页面正常加载，不再跳转
4. 修改商品信息并保存

## 新权限系统说明

### 权限结构
```
用户角色: user
├── 查看商品: 所有已认证用户
├── 管理自己的商品: 创建、编辑、删除
├── 查看已激活商品: 所有人（包括未登录）
└── 管理员权限: 如果存在admin角色
```

### 安全特性
- ✅ 用户只能管理自己的商品
- ✅ 基于 `auth.uid() = seller_id` 的数据隔离
- ✅ 完整的用户身份验证
- ✅ 简化的角色管理

## 测试验证

### 功能测试
- ✅ 用户登录后可以访问商品管理页面
- ✅ 用户可以编辑自己的商品
- ✅ 用户可以创建新商品
- ✅ 编辑页面不再跳转

### 权限测试
- ✅ 用户无法编辑其他用户的商品
- ✅ 未登录用户无法访问管理页面
- ✅ 数据隔离正常工作

## 总结

通过修复用户角色系统和数据库策略，成功解决了编辑商品跳转的问题：

### ✅ 已修复的问题
- **角色检查失败**: 移除了 `seller` 角色限制
- **权限验证失败**: 更新了数据库RLS策略
- **页面跳转问题**: 编辑页面现在可以正常访问

### 🔒 新的安全模型
- 简化的用户角色系统
- 基于用户ID的数据隔离
- 完整的身份验证
- 清晰的权限层次

### 📱 用户体验
- 编辑功能完全可用
- 不再有意外跳转
- 简化的权限管理
- 一致的用户界面

现在所有 `user` 角色的用户都可以正常管理自己的商品，编辑页面不再跳转！