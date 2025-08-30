"use client"

import { useEffect, useState } from "react"
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
  const supabase = createClient()

  useEffect(() => {
    // 如果不是商品所有者且商品是活跃状态，则跟踪浏览次数
    if (!isOwner && isActive && !hasTracked) {
      const trackView = async () => {
        try {
          // 检查本地存储，防止重复计数
          const viewKey = `product_view_${productId}`
          const hasViewed = localStorage.getItem(viewKey)
          
          if (!hasViewed) {
            // 增加浏览次数
            const { data, error } = await supabase
              .from("products")
              .update({ 
                view_count: viewCount + 1,
                updated_at: new Date().toISOString()
              })
              .eq("id", productId)
              .select("view_count")
              .single()

            if (!error && data) {
              setViewCount(data.view_count)
              // 标记为已查看，防止重复计数
              localStorage.setItem(viewKey, Date.now().toString())
              setHasTracked(true)
            } else {
              console.error("Failed to update view count:", error)
            }
          } else {
            // 已经查看过，标记为已跟踪
            setHasTracked(true)
          }
        } catch (error) {
          console.error("Error tracking view:", error)
        }
      }

      // 延迟执行，确保页面完全加载
      const timer = setTimeout(trackView, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [productId, isOwner, isActive, hasTracked, viewCount, supabase])

  // 这个组件不渲染任何内容，只负责跟踪浏览次数
  return null
}