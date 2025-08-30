-- 清理products表的所有RLS策略，解决权限冲突问题
-- 删除所有现有策略
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

-- 重新创建正确的策略，按优先级排序
-- 1. 卖家可以管理自己的所有商品（最高优先级）
CREATE POLICY "sellers_manage_own_products" ON public.products 
  FOR ALL USING (auth.uid() = seller_id);

-- 2. 管理员可以管理所有商品
CREATE POLICY "admin_manage_all_products" ON public.products 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 3. 所有人都可以查看已激活的商品（用于商城展示）
CREATE POLICY "products_select_active" ON public.products 
  FOR SELECT USING (status = 'active');

-- 4. 审核员可以审核商品（如果需要的话）
CREATE POLICY "reviewers_moderate_products" ON public.products 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'reviewer'
    )
  );

-- 确保RLS已启用
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 验证策略
SELECT 
  policyname, 
  permissive, 
  cmd, 
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'WITH CHECK: ' || with_check::text
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY 
  CASE 
    WHEN cmd = 'ALL' THEN 1
    WHEN cmd = 'UPDATE' THEN 2
    WHEN cmd = 'SELECT' THEN 3
    ELSE 4
  END,
  policyname;

-- 显示策略总数
SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'products';