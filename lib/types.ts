// 用户相关类型
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone?: string
  address?: string
  user_type: 'buyer' | 'seller' | 'admin'
  role?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

// 商品分类类型
export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// 商品类型
export interface Product {
  id: string
  seller_id: string
  category_id: string
  title: string
  description: string
  price: number
  images: string[]
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  location?: string
  tags: string[]
  status: 'draft' | 'pending' | 'active' | 'sold' | 'inactive' | 'rejected'
  is_featured: boolean
  view_count: number
  sort_order: number
  created_at: string
  updated_at: string
}

// 订单类型
export interface Order {
  id: string
  product_id: string
  buyer_id: string
  seller_id: string
  quantity: number
  total_price: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  shipping_address?: string
  notes?: string
  created_at: string
  updated_at: string
}

// 消息类型
export interface Message {
  id: string
  product_id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

// 角色类型
export interface Role {
  id: string
  name: string
  description?: string
  is_system: boolean
  created_at: string
  updated_at: string
}

// 权限类型
export interface Permission {
  id: string
  name: string
  description?: string
  resource: string
  action: string
  created_at: string
  updated_at: string
}

// 角色权限关联类型
export interface RolePermission {
  id: string
  role_id: string
  permission_id: string
  created_at: string
}

// 系统设置类型
export interface SystemSettings {
  id: number
  
  // 基本设置
  site_name: string
  site_description: string
  site_keywords: string
  site_logo: string
  site_favicon: string
  maintenance_mode: boolean
  registration_enabled: boolean
  
  // 邮件设置
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  smtp_encryption: string
  mail_from_name: string
  mail_from_address: string
  
  // 支付设置
  payment_gateway: string
  stripe_public_key: string
  stripe_secret_key: string
  stripe_webhook_secret: string
  paypal_client_id: string
  paypal_client_secret: string
  paypal_mode: string
  
  // 安全设置
  max_login_attempts: number
  lockout_duration: number
  password_min_length: number
  require_email_verification: boolean
  require_phone_verification: boolean
  two_factor_auth: boolean
  
  // 内容设置
  max_upload_size: number
  allowed_file_types: string
  auto_approve_products: boolean
  max_products_per_user: number
  max_images_per_product: number
  
  // 通知设置
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  admin_notifications: boolean
  
  created_at: string
  updated_at: string
}

// 统计数据类型
export interface DashboardStats {
  totalProducts: number
  totalUsers: number
  totalOrders: number
  totalMessages: number
  activeProducts: number
  pendingProducts: number
  recentOrders: Order[]
  recentUsers: User[]
}

// 分页类型
export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 表单数据类型
export interface CategoryFormData {
  name: string
  description: string
  icon: string
  parent_id: string
  sort_order: number
  is_active: boolean
}

export interface RoleFormData {
  name: string
  description: string
}

export interface PermissionFormData {
  name: string
  description: string
  resource: string
  action: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 文件上传类型
export interface FileUpload {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploaded_at: string
}

// 通知类型
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
}

// 日志类型
export interface SystemLog {
  id: string
  user_id?: string
  action: string
  resource: string
  resource_id?: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}