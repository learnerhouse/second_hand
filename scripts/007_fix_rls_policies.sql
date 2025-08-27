-- 修复profiles表的RLS策略，解决无限递归问题
-- 删除有问题的管理员策略，避免无限递归
DROP POLICY IF EXISTS "admin_select_all_profiles" ON public.profiles;

-- 创建新的管理员策略，使用auth.jwt()来避免递归
CREATE POLICY "admin_select_all_profiles" ON public.profiles 
  FOR SELECT USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'user_type' = 'admin'
    OR auth.uid() = id
  );

-- 允许所有用户查看其他用户的基本信息（用于商品展示）
CREATE POLICY "profiles_select_public_info" ON public.profiles 
  FOR SELECT USING (true);

-- 更新其他表的RLS策略，确保它们不依赖profiles表查询
-- 产品表策略
DROP POLICY IF EXISTS "products_select_all" ON public.products;
CREATE POLICY "products_select_all" ON public.products 
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "products_insert_own" ON public.products;
CREATE POLICY "products_insert_own" ON public.products 
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own" ON public.products 
  FOR UPDATE USING (auth.uid() = seller_id);

-- 分类表策略
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all" ON public.categories 
  FOR SELECT USING (is_active = true);

-- 消息表策略
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
CREATE POLICY "messages_select_own" ON public.messages 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own" ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 订单表策略
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own" ON public.orders 
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "orders_insert_buyer" ON public.orders;
CREATE POLICY "orders_insert_buyer" ON public.orders 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
