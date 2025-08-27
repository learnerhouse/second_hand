import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 获取用户信息并更新profile
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        // 更新用户profile信息
        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || "",
          user_type: user.user_metadata?.user_type || "buyer",
        })

        // 根据用户类型重定向
        const userType = user.user_metadata?.user_type
        if (userType === "admin") {
          return NextResponse.redirect(`${origin}/admin`)
        } else if (userType === "seller") {
          return NextResponse.redirect(`${origin}/seller`)
        } else {
          return NextResponse.redirect(`${origin}/marketplace`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 验证失败，重定向到错误页面
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
