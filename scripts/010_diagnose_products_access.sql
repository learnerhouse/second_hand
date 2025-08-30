-- 诊断products表访问权限问题
-- 1. 检查当前用户
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_user_email;

-- 2. 检查products表的RLS状态
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'products';

-- 3. 检查当前所有策略
SELECT 
  policyname, 
  permissive, 
  cmd, 
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 4. 检查用户资料
SELECT 
  id,
  email,
  user_type,
  created_at
FROM public.profiles 
WHERE id = auth.uid();

-- 5. 检查商品数据（如果用户是卖家）
SELECT 
  id,
  title,
  status,
  seller_id,
  created_at
FROM public.products 
WHERE seller_id = auth.uid()
LIMIT 5;

-- 6. 测试权限（模拟卖家查询自己的商品）
-- 注意：这个查询应该返回结果，如果返回空或错误，说明权限有问题
SELECT 
  COUNT(*) as my_products_count
FROM public.products 
WHERE seller_id = auth.uid();

-- 7. 检查是否有其他用户类型的商品
SELECT 
  seller_id,
  COUNT(*) as product_count
FROM public.products 
GROUP BY seller_id 
ORDER BY product_count DESC 
LIMIT 10;