import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  Copy,
  FileText,
  Folder,
  FolderTree,
  Folders,
  Globe,
  Keyboard,
  Lock,
  Menu,
  PartyPopper,
  Pencil,
  Rocket,
  Trash2,
  Type,
  X,
} from 'lucide-react'

import { CourseBrandIcon } from '@/features/courses/CourseBrandIcon'
import { KeyboardTrainer } from '@/features/training/KeyboardTrainer'
import { PracticeKeyboardGate } from '@/features/mobile/PracticeKeyboardGate'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { PracticeRegisterGate } from '@/shared/components/PracticeRegisterGate'
import { useT } from '@/shared/i18n'
import { cn } from '@/shared/lib/utils'

import {
  classifyLesson,
  commandMatches,
  expectedCommand,
  lessonSyntax,
  sidebarMark,
  type LessonKind,
  type TerminalLine,
  type TrackStatus,
} from './lessonView'
import { buildLessonCard, featureGlyph, terminalPlain, type FeatureItem } from './lessonPlaybooks'
import type { TeachPack } from './computerBasicsPlaybooks'
import { SystemStudySheet } from './SystemStudySheet'
import {
  loadSystemStudyTicks,
  mergeSystemStudyTicks,
  saveSystemStudyTicks,
  type SystemStudyRow,
} from './systemStudy'
import './lessonPlayer.css'

type SidebarLesson = {
  id: string
  title: string
  status: TrackStatus
  n: number
}

type SidebarModule = {
  slug: string
  title: string
  lessons: SidebarLesson[]
}

type Props = {
  courseSlug: string
  courseIcon?: string
  courseTitle: string
  lessonId: string
  lessonTitle: string
  seedTitle: string
  summary: string
  why?: string
  detail?: string
  description: string
  actionPrompt: string
  usageExample: string
  keys: string[]
  xpReward: number
  kind: LessonKind
  locale: 'ru' | 'tg'
  modules: SidebarModule[]
  doneCount: number
  totalCount: number
  lessonIndex: number
  locked: boolean
  playableId: string | null
  nextId: string | null
  prevId: string | null
  token: boolean
  completed: boolean
  studyOnly: boolean
  systemSheet?: { title: string; rows: SystemStudyRow[] } | null
  simulatorHref?: string
  onComplete: () => void
  onCompleteSystem?: () => void
  onSystemTicksChange?: (ids: string[]) => void
  onHotkeyResult: (correct: boolean, ms: number) => void
}

function toneClass(tone: TerminalLine['tone']): string {
  if (tone === 'cmd') return 't-prompt'
  if (tone === 'ok') return 't-green'
  if (tone === 'err') return 't-red'
  if (tone === 'warn') return 't-warn'
  return 't-dim'
}

function CopyButton({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  const t = useT()
  return (
    <button type="button" className="copy-btn" onClick={onCopy} aria-label={copied ? t('lesson.copied') : t('lesson.copy')}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

const ICON_TONES = ['blue', 'cyan', 'amber', 'violet'] as const

function glyphTone(title: string): (typeof ICON_TONES)[number] | 'green' | 'rose' {
  const s = title.toLowerCase()
  if (/website|html|index/.test(s)) return 'violet'
  if (/zip|сжать|распак|архив/.test(s)) return 'amber'
  if (/удал|корзин|нест/.test(s)) return 'rose'
  if (/копи|копия|нусха/.test(s)) return 'green'
  if (/восстанов|барқарор/.test(s)) return 'green'
  if (/расширен|пасванд/.test(s)) return 'cyan'
  if (/переимен|номи нав/.test(s)) return 'amber'
  if (/хранить|нигоҳ|папк|folder|practice|projects/.test(s)) return 'blue'
  return 'cyan'
}

function lessonGlyph(title: string): ComponentType<{ className?: string }> {
  const s = title.toLowerCase()
  if (/website|html|index/.test(s)) return Globe
  if (/zip|сжать|распак/.test(s)) return Archive
  if (/восстанов|барқарор/.test(s)) return ArchiveRestore
  if (/удал|корзин|нест/.test(s)) return Trash2
  if (/копи|копия|нусха/.test(s)) return Copy
  if (/перемест/.test(s)) return Folders
  if (/переимен|номи нав/.test(s)) return Pencil
  if (/расширен|пасванд/.test(s)) return Type
  if (/где хранить/.test(s)) return FolderTree
  if (/папк|folder|practice|projects/.test(s)) return Folder
  if (/встав|гузошт|вырез|бурид|отмен|бекор|повтор|такрор|выдел|интихоб|сохран|нигоҳ дошт|поиск|ҷустуҷ|замен|иваз|скрин/.test(s)) {
    return Keyboard
  }
  return FileText
}

function extraFeatures(features: FeatureItem[], intro: string): FeatureItem[] {
  const introNorm = intro.trim()
  return features.filter((feature) => {
    const blob = `${feature.title} ${feature.text}`.replace(/\s+/g, ' ').trim()
    return Boolean(blob) && blob !== introNorm
  })
}

function treeLineClass(line: string): string {
  if (!line.trim()) return 't-mute'
  if (/\/\s*$/.test(line) || line.trim().endsWith('/')) return 't-folder'
  if (/\.\w{1,8}\s*$/.test(line)) return 't-file'
  return 't-branch'
}

function RingProgress({ value }: { value: number }) {
  const r = 20
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, value))
  return (
    <svg className="lp-ring" viewBox="0 0 52 52" aria-hidden>
      <circle cx="26" cy="26" r={r} className="lp-ring-track" />
      <circle
        cx="26"
        cy="26"
        r={r}
        className="lp-ring-fill"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
      />
    </svg>
  )
}

function ExtensionQuiz({
  pack,
  disabled,
  onPass,
}: {
  pack: TeachPack
  disabled: boolean
  onPass: () => void
}) {
  const t = useT()
  const items = pack.quiz?.items ?? []
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const check = () => {
    const ok = items.every((item) => picked[item.file] === item.ext)
    if (!ok) {
      setError(t('lesson.quizBad'))
      return
    }
    setError('')
    onPass()
  }

  return (
    <div className="teach-quiz">
      <p className="desc">{pack.quiz?.prompt}</p>
      {items.map((item) => (
        <div key={item.file} className="quiz-row">
          <code>{item.file}</code>
          <div className="quiz-opts">
            {items.map((opt) => (
              <button
                key={`${item.file}-${opt.ext}`}
                type="button"
                className={cn('quiz-chip', picked[item.file] === opt.ext && 'is-on')}
                disabled={disabled}
                onClick={() => {
                  setPicked((prev) => ({ ...prev, [item.file]: opt.ext }))
                  setError('')
                }}
              >
                .{opt.ext}
              </button>
            ))}
          </div>
        </div>
      ))}
      {error ? <p className="try-error">{error}</p> : null}
      {disabled ? (
        <p className="try-ok">
          {t('lesson.greatJob')} {pack.success}
        </p>
      ) : (
        <button type="button" className="check-btn" onClick={check}>
          {t('lesson.checkTask')}
        </button>
      )}
    </div>
  )
}

function PracticeActions({
  pack,
  kind,
  token,
  completed,
  lessonId,
  simulatorHref,
  expected,
  syntax,
  command,
  commandError,
  copied,
  studyOnly,
  courseSlug,
  actionPrompt,
  keys,
  why,
  detail,
  markMode,
  onCommand,
  setCommand,
  setCommandError,
  copyValue,
  onComplete,
  onHotkeyResult,
}: {
  pack?: TeachPack
  kind: LessonKind
  token: boolean
  completed: boolean
  lessonId: string
  simulatorHref?: string
  expected: string | null
  syntax: string
  command: string
  commandError: string
  copied: 'syntax' | 'term' | 'try' | null
  studyOnly: boolean
  courseSlug: string
  actionPrompt: string
  keys: string[]
  why?: string
  detail?: string
  markMode?: boolean
  onCommand: () => void
  setCommand: (value: string) => void
  setCommandError: (value: string) => void
  copyValue: (value: string, which: 'syntax' | 'term' | 'try') => void
  onComplete: () => void
  onHotkeyResult: (correct: boolean, ms: number) => void
}) {
  const t = useT()
  if (pack?.quiz) {
    return <ExtensionQuiz pack={pack} disabled={completed} onPass={onComplete} />
  }
  if (!token && (kind === 'hotkey' || kind === 'command' || kind === 'desktop' || simulatorHref)) {
    return (
      <div className="lp-gate">
        <PracticeRegisterGate returnTo={`/lessons/${lessonId}`} />
      </div>
    )
  }
  if (kind === 'hotkey' && !studyOnly) {
    return (
      <div className="km-player-trainer is-fill">
        <PracticeKeyboardGate courseQuery={courseSlug} variant="player">
          <KeyboardTrainer
            compact
            fill
            key={lessonId}
            headline={actionPrompt}
            why={why ?? ''}
            detail={detail ?? ''}
            mode="learn"
            actionPrompt={actionPrompt}
            keys={keys}
            onResult={onHotkeyResult}
          />
        </PracticeKeyboardGate>
      </div>
    )
  }
  if (kind === 'command' && expected) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onCommand()
        }}
      >
        <div className="try-input">
          <input
            value={command}
            onChange={(event) => {
              setCommand(event.target.value)
              setCommandError('')
            }}
            disabled={completed}
            placeholder={syntax}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label={t('lesson.pressToCheck')}
          />
          <CopyButton copied={copied === 'try'} onCopy={() => copyValue(syntax, 'try')} />
        </div>
        {commandError ? <p className="try-error">{commandError}</p> : null}
        {completed ? (
          <p className="try-ok">{t('lesson.commandOk')}</p>
        ) : (
          <button type="submit" className="check-btn">
            {t('lesson.checkTask')}
          </button>
        )}
      </form>
    )
  }
  if (pack?.nextCourse) {
    return (
      <div className="teach-next">
        {completed ? <p className="try-ok">{pack.success}</p> : null}
        {!completed ? (
          <button type="button" className="check-btn" onClick={onComplete}>
            {t('lesson.taskComplete')}
          </button>
        ) : null}
        <Link to="/courses/programmer-basics" className="check-btn" style={{ marginTop: 10 }}>
          {t('lesson.nextCourse')}
        </Link>
      </div>
    )
  }
  const href = simulatorHref
  if (href) {
    return (
      <Link to={href} className="check-btn">
        {t('lesson.openDesktopSim')}
      </Link>
    )
  }
  return (
    <button type="button" className="check-btn" disabled={completed} onClick={onComplete}>
      {completed ? t('lesson.taskDone') : markMode ? t('lesson.markLearned') : t('lesson.taskComplete')}
    </button>
  )
}

function TeachArticle({
  teach,
  kind,
  syntax,
  showSyntax,
  copied,
  copyValue,
  terminal,
  showTerminalExample,
}: {
  teach: TeachPack
  kind: LessonKind
  syntax: string
  showSyntax: boolean
  copied: 'syntax' | 'term' | 'try' | null
  copyValue: (value: string, which: 'syntax' | 'term' | 'try') => void
  terminal: TerminalLine[]
  showTerminalExample: boolean
}) {
  const t = useT()
  const exampleLines = teach.example?.lines ?? (showTerminalExample ? terminal.map((line) => line.text) : [])
  const ExampleIcon = exampleLines.some((line) => /[/└├]/.test(line)) ? FolderTree : Keyboard
  return (
    <>
      {showSyntax ? (
        <section className="card">
          <h3>{t('lesson.syntax')}</h3>
          <div className="code-line">
            <span>{syntax}</span>
            <CopyButton copied={copied === 'syntax'} onCopy={() => copyValue(syntax, 'syntax')} />
          </div>
        </section>
      ) : null}

      <section className="lp-split">
        <div className="card lp-explain">
          <h3>
            <BookOpen className="lp-h-icon" />
            {kind === 'command' ? t('lesson.whatItDoes') : t('lesson.explanation')}
          </h3>
          {teach.explain.map((para) => (
            <p key={para} className="desc">
              {para}
            </p>
          ))}
          {teach.analog?.length ? (
            <div className="teach-analog">
              {teach.analog.map((item, analogIndex) => (
                <div
                  key={`${item.term}-${item.text}`}
                  className={cn('analog-card', `is-${ICON_TONES[analogIndex % ICON_TONES.length]}`)}
                >
                  <strong>{item.term}</strong>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          ) : teach.bullets?.length ? (
            <ul className="feature-list" style={{ marginTop: 12 }}>
              {teach.bullets.map((item) => (
                <li key={item}>
                  <span className="feature-icon blue sm">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {exampleLines.length ? (
          <section className="card lp-example">
            <h3>
              <ExampleIcon className="lp-h-icon" />
              {t('lesson.exampleStructure')}
            </h3>
            {teach.example?.caption ? <p className="desc">{teach.example.caption}</p> : null}
            <div className="terminal">
              <CopyButton
                copied={copied === 'term'}
                onCopy={() => copyValue(exampleLines.join('\n'), 'term')}
              />
              {exampleLines.map((line, index) => (
                <div key={`${line}-${index}`} className={treeLineClass(line)}>
                  {line || '\u00a0'}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </>
  )
}

export function LessonWorkspace(props: Props) {
  const t = useT()
  const [menuOpen, setMenuOpen] = useState(false)
  const [command, setCommand] = useState('')
  const [commandError, setCommandError] = useState('')
  const [copied, setCopied] = useState<'syntax' | 'term' | 'try' | null>(null)
  const [systemTicks, setSystemTicks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setCommand('')
    setCommandError('')
    setCopied(null)
    setMenuOpen(false)
  }, [props.lessonId])

  const kind = props.kind
  const isHotkey = kind === 'hotkey'
  const systemSheet = props.systemSheet
  const isSystemStudy = Boolean(systemSheet?.rows.length)
  const systemAllDone = Boolean(isSystemStudy && systemSheet?.rows.every((row) => row.done))
  const systemDoneKey = systemSheet?.rows.map((row) => `${row.id}:${row.done ? 1 : 0}`).join(',') ?? ''

  useEffect(() => {
    if (!systemSheet?.rows.length) return
    const completed: Record<string, boolean> = {}
    for (const row of systemSheet.rows) completed[row.id] = Boolean(row.done || systemAllDone)
    const next = mergeSystemStudyTicks(
      systemSheet.rows.map((row) => row.id),
      loadSystemStudyTicks(),
      completed,
    )
    setSystemTicks(next)
    saveSystemStudyTicks(next)
    // systemSheet is derived from systemDoneKey — avoid resetting ticks on new object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-merge when completion flags change
  }, [systemAllDone, systemDoneKey])

  const toggleSystemTick = (id: string) => {
    if (systemAllDone) return
    setSystemTicks((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      saveSystemStudyTicks(next)
      return next
    })
  }

  useEffect(() => {
    const ids = Object.entries(systemTicks)
      .filter(([, on]) => on)
      .map(([id]) => id)
    props.onSystemTicksChange?.(ids)
  }, [props.onSystemTicksChange, systemTicks])
  const syntax = lessonSyntax(kind, props.lessonTitle, props.keys)
  const expected = expectedCommand(kind, props.lessonTitle)
  const card = useMemo(
    () =>
      buildLessonCard({
        courseSlug: props.courseSlug,
        locale: props.locale,
        title: props.lessonTitle,
        seedTitle: props.seedTitle,
        keys: props.keys,
        summary: props.summary,
        description: props.description,
        actionPrompt: props.actionPrompt,
        usageExample: props.usageExample,
      }),
    [
      props.actionPrompt,
      props.courseSlug,
      props.description,
      props.keys,
      props.lessonTitle,
      props.locale,
      props.seedTitle,
      props.summary,
      props.usageExample,
    ],
  )
  const progressPct = props.totalCount ? Math.round((props.doneCount / props.totalCount) * 100) : 0
  const teach = card.teach
  const aboutFeatures = extraFeatures(card.features, card.whatIntro)
  const lastFilesLesson = props.courseSlug === 'computer-basics' && !props.nextId
  const skipFakeTry =
    Boolean(teach?.nextCourse) ||
    props.seedTitle === 'Дальше' ||
    (lastFilesLesson && !props.simulatorHref)
  const practiceSteps = skipFakeTry ? [] : teach?.practiceSteps.length ? teach.practiceSteps : card.steps
  const catalogHref = '/courses'
  const hasSim = Boolean(props.simulatorHref)
  const markMode =
    !isHotkey && kind !== 'command' && !hasSim && !teach?.quiz && !isSystemStudy && !skipFakeTry
  const showStepList = practiceSteps.length > 0 && !isHotkey && !isSystemStudy && !markMode
  const heroLead = (
    isSystemStudy
      ? t('lesson.systemStudyIntro')
      : (teach?.summary || props.why || card.summary || '').trim()
  )
  const showLead = Boolean(heroLead) && heroLead !== props.lessonTitle.trim()
  const hotkeyExplain = (props.detail || card.whatIntro || props.why || '').trim()

  const copyValue = async (value: string, which: 'syntax' | 'term' | 'try') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      window.setTimeout(() => setCopied(null), 1000)
    } catch {
      setCopied(null)
    }
  }

  const submitCommand = () => {
    if (!expected) return
    if (commandMatches(command, expected)) {
      setCommandError('')
      props.onComplete()
      return
    }
    setCommandError(t('lesson.commandBad', { cmd: expected }))
  }

  return (
    <div className="km-player-frame">
      {menuOpen ? (
        <button type="button" className="km-player-backdrop is-on" onClick={() => setMenuOpen(false)} />
      ) : null}
      <div className={cn('km-player', isHotkey && 'is-hotkey', isSystemStudy && 'is-system-study')}>
      <aside className={cn('sidebar', menuOpen && 'is-open')}>
        <div className="km-player-side-head">
          <Link to={catalogHref} className="back-link">
            <ArrowLeft className="h-4 w-4" />
            {t('lesson.backToCourse')}
          </Link>
          <LanguageSwitcher variant="player" />
          <button type="button" className="km-player-close" onClick={() => setMenuOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="lp-course-head">
          <CourseBrandIcon slug={props.courseSlug} icon={props.courseIcon} size={26} className="lp-course-mark" />
          <div className="course-title">{props.courseTitle}</div>
        </div>
        <div className="lp-progress-hero">
          <div className="lp-progress-row">
            <div className="lp-ring-wrap">
              <RingProgress value={progressPct} />
              <span>{progressPct}%</span>
            </div>
            <div className="lp-progress-copy">
              <div className="lp-progress-label">{t('lesson.progressTitle')}</div>
              <strong>
                {t('lesson.progressLessonsOf', { done: props.doneCount, total: props.totalCount })}{' '}
                {t('lesson.progressPassed')}
              </strong>
            </div>
          </div>
        </div>

        <nav aria-label={t('lesson.openLessons')}>
          {props.modules.map((mod) => (
            <div key={mod.slug}>
              <div className="section-label">{mod.title}</div>
              <ul className="lesson-list">
                {mod.lessons.map((lesson) => {
                  const mark = sidebarMark(lesson.status, lesson.n - 1, props.lessonIndex)
                  const Glyph = lessonGlyph(lesson.title)
                  const inner = (
                    <>
                      <span
                        className={cn(
                          'lesson-icon',
                          mark === 'current' ? 'current' : mark === 'done' ? 'done' : 'next',
                          mark !== 'current' && mark !== 'done' && `tone-${glyphTone(lesson.title)}`,
                        )}
                      >
                        {mark === 'done' ? <CircleCheck /> : mark === 'locked' ? <Lock /> : <Glyph />}
                      </span>
                        <span className="lesson-text">
                          <span className="lesson-name">
                            {lesson.n}. {lesson.title}
                          </span>
                          {mark === 'current' ? (
                            <span className="lesson-sub current-sub">{t('lesson.currentLesson')}</span>
                          ) : null}
                        </span>
                    </>
                  )
                  if (lesson.status === 'locked') {
                    return (
                      <li key={lesson.id}>
                        <span className="lesson-item locked">{inner}</span>
                      </li>
                    )
                  }
                  return (
                    <li key={lesson.id}>
                      <Link
                        to={`/lessons/${lesson.id}`}
                        onClick={() => setMenuOpen(false)}
                        className={cn('lesson-item', mark === 'current' && 'active')}
                      >
                        {inner}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className={cn('km-player-body', isHotkey && 'is-hotkey', isSystemStudy && 'is-system-study')}>
      <div className="main">
        <div className="km-player-toolbar">
          <button type="button" className="km-player-menu" onClick={() => setMenuOpen(true)}>
            <Menu className="h-4 w-4" />
            {t('lesson.openLessons')}
          </button>
          <LanguageSwitcher variant="player" />
        </div>
        {props.locked ? (
          <section className="card lock-card">
            <Lock className="mx-auto h-8 w-8" style={{ color: '#5b6478' }} />
            <p>{t('lesson.lockedHint')}</p>
            {props.playableId ? (
              <Link to={`/lessons/${props.playableId}`} className="check-btn" style={{ maxWidth: 240, margin: '16px auto 0' }}>
                {t('lesson.currentLesson')}
              </Link>
            ) : null}
          </section>
        ) : (
          <>
            <header className={cn('lp-hero', isHotkey && 'is-compact')}>
              <div className="lp-hero-top">
                {props.prevId ? (
                  <Link to={`/lessons/${props.prevId}`} className="lp-back" aria-label={t('lesson.prevLesson')}>
                    <ArrowLeft />
                  </Link>
                ) : (
                  <Link to={catalogHref} className="lp-back" aria-label={t('lesson.backToCourse')}>
                    <ArrowLeft />
                  </Link>
                )}
                <span className="lesson-badge">{t('lesson.lessonOf', { n: props.lessonIndex + 1, total: props.totalCount })}</span>
              </div>
              {isSystemStudy ? <p className="lp-module-label">{systemSheet!.title}</p> : null}
              <h1 className={cn('lesson-title', kind !== 'command' && 'is-plain')}>{props.lessonTitle}</h1>
              {showLead ? <p className="lesson-desc">{heroLead}</p> : null}
            </header>

            {isHotkey && !isSystemStudy ? (
              <section className="card lp-understand">
                {card.showSyntax ? (
                  <div className="code-line">
                    <span>{syntax}</span>
                    <CopyButton copied={copied === 'syntax'} onCopy={() => void copyValue(syntax, 'syntax')} />
                  </div>
                ) : null}
                {hotkeyExplain && hotkeyExplain !== heroLead ? (
                  <p className="desc">{hotkeyExplain}</p>
                ) : null}
              </section>
            ) : null}

            {isHotkey ? null : teach ? (
              <TeachArticle
                teach={teach}
                kind={kind}
                syntax={syntax}
                showSyntax={card.showSyntax}
                copied={copied}
                copyValue={(value, which) => void copyValue(value, which)}
                terminal={card.terminal}
                showTerminalExample={card.showExample}
              />
            ) : (
              <>
            {card.showSyntax ? (
              <section className="card">
                <h3>{t('lesson.syntax')}</h3>
                <div className="code-line">
                  <span>{syntax}</span>
                  <CopyButton copied={copied === 'syntax'} onCopy={() => void copyValue(syntax, 'syntax')} />
                </div>
              </section>
            ) : null}

            <section className="card">
              <h4>{t(kind === 'command' ? 'lesson.whatItDoes' : 'lesson.whatItDoesTopic')}</h4>
              {card.whatIntro ? <p className="desc">{card.whatIntro}</p> : null}
              {aboutFeatures.length ? (
                <ul className="feature-list">
                  {aboutFeatures.map((feature) => (
                    <li key={`${feature.title}-${feature.text}`}>
                      <span className={cn('feature-icon', feature.tone)}>
                        {featureGlyph(feature.tone)}
                      </span>
                      <span>
                        {feature.title ? <b>{feature.title}</b> : null}
                        {feature.title ? ' — ' : null}
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {card.showExample ? (
                <>
                  <h4>{t('lesson.example')}</h4>
                  <div className="terminal">
                    <CopyButton
                      copied={copied === 'term'}
                      onCopy={() => void copyValue(terminalPlain(card.terminal), 'term')}
                    />
                    {card.terminal.map((line, index) => (
                      <div key={`${line.text}-${index}`} className={toneClass(line.tone)}>
                        {line.text || '\u00a0'}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
              </>
            )}

            {!skipFakeTry ? (
              <section className={cn('lp-practice', markMode && 'is-mark')}>
                <div className="lp-practice-head">
                  <h3>
                    <Rocket className="lp-h-icon" />
                    {isSystemStudy
                      ? t('lesson.systemStudyTitle')
                      : markMode
                        ? t('lesson.understandTitle')
                        : t('lesson.tryYourself')}
                  </h3>
                  {teach?.practice && !isHotkey && !markMode ? <p>{teach.practice}</p> : null}
                </div>
                <div className={cn('lp-practice-grid', (isHotkey || !teach?.practiceTree?.length || markMode) && 'is-solo')}>
                  {teach?.practiceTree?.length && !isHotkey && !markMode ? (
                    <div className="terminal lp-practice-tree">
                      {teach.practiceTree.map((line, index) => (
                        <div key={`${line}-${index}`} className={treeLineClass(line)}>
                          {line || '\u00a0'}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div>
                    {showStepList ? (
                      <>
                        <p className="lp-do-label">{t('lesson.doThis')}</p>
                        <ol className="lp-steps">
                          {practiceSteps.map((step, index) => (
                            <li key={step}>
                              <span className="step-num">{index + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </>
                    ) : null}
                    <div className="try-actions">
                      {isSystemStudy && systemSheet ? (
                        <SystemStudySheet
                          rows={systemSheet.rows}
                          currentId={props.lessonId}
                          token={props.token}
                          lessonId={props.lessonId}
                          completedAll={systemAllDone}
                          ticks={systemTicks}
                          onToggle={toggleSystemTick}
                          onCompleteAll={() => props.onCompleteSystem?.()}
                        />
                      ) : (
                        <>
                      <PracticeActions
                        pack={teach}
                        kind={kind}
                        token={props.token}
                        completed={props.completed}
                        lessonId={props.lessonId}
                        simulatorHref={props.simulatorHref}
                        expected={expected}
                        syntax={syntax}
                        command={command}
                        commandError={commandError}
                        copied={copied}
                        studyOnly={props.studyOnly}
                        courseSlug={props.courseSlug}
                        actionPrompt={props.actionPrompt}
                        keys={props.keys}
                        why={props.why}
                        detail={props.detail}
                        markMode={markMode}
                        onCommand={submitCommand}
                        setCommand={setCommand}
                        setCommandError={setCommandError}
                        copyValue={(value, which) => void copyValue(value, which)}
                        onComplete={props.onComplete}
                        onHotkeyResult={props.onHotkeyResult}
                      />
                      {lastFilesLesson ? (
                        <Link to="/courses/programmer-basics" className="check-btn" style={{ marginTop: 10 }}>
                          {t('lesson.nextCourse')}
                        </Link>
                      ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : lastFilesLesson ? (
              <Link to="/courses/programmer-basics" className="check-btn">
                {t('lesson.nextCourse')}
              </Link>
            ) : null}
            {props.completed ? (
              <div className="lp-congrats">
                <PartyPopper />
                <div>
                  <h3>{t('lesson.congrats')}</h3>
                  <p>{teach?.success || t('lesson.greatJob')}</p>
                </div>
              </div>
            ) : null}
            <div className="lesson-pager">
              {props.prevId ? (
                <Link to={`/lessons/${props.prevId}`} className="nav-btn">
                  <ArrowLeft className="h-4 w-4" />
                  {t('lesson.prevLesson')}
                </Link>
              ) : (
                <span className="nav-btn is-disabled">← {t('lesson.prevLesson')}</span>
              )}
              {props.nextId && !props.locked ? (
                <Link to={`/lessons/${props.nextId}`} className="nav-btn primary">
                  {t('lesson.nextLesson')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : props.courseSlug === 'computer-basics' && !props.nextId ? (
                <Link to="/courses/programmer-basics" className="nav-btn primary">
                  {t('lesson.nextCourse')}
                </Link>
              ) : teach?.nextCourse ? (
                <Link to="/courses/programmer-basics" className="nav-btn primary">
                  {t('lesson.nextCourse')}
                </Link>
              ) : props.completed && !props.nextId ? (
                <Link to="/courses" className="nav-btn primary">
                  {t('lesson.catalog')}
                </Link>
              ) : (
                <span className="nav-btn is-disabled primary">{t('lesson.nextLesson')} →</span>
              )}
            </div>
          </>
        )}
      </div>
      </div>
      </div>
    </div>
  )
}

export function lessonKindFromData(courseSlug: string | undefined, keys: string[], title: string): LessonKind {
  return classifyLesson(courseSlug, keys, title)
}
