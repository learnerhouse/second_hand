-- 添加表检查脚本来验证数据库状态
-- 检查所有必要的表是否存在
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'categories', 'products', 'messages', 'orders')
ORDER BY tablename;

-- 如果表不存在，显示创建表的建议
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'categories', 'products', 'messages', 'orders');
  
  IF table_count < 5 THEN
    RAISE NOTICE '数据库表不完整，当前只有 % 个表。请按顺序运行以下脚本：', table_count;
    RAISE NOTICE '1. scripts/001_create_users_profiles.sql';
    RAISE NOTICE '2. scripts/002_create_categories.sql';
    RAISE NOTICE '3. scripts/003_create_products.sql';
    RAISE NOTICE '4. scripts/004_create_messages.sql';
    RAISE NOTICE '5. scripts/005_create_orders.sql';
    RAISE NOTICE '6. scripts/006_create_triggers.sql';
  ELSE
    RAISE NOTICE '所有必要的表都已创建完成！';
  END IF;
END $$;
