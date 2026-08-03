const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || '/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('km_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (init?.headers) {
    Object.assign(headers, init.headers as Record<string, string>)
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(
      'Сервер API не отвечает. Запустите backend в папке backend (порт 8000).',
      0,
    )
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      detail?: string | { msg: string }[]
    }
    let message = res.statusText
    if (typeof body.detail === 'string') message = body.detail
    else if (Array.isArray(body.detail)) message = body.detail.map((d) => d.msg).join(', ')
    if (res.status === 502 || res.status === 503) {
      message = 'Сервер API не запущен. Выполните: cd backend && uvicorn app.main:app --reload --port 8000'
    }
    throw new ApiError(message, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  register: (body: { email: string; username: string; password: string; display_name: string }) =>
    request<{ access_token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ access_token: string }>('/auth/login/json', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<UserDto>('/auth/me'),
  courses: () => request<CourseDto[]>('/courses'),
  course: (slug: string) => request<CourseDetailDto>(`/courses/${slug}`),
  lesson: (id: string) => request<LessonDto>(`/courses/lessons/${id}`),
  submitTraining: (body: { lesson_id: string; correct: boolean; response_time_ms?: number }) =>
    request<TrainingResultDto>('/training/submit', { method: 'POST', body: JSON.stringify(body) }),
  randomLessons: (params?: { course_slug?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.course_slug) q.set('course_slug', params.course_slug)
    if (params?.limit) q.set('limit', String(params.limit))
    return request<RandomLessonDto[]>(`/training/random?${q}`)
  },
  achievements: () => request<AchievementDto[]>('/achievements'),
  leaderboard: (period = 'all') => request<LeaderboardDto[]>(`/leaderboard?period=${period}`),
  stats: () => request<StatsDto>('/stats/me'),
  daily: () => request<DailyDto[]>('/daily'),
  courseProgress: () => request<CourseProgressDto[]>('/progress/courses'),
  lessonProgress: (params?: { courseSlug?: string; lessonId?: string }) => {
    const q = new URLSearchParams()
    if (params?.courseSlug) q.set('course_slug', params.courseSlug)
    if (params?.lessonId) q.set('lesson_id', params.lessonId)
    const qs = q.toString()
    return request<LessonProgressDto[]>(`/progress/lessons${qs ? `?${qs}` : ''}`)
  },
  admin: {
    overview: () => request<AdminOverviewDto>('/admin/overview'),
    courses: () => request<CourseDto[]>('/admin/courses'),
    course: (id: string) => request<CourseDetailDto>(`/admin/courses/${id}`),
    createCourse: (body: AdminCourseBody) =>
      request<CourseDto>('/admin/courses', { method: 'POST', body: JSON.stringify(body) }),
    updateCourse: (id: string, body: Partial<AdminCourseBody>) =>
      request<CourseDto>(`/admin/courses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteCourse: (id: string) => request<{ ok: boolean }>(`/admin/courses/${id}`, { method: 'DELETE' }),
    createCategory: (body: AdminCategoryBody) =>
      request<{ id: string; slug: string; title: string; sort_order: number }>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateCategory: (id: string, body: Partial<Omit<AdminCategoryBody, 'course_id'>>) =>
      request(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteCategory: (id: string) => request<{ ok: boolean }>(`/admin/categories/${id}`, { method: 'DELETE' }),
    createLesson: (body: AdminLessonBody) =>
      request<LessonDto>('/admin/lessons', { method: 'POST', body: JSON.stringify(body) }),
    updateLesson: (id: string, body: Partial<AdminLessonBody>) =>
      request<LessonDto>(`/admin/lessons/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteLesson: (id: string) => request<{ ok: boolean }>(`/admin/lessons/${id}`, { method: 'DELETE' }),
    users: () => request<AdminUserDto[]>('/admin/users'),
    updateUser: (id: string, body: Partial<{ display_name: string; xp: number; level: number; streak_days: number; is_admin: boolean }>) =>
      request<AdminUserDto>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteUser: (id: string) => request<{ ok: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),
    achievements: () => request<AdminAchievementDto[]>('/admin/achievements'),
    createAchievement: (body: AdminAchievementBody) =>
      request<AdminAchievementDto>('/admin/achievements', { method: 'POST', body: JSON.stringify(body) }),
    updateAchievement: (id: string, body: Partial<AdminAchievementBody>) =>
      request<AdminAchievementDto>(`/admin/achievements/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteAchievement: (id: string) =>
      request<{ ok: boolean }>(`/admin/achievements/${id}`, { method: 'DELETE' }),
  },
}

export interface UserDto {
  id: string
  email: string
  username: string
  display_name: string
  xp: number
  level: number
  streak_days: number
  is_admin: boolean
}

export interface CourseDto {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  sort_order?: number
  lesson_count: number
  category_count: number
}

export interface LessonDto {
  id: string
  title: string
  description: string
  action_prompt: string
  keys: string[]
  usage_example: string
  xp_reward: number
  course_slug?: string | null
  category_slug?: string | null
}

export interface CourseDetailDto extends CourseDto {
  categories: {
    id: string
    slug: string
    title: string
    sort_order?: number
    lessons: (LessonDto & { sort_order?: number })[]
  }[]
}

export interface TrainingResultDto {
  xp_gained: number
  total_xp: number
  level: number
  level_title: string
  streak_days: number
}

export interface RandomLessonDto {
  id: string
  title: string
  action_prompt: string
  keys: string[]
  course_slug?: string | null
  category_slug?: string | null
}

export interface AchievementDto {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  unlocked: boolean
}

export interface LeaderboardDto {
  rank: number
  username: string
  display_name: string
  xp: number
  level_title: string
}

export interface StatsDto {
  total_correct: number
  total_wrong: number
  accuracy: number
  combos_best: number
  speed_best_score: number
  exam_best_score: number
  study_time_seconds: number
  streak_days: number
  combinations_learned: number
  avg_response_ms: number
}

export interface CourseProgressDto {
  course_id: string
  slug: string
  title: string
  icon: string
  lesson_count: number
  completed_lessons: number
  percent: number
  xp_earned: number
  xp_total: number
}

export interface LessonProgressDto {
  lesson_id: string
  course_slug: string
  title: string
  keys: string[]
  completed: boolean
  attempts: number
  correct_count: number
  xp_reward: number
}

export interface DailyDto {
  challenge_type: string
  title: string
  target: number
  progress: number
  completed: boolean
  xp_reward: number
}

export interface AdminOverviewDto {
  users: number
  courses: number
  lessons: number
  achievements: number
  lessons_completed: number
  admins: number
}

export interface AdminCourseBody {
  slug: string
  title: string
  description: string
  icon: string
  sort_order: number
}

export interface AdminCategoryBody {
  course_id: string
  slug: string
  title: string
  sort_order: number
}

export interface AdminLessonBody {
  category_id: string
  title: string
  description: string
  action_prompt: string
  keys: string[]
  usage_example: string
  xp_reward: number
  sort_order: number
}

export interface AdminUserDto {
  id: string
  email: string
  username: string
  display_name: string
  xp: number
  level: number
  streak_days: number
  is_admin: boolean
  created_at: string
}

export interface AdminAchievementDto {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  xp_bonus: number
  condition_type: string
  condition_value: number
}

export interface AdminAchievementBody {
  slug: string
  title: string
  description: string
  icon: string
  xp_bonus: number
  condition_type: string
  condition_value: number
}
