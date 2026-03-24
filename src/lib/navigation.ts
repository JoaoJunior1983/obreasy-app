/**
 * Helper centralizado para navegação no dashboard
 * Garante que "Voltar ao Dashboard" sempre leve para o dashboard da obra ativa
 */

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

/**
 * Navega para o dashboard da obra ativa
 * @param router - Instância do router do Next.js
 * @param obraId - ID da obra ativa (opcional, será buscado se não fornecido)
 */
export function goToObraDashboard(router: AppRouterInstance, obraId?: string): void {
  try {
    // Se obraId não foi fornecido, tentar buscar do localStorage
    let obraAtualId = obraId

    if (!obraAtualId && typeof window !== "undefined") {
      // Tentar obter obra ativa do localStorage
      const userData = localStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        const obrasExistentes = JSON.parse(localStorage.getItem("obras") || "[]")
        const obrasDoUsuario = obrasExistentes.filter((o: any) => o.userId === user.email)
        
        if (obrasDoUsuario.length > 0) {
          // Pegar a obra mais recente
          const obraMaisRecente = obrasDoUsuario[obrasDoUsuario.length - 1]
          obraAtualId = obraMaisRecente.id
        }
      }
    }

    // REGRA: Se existe obra ativa, vai para o dashboard da obra
    // Se não existe, vai para /dashboard (lista de obras ou seleção)
    // NUNCA vai para "/" (tela de boas-vindas)
    
    if (obraAtualId) {
      // Navegar para o dashboard da obra específica
      router.push("/dashboard/obra")
    } else {
      // Fallback: ir para /dashboard (lista de obras)
      router.push("/dashboard")
    }
  } catch (error) {
    console.error("Erro ao navegar para dashboard:", error)
    // Em caso de erro, ir para /dashboard como fallback seguro
    router.push("/dashboard")
  }
}

/**
 * Obtém o ID da obra ativa do localStorage
 * @returns ID da obra ativa ou null se não houver
 */
export function getObraAtualId(): string | null {
  if (typeof window === "undefined") return null

  try {
    const userData = localStorage.getItem("user")
    if (!userData) return null

    const user = JSON.parse(userData)
    const obrasExistentes = JSON.parse(localStorage.getItem("obras") || "[]")
    const obrasDoUsuario = obrasExistentes.filter((o: any) => o.userId === user.email)
    
    if (obrasDoUsuario.length > 0) {
      const obraMaisRecente = obrasDoUsuario[obrasDoUsuario.length - 1]
      return obraMaisRecente.id
    }

    return null
  } catch (error) {
    console.error("Erro ao obter obra atual:", error)
    return null
  }
}
