-- 修复商品浏览次数更新问题
-- 这个脚本只添加缺失的 view_count 更新策略，不重复创建已存在的策略

-- 1. 检查现有策略
SELECT '现有策略检查' as info, '' as value;

SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 2. 只删除可能阻止 view_count 更新的策略（如果存在）
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "sellers_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "update_view_count" ON public.products;
DROP POLICY IF EXISTS "products_select_active" ON public.products;
DROP POLICY IF EXISTS "products_select_all" ON public.products;

-- 3. 创建专门的 view_count 更新策略（如果不存在）
-- 允许任何人更新 view_count 字段（用于统计）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'update_view_count_anyone'
  ) THEN
    CREATE POLICY "update_view_count_anyone" ON public.products 
      FOR UPDATE USING (true)
      WITH CHECK (
        -- 只允许更新 view_count 和 updated_at 字段
        (SELECT COUNT(*) FROM jsonb_object_keys(to_jsonb(NEW)) WHERE value NOT IN ('view_count', 'updated_at')) = 0
      );
    RAISE NOTICE '成功创建 update_view_count_anyone 策略';
  ELSE
    RAISE NOTICE '策略 update_view_count_anyone 已存在，跳过创建';
  END IF;
END $$;

-- 4. 确保 RLS 已启用
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. 验证最终策略配置
SELECT '最终策略配置' as info, '' as value;

SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 6. 显示当前策略总数
SELECT '策略统计' as info, '' as value;

SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'products';

-- 7. 测试 view_count 更新（在事务中执行，然后回滚）
SELECT '测试 view_count 更新' as info, '' as value;

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
    
    -- 尝试更新 view_count
    UPDATE products 
    SET view_count = view_count + 1, updated_at = NOW()
    WHERE id = test_product_id;
    
    -- 检查更新结果
    SELECT view_count INTO current_view_count FROM products WHERE id = test_product_id;
    RAISE NOTICE '更新后浏览次数: %', current_view_count;
    
    -- 恢复原值
    UPDATE products 
    SET view_count = current_view_count - 1, updated_at = NOW()
    WHERE id = test_product_id;
    
    RAISE NOTICE '已恢复原浏览次数: %', current_view_count - 1;
  ELSE
    RAISE NOTICE '没有找到可测试的商品';
  END IF;
END $$;

-- 回滚测试更新
ROLLBACK;

-- 8. 显示最终状态
SELECT '最终状态' as info, '' as value;

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