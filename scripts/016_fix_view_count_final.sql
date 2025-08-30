-- 最终修复商品浏览次数更新问题
-- 这个脚本确保view_count可以正常更新

-- 1. 清理所有可能阻止view_count更新的策略
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "sellers_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "users_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "update_view_count" ON public.products;
DROP POLICY IF EXISTS "products_select_active" ON public.products;
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "admin_manage_all_products" ON public.products;

-- 2. 重新创建基础策略
-- 允许所有已认证用户查看商品
CREATE POLICY "users_select_products" ON public.products 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 允许所有用户查看已激活的商品（公开访问）
CREATE POLICY "public_view_active_products" ON public.products 
  FOR SELECT USING (status = 'active');

-- 3. 创建专门的view_count更新策略
-- 允许任何人更新view_count字段（用于统计）
CREATE POLICY "update_view_count_anyone" ON public.products 
  FOR UPDATE USING (true)
  WITH CHECK (
    -- 只允许更新view_count和updated_at字段
    (SELECT COUNT(*) FROM jsonb_object_keys(to_jsonb(NEW)) WHERE value NOT IN ('view_count', 'updated_at')) = 0
  );

-- 4. 创建用户管理自己商品的策略
CREATE POLICY "users_manage_own_products" ON public.products 
  FOR ALL USING (auth.uid() = seller_id);

-- 5. 创建管理员管理所有商品的策略（如果存在admin角色）
CREATE POLICY "admin_manage_all_products" ON public.products 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 6. 确保RLS已启用
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 7. 验证策略
SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 8. 显示当前策略总数
SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'products';

-- 9. 测试view_count更新（在事务中执行，然后回滚）
BEGIN;

-- 获取一个测试商品
DO $$
DECLARE
  test_product_id uuid;
  current_view_count integer;
BEGIN
  SELECT id, view_count INTO test_product_id, current_view_count 
  FROM products 
  WHERE status = 'active' 
  LIMIT 1;
  
  IF test_product_id IS NOT NULL THEN
    RAISE NOTICE '测试商品ID: %, 当前浏览次数: %', test_product_id, current_view_count;
    
    -- 尝试更新view_count
    UPDATE products 
    SET view_count = view_count + 1, updated_at = NOW()
    WHERE id = test_product_id;
    
    -- 检查更新结果
    SELECT view_count INTO current_view_count FROM products WHERE id = test_product_id;
    RAISE NOTICE '更新后浏览次数: %', current_view_count;
  ELSE
    RAISE NOTICE '没有找到可测试的商品';
  END IF;
END $$;

-- 回滚测试更新
ROLLBACK;

-- 10. 显示最终状态
SELECT 
  'RLS Status' as info,
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as value
FROM pg_tables 
WHERE tablename = 'products'

UNION ALL

SELECT 
  'Total Policies' as info,
  COUNT(*)::text as value
FROM pg_policies 
WHERE tablename = 'products';