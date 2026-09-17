import {
  FiCheckCircle,
  FiChevronDown,
  FiGrid,
  FiLogOut,
} from 'react-icons/fi'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const STATUSES: { id: string; label: string; dot: string }[] = [
  { id: 'TODO', label: 'Coming next', dot: 'bg-[#c4c4c4]' },
  { id: 'IN_PROGRESS', label: 'In progress', dot: 'bg-foreground' },
  { id: 'DONE', label: 'Completed', dot: 'bg-primary' },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TaskSidebar({
  nav,
  onNavChange,
  doneCount,
  inProgressCount,
  totalCount,
  userName,
  userEmail,
  onLogout,
}: {
  nav: string
  onNavChange: (id: string) => void
  doneCount: number
  inProgressCount: number
  totalCount: number
  userName: string
  userEmail: string
  onLogout: () => void
}) {
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0
  const todoCount = Math.max(totalCount - doneCount - inProgressCount, 0)
  const counts: Record<string, number> = {
    TODO: todoCount,
    IN_PROGRESS: inProgressCount,
    DONE: doneCount,
  }
  const dashActive = nav === 'dashboard' || nav.startsWith('status:')

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col overflow-hidden bg-background text-foreground">
      <div className="shrink-0 px-3 pt-4 pb-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-black/5"
        >
          <div className="grid size-8 place-content-center rounded-lg bg-primary text-primary-foreground">
            <FiCheckCircle className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold tracking-[-0.02em]">Task Manager</p>
            <p className="truncate text-[11px] text-muted-foreground">Personal workspace</p>
          </div>
          <FiChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5">
        <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Menu
        </p>

        <button
          type="button"
          onClick={() => onNavChange('dashboard')}
          className={cn(
            'flex h-9 w-full items-center gap-2.5 px-2.5 text-left text-[13px] font-medium transition-colors',
            dashActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <FiGrid className="size-4 shrink-0" />
          Dashboard
        </button>

        {/* Tree with visible branches */}
        <ul className="ml-[18px] list-none">
          {STATUSES.map((status, i) => {
            const active = nav === `status:${status.id}`
            const isLast = i === STATUSES.length - 1
            return (
              <li key={status.id} className="relative">
                {/* vertical trunk */}
                <span
                  className={cn(
                    'pointer-events-none absolute top-0 left-0 w-px bg-[#cfc6ba]',
                    isLast ? 'h-4' : 'h-full',
                  )}
                  aria-hidden
                />
                {/* horizontal branch */}
                <span
                  className="pointer-events-none absolute top-4 left-0 h-px w-3.5 bg-[#cfc6ba]"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => onNavChange(`status:${status.id}`)}
                  className={cn(
                    'flex h-8 w-full items-center gap-2 pr-2 pl-5 text-left text-[12px] font-medium transition-colors',
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className={cn('size-1.5 shrink-0 rounded-full', status.dot)} />
                  <span className="min-w-0 flex-1 truncate">{status.label}</span>
                  <span className="tabular-nums text-[11px] text-muted-foreground">
                    {counts[status.id]}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="shrink-0 space-y-3 px-3 pt-2 pb-4">
        <div className="rounded-xl bg-secondary/80 px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-muted-foreground">Progress</span>
            <span className="tabular-nums text-foreground">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-card">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
            {doneCount} of {totalCount} tasks done
          </p>
        </div>

        <div className="flex items-center gap-2 px-1 py-1">
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-foreground text-[10px] font-bold text-background">
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold">{userName}</p>
            <p className="truncate text-[10px] text-muted-foreground">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="grid size-8 place-content-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <FiLogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
