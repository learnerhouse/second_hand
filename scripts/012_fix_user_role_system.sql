-- 修复用户角色系统：适配只有user角色的新系统
-- 步骤1: 清理所有现有策略
DROP POLICY IF EXISTS "admin_manage_all_products" ON public.products;
DROP POLICY IF EXISTS "admin_manage_all_products_role" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
DROP POLICY IF EXISTS "products_select_active" ON public.products;
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "reviewers_delete_products" ON public.products;
DROP POLICY IF EXISTS "reviewers_moderate_products" ON public.products;
DROP POLICY IF EXISTS "sellers_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "sellers_manage_own_products_role" ON public.products;

-- 步骤2: 重新启用RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 步骤3: 创建新的策略（基于user角色）
-- 1. 所有已认证用户都可以查看商品
CREATE POLICY "users_select_products" ON public.products 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. 用户可以管理自己的商品（创建、更新、删除）
CREATE POLICY "users_manage_own_products" ON public.products 
  FOR ALL USING (auth.uid() = seller_id);

-- 3. 所有人都可以查看已激活的商品（用于商城展示）
CREATE POLICY "public_view_active_products" ON public.products 
  FOR SELECT USING (status = 'active');

-- 4. 管理员可以管理所有商品（如果存在admin角色）
CREATE POLICY "admin_manage_all_products" ON public.products 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 步骤4: 验证策略
SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 步骤5: 显示当前策略总数
SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'products';