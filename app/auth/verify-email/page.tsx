import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <CardTitle className="text-2xl">验证您的邮箱</CardTitle>
            <CardDescription>我们已向您的邮箱发送了验证链接，请点击链接完成账户验证。</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-6">没有收到邮件？请检查垃圾邮件文件夹，或稍后重试。</p>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/auth/login">返回登录</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
