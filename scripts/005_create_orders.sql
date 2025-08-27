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
