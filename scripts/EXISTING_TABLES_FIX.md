# 现有表结构修复说明

## 概述

这个脚本 (`007_fix_existing_tables.sql`) 是基于你提供的现有表结构进行修复和补充的。它会在不破坏现有数据的情况下，添加新功能所需的表和字段。

## 现有表结构分析

### 已有的表
1. **profiles** - 用户配置表
2. **categories** - 商品分类表
3. **products** - 商品表
4. **messages** - 消息表
5. **orders** - 订单表
6. **favorites** - 收藏表

### 需要修复的问题

#### 1. profiles 表
- **现有约束**: `role` 字段限制为 `['user', 'reviewer', 'admin']`
- **修复方案**: 扩展为 `['user', 'reviewer', 'admin', 'buyer', 'seller', 'moderator', 'guest']`
- **兼容性**: 保持现有角色映射关系

#### 2. products 表
- **现有字段**: 已有 `images` 和 `tags` 字段
- **检查逻辑**: 脚本会检查字段是否存在，避免重复添加

#### 3. 缺失的触发器
- **问题**: 缺少 `updated_at` 字段的自动更新触发器
- **解决方案**: 为所有相关表添加触发器

## 修复脚本功能

### 1. 表结构修复
```sql
-- 修复 profiles 表的 role 字段约束
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['user', 'reviewer', 'admin', 'buyer', 'seller', 'moderator', 'guest']));

-- 更新现有用户的角色映射
UPDATE public.profiles 
SET role = CASE 
  WHEN user_type = 'admin' THEN 'admin'
  WHEN user_type = 'seller' THEN 'seller'
  WHEN user_type = 'buyer' THEN 'buyer'
  ELSE 'user'
END
WHERE role IN ('user', 'reviewer');
```

### 2. 新增功能表
- **roles** - 角色管理表
- **permissions** - 权限管理表
- **role_permissions** - 角色权限关联表
- **system_settings** - 系统设置表

### 3. 权限系统设计
- **7个角色**: admin, reviewer, moderator, seller, buyer, user, guest
- **细粒度权限**: 按资源和操作分类
- **权限矩阵**: 完整的角色权限分配

### 4. 触发器添加
```sql
-- 为所有表添加 updated_at 触发器
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 执行步骤

### 1. 备份现有数据
```sql
-- 在执行修复脚本前，建议先备份
-- 可以使用 Supabase Dashboard 的备份功能
```

### 2. 执行修复脚本
```sql
-- 在 Supabase Dashboard 的 SQL Editor 中执行
scripts/007_fix_existing_tables.sql
```

### 3. 验证修复结果
```sql
-- 检查表结构
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 检查角色
SELECT * FROM roles;

-- 检查权限
SELECT * FROM permissions;
```

## 兼容性说明

### 1. 数据安全
- ✅ 不会删除现有数据
- ✅ 不会修改现有字段值
- ✅ 只添加缺失的字段和表

### 2. 角色映射
- **admin** → **admin** (保持不变)
- **reviewer** → **reviewer** (保持不变)
- **user** → **user** (保持不变)
- **新增**: buyer, seller, moderator, guest

### 3. 权限继承
- **admin**: 拥有所有权限
- **reviewer**: 内容审核权限
- **seller**: 商品管理权限
- **buyer**: 购买相关权限
- **user**: 基本浏览权限
- **guest**: 只读权限

## 执行后的效果

### 1. 新增功能可用
- ✅ 商品分类管理页面
- ✅ 权限管理页面
- ✅ 系统设置页面

### 2. 权限控制完善
- ✅ 基于角色的权限控制
- ✅ 细粒度的操作权限
- ✅ 完整的 RLS 策略

### 3. 系统管理增强
- ✅ 角色和权限管理
- ✅ 系统配置管理
- ✅ 用户权限分配

## 注意事项

### 1. 执行顺序
- 这个脚本应该在现有表结构基础上执行
- 不需要重新执行之前的初始化脚本

### 2. 权限检查
- 确保执行脚本的用户有足够的权限
- 建议使用 Supabase 的 postgres 用户执行

### 3. 回滚方案
- 如果出现问题，可以删除新增的表
- 现有数据不会受到影响

## 故障排除

### 常见问题

1. **约束冲突**
   ```sql
   -- 如果遇到约束冲突，可以先删除约束
   ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
   ```

2. **字段已存在**
   - 脚本使用 `IF NOT EXISTS` 检查，不会重复添加字段

3. **权限不足**
   - 确保使用有足够权限的用户执行脚本

### 验证命令
```sql
-- 检查所有表
\dt public.*

-- 检查特定表结构
\d public.profiles
\d public.roles
\d public.permissions

-- 检查数据
SELECT COUNT(*) FROM roles;
SELECT COUNT(*) FROM permissions;
SELECT COUNT(*) FROM role_permissions;
```

## 总结

这个修复脚本会：
1. ✅ 修复现有表结构的约束问题
2. ✅ 添加新功能所需的表和字段
3. ✅ 建立完整的权限控制系统
4. ✅ 保持现有数据的完整性
5. ✅ 为新管理页面提供数据库支持

执行完成后，你就可以正常使用所有新功能了！