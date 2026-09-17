const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateName(value: string): string | undefined {
  const v = value.trim()
  if (!v) return 'Name is required'
  if (v.length < 2) return 'Name must be at least 2 characters'
  if (v.length > 80) return 'Name must be under 80 characters'
  return undefined
}

export function validateEmail(value: string): string | undefined {
  const v = value.trim()
  if (!v) return 'Email is required'
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address'
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required'
  if (value.length < 6) return 'Password must be at least 6 characters'
  if (value.length > 72) return 'Password must be under 72 characters'
  return undefined
}

export function validateTaskTitle(value: string): string | undefined {
  const v = value.trim()
  if (!v) return 'Title is required'
  if (v.length > 120) return 'Title must be under 120 characters'
  return undefined
}

export function validateTaskDescription(value: string): string | undefined {
  if (value.trim().length > 1000) return 'Description must be under 1000 characters'
  return undefined
}
