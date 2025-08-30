# 数据库脚本说明

本目录包含了二手交易平台所需的数据库初始化脚本。请按顺序执行这些脚本来创建完整的数据库结构。

## 执行顺序

1. **000_complete_database_init.sql** - 完整的数据库初始化脚本（推荐）
   - 包含所有基础表：用户配置、分类、商品、消息、订单
   - 包含 RLS 策略和触发器
   - 包含示例数据

2. **006_create_roles_permissions.sql** - 角色和权限管理脚本
   - 创建角色表 (roles)
   - 创建权限表 (permissions)
   - 创建角色权限关联表 (role_permissions)
   - 创建系统设置表 (system_settings)
   - 创建权限检查函数

## 执行方法

### 方法1：使用 Supabase Dashboard

1. 登录到 Supabase Dashboard
2. 选择你的项目
3. 进入 SQL Editor
4. 复制脚本内容并粘贴
5. 点击 "Run" 执行

### 方法2：使用 psql 命令行

```bash
# 连接到你的 Supabase 数据库
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 执行脚本
\i scripts/000_complete_database_init.sql
\i scripts/006_create_roles_permissions.sql
```

### 方法3：使用 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref [YOUR-PROJECT-REF]

# 执行 SQL
supabase db reset
```

## 脚本内容说明

### 000_complete_database_init.sql

- **profiles**: 用户配置表
- **categories**: 商品分类表（支持层级结构）
- **products**: 商品表
- **messages**: 消息表
- **orders**: 订单表

### 006_create_roles_permissions.sql

- **roles**: 角色表（admin, moderator, seller, buyer, guest）
- **permissions**: 权限表（细粒度的权限控制）
- **role_permissions**: 角色权限关联表
- **system_settings**: 系统设置表
- **权限函数**: has_permission(), has_role_permission()

## 默认数据

### 默认角色
- `admin`: 系统管理员，拥有所有权限
- `moderator`: 内容审核员
- `seller`: 卖家
- `buyer`: 买家
- `guest`: 访客

### 默认分类
- 二手物品
- 技能服务
- 手工艺品

### 默认权限
- 用户管理：查看、创建、编辑、删除
- 商品管理：查看、创建、编辑、删除、审核
- 分类管理：查看、创建、编辑、删除
- 订单管理：查看、创建、编辑、删除
- 消息管理：查看、发送、编辑、删除
- 系统管理：设置、角色、权限、日志

## 注意事项

1. **执行前备份**: 在生产环境执行前请先备份数据库
2. **权限检查**: 确保执行脚本的用户有足够的权限
3. **依赖关系**: 请按顺序执行，后面的脚本依赖前面的表结构
4. **RLS 策略**: 所有表都启用了行级安全策略
5. **触发器**: 包含自动更新时间戳的触发器

## 故障排除

### 常见错误

1. **权限不足**: 确保用户有 CREATE TABLE 权限
2. **表已存在**: 脚本使用 IF NOT EXISTS，不会覆盖现有表
3. **外键约束**: 确保按顺序执行脚本

### 验证执行结果

```sql
-- 检查表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 检查角色
SELECT * FROM roles;

-- 检查权限
SELECT * FROM permissions;

-- 检查系统设置
SELECT * FROM system_settings;
```

## 后续步骤

执行完脚本后，你可以：

1. 在管理后台配置系统设置
2. 创建自定义角色和权限
3. 为用户分配角色
4. 配置邮件和支付设置

如有问题，请检查 Supabase 的日志或联系技术支持。