-- 最简化的 view_count 更新修复
-- 只添加一个基本的 UPDATE 策略

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

-- 2. 添加 view_count 更新策略
CREATE POLICY IF NOT EXISTS "view_count_update" ON public.products 
  FOR UPDATE USING (true);

-- 3. 验证策略是否创建成功
SELECT '新增策略验证:' as info;

SELECT 
  policyname, 
  cmd,
  '允许更新' as operation
FROM pg_policies 
WHERE tablename = 'products' 
  AND policyname = 'view_count_update';

-- 4. 显示最终策略配置
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

-- 5. 策略统计
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