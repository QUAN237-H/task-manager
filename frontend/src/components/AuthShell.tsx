import { Link } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useState, type ReactNode } from 'react'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footerLeft: ReactNode
}

export function AuthShell({ title, subtitle, children, footerLeft }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh w-full bg-[#f7f4ef] lg:grid-cols-2">
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-8 sm:px-12 lg:items-stretch lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8 inline-flex w-fit items-center rounded-full border border-[#d9d4cc] px-4 py-1.5 text-[13px] font-medium text-[#2f2c28] sm:mb-10">
            Task Manager
          </div>

          <h1 className="text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] text-[#2b2926] sm:text-[42px]">
            {title}
          </h1>
          <p className="mt-3 text-[15px] font-medium text-[#8a8580]">{subtitle}</p>

          <div className="mt-9">{children}</div>

          <div className="mt-10 text-[13px] font-medium text-[#6f6a64]">
            {footerLeft}
          </div>
        </div>
      </div>

      <div className="hidden min-h-screen p-3 lg:block lg:p-3.5 xl:p-4">
        <div className="relative flex h-full min-h-[calc(100vh-1.5rem)] flex-col justify-end overflow-hidden rounded-[20px] xl:min-h-[calc(100vh-2rem)]">
          <img
            src="/auth-hero.jpg"
            alt="Planner notebook and checklist for tasks"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,41,38,0.25)_0%,rgba(43,41,38,0.55)_45%,rgba(43,41,38,0.88)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,215,110,0.22),transparent_50%)]" />
          <div className="relative z-10 max-w-md p-10 xl:p-12">
            <p className="text-[13px] font-semibold tracking-[0.08em] text-white/70 uppercase">
              Stay organized
            </p>
            <h2 className="mt-3 text-[36px] leading-[1.15] font-semibold tracking-[-0.03em] text-white xl:text-[42px]">
              Plan your day. Finish what matters.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed font-medium text-white/85">
              Create tasks, track progress, and keep work in sync across web and mobile —
              one clear inbox for everything you need to do.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-[#2b2926] underline underline-offset-2">
      {children}
    </Link>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-[13px] font-medium text-[#8a8580]">{children}</span>
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return <p className="mt-1.5 text-[12px] font-medium text-[#e34432]">{children}</p>
}

export const fieldClass =
  'w-full rounded-full border-0 bg-white px-5 py-3.5 text-[15px] font-medium text-[#2b2926] outline-none ring-1 ring-[#e8e4de] transition placeholder:text-[#b0aaa3] focus:ring-2 focus:ring-[#2b2926]/15'

export const fieldErrorClass = 'ring-[#e34432]/55 focus:ring-[#e34432]/35'

export const primaryBtnClass =
  'inline-flex w-full items-center justify-center rounded-full bg-[#f5d76e] px-5 py-3.5 text-[15px] font-semibold text-[#2b2926] transition hover:bg-[#efcd5a] disabled:cursor-not-allowed disabled:opacity-55'

export function PasswordField({
  value,
  onChange,
  autoComplete,
  placeholder = '••••••••••••',
  error,
}: {
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} pr-12 ${error ? fieldErrorClass : ''}`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute top-1/2 right-4 -translate-y-1/2 text-[#9a9590] hover:text-[#2b2926]"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}
