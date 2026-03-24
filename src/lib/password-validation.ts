/**
 * Validação robusta de senhas com regras de segurança
 * Conforme requisitos do sistema OBREASY
 */

export interface PasswordValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Valida se a senha atende aos critérios de segurança:
 * - Mínimo de 6 caracteres
 * - Bloqueia sequências numéricas óbvias (123456, etc)
 * - Bloqueia caracteres repetidos (111111, etc)
 * - Bloqueia sequências alfabéticas óbvias (abcdef, etc)
 * - Exige pelo menos 2 tipos de caracteres (letras e números)
 */
export function validatePassword(password: string): PasswordValidationResult {
  // Regra 1: Mínimo de 6 caracteres
  if (password.length < 6) {
    return {
      isValid: false,
      error: "A senha deve ter no mínimo 6 caracteres."
    }
  }

  // Regra 2: Bloquear senhas com caracteres repetidos (ex: 111111, aaaaaa)
  const hasOnlyRepeatedChars = /^(.)\1+$/.test(password)
  if (hasOnlyRepeatedChars) {
    return {
      isValid: false,
      error: "A senha não pode conter apenas o mesmo caractere repetido."
    }
  }

  // Regra 3: Bloquear sequências numéricas óbvias
  const numericSequences = [
    "123456", "654321", "012345", "234567", "345678", "456789",
    "111111", "222222", "333333", "444444", "555555", "666666",
    "777777", "888888", "999999", "000000"
  ]

  for (const seq of numericSequences) {
    if (password.includes(seq)) {
      return {
        isValid: false,
        error: "Por favor, escolha uma senha mais segura. Evite sequências numéricas simples."
      }
    }
  }

  // Regra 4: Bloquear sequências alfabéticas óbvias
  const alphabeticSequences = [
    "abcdef", "bcdefg", "cdefgh", "defghi", "efghij",
    "fedcba", "gfedcb", "hgfedc", "ihgfed", "jihgfe",
    "qwerty", "asdfgh", "zxcvbn"
  ]

  const lowerPassword = password.toLowerCase()
  for (const seq of alphabeticSequences) {
    if (lowerPassword.includes(seq)) {
      return {
        isValid: false,
        error: "Por favor, escolha uma senha mais segura. Evite sequências alfabéticas simples."
      }
    }
  }

  // Regra 5: Exigir pelo menos 2 tipos diferentes de caracteres
  const hasLetters = /[a-zA-Z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)

  const charTypeCount = [hasLetters, hasNumbers].filter(Boolean).length

  if (charTypeCount < 2) {
    return {
      isValid: false,
      error: "A senha deve conter pelo menos letras e números."
    }
  }

  // Senha válida
  return {
    isValid: true
  }
}

/**
 * Valida se duas senhas coincidem
 */
export function validatePasswordMatch(password: string, confirmPassword: string): PasswordValidationResult {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: "As senhas não coincidem. Por favor, verifique."
    }
  }

  return {
    isValid: true
  }
}
