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
