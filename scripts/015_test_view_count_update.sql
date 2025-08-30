-- 测试商品浏览次数更新功能
-- 这个脚本用于诊断view_count更新问题

-- 1. 检查当前products表的RLS策略
SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 2. 检查RLS是否启用
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'products';

-- 3. 检查当前用户权限
SELECT 
  current_user,
  session_user,
  current_setting('role'),
  current_setting('app.current_user_id');

-- 4. 测试直接更新view_count（模拟客户端操作）
-- 注意：这需要在有适当权限的上下文中执行
DO $$
DECLARE
  test_product_id uuid;
  current_view_count integer;
  new_view_count integer;
BEGIN
  -- 获取一个测试商品
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
    SELECT view_count INTO new_view_count FROM products WHERE id = test_product_id;
    RAISE NOTICE '更新后浏览次数: %', new_view_count;
    
    -- 恢复原值
    UPDATE products 
    SET view_count = current_view_count, updated_at = NOW()
    WHERE id = test_product_id;
    
    RAISE NOTICE '已恢复原浏览次数: %', current_view_count;
  ELSE
    RAISE NOTICE '没有找到可测试的商品';
  END IF;
END $$;

-- 5. 检查是否有阻止更新的触发器
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'products';

-- 6. 检查表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('view_count', 'updated_at')
ORDER BY ordinal_position;

-- 7. 显示当前策略总数
SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'products';