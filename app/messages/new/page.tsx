import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { MessagesLayout } from "@/components/messages/messages-layout"
import { NewMessageForm } from "@/components/messages/new-message-form"

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: { product?: string; seller?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!searchParams.product || !searchParams.seller) {
    notFound()
  }

  // 获取商品信息
  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      seller:profiles!seller_id(id, full_name, avatar_url),
      category:categories(name, icon)
    `)
    .eq("id", searchParams.product)
    .single()

  if (!product) {
    notFound()
  }

  // 获取卖家信息
  const { data: seller } = await supabase.from("profiles").select("*").eq("id", searchParams.seller).single()

  if (!seller) {
    notFound()
  }

  return (
    <MessagesLayout user={user} profile={profile}>
      <NewMessageForm product={product} seller={seller} currentUser={user} />
    </MessagesLayout>
  )
}
