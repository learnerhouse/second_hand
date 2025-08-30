-- 完整修复products表访问权限问题
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

-- 步骤2: 临时禁用RLS以便调试
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 步骤3: 检查表结构和数据
-- 查看products表结构
\d products;

-- 查看是否有数据
SELECT COUNT(*) as total_products FROM public.products;

-- 查看用户类型分布
SELECT 
  p.user_type,
  COUNT(*) as user_count
FROM public.profiles p
GROUP BY p.user_type;

-- 查看商品状态分布
SELECT 
  status,
  COUNT(*) as product_count
FROM public.products
GROUP BY status;

-- 步骤4: 重新启用RLS并创建正确的策略
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 创建基础策略：允许所有已认证用户查看商品
CREATE POLICY "authenticated_users_select_products" ON public.products 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 创建卖家策略：卖家可以管理自己的所有商品
CREATE POLICY "sellers_manage_own_products" ON public.products 
  FOR ALL USING (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'seller'
    )
  );

-- 创建管理员策略：管理员可以管理所有商品
CREATE POLICY "admin_manage_all_products" ON public.products 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 创建公共查看策略：所有人都可以查看已激活的商品
CREATE POLICY "public_view_active_products" ON public.products 
  FOR SELECT USING (status = 'active');

-- 步骤5: 验证策略
SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 步骤6: 测试权限
-- 测试卖家查询自己的商品（应该返回结果）
-- 注意：这个查询需要在卖家用户会话中执行
SELECT 
  'Testing seller access to own products' as test_description,
  COUNT(*) as accessible_products
FROM public.products 
WHERE seller_id = auth.uid();

-- 显示当前策略总数
SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'products';