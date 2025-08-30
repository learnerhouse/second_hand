-- 修复商品浏览次数统计的RLS策略问题
-- 允许更新view_count字段，即使不是商品所有者

-- 1. 删除可能阻止view_count更新的策略
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "sellers_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "users_manage_own_products" ON public.products;

-- 2. 重新创建策略，允许view_count更新
-- 用户管理自己的商品（除了view_count）
CREATE POLICY "users_manage_own_products" ON public.products 
  FOR ALL USING (auth.uid() = seller_id);

-- 允许更新view_count（用于统计）
CREATE POLICY "update_view_count" ON public.products 
  FOR UPDATE USING (true)
  WITH CHECK (
    -- 只允许更新view_count字段
    (SELECT COUNT(*) FROM jsonb_object_keys(to_jsonb(NEW)) WHERE value NOT IN ('view_count', 'updated_at')) = 0
    OR
    -- 或者用户是商品所有者
    auth.uid() = seller_id
  );

-- 3. 验证策略
SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 4. 显示当前策略总数
SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'products';