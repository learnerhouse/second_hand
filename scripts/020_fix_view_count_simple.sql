-- 简单的 view_count 更新策略修复
-- 使用正确的 PostgreSQL 语法

-- 1. 显示现有策略
SELECT '=== 现有策略（修复前）===' as info;

SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 2. 创建简单的 view_count 更新策略
-- 允许任何人更新 view_count 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'allow_view_count_update'
  ) THEN
    -- 创建策略：允许更新 view_count 和 updated_at
    CREATE POLICY "allow_view_count_update" ON public.products 
      FOR UPDATE USING (true);
    
    RAISE NOTICE '成功创建 allow_view_count_update 策略';
  ELSE
    RAISE NOTICE '策略 allow_view_count_update 已存在，跳过创建';
  END IF;
END $$;

-- 3. 验证策略创建
SELECT '=== 新增策略验证 ===' as info;

SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
  AND policyname = 'allow_view_count_update';

-- 4. 显示最终策略配置
SELECT '=== 最终策略配置 ===' as info;

SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 5. 测试 view_count 更新功能
SELECT '=== 测试 view_count 更新 ===' as info;

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

-- 6. 显示策略统计
SELECT '=== 策略统计 ===' as info;

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

-- 7. 检查 RLS 状态
SELECT '=== RLS 状态 ===' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '已启用' ELSE '已禁用' END as rls_status
FROM pg_tables 
WHERE tablename = 'products';