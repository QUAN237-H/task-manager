import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ApiError } from '../api'
import { useAuth } from '../auth'
import {
  AuthLink,
  AuthShell,
  FieldError,
  FieldLabel,
  PasswordField,
  fieldClass,
  fieldErrorClass,
  primaryBtnClass,
} from '../components/AuthShell'
import { Spinner } from '@/components/ui/skeleton'
import { validateEmail, validatePassword } from '@/lib/validation'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setErrors(next)
    return !next.email && !next.password
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError) {
        const next = {
          email: err.fields.email,
          password: err.fields.password,
        }
        if (next.email || next.password) setErrors(next)
        toast.error(err.message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in and get back to your tasks"
      footerLeft={
        <>
          Have any account? <AuthLink to="/register">Sign up</AuthLink>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <FieldLabel>Email</FieldLabel>
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
            }}
            className={`${fieldClass} ${errors.email ? fieldErrorClass : ''}`}
            placeholder="you@example.com"
          />
          <FieldError>{errors.email}</FieldError>
        </label>
        <label className="block">
          <FieldLabel>Password</FieldLabel>
          <PasswordField
            value={password}
            error={errors.password}
            onChange={(value) => {
              setPassword(value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={loading} className={`${primaryBtnClass} mt-2 gap-2`}>
          {loading ? <Spinner size={16} /> : null}
          {loading ? 'Signing in…' : 'Submit'}
        </button>
      </form>
    </AuthShell>
  )
}
