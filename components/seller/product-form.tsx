"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Upload, Plus, Trash2, Image as ImageIcon } from "lucide-react"

interface Category {
  id: string
  name: string
  icon?: string
}

interface ProductFormProps {
  categories: Category[]
  product?: any
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price || "",
    category_id: product?.category_id || "",
    condition: product?.condition || "",
    location: product?.location || "",
    tags: product?.tags || [],
    images: product?.images || [],
  })

  const [newTag, setNewTag] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  // 图片上传相关函数
  const handleImageSelect = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newImages: string[] = []
    const maxImages = 5
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    // 检查图片数量限制
    if (formData.images.length + files.length > maxImages) {
      setError(`最多只能上传 ${maxImages} 张图片`)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 检查文件类型
      if (!allowedTypes.includes(file.type)) {
        setError(`不支持的文件类型: ${file.name}，请使用 JPG、PNG 或 WebP 格式`)
        continue
      }

      // 检查文件大小（限制为 5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError(`文件过大: ${file.name}，请选择小于 5MB 的图片`)
        continue
      }

      try {
        const imageUrl = await uploadImageToSupabase(file)
        if (imageUrl) {
          newImages.push(imageUrl)
        }
      } catch (error) {
        console.error('图片上传失败:', error)
        setError(`图片上传失败: ${file.name}`)
      }
    }

    if (newImages.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }))
      setError(null)
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (!user) throw new Error("用户未登录")

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('上传到Supabase失败:', error)
      throw error
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent, status = "draft") => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("用户未登录")

      const productData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        seller_id: user.id,
        status: product ? product.status : status, // 编辑时保持原状态，新建时使用传入状态
      }

      if (product) {
        // 更新商品
        const { error } = await supabase.from("products").update(productData).eq("id", product.id)
        if (error) throw error
      } else {
        // 创建新商品
        const { error } = await supabase.from("products").insert([productData])
        if (error) throw error
      }

      router.push("/seller/products")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, product?.status || "pending")}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">商品标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="请输入商品标题"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">商品描述 *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="详细描述您的商品..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">价格 (元) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">商品分类 *</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleInputChange("category_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condition">商品状况</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状况" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">全新</SelectItem>
                    <SelectItem value="like_new">几乎全新</SelectItem>
                    <SelectItem value="good">良好</SelectItem>
                    <SelectItem value="fair">一般</SelectItem>
                    <SelectItem value="poor">较差</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">所在地区</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="如：北京市朝阳区"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>商品标签</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="添加标签"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>商品图片</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* 图片预览区域 */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`商品图片 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 上传区域 */}
              {formData.images.length < 5 && (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={handleImageSelect}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">点击上传或拖拽图片到此处</p>
                  <p className="text-sm text-gray-500">支持 JPG、PNG、WebP 格式，最多 5 张图片，每张不超过 5MB</p>
                  <Button type="button" variant="outline" className="mt-4 bg-transparent">
                    选择图片
                  </Button>
                </div>
              )}

              {/* 图片数量提示 */}
              <div className="text-sm text-gray-500 text-center">
                已上传 {formData.images.length}/5 张图片
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">{error}</div>}

        <div className="flex gap-4">
          <Button type="button" onClick={(e) => handleSubmit(e, "draft")} variant="outline" disabled={isLoading}>
            保存草稿
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "保存中..." : (product ? "保存更改" : "发布商品")}
          </Button>
        </div>
      </div>
    </form>
  )
}
