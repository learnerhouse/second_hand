-- 只添加缺失的 view_count 更新策略
-- 这个脚本不会影响现有的策略

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

-- 2. 创建专门的 view_count 更新策略（如果不存在）
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

-- 3. 验证最终策略配置
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

-- 4. 显示当前策略总数
SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'products';

-- 5. 测试 view_count 更新
SELECT '测试 view_count 更新' as info, '' as value;

-- 测试更新（使用事务确保安全）
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
    
    -- 尝试更新 view_count
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
    RAISE NOTICE '测试完成：view_count 更新功能正常';
  ELSE
    RAISE NOTICE '没有找到可测试的商品';
  END IF;
END $$;