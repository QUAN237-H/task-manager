import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type FormEvent,
  type HTMLAttributes,
  type RefObject,
  type SetStateAction,
  type ReactNode,
} from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  FiChevronDown,
  FiEdit2,
  FiList,
  FiLogOut,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { createPortal } from 'react-dom'
import { useAuth } from '@/auth'
import * as api from '@/api'
import type { Task, TaskStatus } from '@/types'
// import { TaskSidebar } from '@/components/TaskSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardSkeleton, Spinner } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { validateTaskDescription, validateTaskTitle } from '@/lib/validation'

const emptyForm = {
  title: '',
  description: '',
  status: 'TODO' as TaskStatus,
}

const COLUMNS: { id: TaskStatus; title: string; header: string }[] = [
  { id: 'TODO', title: 'To do', header: 'border-0 bg-[#e5e5e5] text-foreground' },
  { id: 'IN_PROGRESS', title: 'In progress', header: 'border-0 bg-foreground text-background' },
  { id: 'DONE', title: 'Done', header: 'border-0 bg-primary text-primary-foreground' },
]

const STATUS_BADGE =
  'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold'

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
}

function greetingPeriod() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function TaskCardView({
  task,
  ownerName,
  onEdit,
  onDelete,
  dragHandleProps,
  style,
  isDragging,
}: {
  task: Task
  ownerName: string
  onEdit?: (task: Task) => void
  onDelete?: (id: number) => void
  dragHandleProps?: HTMLAttributes<HTMLDivElement>
  style?: CSSProperties
  isDragging?: boolean
}) {
  const column = COLUMNS.find((c) => c.id === task.status)
  const displayName = ownerName.trim() || 'You'

  return (
    <div
      style={style}
      className={cn(
        'flex h-[168px] flex-col rounded-2xl border border-border/80 bg-card p-4',
        isDragging && 'opacity-90 ring-2 ring-primary/40',
      )}
      {...dragHandleProps}
    >
      <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
        <span className={cn(STATUS_BADGE, column?.header ?? 'border-0 bg-[#e5e5e5] text-foreground')}>
          {column?.title ?? 'Task'}
        </span>
        {(onEdit || onDelete) && (
          <div className="flex gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
            {onEdit && (
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
                <FiEdit2 size={13} />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:text-destructive"
                onClick={() => onDelete(task.id)}
              >
                <FiTrash2 size={13} />
              </Button>
            )}
          </div>
        )}
      </div>

      <h3 className="line-clamp-2 text-[15px] leading-snug font-bold tracking-[-0.01em] text-foreground">
        {task.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[12px] leading-relaxed font-medium text-muted-foreground">
        {task.description || 'No description added yet.'}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <FiList size={13} />
          {task.status === 'DONE' ? '1/1' : '0/1'}
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <Avatar className="h-6 w-6 shrink-0 border-2 border-card">
            <AvatarFallback className="bg-foreground text-[8px] font-bold text-background">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-[11px] font-semibold text-foreground">{displayName}</span>
        </div>
      </div>
    </div>
  )
}

function SortableTaskCard({
  task,
  ownerName,
  onEdit,
  onDelete,
}: {
  task: Task
  ownerName: string
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(task.id),
    data: { status: task.status, task },
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
  }

  return (
    <div ref={setNodeRef}>
      <TaskCardView
        task={task}
        ownerName={ownerName}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        style={style}
        isDragging={isDragging}
      />
    </div>
  )
}

function DroppableColumn({
  column,
  tasks,
  ownerName,
  columnSearch,
  onColumnSearch,
  onEdit,
  onDelete,
}: {
  column: (typeof COLUMNS)[number]
  tasks: Task[]
  ownerName: string
  columnSearch: string
  onColumnSearch: (value: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const filtered = useMemo(() => {
    const q = columnSearch.trim().toLowerCase()
    if (!q) return tasks
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false),
    )
  }, [tasks, columnSearch])

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className={cn('mb-2 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold', column.header)}>
        {column.title}
        <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums">
          {filtered.length}
        </span>
      </div>
      <div className="relative mb-2.5">
        <FiSearch className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={columnSearch}
          onChange={(e) => onColumnSearch(e.target.value)}
          placeholder="Search…"
          className="h-8 rounded-xl border-0 bg-secondary/80 pr-2 pl-8 text-[12px] shadow-none"
        />
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[200px] space-y-3 rounded-md p-0.5 transition-colors lg:min-h-0 lg:flex-1 lg:overflow-y-auto',
          isOver && 'bg-accent/60',
        )}
      >
        <SortableContext items={filtered.map((t) => String(t.id))} strategy={verticalListSortingStrategy}>
          {filtered.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border px-3 py-8 text-center text-[12px] font-medium text-muted-foreground">
              {tasks.length === 0 ? 'Drop tasks here' : 'No matches'}
            </p>
          )}
          {filtered.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              ownerName={ownerName}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

function FloatingField({
  id,
  label,
  value,
  onChange,
  inputRef,
  clearable,
  onClear,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  inputRef?: RefObject<HTMLInputElement | null>
  clearable?: boolean
  onClear?: () => void
  error?: string
}) {
  const [focused, setFocused] = useState(false)
  const raised = focused || value.length > 0

  return (
    <div className="relative pt-4">
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-0 origin-left font-bold transition-all duration-200 ease-out',
          raised
            ? 'top-0 text-[11px] text-foreground'
            : 'top-7 text-[13px] text-muted-foreground',
          error && raised && 'text-destructive',
        )}
      >
        {label}
      </label>
      <Input
        id={id}
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className={cn(
          'h-9 rounded-none border-0 border-b-2 border-foreground/25 bg-transparent px-0 text-[13px] font-medium shadow-none focus-visible:border-foreground focus-visible:ring-0',
          focused && 'border-foreground',
          error && 'border-destructive focus-visible:border-destructive',
          clearable && value && 'pr-7',
        )}
      />
      {clearable && value && onClear && (
        <button
          type="button"
          className="absolute right-0 bottom-2.5 text-muted-foreground"
          onClick={onClear}
        >
          <FiX size={14} />
        </button>
      )}
      {error ? <p className="mt-1.5 text-[11px] font-medium text-destructive">{error}</p> : null}
    </div>
  )
}

function GrowingTextarea({
  id,
  label,
  value,
  onChange,
  onClear,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onClear: () => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)
  const raised = focused || value.length > 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 36)}px`
  }, [value])

  return (
    <div className="relative pt-4">
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-0 origin-left font-bold transition-all duration-200 ease-out',
          raised
            ? 'top-0 text-[11px] text-foreground'
            : 'top-7 text-[13px] text-muted-foreground',
        )}
      >
        {label}
      </label>
      <Textarea
        id={id}
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className={cn(
          'min-h-9 resize-none overflow-hidden rounded-none border-0 border-b-2 border-foreground/25 bg-transparent px-0 py-2 text-[13px] font-medium shadow-none focus-visible:border-foreground focus-visible:ring-0',
          focused && 'border-foreground',
          value && 'pr-7',
        )}
      />
      {value.length > 0 && (
        <button
          type="button"
          className="absolute right-0 bottom-2.5 text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  )
}

function TaskCreateForm({
  form,
  setForm,
  saving,
  editingId,
  onSubmit,
  onCancel,
  titleInputRef,
}: {
  form: typeof emptyForm
  setForm: Dispatch<SetStateAction<typeof emptyForm>>
  saving: boolean
  editingId: number | null
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  titleInputRef?: RefObject<HTMLInputElement | null>
}) {
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = {
      title: validateTaskTitle(form.title),
      description: validateTaskDescription(form.description),
    }
    setErrors(next)
    if (next.title || next.description) return
    onSubmit(e)
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] leading-tight font-bold tracking-[-0.02em] text-foreground">
            {editingId ? 'Edit task' : 'Create a new task'}
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed font-medium text-muted-foreground">
            {editingId
              ? 'Update the details below, then save your changes.'
              : 'Add a title, pick a status, and describe the work.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="grid size-7 shrink-0 place-content-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          aria-label="Close"
        >
          <FiX size={15} />
        </button>
      </header>

      <div className="flex flex-col gap-4">
        <FloatingField
          id="task-title"
          label="Title"
          value={form.title}
          error={errors.title}
          onChange={(title) => {
            setForm((f) => ({ ...f, title }))
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
          }}
          inputRef={titleInputRef}
          clearable
          onClear={() => setForm((f) => ({ ...f, title: '' }))}
        />

        <div>
          <label
            htmlFor="task-status"
            className="mb-1.5 block text-[11px] font-bold text-foreground"
          >
            Status
          </label>
          <Select
            value={form.status}
            onValueChange={(value) => setForm((f) => ({ ...f, status: value as TaskStatus }))}
          >
            <SelectTrigger
              id="task-status"
              className="h-9 rounded-lg border-border/40 bg-background/50"
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <GrowingTextarea
            id="task-description"
            label="Description"
            value={form.description}
            onChange={(description) => {
              setForm((f) => ({ ...f, description }))
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }))
            }}
            onClear={() => setForm((f) => ({ ...f, description: '' }))}
          />
          {errors.description ? (
            <p className="mt-1.5 text-[11px] font-medium text-destructive">{errors.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex gap-2 border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="h-10 flex-1 rounded-xl text-[13px] font-semibold text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="h-10 flex-[1.4] gap-2 rounded-xl text-[13px] font-semibold"
        >
          {saving ? <Spinner size={14} /> : null}
          {saving ? 'Saving…' : editingId ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

function UserMenu({
  name,
  email,
  onLogout,
}: {
  name: string
  email: string
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full py-0.5 pr-1 pl-0.5 transition hover:bg-secondary"
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-foreground text-[11px] font-bold text-background">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <FiChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-[13px] font-semibold">{name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-secondary"
          >
            <FiLogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function MobileFormDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setVisible(true))
      })
      return () => window.cancelAnimationFrame(id)
    }

    setVisible(false)
    const t = window.setTimeout(() => setMounted(false), 320)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] lg:hidden" aria-modal="true" role="dialog">
      <button
        type="button"
        aria-label="Close form"
        data-open={visible}
        className="drawer-backdrop absolute inset-0 bg-foreground/25"
        onClick={onClose}
      />
      <div
        data-open={visible}
        className="drawer-sheet absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[20px] border border-border bg-[var(--sidebar)] p-4 shadow-[0_-8px_30px_rgba(43,41,38,0.12)] sm:p-5"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>('TODO')
  const [mobileFormOpen, setMobileFormOpen] = useState(false)
  const [mobileListSearch, setMobileListSearch] = useState('')
  const [columnSearch, setColumnSearch] = useState<Record<TaskStatus, string>>({
    TODO: '',
    IN_PROGRESS: '',
    DONE: '',
  })
  const searchRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const formPanelRef = useRef<HTMLDivElement>(null)
  const hasLoadedOnce = useRef(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const loadTasks = useCallback(async () => {
    if (!hasLoadedOnce.current) setLoading(true)
    try {
      setTasks(await api.fetchTasks('', debouncedSearch))
      hasLoadedOnce.current = true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load tasks')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const todo = useMemo(() => tasks.filter((t) => t.status === 'TODO'), [tasks])
  const inProgress = useMemo(() => tasks.filter((t) => t.status === 'IN_PROGRESS'), [tasks])
  const done = useMemo(() => tasks.filter((t) => t.status === 'DONE'), [tasks])

  const byColumn: Record<TaskStatus, Task[]> = {
    TODO: todo,
    IN_PROGRESS: inProgress,
    DONE: done,
  }

  const mobileTasks = useMemo(() => {
    const q = mobileListSearch.trim().toLowerCase()
    return tasks.filter(
      (t) =>
        t.status === mobileStatus &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false)),
    )
  }, [tasks, mobileStatus, mobileListSearch])

  function openMobileForm() {
    setMobileFormOpen(true)
    window.setTimeout(() => titleRef.current?.focus(), 80)
  }

  function closeMobileForm() {
    setMobileFormOpen(false)
    window.setTimeout(() => resetForm(), 320)
  }

  function startEdit(task: Task) {
    setEditingId(task.id)
    setForm({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
    })
    const isMobile = window.matchMedia('(max-width: 1023px)').matches
    if (isMobile) {
      openMobileForm()
    } else {
      window.setTimeout(() => {
        formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        titleRef.current?.focus()
      }, 50)
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function startNewTask() {
    resetForm()
    openMobileForm()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
      }
      if (editingId) {
        await api.updateTask(editingId, payload)
        toast.success('Task updated')
      } else {
        await api.createTask(payload)
        toast.success('Task created')
      }
      setMobileFormOpen(false)
      window.setTimeout(() => resetForm(), 320)
      await loadTasks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function requestDelete(id: number) {
    const task = tasks.find((t) => t.id === id) ?? null
    setDeleteTarget(task)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteTask(deleteTarget.id)
      toast.success('Task deleted')
      if (editingId === deleteTarget.id) {
        setMobileFormOpen(false)
        window.setTimeout(() => resetForm(), 320)
      }
      setDeleteTarget(null)
      await loadTasks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  function onDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => String(t.id) === String(event.active.id))
    setActiveTask(task ?? null)
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = Number(active.id)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    let nextStatus: TaskStatus | null = null
    const overId = String(over.id)

    if (overId === 'TODO' || overId === 'IN_PROGRESS' || overId === 'DONE') {
      nextStatus = overId
    } else {
      const overTask = tasks.find((t) => String(t.id) === overId)
      if (overTask) nextStatus = overTask.status
    }

    if (!nextStatus || nextStatus === task.status) return

    const previous = tasks
    setTasks((curr) =>
      curr.map((t) =>
        t.id === taskId ? { ...t, status: nextStatus!, updatedAt: new Date().toISOString() } : t,
      ),
    )

    try {
      await api.updateTask(taskId, {
        title: task.title,
        description: task.description ?? undefined,
        status: nextStatus,
      })
      toast.success(`Moved to ${COLUMNS.find((c) => c.id === nextStatus)?.title}`)
    } catch (err) {
      setTasks(previous)
      toast.error(err instanceof Error ? err.message : 'Could not move task')
    }
  }

  return (
    <div className="animate-rise min-h-svh bg-background lg:flex lg:h-svh lg:flex-col lg:overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 p-2 sm:p-3 lg:p-3.5 xl:p-4">
        <div className="flex w-full min-w-0 flex-1 flex-col rounded-xl bg-card sm:rounded-[20px] lg:min-h-0 lg:overflow-hidden">
          <header className="flex shrink-0 flex-col gap-3 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-3.5">
            <div className="flex min-w-0 items-center justify-between gap-3 sm:flex-1">
              <h1 className="truncate text-[18px] font-bold tracking-[-0.03em] text-foreground sm:text-[24px]">
                Good {greetingPeriod()}, {user?.name?.split(' ')[0] ?? 'there'}
              </h1>
              <div className="flex shrink-0 items-center gap-2 sm:hidden">
                <UserMenu
                  name={user?.name ?? 'User'}
                  email={user?.email ?? ''}
                  onLogout={() => setLogoutOpen(true)}
                />
              </div>
            </div>
            <div className="relative w-full sm:mx-0 sm:max-w-sm sm:flex-1 lg:max-w-xs lg:flex-none">
              <FiSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search here"
                className="h-10 rounded-xl border-0 bg-secondary pl-10 text-[13px] shadow-none"
              />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <UserMenu
                name={user?.name ?? 'User'}
                email={user?.email ?? ''}
                onLogout={() => setLogoutOpen(true)}
              />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-card p-3 sm:gap-5 sm:p-5 lg:flex-row lg:overflow-hidden">
            <section className="flex min-w-0 flex-1 flex-col gap-4 lg:min-h-0">
              {loading ? (
                <DashboardSkeleton />
              ) : (
                <>
              <div className="shrink-0">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-3">
                  <Card className="border-0 bg-[#e8f3ea] shadow-none">
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-[11px] font-medium text-[#3d6b52] sm:text-[12px]">Done</p>
                      <p className="mt-0.5 text-[20px] font-bold tracking-[-0.03em] text-foreground sm:mt-1 sm:text-[28px]">
                        {done.length}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#2f9e5d] sm:mt-1 sm:text-[11px]">
                        <FiTrendingUp size={12} />
                        <span className="truncate">{tasks.length} total tasks</span>
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-[#f5ebe3] shadow-none">
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-[11px] font-medium text-[#8a5a3d] sm:text-[12px]">In progress</p>
                      <p className="mt-0.5 text-[20px] font-bold tracking-[-0.03em] text-foreground sm:mt-1 sm:text-[28px]">
                        {inProgress.length}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#b45309] sm:mt-1 sm:text-[11px]">
                        <FiTrendingUp size={12} />
                        <span className="truncate">Active now</span>
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="col-span-2 border-0 bg-accent shadow-none lg:col-span-1">
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-[11px] font-medium text-[#6b5a2a] sm:text-[12px]">To do</p>
                      <p className="mt-0.5 text-[20px] font-bold tracking-[-0.03em] text-foreground sm:mt-1 sm:text-[28px]">
                        {todo.length}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#6b5a2a] sm:mt-1 sm:text-[11px]">
                        <FiTrendingUp size={12} />
                        <span className="truncate">{tasks.length} total · queued</span>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Mobile: status filter + list (no kanban) */}
              <div className="flex flex-col gap-3 lg:hidden">
                <div className="flex h-10 items-stretch gap-2">
                  <Select
                    value={mobileStatus}
                    onValueChange={(value) => setMobileStatus(value as TaskStatus)}
                  >
                    <SelectTrigger className="h-full min-h-0 flex-1 rounded-xl border-0 bg-secondary/80 text-[13px] font-medium shadow-none">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="lg"
                    onClick={startNewTask}
                    className="h-full min-h-10 shrink-0 gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold"
                  >
                    <FiPlus size={15} />
                    New task
                  </Button>
                </div>

                <div className="relative">
                  <FiSearch className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={mobileListSearch}
                    onChange={(e) => setMobileListSearch(e.target.value)}
                    placeholder="Search…"
                    className="h-10 rounded-xl border-0 bg-secondary/80 pr-3 pl-9 text-[13px] font-medium shadow-none"
                  />
                </div>

                <div className="space-y-3">
                  {mobileTasks.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border px-3 py-10 text-center text-[12px] font-medium text-muted-foreground">
                      No tasks in {STATUS_LABELS[mobileStatus].toLowerCase()}
                    </p>
                  ) : (
                    mobileTasks.map((task) => (
                      <TaskCardView
                        key={task.id}
                        task={task}
                        ownerName={user?.name ?? ''}
                        onEdit={startEdit}
                        onDelete={requestDelete}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Desktop: kanban */}
              <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragEnd={(e) => void onDragEnd(e)}
                  >
                    <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
                      {COLUMNS.map((column) => (
                        <div key={column.id} className="flex min-h-0 min-w-0 flex-col">
                          <DroppableColumn
                            column={column}
                            tasks={byColumn[column.id]}
                            ownerName={user?.name ?? ''}
                            columnSearch={columnSearch[column.id]}
                            onColumnSearch={(value) =>
                              setColumnSearch((prev) => ({ ...prev, [column.id]: value }))
                            }
                            onEdit={startEdit}
                            onDelete={requestDelete}
                          />
                        </div>
                      ))}
                    </div>
                    <DragOverlay>
                      {activeTask ? (
                        <TaskCardView
                          task={activeTask}
                          ownerName={user?.name ?? ''}
                          isDragging
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
              </div>
                </>
              )}
            </section>

            <aside
              ref={formPanelRef}
              className="hidden w-full shrink-0 lg:block lg:w-[300px] lg:self-stretch xl:w-[320px]"
            >
              <div className="rounded-2xl border border-border/70 bg-[var(--sidebar)] p-4 shadow-[0_1px_0_rgba(43,41,38,0.04)] sm:p-5 lg:sticky lg:top-0">
                <TaskCreateForm
                  form={form}
                  setForm={setForm}
                  saving={saving}
                  editingId={editingId}
                  onSubmit={onSubmit}
                  onCancel={resetForm}
                  titleInputRef={titleRef}
                />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <MobileFormDrawer open={mobileFormOpen} onClose={closeMobileForm}>
        <TaskCreateForm
          form={form}
          setForm={setForm}
          saving={saving}
          editingId={editingId}
          onSubmit={onSubmit}
          onCancel={closeMobileForm}
          titleInputRef={titleRef}
        />
      </MobileFormDrawer>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.title}” will be permanently removed. This cannot be undone.`
                : 'This task will be permanently removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="gap-2"
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
            >
              {deleting ? <Spinner size={14} /> : null}
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You’ll need to sign in again to manage your tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                setLogoutOpen(false)
                logout()
              }}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
