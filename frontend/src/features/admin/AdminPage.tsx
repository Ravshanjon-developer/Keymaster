import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router'

import { useAuthStore } from '@/features/auth/authStore'
import { GlassCard, Skeleton } from '@/shared/components/ui'
import { useT } from '@/shared/i18n'
import {
  api,
  type AdminAchievementBody,
  type AdminAchievementDto,
  type AdminCourseBody,
  type AdminLessonBody,
  type AdminUserDto,
  type CourseDetailDto,
  type CourseDto,
  type LessonDto,
} from '@/shared/lib/api'
import { cn } from '@/shared/lib/utils'

type Tab = 'overview' | 'courses' | 'users' | 'achievements'

function parseKeys(raw: string): string[] {
  return raw
    .split('+')
    .map((k) => k.trim())
    .filter(Boolean)
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink-soft dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function inputClass() {
  return 'input-field w-full'
}

export function AdminPage() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('overview')
  const [courseId, setCourseId] = useState<string | null>(null)

  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-ink dark:text-white">{t('admin.forbidden')}</h1>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('admin.tabOverview') },
    { id: 'courses', label: t('admin.tabCourses') },
    { id: 'users', label: t('admin.tabUsers') },
    { id: 'achievements', label: t('admin.tabAchievements') },
  ]

  return (
    <div className="page-mesh mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-page-title">{t('admin.title')}</h1>
      <p className="text-muted mt-1">{t('admin.subtitle')}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id)
              if (item.id !== 'courses') setCourseId(null)
            }}
            className={cn(
              'rounded-lg px-3.5 py-2 text-sm font-semibold transition',
              tab === item.id
                ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-ink'
                : 'bg-ink/[0.05] text-ink hover:bg-ink/[0.08] dark:bg-white/5 dark:text-slate-200',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'courses' &&
          (courseId ? (
            <CourseEditor courseId={courseId} onBack={() => setCourseId(null)} />
          ) : (
            <CoursesTab onOpen={setCourseId} />
          ))}
        {tab === 'users' && <UsersTab />}
        {tab === 'achievements' && <AchievementsTab />}
      </div>
    </div>
  )
}

function OverviewTab() {
  const t = useT()
  const { data, isLoading } = useQuery({ queryKey: ['admin-overview'], queryFn: api.admin.overview })
  if (isLoading) return <Skeleton className="h-40 w-full" />
  if (!data) return null
  const cards = [
    { label: t('admin.users'), value: data.users },
    { label: t('admin.courses'), value: data.courses },
    { label: t('admin.lessons'), value: data.lessons },
    { label: t('admin.achievements'), value: data.achievements },
    { label: t('admin.completed'), value: data.lessons_completed },
    { label: t('admin.admins'), value: data.admins },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <GlassCard key={c.label} className="!p-5">
          <p className="text-sm text-ink-soft dark:text-slate-400">{c.label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-ink dark:text-white">{c.value}</p>
        </GlassCard>
      ))}
    </div>
  )
}

function CoursesTab({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useT()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<AdminCourseBody>({
    slug: '',
    title: '',
    description: '',
    icon: 'keyboard',
    sort_order: 0,
  })

  const { data, isLoading } = useQuery({ queryKey: ['admin-courses'], queryFn: api.admin.courses })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data ?? []
    return (data ?? []).filter(
      (c) => c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    )
  }, [data, search])

  const createMut = useMutation({
    mutationFn: () => api.admin.createCourse(form),
    onSuccess: () => {
      toast.success(t('admin.saved'))
      setCreating(false)
      setForm({ slug: '', title: '', description: '', icon: 'keyboard', sort_order: 0 })
      void qc.invalidateQueries({ queryKey: ['admin-courses'] })
      void qc.invalidateQueries({ queryKey: ['admin-overview'] })
      void qc.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.admin.deleteCourse(id),
    onSuccess: () => {
      toast.success(t('admin.deleted'))
      void qc.invalidateQueries({ queryKey: ['admin-courses'] })
      void qc.invalidateQueries({ queryKey: ['admin-overview'] })
      void qc.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className={cn(inputClass(), 'max-w-xs')}
          placeholder={t('admin.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn-primary" onClick={() => setCreating((v) => !v)}>
          <Plus className="h-4 w-4" />
          {t('admin.create')}
        </button>
      </div>

      {creating && (
        <GlassCard className="space-y-3 !p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('admin.slug')}>
              <input className={inputClass()} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <Field label={t('admin.titleField')}>
              <input className={inputClass()} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label={t('admin.icon')}>
              <input className={inputClass()} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </Field>
            <Field label={t('admin.sortOrder')}>
              <input
                type="number"
                className={inputClass()}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label={t('admin.description')}>
            <textarea
              className={inputClass()}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="flex gap-2">
            <button type="button" className="btn-primary" disabled={createMut.isPending} onClick={() => createMut.mutate()}>
              {t('admin.save')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
              {t('admin.cancel')}
            </button>
          </div>
        </GlassCard>
      )}

      {isLoading && <Skeleton className="h-48 w-full" />}
      {!isLoading && filtered.length === 0 && <p className="text-sm text-ink-soft">{t('admin.empty')}</p>}

      <div className="space-y-2">
        {filtered.map((course: CourseDto) => (
          <GlassCard key={course.id} className="flex flex-wrap items-center justify-between gap-3 !p-4">
            <div className="min-w-0">
              <p className="font-semibold text-ink dark:text-white">{course.title}</p>
              <p className="text-xs text-ink-soft">
                <code>{course.slug}</code> · {course.lesson_count} {t('admin.lessons')} · {course.category_count}{' '}
                {t('admin.categories')}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary !px-3 !py-1.5 text-sm" onClick={() => onOpen(course.id)}>
                {t('admin.open')}
              </button>
              <button
                type="button"
                className="rounded-lg p-2 text-signal hover:bg-signal/10"
                onClick={() => {
                  if (window.confirm(t('admin.confirmDelete'))) deleteMut.mutate(course.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

function CourseEditor({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const t = useT()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: () => api.admin.course(courseId),
  })

  const [courseForm, setCourseForm] = useState<AdminCourseBody | null>(null)
  const [catForm, setCatForm] = useState({ slug: '', title: '', sort_order: 0 })
  const [lessonForm, setLessonForm] = useState<{
    category_id: string
    title: string
    description: string
    action_prompt: string
    keysRaw: string
    usage_example: string
    xp_reward: number
    sort_order: number
  } | null>(null)
  const [editLesson, setEditLesson] = useState<(LessonDto & { sort_order?: number; category_id?: string }) | null>(null)
  const [editKeysRaw, setEditKeysRaw] = useState('')

  const detail = data as CourseDetailDto | undefined
  const form = courseForm ?? (detail
    ? {
        slug: detail.slug,
        title: detail.title,
        description: detail.description,
        icon: detail.icon,
        sort_order: detail.sort_order ?? 0,
      }
    : null)

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin-course', courseId] })
    void qc.invalidateQueries({ queryKey: ['admin-courses'] })
    void qc.invalidateQueries({ queryKey: ['courses'] })
    void qc.invalidateQueries({ queryKey: ['admin-overview'] })
  }

  const saveCourse = useMutation({
    mutationFn: () => api.admin.updateCourse(courseId, form!),
    onSuccess: () => {
      toast.success(t('admin.saved'))
      setCourseForm(null)
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  const addCategory = useMutation({
    mutationFn: () =>
      api.admin.createCategory({
        course_id: courseId,
        slug: catForm.slug,
        title: catForm.title,
        sort_order: catForm.sort_order,
      }),
    onSuccess: () => {
      toast.success(t('admin.saved'))
      setCatForm({ slug: '', title: '', sort_order: 0 })
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.admin.deleteCategory(id),
    onSuccess: () => {
      toast.success(t('admin.deleted'))
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  const addLesson = useMutation({
    mutationFn: () => {
      if (!lessonForm) throw new Error('no form')
      const body: AdminLessonBody = {
        category_id: lessonForm.category_id,
        title: lessonForm.title,
        description: lessonForm.description,
        action_prompt: lessonForm.action_prompt,
        keys: parseKeys(lessonForm.keysRaw),
        usage_example: lessonForm.usage_example,
        xp_reward: lessonForm.xp_reward,
        sort_order: lessonForm.sort_order,
      }
      return api.admin.createLesson(body)
    },
    onSuccess: () => {
      toast.success(t('admin.saved'))
      setLessonForm(null)
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  const saveLesson = useMutation({
    mutationFn: () => {
      if (!editLesson) throw new Error('no lesson')
      return api.admin.updateLesson(editLesson.id, {
        title: editLesson.title,
        description: editLesson.description,
        action_prompt: editLesson.action_prompt,
        keys: parseKeys(editKeysRaw),
        usage_example: editLesson.usage_example,
        xp_reward: editLesson.xp_reward,
        sort_order: editLesson.sort_order ?? 0,
      })
    },
    onSuccess: () => {
      toast.success(t('admin.saved'))
      setEditLesson(null)
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  const deleteLesson = useMutation({
    mutationFn: (id: string) => api.admin.deleteLesson(id),
    onSuccess: () => {
      toast.success(t('admin.deleted'))
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  if (isLoading || !detail || !form) return <Skeleton className="h-64 w-full" />

  return (
    <div className="space-y-6">
      <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        {t('admin.back')}
      </button>

      <GlassCard className="space-y-3 !p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('admin.slug')}>
            <input
              className={inputClass()}
              value={form.slug}
              onChange={(e) => setCourseForm({ ...form, slug: e.target.value })}
            />
          </Field>
          <Field label={t('admin.titleField')}>
            <input
              className={inputClass()}
              value={form.title}
              onChange={(e) => setCourseForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label={t('admin.icon')}>
            <input
              className={inputClass()}
              value={form.icon}
              onChange={(e) => setCourseForm({ ...form, icon: e.target.value })}
            />
          </Field>
        </div>
        <Field label={t('admin.description')}>
          <textarea
            className={inputClass()}
            rows={3}
            value={form.description}
            onChange={(e) => setCourseForm({ ...form, description: e.target.value })}
          />
        </Field>
        <button type="button" className="btn-primary" onClick={() => saveCourse.mutate()}>
          {t('admin.save')}
        </button>
      </GlassCard>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t('admin.categories')}</h2>
        </div>
        <GlassCard className="mb-4 grid gap-3 !p-4 sm:grid-cols-4">
          <Field label={t('admin.slug')}>
            <input className={inputClass()} value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} />
          </Field>
          <Field label={t('admin.titleField')}>
            <input className={inputClass()} value={catForm.title} onChange={(e) => setCatForm({ ...catForm, title: e.target.value })} />
          </Field>
          <Field label={t('admin.sortOrder')}>
            <input
              type="number"
              className={inputClass()}
              value={catForm.sort_order}
              onChange={(e) => setCatForm({ ...catForm, sort_order: Number(e.target.value) })}
            />
          </Field>
          <div className="flex items-end">
            <button type="button" className="btn-secondary w-full" onClick={() => addCategory.mutate()}>
              <Plus className="h-4 w-4" />
              {t('admin.addCategory')}
            </button>
          </div>
        </GlassCard>

        {detail.categories.map((cat) => (
          <GlassCard key={cat.id} className="mb-4 !p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{cat.title}</p>
                <p className="text-xs text-ink-soft">
                  <code>{cat.slug}</code> · {cat.lessons.length} {t('admin.lessons')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-1.5 text-sm"
                  onClick={() =>
                    setLessonForm({
                      category_id: cat.id,
                      title: '',
                      description: '',
                      action_prompt: '',
                      keysRaw: 'Control+C',
                      usage_example: '',
                      xp_reward: 10,
                      sort_order: cat.lessons.length,
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('admin.addLesson')}
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-signal hover:bg-signal/10"
                  onClick={() => {
                    if (window.confirm(t('admin.confirmDelete'))) deleteCategory.mutate(cat.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {lessonForm?.category_id === cat.id && (
              <div className="mb-4 space-y-2 rounded-xl border border-brand-600/20 bg-brand-50/40 p-3 dark:bg-brand-950/20">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label={t('admin.titleField')}>
                    <input
                      className={inputClass()}
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    />
                  </Field>
                  <Field label={t('admin.keys')}>
                    <input
                      className={inputClass()}
                      value={lessonForm.keysRaw}
                      onChange={(e) => setLessonForm({ ...lessonForm, keysRaw: e.target.value })}
                      placeholder={t('admin.keysHint')}
                    />
                  </Field>
                  <Field label={t('admin.actionPrompt')}>
                    <input
                      className={inputClass()}
                      value={lessonForm.action_prompt}
                      onChange={(e) => setLessonForm({ ...lessonForm, action_prompt: e.target.value })}
                    />
                  </Field>
                  <Field label={t('admin.xpReward')}>
                    <input
                      type="number"
                      className={inputClass()}
                      value={lessonForm.xp_reward}
                      onChange={(e) => setLessonForm({ ...lessonForm, xp_reward: Number(e.target.value) })}
                    />
                  </Field>
                </div>
                <Field label={t('admin.description')}>
                  <textarea
                    className={inputClass()}
                    rows={2}
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  />
                </Field>
                <Field label={t('admin.usageExample')}>
                  <textarea
                    className={inputClass()}
                    rows={2}
                    value={lessonForm.usage_example}
                    onChange={(e) => setLessonForm({ ...lessonForm, usage_example: e.target.value })}
                  />
                </Field>
                <div className="flex gap-2">
                  <button type="button" className="btn-primary" onClick={() => addLesson.mutate()}>
                    {t('admin.save')}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setLessonForm(null)}>
                    {t('admin.cancel')}
                  </button>
                </div>
              </div>
            )}

            <ul className="space-y-2">
              {cat.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-ink/8 px-3 py-2 dark:border-white/10"
                >
                  {editLesson?.id === lesson.id ? (
                    <div className="w-full space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Field label={t('admin.titleField')}>
                          <input
                            className={inputClass()}
                            value={editLesson.title}
                            onChange={(e) => setEditLesson({ ...editLesson, title: e.target.value })}
                          />
                        </Field>
                        <Field label={t('admin.keys')}>
                          <input
                            className={inputClass()}
                            value={editKeysRaw}
                            onChange={(e) => setEditKeysRaw(e.target.value)}
                          />
                        </Field>
                        <Field label={t('admin.actionPrompt')}>
                          <input
                            className={inputClass()}
                            value={editLesson.action_prompt}
                            onChange={(e) => setEditLesson({ ...editLesson, action_prompt: e.target.value })}
                          />
                        </Field>
                        <Field label={t('admin.xpReward')}>
                          <input
                            type="number"
                            className={inputClass()}
                            value={editLesson.xp_reward}
                            onChange={(e) => setEditLesson({ ...editLesson, xp_reward: Number(e.target.value) })}
                          />
                        </Field>
                      </div>
                      <Field label={t('admin.description')}>
                        <textarea
                          className={inputClass()}
                          rows={2}
                          value={editLesson.description}
                          onChange={(e) => setEditLesson({ ...editLesson, description: e.target.value })}
                        />
                      </Field>
                      <Field label={t('admin.usageExample')}>
                        <textarea
                          className={inputClass()}
                          rows={2}
                          value={editLesson.usage_example}
                          onChange={(e) => setEditLesson({ ...editLesson, usage_example: e.target.value })}
                        />
                      </Field>
                      <div className="flex gap-2">
                        <button type="button" className="btn-primary" onClick={() => saveLesson.mutate()}>
                          {t('admin.save')}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setEditLesson(null)}>
                          {t('admin.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="font-medium">{lesson.title}</p>
                        <p className="font-mono text-xs text-brand-800 dark:text-brand-300">
                          {(lesson.keys || []).join('+')} · +{lesson.xp_reward} XP
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{lesson.action_prompt}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-ink/5 dark:hover:bg-white/5"
                          onClick={() => {
                            setEditLesson(lesson)
                            setEditKeysRaw((lesson.keys || []).join('+'))
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-signal hover:bg-signal/10"
                          onClick={() => {
                            if (window.confirm(t('admin.confirmDelete'))) deleteLesson.mutate(lesson.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

function UsersTab() {
  const t = useT()
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: api.admin.users })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data ?? []
    return (data ?? []).filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.display_name.toLowerCase().includes(q),
    )
  }, [data, search])

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof api.admin.updateUser>[1] }) =>
      api.admin.updateUser(id, body),
    onSuccess: () => {
      toast.success(t('admin.saved'))
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
      void qc.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.admin.deleteUser(id),
    onSuccess: () => {
      toast.success(t('admin.deleted'))
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
      void qc.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  if (isLoading) return <Skeleton className="h-48 w-full" />

  return (
    <div className="space-y-4">
      <input
        className={cn(inputClass(), 'max-w-xs')}
        placeholder={t('admin.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="overflow-x-auto rounded-xl border border-ink/10 dark:border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wide text-ink-soft dark:bg-white/5">
            <tr>
              <th className="px-3 py-2">{t('admin.email')}</th>
              <th className="px-3 py-2">{t('admin.username')}</th>
              <th className="px-3 py-2">{t('admin.displayName')}</th>
              <th className="px-3 py-2">{t('admin.xp')}</th>
              <th className="px-3 py-2">{t('admin.level')}</th>
              <th className="px-3 py-2">{t('admin.isAdmin')}</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: AdminUserDto) => (
              <tr key={u.id} className="border-t border-ink/8 dark:border-white/10">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.username}</td>
                <td className="px-3 py-2">
                  <input
                    className="input-field !py-1"
                    defaultValue={u.display_name}
                    onBlur={(e) => {
                      if (e.target.value !== u.display_name) {
                        updateMut.mutate({ id: u.id, body: { display_name: e.target.value } })
                      }
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    className="input-field w-24 !py-1"
                    defaultValue={u.xp}
                    onBlur={(e) => {
                      const xp = Number(e.target.value)
                      if (xp !== u.xp) updateMut.mutate({ id: u.id, body: { xp } })
                    }}
                  />
                </td>
                <td className="px-3 py-2 tabular-nums">{u.level}</td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={u.is_admin}
                    disabled={u.id === me?.id}
                    onChange={(e) => updateMut.mutate({ id: u.id, body: { is_admin: e.target.checked } })}
                  />
                </td>
                <td className="px-3 py-2">
                  {u.id !== me?.id && (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-signal hover:bg-signal/10"
                      onClick={() => {
                        if (window.confirm(t('admin.confirmDelete'))) deleteMut.mutate(u.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AchievementsTab() {
  const t = useT()
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<AdminAchievementBody>({
    slug: '',
    title: '',
    description: '',
    icon: 'trophy',
    xp_bonus: 50,
    condition_type: 'correct_answers',
    condition_value: 1,
  })
  const [edit, setEdit] = useState<AdminAchievementDto | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-achievements'],
    queryFn: api.admin.achievements,
  })

  const createMut = useMutation({
    mutationFn: () => api.admin.createAchievement(form),
    onSuccess: () => {
      toast.success(t('admin.saved'))
      setCreating(false)
      setForm({
        slug: '',
        title: '',
        description: '',
        icon: 'trophy',
        xp_bonus: 50,
        condition_type: 'correct_answers',
        condition_value: 1,
      })
      void qc.invalidateQueries({ queryKey: ['admin-achievements'] })
      void qc.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  const saveMut = useMutation({
    mutationFn: () =>
      api.admin.updateAchievement(edit!.id, {
        slug: edit!.slug,
        title: edit!.title,
        description: edit!.description,
        icon: edit!.icon,
        xp_bonus: edit!.xp_bonus,
        condition_type: edit!.condition_type,
        condition_value: edit!.condition_value,
      }),
    onSuccess: () => {
      toast.success(t('admin.saved'))
      setEdit(null)
      void qc.invalidateQueries({ queryKey: ['admin-achievements'] })
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.admin.deleteAchievement(id),
    onSuccess: () => {
      toast.success(t('admin.deleted'))
      void qc.invalidateQueries({ queryKey: ['admin-achievements'] })
      void qc.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: (e: Error) => toast.error(e.message || t('admin.error')),
  })

  if (isLoading) return <Skeleton className="h-48 w-full" />

  return (
    <div className="space-y-4">
      <button type="button" className="btn-primary" onClick={() => setCreating((v) => !v)}>
        <Plus className="h-4 w-4" />
        {t('admin.create')}
      </button>

      {creating && (
        <GlassCard className="space-y-3 !p-5">
          <AchievementFields form={form} setForm={setForm} />
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={() => createMut.mutate()}>
              {t('admin.save')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
              {t('admin.cancel')}
            </button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-2">
        {(data ?? []).map((a) => (
          <GlassCard key={a.id} className="!p-4">
            {edit?.id === a.id ? (
              <div className="space-y-3">
                <AchievementFields
                  form={edit}
                  setForm={(next) => setEdit({ ...edit, ...next })}
                />
                <div className="flex gap-2">
                  <button type="button" className="btn-primary" onClick={() => saveMut.mutate()}>
                    {t('admin.save')}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setEdit(null)}>
                    {t('admin.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-xs text-ink-soft">
                    <code>{a.slug}</code> · {a.condition_type} ≥ {a.condition_value} · +{a.xp_bonus} XP
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{a.description}</p>
                </div>
                <div className="flex gap-1">
                  <button type="button" className="rounded-lg p-2 hover:bg-ink/5" onClick={() => setEdit(a)}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-signal hover:bg-signal/10"
                    onClick={() => {
                      if (window.confirm(t('admin.confirmDelete'))) deleteMut.mutate(a.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

function AchievementFields({
  form,
  setForm,
}: {
  form: AdminAchievementBody
  setForm: (f: AdminAchievementBody) => void
}) {
  const t = useT()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t('admin.slug')}>
        <input className={inputClass()} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
      </Field>
      <Field label={t('admin.titleField')}>
        <input className={inputClass()} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label={t('admin.icon')}>
        <input className={inputClass()} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
      </Field>
      <Field label={t('admin.xpBonus')}>
        <input
          type="number"
          className={inputClass()}
          value={form.xp_bonus}
          onChange={(e) => setForm({ ...form, xp_bonus: Number(e.target.value) })}
        />
      </Field>
      <Field label={t('admin.conditionType')}>
        <select
          className={inputClass()}
          value={form.condition_type}
          onChange={(e) => setForm({ ...form, condition_type: e.target.value })}
        >
          <option value="correct_answers">correct_answers</option>
          <option value="total_xp">total_xp</option>
          <option value="streak_days">streak_days</option>
          <option value="combo">combo</option>
          <option value="course_complete">course_complete</option>
        </select>
      </Field>
      <Field label={t('admin.conditionValue')}>
        <input
          type="number"
          className={inputClass()}
          value={form.condition_value}
          onChange={(e) => setForm({ ...form, condition_value: Number(e.target.value) })}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label={t('admin.description')}>
          <textarea
            className={inputClass()}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
      </div>
    </div>
  )
}
