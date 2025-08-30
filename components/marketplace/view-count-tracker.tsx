"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface ViewCountTrackerProps {
  productId: string
  initialViewCount: number
  isOwner: boolean
  isActive: boolean
}

export function ViewCountTracker({ 
  productId, 
  initialViewCount, 
  isOwner, 
  isActive 
}: ViewCountTrackerProps) {
  const [viewCount, setViewCount] = useState(initialViewCount)
  const [hasTracked, setHasTracked] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const supabase = createClient()
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    // 如果不是商品所有者且商品是活跃状态，则跟踪浏览次数
    if (!isOwner && isActive && !hasTrackedRef.current && !isTracking) {
      const trackView = async () => {
        try {
          setIsTracking(true)
          console.log(`[ViewCountTracker] 开始跟踪商品 ${productId} 的浏览次数`)
          
          // 检查本地存储，防止重复计数
          const viewKey = `product_view_${productId}`
          const hasViewed = localStorage.getItem(viewKey)
          
          if (!hasViewed) {
            console.log(`[ViewCountTracker] 本地存储中未找到记录，准备更新数据库`)
            
            // 直接使用当前数据库中的 view_count 值，而不是本地状态
            const { data, error } = await supabase
              .from("products")
              .update({ 
                view_count: initialViewCount + 1,
                updated_at: new Date().toISOString()
              })
              .eq("id", productId)
              .select("view_count")
              .single()

            if (!error && data) {
              console.log(`[ViewCountTracker] 成功更新浏览次数: ${data.view_count}`)
              setViewCount(data.view_count)
              // 标记为已查看，防止重复计数
              localStorage.setItem(viewKey, Date.now().toString())
              hasTrackedRef.current = true
              setHasTracked(true)
            } else {
              console.error("[ViewCountTracker] 更新浏览次数失败:", error)
              // 即使失败也标记为已跟踪，避免重复尝试
              hasTrackedRef.current = true
              setHasTracked(true)
            }
          } else {
            console.log(`[ViewCountTracker] 本地存储中已有记录，跳过更新`)
            // 已经查看过，标记为已跟踪
            hasTrackedRef.current = true
            setHasTracked(true)
          }
        } catch (error) {
          console.error("[ViewCountTracker] 跟踪浏览次数时发生错误:", error)
          // 即使发生错误也标记为已跟踪，避免重复尝试
          hasTrackedRef.current = true
          setHasTracked(true)
        } finally {
          setIsTracking(false)
        }
      }

      // 延迟执行，确保页面完全加载
      const timer = setTimeout(trackView, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [productId, isOwner, isActive, initialViewCount, supabase]) // 移除了 viewCount 和 hasTracked 依赖

  // 这个组件不渲染任何内容，只负责跟踪浏览次数
  return null
}