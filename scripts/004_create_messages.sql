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
