-- 二手交易平台完整数据库初始化脚本
-- 请按顺序执行此脚本来创建所有必要的表和功能

-- ========================================
-- 1. 创建用户配置表
-- ========================================

-- 创建用户配置表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  user_type TEXT NOT NULL DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'seller', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS策略
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles 
  FOR DELETE USING (auth.uid() = id);

-- 管理员可以查看所有用户资料
CREATE POLICY "admin_select_all_profiles" ON public.profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 自动创建用户配置的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 2. 创建商品分类表
-- ========================================

-- 创建商品分类表
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看分类
CREATE POLICY "categories_select_all" ON public.categories 
  FOR SELECT USING (is_active = TRUE);

-- 只有管理员可以管理分类
CREATE POLICY "admin_manage_categories" ON public.categories 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 插入默认分类
INSERT INTO public.categories (name, description, icon) VALUES
  ('二手物品', '各类二手商品', '📦'),
  ('技能服务', '各种技能和服务', '🛠️'),
  ('手工艺品', '手工制作的艺术品', '🎨')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 3. 创建商品表
-- ========================================

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建商品表
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  images TEXT[] DEFAULT '{}',
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  location TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'sold', 'inactive', 'rejected')),
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看已激活的商品
CREATE POLICY "products_select_active" ON public.products 
  FOR SELECT USING (status = 'active');

-- 卖家可以管理自己的商品
CREATE POLICY "sellers_manage_own_products" ON public.products 
  FOR ALL USING (auth.uid() = seller_id);

-- 管理员可以管理所有商品
CREATE POLICY "admin_manage_all_products" ON public.products 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 创建更新时间触发器
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. 创建消息表
-- ========================================

-- 创建消息表
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己发送或接收的消息
CREATE POLICY "messages_select_own" ON public.messages 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 用户只能发送消息给商品的卖家
CREATE POLICY "messages_insert_to_seller" ON public.messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE id = product_id AND seller_id = receiver_id
    )
  );

-- 用户可以更新自己接收的消息（标记为已读）
CREATE POLICY "messages_update_received" ON public.messages 
  FOR UPDATE USING (auth.uid() = receiver_id);

-- 管理员可以查看所有消息
CREATE POLICY "admin_select_all_messages" ON public.messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- ========================================
-- 5. 创建订单表
-- ========================================

-- 创建订单表
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded')),
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 买家和卖家可以查看自己相关的订单
CREATE POLICY "orders_select_own" ON public.orders 
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 买家可以创建订单
CREATE POLICY "buyers_create_orders" ON public.orders 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- 买家和卖家可以更新订单状态
CREATE POLICY "orders_update_participants" ON public.orders 
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 管理员可以管理所有订单
CREATE POLICY "admin_manage_all_orders" ON public.orders 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 创建更新时间触发器
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. 为profiles表添加更新时间触发器
-- ========================================

-- 为profiles表添加更新时间触发器
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. 插入示例数据（可选）
-- ========================================

-- 插入一些示例商品数据（需要先有用户注册）
-- 这部分数据会在用户注册后自动可用

-- 数据库初始化完成
SELECT 'Database initialization completed successfully!' as status;
