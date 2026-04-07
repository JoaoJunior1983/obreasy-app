"use client"

import { useRouter } from "next/navigation"
import AuthModal from "@/components/custom/auth-modal"

export default function CadastroPage() {
  const router = useRouter()

  return (
    <AuthModal
      onClose={() => router.push("/")}
      fromQuiz={true}
    />
  )
}
