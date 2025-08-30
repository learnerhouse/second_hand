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
import { Plus, Edit, Trash2, Shield, Users, Key, CheckCircle, XCircle } from "lucide-react"

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
      toast.error("角色名称不能为空")
      return
    }

    try {
      const { data, error } = await supabase
        .from("roles")
        .insert([{
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim(),
          is_system: false
        }])
        .select()
        .single()

      if (error) throw error

      setRoles([...roles, data])
      setIsAddRoleDialogOpen(false)
      resetRoleForm()
      toast.success("角色创建成功")
    } catch (error) {
      console.error("创建角色失败:", error)
      toast.error("创建角色失败")
    }
  }

  const handleEditRole = async () => {
    if (!editingRole || !roleFormData.name.trim()) {
      toast.error("角色名称不能为空")
      return
    }

    try {
      const { error } = await supabase
        .from("roles")
        .update({
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim()
        })
        .eq("id", editingRole.id)

      if (error) throw error

      setRoles(roles.map(role => 
        role.id === editingRole.id 
          ? { ...role, ...roleFormData }
          : role
      ))
      setIsEditRoleDialogOpen(false)
      setEditingRole(null)
      resetRoleForm()
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
      // 同时删除相关的角色权限关联
      setRolePermissions(rolePermissions.filter(rp => rp.role_id !== roleId))
      toast.success("角色删除成功")
    } catch (error) {
      console.error("删除角色失败:", error)
      toast.error("删除角色失败")
    }
  }

  // 权限管理
  const handleAddPermission = async () => {
    if (!permissionFormData.name.trim() || !permissionFormData.resource.trim() || !permissionFormData.action.trim()) {
      toast.error("权限名称、资源和操作不能为空")
      return
    }

    try {
      const { data, error } = await supabase
        .from("permissions")
        .insert([{
          name: permissionFormData.name.trim(),
          description: permissionFormData.description.trim(),
          resource: permissionFormData.resource.trim(),
          action: permissionFormData.action.trim()
        }])
        .select()
        .single()

      if (error) throw error

      setPermissions([...permissions, data])
      setIsAddPermissionDialogOpen(false)
      resetPermissionForm()
      toast.success("权限创建成功")
    } catch (error) {
      console.error("创建权限失败:", error)
      toast.error("创建权限失败")
    }
  }

  const handleEditPermission = async () => {
    if (!editingPermission || !permissionFormData.name.trim() || !permissionFormData.resource.trim() || !permissionFormData.action.trim()) {
      toast.error("权限名称、资源和操作不能为空")
      return
    }

    try {
      const { error } = await supabase
        .from("permissions")
        .update({
          name: permissionFormData.name.trim(),
          description: permissionFormData.description.trim(),
          resource: permissionFormData.resource.trim(),
          action: permissionFormData.action.trim()
        })
        .eq("id", editingPermission.id)

      if (error) throw error

      setPermissions(permissions.map(permission => 
        permission.id === editingPermission.id 
          ? { ...permission, ...permissionFormData }
          : permission
      ))
      setIsEditPermissionDialogOpen(false)
      setEditingPermission(null)
      resetPermissionForm()
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
      // 同时删除相关的角色权限关联
      setRolePermissions(rolePermissions.filter(rp => rp.permission_id !== permissionId))
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
      <div>
        <h1 className="text-2xl font-bold">权限管理</h1>
        <p className="text-gray-600">管理系统角色、权限和用户角色分配</p>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>角色管理</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>权限管理</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>用户角色</span>
          </TabsTrigger>
        </TabsList>

        {/* 角色管理 */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">角色管理</h2>
            <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetRoleForm}>
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

          <div className="grid gap-4">
            {roles.map(role => (
              <Card key={role.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{role.name}</h3>
                      <p className="text-sm text-gray-600">{role.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={role.is_system ? "default" : "secondary"}>
                          {role.is_system ? "系统角色" : "自定义角色"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          创建时间: {new Date(role.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditRoleDialog(role)}
                        disabled={role.is_system}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.is_system}
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

        {/* 权限管理 */}
        <TabsContent value="permissions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">权限管理</h2>
            <Dialog open={isAddPermissionDialogOpen} onOpenChange={setIsAddPermissionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetPermissionForm}>
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
                  <div>
                    <Label htmlFor="permission-resource">资源 *</Label>
                    <Input
                      id="permission-resource"
                      value={permissionFormData.resource}
                      onChange={(e) => setPermissionFormData({ ...permissionFormData, resource: e.target.value })}
                      placeholder="如: products, users, orders"
                    />
                  </div>
                  <div>
                    <Label htmlFor="permission-action">操作 *</Label>
                    <Input
                      id="permission-action"
                      value={permissionFormData.action}
                      onChange={(e) => setPermissionFormData({ ...permissionFormData, action: e.target.value })}
                      placeholder="如: create, read, update, delete"
                    />
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

          <div className="grid gap-4">
            {permissions.map(permission => (
              <Card key={permission.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{permission.name}</h3>
                      <p className="text-sm text-gray-600">{permission.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{permission.resource}</Badge>
                        <Badge variant="outline">{permission.action}</Badge>
                        <span className="text-xs text-gray-500">
                          创建时间: {new Date(permission.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
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

        {/* 用户角色管理 */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">用户角色管理</h2>
            <div className="text-sm text-gray-600">
              点击角色选择器可以修改用户权限
            </div>
          </div>
          
          <div className="grid gap-4">
            {users.map(user => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{user.full_name || user.email}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{user.user_type}</Badge>
                        <Badge variant={user.is_verified ? "default" : "secondary"}>
                          {user.is_verified ? "已验证" : "未验证"}
                        </Badge>
                        <Badge variant="outline">当前角色: {user.role || '未设置'}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={user.role || ""}
                        onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-40">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 角色权限分配 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>角色权限分配</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">角色</th>
                  {permissions.map(permission => (
                    <th key={permission.id} className="text-center p-2">
                      <div className="text-xs">
                        <div>{permission.name}</div>
                        <div className="text-gray-500">{permission.resource}.{permission.action}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id} className="border-b">
                    <td className="p-2 font-medium">{role.name}</td>
                    {permissions.map(permission => (
                      <td key={permission.id} className="text-center p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleRolePermission(role.id, permission.id)}
                          className={`h-8 w-8 p-0 ${
                            hasPermission(role.id, permission.id)
                              ? "text-green-600 hover:text-green-700"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {hasPermission(role.id, permission.id) ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </Button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              更新角色
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
            <div>
              <Label htmlFor="edit-permission-resource">资源 *</Label>
              <Input
                id="edit-permission-resource"
                value={permissionFormData.resource}
                onChange={(e) => setPermissionFormData({ ...permissionFormData, resource: e.target.value })}
                placeholder="如: products, users, orders"
              />
            </div>
            <div>
              <Label htmlFor="edit-permission-action">操作 *</Label>
              <Input
                id="edit-permission-action"
                value={permissionFormData.action}
                onChange={(e) => setPermissionFormData({ ...permissionFormData, action: e.target.value })}
                placeholder="如: create, read, update, delete"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditPermissionDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditPermission}>
              更新权限
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}