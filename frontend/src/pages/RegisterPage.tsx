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
import { validateEmail, validateName, validatePassword } from '@/lib/validation'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const next = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setErrors(next)
    return !next.name && !next.email && !next.password
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(name.trim(), email.trim(), password)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError) {
        const next = {
          name: err.fields.name,
          email: err.fields.email,
          password: err.fields.password,
        }
        if (next.name || next.email || next.password) {
          setErrors(next)
        }
        toast.error(err.message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create an account"
      subtitle="Sign up and start managing your tasks"
      footerLeft={
        <>
          Have any account? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <FieldLabel>Full name</FieldLabel>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            className={`${fieldClass} ${errors.name ? fieldErrorClass : ''}`}
            placeholder="Amélie Laurent"
          />
          <FieldError>{errors.name}</FieldError>
        </label>
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
            autoComplete="new-password"
          />
        </label>
        <button type="submit" disabled={loading} className={`${primaryBtnClass} mt-2 gap-2`}>
          {loading ? <Spinner size={16} /> : null}
          {loading ? 'Creating…' : 'Submit'}
        </button>
      </form>
    </AuthShell>
  )
}
