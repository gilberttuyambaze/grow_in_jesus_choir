const PASSWORD_MIN_LENGTH = 6

export function getPasswordRequirements(password: string) {
  const types = [
    /\p{Ll}/u.test(password),
    /\p{Lu}/u.test(password),
    /\p{N}/u.test(password),
    /[^\p{L}\p{N}]/u.test(password)
  ]
  const characterTypes = types.filter(Boolean).length

  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    characterTypes,
    hasEnoughCharacterTypes: characterTypes >= 3,
    isValid: password.length >= PASSWORD_MIN_LENGTH && characterTypes >= 3
  }
}
