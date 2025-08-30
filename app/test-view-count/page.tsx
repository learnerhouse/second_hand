"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function TestViewCountPage() {
  const [productId, setProductId] = useState("b56d1299-e161-4b6e-bc66-edfda3d0d4d8")
  const [currentCount, setCurrentCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const supabase = createClient()

  // 获取当前浏览次数
  const getCurrentCount = async () => {
    setIsLoading(true)
    setMessage("")
    
    try {
      const { data, error } = await supabase
        .from("products")
        .select("view_count, title")
        .eq("id", productId)
        .single()

      if (error) {
        setMessage(`获取失败: ${error.message}`)
      } else {
        setCurrentCount(data.view_count)
        setMessage(`商品: ${data.title}, 当前浏览次数: ${data.view_count}`)
      }
    } catch (err) {
      setMessage(`错误: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 手动增加浏览次数
  const incrementCount = async () => {
    setIsLoading(true)
    setMessage("")
    
    try {
      const { data, error } = await supabase
        .from("products")
        .update({ 
          view_count: (currentCount || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", productId)
        .select("view_count")
        .single()

      if (error) {
        setMessage(`更新失败: ${error.message}`)
        console.error("更新错误:", error)
      } else {
        setCurrentCount(data.view_count)
        setMessage(`成功更新! 新浏览次数: ${data.view_count}`)
      }
    } catch (err) {
      setMessage(`错误: ${err}`)
      console.error("更新异常:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // 检查用户认证状态
  const checkAuth = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      setMessage(`认证错误: ${error.message}`)
    } else if (user) {
      setMessage(`已认证用户: ${user.email}`)
    } else {
      setMessage("未认证用户")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">浏览次数测试页面</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* 商品ID输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品ID
            </label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入商品ID"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-4">
            <button
              onClick={getCurrentCount}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "加载中..." : "获取当前次数"}
            </button>
            
            <button
              onClick={incrementCount}
              disabled={isLoading || currentCount === null}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "更新中..." : "增加浏览次数"}
            </button>
            
            <button
              onClick={checkAuth}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              检查认证状态
            </button>
          </div>

          {/* 当前次数显示 */}
          {currentCount !== null && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-2">当前浏览次数</h3>
              <p className="text-3xl font-bold text-blue-600">{currentCount}</p>
            </div>
          )}

          {/* 消息显示 */}
          {message && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800">{message}</p>
            </div>
          )}

          {/* 调试信息 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">调试信息</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>商品ID: {productId}</p>
              <p>当前次数: {currentCount ?? "未获取"}</p>
              <p>加载状态: {isLoading ? "是" : "否"}</p>
              <p>页面URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">使用说明</h2>
          <div className="space-y-2 text-gray-600">
            <p>1. 输入要测试的商品ID</p>
            <p>2. 点击"获取当前次数"查看当前浏览次数</p>
            <p>3. 点击"增加浏览次数"手动增加一次</p>
            <p>4. 点击"检查认证状态"验证用户权限</p>
            <p>5. 查看浏览器控制台的详细日志</p>
          </div>
        </div>
      </div>
    </div>
  )
}