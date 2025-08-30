"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Save, Settings, Mail, CreditCard, Shield, Globe, Database } from "lucide-react"

interface SystemSettingsProps {
  initialSettings: any
}

export function SystemSettings({ initialSettings }: SystemSettingsProps) {
  const [settings, setSettings] = useState(initialSettings || {
    // 基本设置
    site_name: "二手交易平台",
    site_description: "安全可靠的二手商品交易平台",
    site_keywords: "二手,交易,平台,商品",
    site_logo: "",
    site_favicon: "",
    maintenance_mode: false,
    registration_enabled: true,
    
    // 邮件设置
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    smtp_encryption: "tls",
    mail_from_name: "二手交易平台",
    mail_from_address: "noreply@example.com",
    
    // 支付设置
    payment_gateway: "stripe",
    stripe_public_key: "",
    stripe_secret_key: "",
    stripe_webhook_secret: "",
    paypal_client_id: "",
    paypal_client_secret: "",
    paypal_mode: "sandbox",
    
    // 安全设置
    max_login_attempts: 5,
    lockout_duration: 15,
    password_min_length: 8,
    require_email_verification: true,
    require_phone_verification: false,
    two_factor_auth: false,
    
    // 内容设置
    max_upload_size: 10,
    allowed_file_types: "jpg,jpeg,png,gif,pdf,doc,docx",
    auto_approve_products: false,
    max_products_per_user: 50,
    max_images_per_product: 10,
    
    // 通知设置
    email_notifications: true,
    push_notifications: false,
    sms_notifications: false,
    admin_notifications: true
  })

  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSave = async (section: string) => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          id: 1,
          ...settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success(`${section}设置保存成功`)
    } catch (error) {
      console.error("保存设置失败:", error)
      toast.error("保存设置失败")
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">系统设置</h1>
        <p className="text-gray-600">管理系统配置、邮件设置、支付设置等</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>基本设置</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>邮件设置</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>支付设置</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>安全设置</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>内容设置</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>通知设置</span>
          </TabsTrigger>
        </TabsList>

        {/* 基本设置 */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>网站基本设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site_name">网站名称</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => updateSetting("site_name", e.target.value)}
                    placeholder="输入网站名称"
                  />
                </div>
                <div>
                  <Label htmlFor="site_logo">网站Logo URL</Label>
                  <Input
                    id="site_logo"
                    value={settings.site_logo}
                    onChange={(e) => updateSetting("site_logo", e.target.value)}
                    placeholder="输入Logo URL"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="site_description">网站描述</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => updateSetting("site_description", e.target.value)}
                  placeholder="输入网站描述"
                />
              </div>
              <div>
                <Label htmlFor="site_keywords">网站关键词</Label>
                <Input
                  id="site_keywords"
                  value={settings.site_keywords}
                  onChange={(e) => updateSetting("site_keywords", e.target.value)}
                  placeholder="输入关键词，用逗号分隔"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenance_mode"
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) => updateSetting("maintenance_mode", checked)}
                  />
                  <Label htmlFor="maintenance_mode">维护模式</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="registration_enabled"
                    checked={settings.registration_enabled}
                    onCheckedChange={(checked) => updateSetting("registration_enabled", checked)}
                  />
                  <Label htmlFor="registration_enabled">允许用户注册</Label>
                </div>
              </div>
              <Button 
                onClick={() => handleSave("基本")} 
                disabled={isLoading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                保存基本设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 邮件设置 */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP邮件设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_host">SMTP服务器</Label>
                  <Input
                    id="smtp_host"
                    value={settings.smtp_host}
                    onChange={(e) => updateSetting("smtp_host", e.target.value)}
                    placeholder="如: smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">SMTP端口</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => updateSetting("smtp_port", parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_username">SMTP用户名</Label>
                  <Input
                    id="smtp_username"
                    value={settings.smtp_username}
                    onChange={(e) => updateSetting("smtp_username", e.target.value)}
                    placeholder="输入SMTP用户名"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">SMTP密码</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={settings.smtp_password}
                    onChange={(e) => updateSetting("smtp_password", e.target.value)}
                    placeholder="输入SMTP密码"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_encryption">加密方式</Label>
                  <Select
                    value={settings.smtp_encryption}
                    onValueChange={(value) => updateSetting("smtp_encryption", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">无</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mail_from_name">发件人名称</Label>
                  <Input
                    id="mail_from_name"
                    value={settings.mail_from_name}
                    onChange={(e) => updateSetting("mail_from_name", e.target.value)}
                    placeholder="输入发件人名称"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mail_from_address">发件人邮箱</Label>
                <Input
                  id="mail_from_address"
                  type="email"
                  value={settings.mail_from_address}
                  onChange={(e) => updateSetting("mail_from_address", e.target.value)}
                  placeholder="输入发件人邮箱"
                />
              </div>
              <Button 
                onClick={() => handleSave("邮件")} 
                disabled={isLoading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                保存邮件设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 支付设置 */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>支付网关设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payment_gateway">支付网关</Label>
                <Select
                  value={settings.payment_gateway}
                  onValueChange={(value) => updateSetting("payment_gateway", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="alipay">支付宝</SelectItem>
                    <SelectItem value="wechat">微信支付</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.payment_gateway === "stripe" && (
                <div className="space-y-4">
                  <h4 className="font-medium">Stripe 设置</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stripe_public_key">公钥</Label>
                      <Input
                        id="stripe_public_key"
                        value={settings.stripe_public_key}
                        onChange={(e) => updateSetting("stripe_public_key", e.target.value)}
                        placeholder="输入Stripe公钥"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stripe_secret_key">私钥</Label>
                      <Input
                        id="stripe_secret_key"
                        type="password"
                        value={settings.stripe_secret_key}
                        onChange={(e) => updateSetting("stripe_secret_key", e.target.value)}
                        placeholder="输入Stripe私钥"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="stripe_webhook_secret">Webhook密钥</Label>
                    <Input
                      id="stripe_webhook_secret"
                      type="password"
                      value={settings.stripe_webhook_secret}
                      onChange={(e) => updateSetting("stripe_webhook_secret", e.target.value)}
                      placeholder="输入Webhook密钥"
                    />
                  </div>
                </div>
              )}

              {settings.payment_gateway === "paypal" && (
                <div className="space-y-4">
                  <h4 className="font-medium">PayPal 设置</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paypal_client_id">客户端ID</Label>
                      <Input
                        id="paypal_client_id"
                        value={settings.paypal_client_id}
                        onChange={(e) => updateSetting("paypal_client_id", e.target.value)}
                        placeholder="输入PayPal客户端ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paypal_client_secret">客户端密钥</Label>
                      <Input
                        id="paypal_client_secret"
                        type="password"
                        value={settings.paypal_client_secret}
                        onChange={(e) => updateSetting("paypal_client_secret", e.target.value)}
                        placeholder="输入PayPal客户端密钥"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="paypal_mode">PayPal模式</Label>
                    <Select
                      value={settings.paypal_mode}
                      onValueChange={(value) => updateSetting("paypal_mode", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">沙盒模式</SelectItem>
                        <SelectItem value="live">生产模式</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => handleSave("支付")} 
                disabled={isLoading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                保存支付设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_login_attempts">最大登录尝试次数</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    value={settings.max_login_attempts}
                    onChange={(e) => updateSetting("max_login_attempts", parseInt(e.target.value))}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="lockout_duration">锁定时间（分钟）</Label>
                  <Input
                    id="lockout_duration"
                    type="number"
                    value={settings.lockout_duration}
                    onChange={(e) => updateSetting("lockout_duration", parseInt(e.target.value))}
                    placeholder="15"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password_min_length">密码最小长度</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={settings.password_min_length}
                    onChange={(e) => updateSetting("password_min_length", parseInt(e.target.value))}
                    placeholder="8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_email_verification"
                    checked={settings.require_email_verification}
                    onCheckedChange={(checked) => updateSetting("require_email_verification", checked)}
                  />
                  <Label htmlFor="require_email_verification">要求邮箱验证</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_phone_verification"
                    checked={settings.require_phone_verification}
                    onCheckedChange={(checked) => updateSetting("require_phone_verification", checked)}
                  />
                  <Label htmlFor="require_phone_verification">要求手机验证</Label>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="two_factor_auth"
                  checked={settings.two_factor_auth}
                  onCheckedChange={(checked) => updateSetting("two_factor_auth", checked)}
                />
                <Label htmlFor="two_factor_auth">启用双因素认证</Label>
              </div>
              <Button 
                onClick={() => handleSave("安全")} 
                disabled={isLoading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                保存安全设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 内容设置 */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>内容管理设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_upload_size">最大上传大小（MB）</Label>
                  <Input
                    id="max_upload_size"
                    type="number"
                    value={settings.max_upload_size}
                    onChange={(e) => updateSetting("max_upload_size", parseInt(e.target.value))}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="max_products_per_user">每用户最大商品数</Label>
                  <Input
                    id="max_products_per_user"
                    type="number"
                    value={settings.max_products_per_user}
                    onChange={(e) => updateSetting("max_products_per_user", parseInt(e.target.value))}
                    placeholder="50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_images_per_product">每商品最大图片数</Label>
                  <Input
                    id="max_images_per_product"
                    type="number"
                    value={settings.max_images_per_product}
                    onChange={(e) => updateSetting("max_images_per_product", parseInt(e.target.value))}
                    placeholder="10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="allowed_file_types">允许的文件类型</Label>
                <Input
                  id="allowed_file_types"
                  value={settings.allowed_file_types}
                  onChange={(e) => updateSetting("allowed_file_types", e.target.value)}
                  placeholder="jpg,jpeg,png,gif,pdf,doc,docx"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_approve_products"
                  checked={settings.auto_approve_products}
                  onCheckedChange={(checked) => updateSetting("auto_approve_products", checked)}
                />
                <Label htmlFor="auto_approve_products">自动审核商品</Label>
              </div>
              <Button 
                onClick={() => handleSave("内容")} 
                disabled={isLoading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                保存内容设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email_notifications"
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
                  />
                  <Label htmlFor="email_notifications">邮件通知</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="push_notifications"
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) => updateSetting("push_notifications", checked)}
                  />
                  <Label htmlFor="push_notifications">推送通知</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sms_notifications"
                    checked={settings.sms_notifications}
                    onCheckedChange={(checked) => updateSetting("sms_notifications", checked)}
                  />
                  <Label htmlFor="sms_notifications">短信通知</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="admin_notifications"
                    checked={settings.admin_notifications}
                    onCheckedChange={(checked) => updateSetting("admin_notifications", checked)}
                  />
                  <Label htmlFor="admin_notifications">管理员通知</Label>
                </div>
              </div>
              <Button 
                onClick={() => handleSave("通知")} 
                disabled={isLoading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                保存通知设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}