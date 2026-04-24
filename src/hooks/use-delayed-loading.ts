import { useEffect, useState } from "react"

/**
 * Retorna `true` apenas se `loading` continuar `true` por mais de `delayMs`.
 * Quando o fetch resolve rápido, o loader nunca chega a ser mostrado — o
 * usuário vê a tela aparecer direto com os dados, sem flash de "Carregando...".
 */
export function useDelayedLoading(loading: boolean, delayMs = 400): boolean {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!loading) {
      setShow(false)
      return
    }
    const timer = setTimeout(() => setShow(true), delayMs)
    return () => clearTimeout(timer)
  }, [loading, delayMs])

  return show
}
