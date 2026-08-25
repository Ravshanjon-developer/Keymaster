import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { LessonWorkspace, lessonKindFromData } from '@/features/lessons/LessonWorkspace'
import { firstPlayableId, trackStatuses } from '@/features/lessons/lessonView'
import { useAuthStore } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'
import { isBrowserHostileForTraining } from '@/shared/lib/hotkeys'
import { useBlockBrowserChord } from '@/shared/hooks/useBlockBrowserChord'
import { deriveTrainerCopy } from '@/shared/lib/lessonCopy'
import {
  isProgrammerSystemCategory,
  loadSystemStudyTicks,
  systemExplainId,
  systemShortcutLabel,
} from '@/features/lessons/systemStudy'
import { addLocalLessonDone, loadLocalLessonDone } from '@/features/lessons/localLessonDone'
import { syncLessonIdsToServer, syncLocalProgressToServer } from '@/features/lessons/syncLocalProgress'
import { desktopSimulatorHref, parseDesktopTaskId, DESKTOP_PROGRESS_EVENT, isDesktopTaskDoneLocally } from '@/shared/lib/simulatorProgress'
import { useT, useLocaleStore } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { SkeletonBlock } from '@/shared/components/PageLayout'

export function LessonPage({ lessonId }: { lessonId: string }) {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const { localizeLesson, localizeCourse, localizeCategory } = useLocalizedContent()
  const { data, isLoading } = useQuery({ queryKey: ['lesson', lessonId], queryFn: () => api.lesson(lessonId) })
  const token = useAuthStore((s) => s.token)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const queryClient = useQueryClient()
  const [succeeded, setSucceeded] = useState(false)
  const [localDone, setLocalDone] = useState<string[]>([])
  const [tickedSystem, setTickedSystem] = useState<string[]>([])

  const lessonProgress = useQuery({
    queryKey: ['lesson-progress-item', lessonId],
    queryFn: async () => {
      const rows = await api.lessonProgress({ lessonId })
      return rows[0] ?? null
    },
    enabled: !!token,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  })

  const courseQuery = useQuery({
    queryKey: ['course', data?.course_slug],
    queryFn: () => api.course(data!.course_slug!),
    enabled: !!data?.course_slug,
  })

  const courseProgressQuery = useQuery({
    queryKey: ['lesson-progress', data?.course_slug],
    queryFn: () => api.lessonProgress({ courseSlug: data!.course_slug! }),
    enabled: !!token && !!data?.course_slug,
  })

  const desktopTaskId = data ? parseDesktopTaskId(data.keys) : null
  const localDesktopDone = desktopTaskId ? isDesktopTaskDoneLocally(desktopTaskId) : false
  const learned = succeeded || Boolean(lessonProgress.data?.completed) || localDesktopDone
  const taskKind = data ? lessonKindFromData(data.course_slug ?? undefined, data.keys, data.title) : 'hotkey'
  const studyOnly = Boolean(data && taskKind === 'hotkey' && isBrowserHostileForTraining(data.keys))
  const keyboardPractice = Boolean(data && taskKind === 'hotkey' && !studyOnly && token)

  useEffect(() => {
    setSucceeded(false)
  }, [lessonId])

  useEffect(() => {
    const slug = data?.course_slug
    if (!slug) return
    setLocalDone(loadLocalLessonDone(slug))
    const ticks = loadSystemStudyTicks()
    setTickedSystem(Object.entries(ticks).filter(([, on]) => on).map(([id]) => id))
  }, [data?.course_slug])

  useEffect(() => {
    if (!token || !data?.course_slug) return
    let cancelled = false
    void (async () => {
      const n = await syncLocalProgressToServer()
      if (cancelled || n <= 0) return
      await queryClient.invalidateQueries({ queryKey: ['course-progress'] })
      await queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
      await queryClient.invalidateQueries({ queryKey: ['lesson-progress-item', lessonId] })
      await refreshUser()
    })()
    return () => {
      cancelled = true
    }
  }, [token, data?.course_slug, lessonId, queryClient, refreshUser])

  useEffect(() => {
    if (!token || !desktopTaskId) return

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['lesson-progress-item', lessonId] })
      void queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
      void queryClient.invalidateQueries({ queryKey: ['course-progress'] })
      if (isDesktopTaskDoneLocally(desktopTaskId)) setSucceeded(true)
      void syncLocalProgressToServer().then((n) => {
        if (n <= 0) return
        void queryClient.invalidateQueries({ queryKey: ['course-progress'] })
        void queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
        void refreshUser()
      })
    }

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ completed?: number[] }>).detail
      if (detail?.completed?.includes(desktopTaskId)) refresh()
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== 'km_desktop_tasks_v1') return
      refresh()
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    refresh()
    window.addEventListener(DESKTOP_PROGRESS_EVENT, onProgress)
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisible)
    const poll = window.setInterval(() => {
      if (!lessonProgress.data?.completed) refresh()
    }, 1500)

    return () => {
      window.removeEventListener(DESKTOP_PROGRESS_EVENT, onProgress)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(poll)
    }
  }, [token, desktopTaskId, lessonId, queryClient, lessonProgress.data?.completed])

  useBlockBrowserChord(keyboardPractice ? data?.keys ?? null : null, keyboardPractice)

  const track = useMemo(() => {
    const cats = courseQuery.data?.categories ?? []
    const ordered = cats.flatMap((cat) => cat.lessons.map((lesson) => lesson.id))
    const completed = new Set(
      (courseProgressQuery.data ?? [])
        .filter((row) => row.completed || (row.lesson_id === lessonId && learned))
        .map((row) => row.lesson_id),
    )
    if (learned) completed.add(lessonId)
    for (const id of localDone) completed.add(id)
    for (const id of tickedSystem) completed.add(id)
    const statuses = trackStatuses(ordered, completed, lessonId, false)
    const index = ordered.indexOf(lessonId)
    const status = index >= 0 ? statuses[index] : 'available'
    const prevId = index > 0 ? ordered[index - 1]! : null
    const nextRaw = index >= 0 && index < ordered.length - 1 ? ordered[index + 1]! : null
    const nextStatus = nextRaw ? statuses[ordered.indexOf(nextRaw)] : null
    const nextId = nextRaw && nextStatus !== 'locked' ? nextRaw : null
    return {
      ordered,
      statuses,
      index: Math.max(0, index),
      locked: status === 'locked',
      prevId,
      nextId,
      playableId: firstPlayableId(ordered, statuses),
      doneCount: ordered.filter((_, i) => statuses[i] === 'done').length,
      totalCount: ordered.length,
    }
  }, [courseProgressQuery.data, courseQuery.data, learned, lessonId, localDone, tickedSystem])

  const modules = useMemo(() => {
    const cats = courseQuery.data?.categories ?? []
    let cursor = 0
    return cats.map((cat) => {
      const lessons = cat.lessons.map((lesson) => {
        cursor += 1
        const status = track.statuses[cursor - 1] ?? 'available'
        const loc = localizeLesson(courseQuery.data?.slug, cat.slug, lesson.keys, { title: lesson.title })
        return { id: lesson.id, title: loc.title, status, n: cursor }
      })
      return {
        slug: cat.slug,
        title: localizeCategory(courseQuery.data?.slug ?? '', cat.slug, cat.title),
        lessons,
      }
    })
  }, [courseQuery.data, locale, localizeCategory, localizeLesson, track.statuses])

  if (isLoading) {
    return (
      <div className="km-player-frame" style={{ padding: 32 }}>
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="mt-6 h-96 w-full rounded-[14px]" />
      </div>
    )
  }
  if (!data) return null

  const loc = localizeLesson(data.course_slug ?? undefined, data.category_slug ?? undefined, data.keys, {
    title: data.title,
    action_prompt: data.action_prompt,
    usage_example: data.usage_example,
    description: data.description,
  })
  const copy = deriveTrainerCopy({
    keys: data.keys,
    title: loc.title ?? data.title,
    action_prompt: loc.action_prompt ?? data.action_prompt,
    usage_example: loc.usage_example ?? data.usage_example,
    description: loc.description ?? data.description,
    locale,
  })
  const courseTitle = courseQuery.data
    ? localizeCourse(courseQuery.data.slug, courseQuery.data.title, courseQuery.data.description).title
    : data.course_slug ?? ''

  const systemCategory = courseQuery.data?.categories.find((cat) => cat.slug === 'system')
  const showSystemSheet = isProgrammerSystemCategory(data.course_slug, data.category_slug)
  const systemSheet =
    showSystemSheet && systemCategory
      ? {
          title: localizeCategory(data.course_slug ?? '', 'system', systemCategory.title),
          rows: systemCategory.lessons.map((lesson) => {
            const rowLoc = localizeLesson(data.course_slug ?? undefined, 'system', lesson.keys, {
              title: lesson.title,
              description: lesson.description,
            })
            const explain = systemExplainId(lesson.keys)
            return {
              id: lesson.id,
              keys: lesson.keys,
              title: rowLoc.title,
              shortcut: systemShortcutLabel(lesson.keys),
              meaning: explain ? t(`lesson.${explain}`) : (rowLoc.description || rowLoc.title),
              done:
                localDone.includes(lesson.id) ||
                tickedSystem.includes(lesson.id) ||
                Boolean(
                  (courseProgressQuery.data ?? []).find((row) => row.lesson_id === lesson.id && row.completed),
                ) ||
                (learned && lesson.id === lessonId),
            }
          }),
        }
      : null

  const rememberDone = (ids: string[]) => {
    const slug = data.course_slug
    if (!slug) {
      setLocalDone((prev) => [...new Set([...prev, ...ids])])
      return
    }
    setLocalDone(addLocalLessonDone(slug, ids))
  }

  const saveCompleteSystem = async () => {
    const pending = systemSheet?.rows.filter((row) => !row.done) ?? []
    const pendingIds = pending.map((row) => row.id)
    if (!pending.length) {
      rememberDone(systemSheet?.rows.map((row) => row.id) ?? [data.id])
      setSucceeded(true)
      return
    }
    if (!token) {
      rememberDone(pendingIds)
      setSucceeded(true)
      return
    }
    try {
      let xp = 0
      const doneIds: string[] = []
      for (const row of pending) {
        const result = await api.submitTraining({
          lesson_id: row.id,
          correct: true,
          response_time_ms: 0,
        })
        doneIds.push(row.id)
        xp += result.xp_gained
      }
      rememberDone(doneIds)
      setSucceeded(true)
      await refreshUser()
      await queryClient.invalidateQueries({ queryKey: ['course-progress'] })
      await queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
      await queryClient.invalidateQueries({ queryKey: ['lesson-progress-item', lessonId] })
      if (xp > 0) toast.success(t('lesson.xpLearned', { n: xp }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lesson.xpFail'))
    }
  }

  const saveComplete = async () => {
    if (!token) {
      rememberDone([data.id])
      setSucceeded(true)
      return
    }
    try {
      const result = await api.submitTraining({
        lesson_id: data.id,
        correct: true,
        response_time_ms: 0,
      })
      rememberDone([data.id])
      setSucceeded(true)
      await refreshUser()
      await queryClient.invalidateQueries({ queryKey: ['course-progress'] })
      await queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
      await queryClient.invalidateQueries({ queryKey: ['lesson-progress-item', lessonId] })
      if (result.xp_gained > 0) toast.success(t('lesson.xpLearned', { n: result.xp_gained }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('lesson.xpFail'))
    }
  }

  return (
    <LessonWorkspace
        courseSlug={data.course_slug ?? ''}
        courseIcon={courseQuery.data?.icon}
        courseTitle={courseTitle}
        lessonId={lessonId}
        lessonTitle={loc.title}
        seedTitle={data.title}
        summary={copy.why || loc.action_prompt || ''}
        why={copy.why}
        detail={copy.detail}
        description={loc.description ?? data.description ?? ''}
        actionPrompt={loc.action_prompt ?? data.action_prompt}
        usageExample={loc.usage_example ?? data.usage_example ?? ''}
        keys={data.keys}
        xpReward={data.xp_reward}
        kind={taskKind}
        locale={locale}
        modules={modules}
        doneCount={track.doneCount}
        totalCount={track.totalCount || 1}
        lessonIndex={track.index}
        locked={track.locked}
        playableId={track.playableId}
        prevId={track.prevId}
        nextId={track.nextId}
        token={Boolean(token)}
        completed={learned}
        studyOnly={studyOnly}
        systemSheet={systemSheet}
        simulatorHref={desktopTaskId ? desktopSimulatorHref(desktopTaskId, data.id) : undefined}
        onComplete={() => void saveComplete()}
        onCompleteSystem={() => void saveCompleteSystem()}
        onSystemTicksChange={(ids) => {
          setTickedSystem((prev) => {
            const before = [...prev].sort().join('|')
            const after = [...ids].sort().join('|')
            return before === after ? prev : ids
          })
          if (!token) return
          const newly = ids.filter((id) => !tickedSystem.includes(id))
          if (!newly.length) return
          void (async () => {
            const n = await syncLessonIdsToServer(newly)
            if (n <= 0) return
            await queryClient.invalidateQueries({ queryKey: ['course-progress'] })
            await queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
            await queryClient.invalidateQueries({ queryKey: ['lesson-progress-item', lessonId] })
            await refreshUser()
          })()
        }}
        onHotkeyResult={async (correct, ms) => {
          if (!correct) return
          if (!token) {
            rememberDone([data.id])
            setSucceeded(true)
            return
          }
          try {
            const result = await api.submitTraining({
              lesson_id: data.id,
              correct,
              response_time_ms: ms,
            })
            rememberDone([data.id])
            setSucceeded(true)
            await refreshUser()
            await queryClient.invalidateQueries({ queryKey: ['course-progress'] })
            await queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
            await queryClient.invalidateQueries({ queryKey: ['lesson-progress-item', lessonId] })
            if (result.xp_gained > 0) toast.success(t('lesson.xpLearned', { n: result.xp_gained }))
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t('lesson.xpFail'))
          }
        }}
      />
  )
}
