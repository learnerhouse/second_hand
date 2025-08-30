-- 诊断 view_count 更新问题
-- 这个脚本帮助找出为什么 view_count 无法更新

-- 1. 检查现有策略的详细配置
SELECT '=== 现有策略详细配置 ===' as info;

SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check,
  CASE 
    WHEN cmd = 'UPDATE' THEN '允许更新'
    WHEN cmd = 'SELECT' THEN '允许查询'
    WHEN cmd = 'ALL' THEN '允许所有操作'
    ELSE '其他操作'
  END as operation_type
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 2. 检查 RLS 状态
SELECT '=== RLS 状态 ===' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '已启用' ELSE '已禁用' END as rls_status
FROM pg_tables 
WHERE tablename = 'products';

-- 3. 检查表结构和约束
SELECT '=== 表结构检查 ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name = 'view_count' THEN '这是我们要更新的字段'
    WHEN column_name = 'updated_at' THEN '这是时间戳字段'
    ELSE '其他字段'
  END as note
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('view_count', 'updated_at', 'id', 'seller_id', 'status')
ORDER BY ordinal_position;

-- 4. 检查是否有触发器
SELECT '=== 触发器检查 ===' as info;

SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  CASE 
    WHEN event_manipulation = 'UPDATE' THEN '可能影响更新操作'
    ELSE '不影响更新'
  END as impact
FROM information_schema.triggers 
WHERE event_object_table = 'products';

-- 5. 检查是否有外键约束
SELECT '=== 外键约束检查 ===' as info;

SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'products';

-- 6. 测试具体的 view_count 更新操作
SELECT '=== 测试 view_count 更新 ===' as info;

-- 获取测试商品信息
DO $$
DECLARE
  test_product_id uuid;
  current_view_count integer;
  test_user_id uuid;
BEGIN
  -- 获取一个测试商品
  SELECT id, view_count INTO test_product_id, current_view_count 
  FROM products 
  WHERE status = 'active' 
  LIMIT 1;
  
  -- 获取一个测试用户ID
  SELECT id INTO test_user_id 
  FROM profiles 
  LIMIT 1;
  
  IF test_product_id IS NOT NULL THEN
    RAISE NOTICE '测试商品ID: %, 当前浏览次数: %', test_product_id, current_view_count;
    RAISE NOTICE '测试用户ID: %', test_user_id;
    
    -- 模拟客户端更新操作
    BEGIN
      -- 设置当前用户上下文（模拟认证）
      PERFORM set_config('request.jwt.claim.sub', test_user_id::text, false);
      
      -- 尝试更新 view_count
      UPDATE products 
      SET view_count = view_count + 1, updated_at = NOW()
      WHERE id = test_product_id;
      
      RAISE NOTICE '更新操作执行成功';
      
      -- 检查更新结果
      SELECT view_count INTO current_view_count FROM products WHERE id = test_product_id;
      RAISE NOTICE '更新后浏览次数: %', current_view_count;
      
      -- 恢复原值
      UPDATE products 
      SET view_count = current_view_count - 1, updated_at = NOW()
      WHERE id = test_product_id;
      
      RAISE NOTICE '已恢复原浏览次数: %', current_view_count - 1;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '更新操作失败: %', SQLERRM;
      RAISE NOTICE '错误代码: %', SQLSTATE;
    END;
    
  ELSE
    RAISE NOTICE '没有找到可测试的商品';
  END IF;
END $$;

-- 7. 检查权限和角色
SELECT '=== 权限和角色检查 ===' as info;

SELECT 
  current_user,
  session_user,
  current_setting('role'),
  current_setting('request.jwt.claim.sub') as jwt_user_id;

-- 8. 显示诊断总结
SELECT '=== 诊断总结 ===' as info;

SELECT 
  '策略总数' as item,
  COUNT(*)::text as value
FROM pg_policies 
WHERE tablename = 'products'

UNION ALL

SELECT 
  'RLS状态' as item,
  CASE WHEN rowsecurity THEN '已启用' ELSE '已禁用' END as value
FROM pg_tables 
WHERE tablename = 'products'

UNION ALL

SELECT 
  '触发器数量' as item,
  COUNT(*)::text as value
FROM information_schema.triggers 
WHERE event_object_table = 'products'

UNION ALL

SELECT 
  '外键约束数量' as item,
  COUNT(*)::text as value
FROM information_schema.table_constraints 
WHERE table_name = 'products' AND constraint_type = 'FOREIGN KEY';