import type React from "react"
import { Suspense } from "react"
import { CheckoutClient } from "@/components/checkout/checkout-client"

export const dynamic = "force-dynamic"

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}> 
      <CheckoutClient />
    </Suspense>
  )
}

