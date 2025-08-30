"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Shield, Users, Key, CheckCircle, XCircle, Settings, UserCheck } from "lucide-react"

interface Role {
  id: string
  name: string
  description: string
  is_system: boolean
  created_at: string
}

interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
  created_at: string
}

interface RolePermission {
  id: string
  role_id: string
  permission_id: string
}

interface User {
  id: string
  email: string
  full_name: string
  user_type: string
  role: string
  is_verified: boolean
}

interface PermissionsManagementProps {
  users: User[]
  roles: Role[]
  permissions: Permission[]
  rolePermissions: RolePermission[]
}

export function PermissionsManagement({ 
  users: initialUsers, 
  roles: initialRoles, 
  permissions: initialPermissions, 
  rolePermissions: initialRolePermissions 
}: PermissionsManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions)
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(initialRolePermissions)
  
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false)
  const [isAddPermissionDialogOpen, setIsAddPermissionDialogOpen] = useState(false)
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [isEditPermissionDialogOpen, setIsEditPermissionDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false)
  
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: ""
  })
  
  const [permissionFormData, setPermissionFormData] = useState({
    name: "",
    description: "",
    resource: "",
    action: ""
  })

  const supabase = createClient()

  const resetRoleForm = () => {
    setRoleFormData({
      name: "",
      description: ""
    })
  }

  const resetPermissionForm = () => {
    setPermissionFormData({
      name: "",
      description: "",
      resource: "",
      action: ""
    })
  }

  // 角色管理
  const handleAddRole = async () => {
    if (!roleFormData.name.trim()) {
      toast.error("请输入角色名称")
      return
    }

    try {
      const { data, error } = await supabase
        .from("roles")
        .insert([{
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim() || null
        }])
        .select()
        .single()

      if (error) throw error

      setRoles([...roles, data])
      resetRoleForm()
      setIsAddRoleDialogOpen(false)
      toast.success("角色创建成功")
    } catch (error) {
      console.error("创建角色失败:", error)
      toast.error("创建角色失败")
    }
  }

  const handleEditRole = async () => {
    if (!editingRole || !roleFormData.name.trim()) {
      toast.error("请输入角色名称")
      return
    }

    try {
      const { error } = await supabase
        .from("roles")
        .update({
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim() || null
        })
        .eq("id", editingRole.id)

      if (error) throw error

      setRoles(roles.map(role => 
        role.id === editingRole.id 
          ? { ...role, name: roleFormData.name.trim(), description: roleFormData.description.trim() || null }
          : role
      ))
      setIsEditRoleDialogOpen(false)
      toast.success("角色更新成功")
    } catch (error) {
      console.error("更新角色失败:", error)
      toast.error("更新角色失败")
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("确定要删除这个角色吗？删除后无法恢复。")) return

    try {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", roleId)

      if (error) throw error

      setRoles(roles.filter(role => role.id !== roleId))
      toast.success("角色删除成功")
    } catch (error) {
      console.error("删除角色失败:", error)
      toast.error("删除角色失败")
    }
  }

  // 权限管理
  const handleAddPermission = async () => {
    if (!permissionFormData.name.trim() || !permissionFormData.resource.trim() || !permissionFormData.action.trim()) {
      toast.error("请填写所有必填字段")
      return
    }

    try {
      const { data, error } = await supabase
        .from("permissions")
        .insert([{
          name: permissionFormData.name.trim(),
          description: permissionFormData.description.trim() || null,
          resource: permissionFormData.resource.trim(),
          action: permissionFormData.action.trim()
        }])
        .select()
        .single()

      if (error) throw error

      setPermissions([...permissions, data])
      resetPermissionForm()
      setIsAddPermissionDialogOpen(false)
      toast.success("权限创建成功")
    } catch (error) {
      console.error("创建权限失败:", error)
      toast.error("创建权限失败")
    }
  }

  const handleEditPermission = async () => {
    if (!editingPermission || !permissionFormData.name.trim() || !permissionFormData.resource.trim() || !permissionFormData.action.trim()) {
      toast.error("请填写所有必填字段")
      return
    }

    try {
      const { error } = await supabase
        .from("permissions")
        .update({
          name: permissionFormData.name.trim(),
          description: permissionFormData.description.trim() || null,
          resource: permissionFormData.resource.trim(),
          action: permissionFormData.action.trim()
        })
        .eq("id", editingPermission.id)

      if (error) throw error

      setPermissions(permissions.map(permission => 
        permission.id === editingPermission.id 
          ? { 
              ...permission, 
              name: permissionFormData.name.trim(), 
              description: permissionFormData.description.trim() || null,
              resource: permissionFormData.resource.trim(),
              action: permissionFormData.action.trim()
            }
          : permission
      ))
      setIsEditPermissionDialogOpen(false)
      toast.success("权限更新成功")
    } catch (error) {
      console.error("更新权限失败:", error)
      toast.error("更新权限失败")
    }
  }

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm("确定要删除这个权限吗？删除后无法恢复。")) return

    try {
      const { error } = await supabase
        .from("permissions")
        .delete()
        .eq("id", permissionId)

      if (error) throw error

      setPermissions(permissions.filter(permission => permission.id !== permissionId))
      toast.success("权限删除成功")
    } catch (error) {
      console.error("删除权限失败:", error)
      toast.error("删除权限失败")
    }
  }

  // 角色权限管理
  const handleToggleRolePermission = async (roleId: string, permissionId: string) => {
    const existingRolePermission = rolePermissions.find(
      rp => rp.role_id === roleId && rp.permission_id === permissionId
    )

    setIsUpdatingPermissions(true)

    try {
      if (existingRolePermission) {
        // 移除权限
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("id", existingRolePermission.id)

        if (error) throw error

        setRolePermissions(rolePermissions.filter(rp => rp.id !== existingRolePermission.id))
        toast.success("权限移除成功")
      } else {
        // 添加权限
        const { data, error } = await supabase
          .from("role_permissions")
          .insert([{
            role_id: roleId,
            permission_id: permissionId
          }])
          .select()
          .single()

        if (error) throw error

        setRolePermissions([...rolePermissions, data])
        toast.success("权限分配成功")
      }
    } catch (error) {
      console.error("更新角色权限失败:", error)
      toast.error("更新角色权限失败")
    } finally {
      setIsUpdatingPermissions(false)
    }
  }

  // 用户角色管理
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId)

      if (error) throw error

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ))
      toast.success("用户角色更新成功")
    } catch (error) {
      console.error("更新用户角色失败:", error)
      toast.error("更新用户角色失败")
    }
  }

  const openEditRoleDialog = (role: Role) => {
    setEditingRole(role)
    setRoleFormData({
      name: role.name,
      description: role.description || ""
    })
    setIsEditRoleDialogOpen(true)
  }

  const openEditPermissionDialog = (permission: Permission) => {
    setEditingPermission(permission)
    setPermissionFormData({
      name: permission.name,
      description: permission.description || "",
      resource: permission.resource,
      action: permission.action
    })
    setIsEditPermissionDialogOpen(true)
  }

  const hasPermission = (roleId: string, permissionId: string) => {
    return rolePermissions.some(
      rp => rp.role_id === roleId && rp.permission_id === permissionId
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和统计信息 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">权限管理</h1>
          <p className="text-gray-600 mt-2">管理系统角色、权限和用户角色分配</p>
        </div>
        
        {/* 统计卡片 */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">{roles.length} 个角色</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
            <Key className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">{permissions.length} 个权限</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-purple-50 rounded-lg">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">{users.length} 个用户</span>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧：角色和权限管理 */}
        <div className="xl:col-span-2 space-y-6">
          <Tabs defaultValue="roles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="roles" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>角色管理</span>
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>权限管理</span>
              </TabsTrigger>
            </TabsList>

            {/* 角色管理 */}
            <TabsContent value="roles" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">角色列表</h2>
                <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetRoleForm} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      添加角色
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加新角色</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role-name">角色名称 *</Label>
                        <Input
                          id="role-name"
                          value={roleFormData.name}
                          onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                          placeholder="输入角色名称"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role-description">描述</Label>
                        <Input
                          id="role-description"
                          value={roleFormData.description}
                          onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                          placeholder="输入角色描述"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddRole}>
                        创建角色
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-3">
                {roles.map(role => (
                  <Card key={role.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">{role.name}</h3>
                            {role.is_system && (
                              <Badge variant="default" className="text-xs">系统</Badge>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>创建时间: {new Date(role.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {!role.is_system && (
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditRoleDialog(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 权限管理 */}
            <TabsContent value="permissions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">权限列表</h2>
                <Dialog open={isAddPermissionDialogOpen} onOpenChange={setIsAddPermissionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetPermissionForm} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      添加权限
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加新权限</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="permission-name">权限名称 *</Label>
                        <Input
                          id="permission-name"
                          value={permissionFormData.name}
                          onChange={(e) => setPermissionFormData({ ...permissionFormData, name: e.target.value })}
                          placeholder="输入权限名称"
                        />
                      </div>
                      <div>
                        <Label htmlFor="permission-description">描述</Label>
                        <Input
                          id="permission-description"
                          value={permissionFormData.description}
                          onChange={(e) => setPermissionFormData({ ...permissionFormData, description: e.target.value })}
                          placeholder="输入权限描述"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="permission-resource">资源 *</Label>
                          <Input
                            id="permission-resource"
                            value={permissionFormData.resource}
                            onChange={(e) => setPermissionFormData({ ...permissionFormData, resource: e.target.value })}
                            placeholder="如: products"
                          />
                        </div>
                        <div>
                          <Label htmlFor="permission-action">操作 *</Label>
                          <Input
                            id="permission-action"
                            value={permissionFormData.action}
                            onChange={(e) => setPermissionFormData({ ...permissionFormData, action: e.target.value })}
                            placeholder="如: create"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsAddPermissionDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddPermission}>
                        创建权限
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-3">
                {permissions.map(permission => (
                  <Card key={permission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-2">{permission.name}</h3>
                          {permission.description && (
                            <p className="text-sm text-gray-600 mb-2">{permission.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{permission.resource}</Badge>
                            <Badge variant="outline" className="text-xs">{permission.action}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditPermissionDialog(permission)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePermission(permission.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右侧：用户角色管理 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5" />
                <span>用户角色管理</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {user.full_name || user.email}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">{user.user_type}</Badge>
                      <Badge variant={user.is_verified ? "default" : "secondary"} className="text-xs">
                        {user.is_verified ? "已验证" : "未验证"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">角色:</span>
                      <Select
                        value={user.role || ""}
                        onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.name}>
                              <div className="flex items-center space-x-2">
                                <span>{role.name}</span>
                                {role.is_system && (
                                  <Badge variant="outline" className="text-xs">系统</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 角色权限分配矩阵 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>角色权限分配</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            点击权限按钮可以为角色分配或移除权限。绿色勾表示已分配，灰色叉表示未分配。
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-900 bg-gray-50">角色</th>
                  {permissions.map(permission => (
                    <th key={permission.id} className="text-center p-3 font-medium text-gray-900 bg-gray-50">
                      <div className="text-xs max-w-[120px]">
                        <div className="font-semibold text-gray-900">{permission.name}</div>
                        <div className="text-gray-500 text-[10px] mt-1">{permission.resource}.{permission.action}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>{role.name}</span>
                        {role.is_system && (
                          <Badge variant="outline" className="text-xs">系统</Badge>
                        )}
                      </div>
                    </td>
                    {permissions.map(permission => (
                      <td key={permission.id} className="text-center p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleRolePermission(role.id, permission.id)}
                          disabled={isUpdatingPermissions}
                          className={`h-10 w-10 p-0 transition-all duration-200 ${
                            hasPermission(role.id, permission.id)
                              ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                          } ${isUpdatingPermissions ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={`${hasPermission(role.id, permission.id) ? '移除' : '分配'} ${permission.name} 权限`}
                        >
                          {isUpdatingPermissions ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                          ) : hasPermission(role.id, permission.id) ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <XCircle className="h-6 w-6" />
                          )}
                        </Button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {permissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无权限数据，请先添加权限
            </div>
          )}
          
          {roles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无角色数据，请先添加角色
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑角色对话框 */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role-name">角色名称 *</Label>
              <Input
                id="edit-role-name"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                placeholder="输入角色名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-role-description">描述</Label>
              <Input
                id="edit-role-description"
                value={roleFormData.description}
                onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                placeholder="输入角色描述"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditRole}>
              保存更改
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑权限对话框 */}
      <Dialog open={isEditPermissionDialogOpen} onOpenChange={setIsEditPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑权限</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-permission-name">权限名称 *</Label>
              <Input
                id="edit-permission-name"
                value={permissionFormData.name}
                onChange={(e) => setPermissionFormData({ ...permissionFormData, name: e.target.value })}
                placeholder="输入权限名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-permission-description">描述</Label>
              <Input
                id="edit-permission-description"
                value={permissionFormData.description}
                onChange={(e) => setPermissionFormData({ ...permissionFormData, description: e.target.value })}
                placeholder="输入权限描述"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-permission-resource">资源 *</Label>
                <Input
                  id="edit-permission-resource"
                  value={permissionFormData.resource}
                  onChange={(e) => setPermissionFormData({ ...permissionFormData, resource: e.target.value })}
                  placeholder="如: products"
                />
              </div>
              <div>
                <Label htmlFor="edit-permission-action">操作 *</Label>
                <Input
                  id="edit-permission-action"
                  value={permissionFormData.action}
                  onChange={(e) => setPermissionFormData({ ...permissionFormData, action: e.target.value })}
                  placeholder="如: create"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditPermissionDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditPermission}>
              保存更改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}