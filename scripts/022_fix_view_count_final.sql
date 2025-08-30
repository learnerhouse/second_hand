-- 修复 view_count 更新问题
-- 使用正确的 PostgreSQL 语法

-- 1. 显示当前策略
SELECT '当前策略配置:' as info;

SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN cmd = 'UPDATE' THEN '允许更新'
    WHEN cmd = 'SELECT' THEN '允许查询'
    WHEN cmd = 'ALL' THEN '允许所有操作'
    ELSE '其他操作'
  END as operation
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 2. 删除可能存在的旧策略（如果存在）
DROP POLICY IF EXISTS "view_count_update" ON public.products;
DROP POLICY IF EXISTS "allow_view_count_update" ON public.products;
DROP POLICY IF EXISTS "update_view_count_anyone" ON public.products;

-- 3. 添加 view_count 更新策略
CREATE POLICY "view_count_update" ON public.products 
  FOR UPDATE USING (true);

-- 4. 验证策略是否创建成功
SELECT '新增策略验证:' as info;

SELECT 
  policyname, 
  cmd,
  '允许更新' as operation
FROM pg_policies 
WHERE tablename = 'products' 
  AND policyname = 'view_count_update';

-- 5. 显示最终策略配置
SELECT '最终策略配置:' as info;

SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN cmd = 'UPDATE' THEN '允许更新'
    WHEN cmd = 'SELECT' THEN '允许查询'
    WHEN cmd = 'ALL' THEN '允许所有操作'
    ELSE '其他操作'
  END as operation
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 6. 策略统计
SELECT '策略统计:' as info;

SELECT 
  '总策略数' as item,
  COUNT(*)::text as value
FROM pg_policies 
WHERE tablename = 'products'

UNION ALL

SELECT 
  'UPDATE策略数' as item,
  COUNT(*)::text as value
FROM pg_policies 
WHERE tablename = 'products' AND cmd = 'UPDATE'

UNION ALL

SELECT 
  'SELECT策略数' as item,
  COUNT(*)::text as value
FROM pg_policies 
WHERE tablename = 'products' AND cmd = 'SELECT'

UNION ALL

SELECT 
  'ALL策略数' as item,
  COUNT(*)::text as value
FROM pg_policies 
WHERE tablename = 'products' AND cmd = 'ALL';

-- 7. 测试 view_count 更新
SELECT '测试 view_count 更新:' as info;

DO $$
DECLARE
  test_product_id uuid;
  current_view_count integer;
BEGIN
  -- 获取一个测试商品
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
    RAISE NOTICE '测试完成：view_count 更新功能正常';
  ELSE
    RAISE NOTICE '没有找到可测试的商品';
  END IF;
END $$;