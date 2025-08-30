-- 创建角色和权限相关的表
-- 请按顺序执行此脚本

-- ========================================
-- 1. 创建角色表
-- ========================================

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看角色
CREATE POLICY "roles_select_all" ON public.roles 
  FOR SELECT USING (TRUE);

-- 只有管理员可以管理角色
CREATE POLICY "admin_manage_roles" ON public.roles 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 插入默认角色
INSERT INTO public.roles (name, description, is_system) VALUES
  ('admin', '系统管理员，拥有所有权限', TRUE),
  ('moderator', '内容审核员，负责内容审核', FALSE),
  ('seller', '卖家，可以发布和管理商品', FALSE),
  ('buyer', '买家，可以浏览和购买商品', FALSE),
  ('guest', '访客，只能浏览公开内容', FALSE)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 2. 创建权限表
-- ========================================

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看权限
CREATE POLICY "permissions_select_all" ON public.permissions 
  FOR SELECT USING (TRUE);

-- 只有管理员可以管理权限
CREATE POLICY "admin_manage_permissions" ON public.permissions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 插入默认权限
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
  
  -- 系统管理权限
  ('系统设置查看', '查看系统设置', 'settings', 'read'),
  ('系统设置编辑', '编辑系统设置', 'settings', 'update'),
  ('角色管理', '管理角色', 'roles', 'manage'),
  ('权限管理', '管理权限', 'permissions', 'manage'),
  ('日志查看', '查看系统日志', 'logs', 'read')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 3. 创建角色权限关联表
-- ========================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 启用RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看角色权限关联
CREATE POLICY "role_permissions_select_all" ON public.role_permissions 
  FOR SELECT USING (TRUE);

-- 只有管理员可以管理角色权限关联
CREATE POLICY "admin_manage_role_permissions" ON public.role_permissions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 为默认角色分配权限
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
  (SELECT id FROM public.roles WHERE name = 'moderator'),
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
WHERE name IN ('商品查看', '商品创建', '商品编辑', '商品删除', '分类查看', '订单查看', '消息查看', '消息发送')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 买家拥有基本浏览和购买权限
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'buyer'),
  id
FROM public.permissions 
WHERE name IN ('商品查看', '分类查看', '订单查看', '订单创建', '消息查看', '消息发送')
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
-- 4. 创建系统设置表
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

-- 启用RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看系统设置
CREATE POLICY "system_settings_select_all" ON public.system_settings 
  FOR SELECT USING (TRUE);

-- 只有管理员可以编辑系统设置
CREATE POLICY "admin_edit_system_settings" ON public.system_settings 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 只有管理员可以插入系统设置
CREATE POLICY "admin_insert_system_settings" ON public.system_settings 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 插入默认系统设置
INSERT INTO public.system_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 5. 为profiles表添加role字段（如果不存在）
-- ========================================

-- 检查role字段是否存在，如果不存在则添加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'buyer';
  END IF;
END $$;

-- 更新现有用户的角色
UPDATE public.profiles 
SET role = CASE 
  WHEN user_type = 'admin' THEN 'admin'
  WHEN user_type = 'seller' THEN 'seller'
  ELSE 'buyer'
END
WHERE role IS NULL OR role = '';

-- ========================================
-- 6. 创建更新时间触发器
-- ========================================

-- 为roles表添加更新时间触发器
CREATE TRIGGER update_roles_updated_at 
  BEFORE UPDATE ON public.roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为permissions表添加更新时间触发器
CREATE TRIGGER update_permissions_updated_at 
  BEFORE UPDATE ON public.permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为system_settings表添加更新时间触发器
CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON public.system_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. 创建权限检查函数
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

-- 数据库初始化完成
SELECT 'Roles and permissions tables created successfully!' as status;