-- 修复现有表结构并添加新功能所需的表
-- 基于现有表结构进行修复和补充

-- ========================================
-- 1. 修复现有表结构
-- ========================================

-- 修复 profiles 表的 role 字段约束
-- 注意：现有表使用 'user', 'reviewer', 'admin'，我们需要扩展为更完整的角色系统
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['user', 'reviewer', 'admin', 'buyer', 'seller', 'moderator', 'guest']));

-- 更新现有用户的角色映射
UPDATE public.profiles 
SET role = CASE 
  WHEN user_type = 'admin' THEN 'admin'
  WHEN user_type = 'seller' THEN 'seller'
  WHEN user_type = 'buyer' THEN 'buyer'
  ELSE 'user'
END
WHERE role IN ('user', 'reviewer');

-- 为 products 表添加缺失的字段（如果不存在）
DO $$
BEGIN
  -- 检查并添加 images 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE public.products ADD COLUMN images text[] DEFAULT '{}';
  END IF;
  
  -- 检查并添加 tags 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.products ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  
  -- 检查并添加 updated_at 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
  
  -- 检查并添加 updated_at 字段到 profiles（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- ========================================
-- 2. 创建角色和权限表
-- ========================================

-- 创建角色表
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建权限表
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建角色权限关联表
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- ========================================
-- 3. 创建系统设置表
-- ========================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  
  -- 基本设置
  site_name TEXT DEFAULT '二手交易平台',
  site_description TEXT DEFAULT '安全可靠的二手商品交易平台',
  site_keywords TEXT DEFAULT '二手,交易,平台,商品',
  site_logo TEXT DEFAULT '',
  site_favicon TEXT DEFAULT '',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  registration_enabled BOOLEAN DEFAULT TRUE,
  
  -- 邮件设置
  smtp_host TEXT DEFAULT '',
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT DEFAULT '',
  smtp_password TEXT DEFAULT '',
  smtp_encryption TEXT DEFAULT 'tls',
  mail_from_name TEXT DEFAULT '二手交易平台',
  mail_from_address TEXT DEFAULT 'noreply@example.com',
  
  -- 支付设置
  payment_gateway TEXT DEFAULT 'stripe',
  stripe_public_key TEXT DEFAULT '',
  stripe_secret_key TEXT DEFAULT '',
  stripe_webhook_secret TEXT DEFAULT '',
  paypal_client_id TEXT DEFAULT '',
  paypal_client_secret TEXT DEFAULT '',
  paypal_mode TEXT DEFAULT 'sandbox',
  
  -- 安全设置
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration INTEGER DEFAULT 15,
  password_min_length INTEGER DEFAULT 8,
  require_email_verification BOOLEAN DEFAULT TRUE,
  require_phone_verification BOOLEAN DEFAULT FALSE,
  two_factor_auth BOOLEAN DEFAULT FALSE,
  
  -- 内容设置
  max_upload_size INTEGER DEFAULT 10,
  allowed_file_types TEXT DEFAULT 'jpg,jpeg,png,gif,pdf,doc,docx',
  auto_approve_products BOOLEAN DEFAULT FALSE,
  max_products_per_user INTEGER DEFAULT 50,
  max_images_per_product INTEGER DEFAULT 10,
  
  -- 通知设置
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  admin_notifications BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. 插入默认角色（兼容现有角色系统）
-- ========================================

INSERT INTO public.roles (name, description, is_system) VALUES
  ('admin', '系统管理员，拥有所有权限', TRUE),
  ('reviewer', '内容审核员，负责内容审核', TRUE),
  ('moderator', '内容审核员，负责内容审核', FALSE),
  ('seller', '卖家，可以发布和管理商品', FALSE),
  ('buyer', '买家，可以浏览和购买商品', FALSE),
  ('user', '普通用户，基本权限', FALSE),
  ('guest', '访客，只能浏览公开内容', FALSE)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 5. 插入默认权限
-- ========================================

INSERT INTO public.permissions (name, description, resource, action) VALUES
  -- 用户管理权限
  ('用户查看', '查看用户信息', 'users', 'read'),
  ('用户创建', '创建新用户', 'users', 'create'),
  ('用户编辑', '编辑用户信息', 'users', 'update'),
  ('用户删除', '删除用户', 'users', 'delete'),
  
  -- 商品管理权限
  ('商品查看', '查看商品信息', 'products', 'read'),
  ('商品创建', '创建新商品', 'products', 'create'),
  ('商品编辑', '编辑商品信息', 'products', 'update'),
  ('商品删除', '删除商品', 'products', 'delete'),
  ('商品审核', '审核商品', 'products', 'approve'),
  
  -- 分类管理权限
  ('分类查看', '查看分类信息', 'categories', 'read'),
  ('分类创建', '创建新分类', 'categories', 'create'),
  ('分类编辑', '编辑分类信息', 'categories', 'update'),
  ('分类删除', '删除分类', 'categories', 'delete'),
  
  -- 订单管理权限
  ('订单查看', '查看订单信息', 'orders', 'read'),
  ('订单创建', '创建新订单', 'orders', 'create'),
  ('订单编辑', '编辑订单信息', 'orders', 'update'),
  ('订单删除', '删除订单', 'orders', 'delete'),
  
  -- 消息管理权限
  ('消息查看', '查看消息', 'messages', 'read'),
  ('消息发送', '发送消息', 'messages', 'create'),
  ('消息编辑', '编辑消息', 'messages', 'update'),
  ('消息删除', '删除消息', 'messages', 'delete'),
  
  -- 收藏管理权限
  ('收藏查看', '查看收藏', 'favorites', 'read'),
  ('收藏添加', '添加收藏', 'favorites', 'create'),
  ('收藏删除', '删除收藏', 'favorites', 'delete'),
  
  -- 系统管理权限
  ('系统设置查看', '查看系统设置', 'settings', 'read'),
  ('系统设置编辑', '编辑系统设置', 'settings', 'update'),
  ('角色管理', '管理角色', 'roles', 'manage'),
  ('权限管理', '管理权限', 'permissions', 'manage'),
  ('日志查看', '查看系统日志', 'logs', 'read')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 6. 为默认角色分配权限
-- ========================================

-- 管理员拥有所有权限
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'admin'),
  id
FROM public.permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 审核员拥有内容审核相关权限
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'reviewer'),
  id
FROM public.permissions 
WHERE name IN ('商品查看', '商品审核', '分类查看', '用户查看')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 卖家拥有商品管理相关权限
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'seller'),
  id
FROM public.permissions 
WHERE name IN ('商品查看', '商品创建', '商品编辑', '商品删除', '分类查看', '订单查看', '消息查看', '消息发送', '收藏查看', '收藏添加', '收藏删除')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 买家拥有基本浏览和购买权限
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'buyer'),
  id
FROM public.permissions 
WHERE name IN ('商品查看', '分类查看', '订单查看', '订单创建', '消息查看', '消息发送', '收藏查看', '收藏添加', '收藏删除')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 普通用户拥有基本权限
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'user'),
  id
FROM public.permissions 
WHERE name IN ('商品查看', '分类查看', '收藏查看', '收藏添加', '收藏删除')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 访客只有查看权限
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'guest'),
  id
FROM public.permissions 
WHERE name IN ('商品查看', '分类查看')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ========================================
-- 7. 插入默认系统设置
-- ========================================

INSERT INTO public.system_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 8. 创建更新时间触发器函数（如果不存在）
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- 9. 为现有表添加更新时间触发器
-- ========================================

-- 为 products 表添加更新时间触发器
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为 profiles 表添加更新时间触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为 orders 表添加更新时间触发器
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为新表添加更新时间触发器
CREATE TRIGGER update_roles_updated_at 
  BEFORE UPDATE ON public.roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at 
  BEFORE UPDATE ON public.permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON public.system_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 10. 启用 RLS 并创建策略
-- ========================================

-- 启用 RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 为现有表启用 RLS（如果尚未启用）
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 11. 创建权限检查函数
-- ========================================

-- 创建检查用户是否有特定权限的函数
CREATE OR REPLACE FUNCTION public.has_permission(
  user_id UUID,
  resource_name TEXT,
  action_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  has_perm BOOLEAN := FALSE;
BEGIN
  -- 获取用户角色
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 检查用户角色是否有指定权限
  SELECT EXISTS(
    SELECT 1 FROM public.role_permissions rp
    JOIN public.roles r ON r.id = rp.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE r.name = user_role 
      AND p.resource = resource_name 
      AND p.action = action_name
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$;

-- 创建检查用户是否有角色权限的函数
CREATE OR REPLACE FUNCTION public.has_role_permission(
  user_id UUID,
  permission_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  has_perm BOOLEAN := FALSE;
BEGIN
  -- 获取用户角色
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 检查用户角色是否有指定权限
  SELECT EXISTS(
    SELECT 1 FROM public.role_permissions rp
    JOIN public.roles r ON r.id = rp.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE r.name = user_role AND p.name = permission_name
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$;

-- ========================================
-- 12. 创建 RLS 策略
-- ========================================

-- 角色表策略
CREATE POLICY "roles_select_all" ON public.roles 
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_manage_roles" ON public.roles 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
    )
  );

-- 权限表策略
CREATE POLICY "permissions_select_all" ON public.permissions 
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_manage_permissions" ON public.permissions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
    )
  );

-- 角色权限关联表策略
CREATE POLICY "role_permissions_select_all" ON public.role_permissions 
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_manage_role_permissions" ON public.role_permissions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
    )
  );

-- 系统设置表策略
CREATE POLICY "system_settings_select_all" ON public.system_settings 
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_edit_system_settings" ON public.system_settings 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
    )
  );

CREATE POLICY "admin_insert_system_settings" ON public.system_settings 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
    )
  );

-- ========================================
-- 13. 验证和清理
-- ========================================

-- 验证表结构
SELECT 'Tables created/updated successfully!' as status;

-- 显示所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 显示角色和权限
SELECT 'Roles:' as info;
SELECT name, description, is_system FROM roles ORDER BY name;

SELECT 'Permissions:' as info;
SELECT name, resource, action FROM permissions ORDER BY resource, action;

-- 数据库修复完成
SELECT 'Database structure fixed and enhanced successfully!' as status;