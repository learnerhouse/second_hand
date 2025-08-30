"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Edit, Trash2, GripVertical, FolderTree } from "lucide-react"
import type { Category } from "@/types"

interface CategoriesManagementProps {
  categories: Category[]
}

export function CategoriesManagement({ categories: initialCategories }: CategoriesManagementProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    parent_id: "",
    sort_order: 0,
    is_active: true
  })

  const supabase = createClient()

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      parent_id: "",
      sort_order: 0,
      is_active: true
    })
  }

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast.error("分类名称不能为空")
      return
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim(),
          icon: formData.icon.trim() || "📦",
          parent_id: formData.parent_id || null,
          sort_order: formData.sort_order,
          is_active: formData.is_active
        }])
        .select()
        .single()

      if (error) throw error

      setCategories([...categories, data])
      setIsAddDialogOpen(false)
      resetForm()
      toast.success("分类创建成功")
    } catch (error) {
      console.error("创建分类失败:", error)
      toast.error("创建分类失败")
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast.error("分类名称不能为空")
      return
    }

    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          icon: formData.icon.trim() || "📦",
          parent_id: formData.parent_id || null,
          sort_order: formData.sort_order,
          is_active: formData.is_active
        })
        .eq("id", editingCategory.id)

      if (error) throw error

      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...formData }
          : cat
      ))
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      resetForm()
      toast.success("分类更新成功")
    } catch (error) {
      console.error("更新分类失败:", error)
      toast.error("更新分类失败")
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("确定要删除这个分类吗？删除后无法恢复。")) return

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId)

      if (error) throw error

      setCategories(categories.filter(cat => cat.id !== categoryId))
      toast.success("分类删除成功")
    } catch (error) {
      console.error("删除分类失败:", error)
      toast.error("删除分类失败")
    }
  }

  const handleToggleActive = async (categoryId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !currentStatus })
        .eq("id", categoryId)

      if (error) throw error

      setCategories(categories.map(cat => 
        cat.id === categoryId 
          ? { ...cat, is_active: !currentStatus }
          : cat
      ))
      toast.success("状态更新成功")
    } catch (error) {
      console.error("更新状态失败:", error)
      toast.error("更新状态失败")
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      parent_id: category.parent_id || "",
      sort_order: category.sort_order || 0,
      is_active: category.is_active
    })
    setIsEditDialogOpen(true)
  }

  const getParentName = (parentId: string | null) => {
    if (!parentId) return "无"
    const parent = categories.find(cat => cat.id === parentId)
    return parent ? parent.name : "未知"
  }

  const getSubCategories = (parentId: string | null) => {
    return categories.filter(cat => cat.parent_id === parentId)
  }

  const renderCategoryTree = (parentId: string | null = null, level: number = 0) => {
    const levelCategories = getSubCategories(parentId)
    
    return levelCategories.map(category => (
      <div key={category.id} className="space-y-2">
        <Card className={`${level > 0 ? 'ml-6' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <span className="text-lg">{category.icon}</span>
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "启用" : "禁用"}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      排序: {category.sort_order}
                    </span>
                    {category.parent_id && (
                      <span className="text-xs text-gray-500">
                        父级: {getParentName(category.parent_id)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(category.id, category.is_active)}
                >
                  {category.is_active ? "禁用" : "启用"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {renderCategoryTree(category.id, level + 1)}
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">商品分类管理</h1>
          <p className="text-gray-600">管理系统中的商品分类，支持层级结构</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              添加分类
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新分类</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">分类名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入分类名称"
                />
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="输入分类描述"
                />
              </div>
              <div>
                <Label htmlFor="icon">图标</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="输入图标（emoji或文字）"
                />
              </div>
              <div>
                <Label htmlFor="parent">父级分类</Label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择父级分类（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无父级分类</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort_order">排序</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">启用分类</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddCategory}>
                创建分类
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 分类树形结构 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderTree className="h-5 w-5" />
            <span>分类结构</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无分类，请添加第一个分类
            </div>
          ) : (
            <div className="space-y-2">
              {renderCategoryTree()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑分类对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">分类名称 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入分类名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入分类描述"
              />
            </div>
            <div>
              <Label htmlFor="edit-icon">图标</Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="输入图标（emoji或文字）"
              />
            </div>
            <div>
              <Label htmlFor="edit-parent">父级分类</Label>
              <Select
                value={formData.parent_id}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择父级分类（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无父级分类</SelectItem>
                  {categories
                    .filter(cat => cat.id !== editingCategory?.id)
                    .map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-sort_order">排序</Label>
              <Input
                id="edit-sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-is_active">启用分类</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditCategory}>
              更新分类
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}