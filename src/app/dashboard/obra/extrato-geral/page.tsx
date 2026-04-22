"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ExtratoGeralRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/despesas")
  }, [router])

  return null
}
