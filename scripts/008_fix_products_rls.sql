-- 修复products表的RLS策略，确保卖家可以管理自己的所有商品
-- 删除有问题的策略
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "products_select_active" ON public.products;

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