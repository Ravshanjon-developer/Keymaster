import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { PageHeader, PageShell } from '@/shared/components/PageLayout'
import { GlassCard, StatusBadge } from '@/shared/components/ui'
import { useT } from '@/shared/i18n'
import { PRACTICE_ICON_STROKE, practiceIcons } from '@/shared/lib/practiceNavIcons'
import { cn } from '@/shared/lib/utils'

type ModeCard = {
  to: string
  icon: LucideIcon
  title: string
  text: string
  tag: string
  tagTone: 'brand' | 'neutral' | 'success'
}

function ModeCardLink({ card, index }: { card: ModeCard; index: number }) {
  const Icon = card.icon
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={card.to} className="block h-full">
        <GlassCard
          hover
          className="group flex h-full min-h-[168px] flex-col !p-5 sm:!p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800 transition group-hover:scale-[1.03] dark:bg-brand-950/50 dark:text-brand-300">
              <Icon className="h-5 w-5" strokeWidth={PRACTICE_ICON_STROKE} aria-hidden />
            </span>
            <StatusBadge tone={card.tagTone}>{card.tag}</StatusBadge>
          </div>
          <h3 className="text-[16px] font-semibold leading-snug tracking-tight text-ink group-hover:text-brand-800 dark:text-white dark:group-hover:text-brand-300 sm:text-lg">
            {card.title}
          </h3>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-soft/85 dark:text-slate-400">
            {card.text}
          </p>
          <span className="mt-4 inline-flex text-brand-800/70 transition group-hover:text-brand-800 dark:text-brand-300/80 dark:group-hover:text-brand-300">
            <ArrowUpRight className="h-4 w-4 text-brand-800 dark:text-brand-300" aria-hidden />
          </span>
        </GlassCard>
      </Link>
    </motion.div>
  )
}

function SectionIntro({ title, description, id }: { title: string; description: string; id?: string }) {
  return (
    <div className="mb-5 max-w-2xl">
      <h2 id={id} className="text-h2">
        {title}
      </h2>
      <p className="text-muted mt-1.5 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

export function PracticeHubPage() {
  const t = useT()
  const location = useLocation()

  useEffect(() => {
    if (location.hash !== '#reinforce') return
    const el = document.getElementById('reinforce')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash, location.pathname])

  const skills: ModeCard[] = [
    {
      to: '/typing',
      icon: practiceIcons.typing,
      title: t('practiceShell.typing'),
      text: t('practice.typingText'),
      tag: t('practice.tagBeginner'),
      tagTone: 'neutral',
    },
    {
      to: '/simulator?mode=desktop',
      icon: practiceIcons.desktop,
      title: t('practiceShell.desktopSimulator'),
      text: t('practice.desktopSimText'),
      tag: t('practice.tagBeginner'),
      tagTone: 'neutral',
    },
    {
      to: '/simulator',
      icon: practiceIcons.simulator,
      title: t('practiceShell.simulator'),
      text: t('practice.simText'),
      tag: t('practice.tagCore'),
      tagTone: 'brand',
    },
    {
      to: '/training?course=programmer-basics',
      icon: practiceIcons.hotkeys,
      title: t('practiceShell.shortcuts'),
      text: t('practice.hotkeysText'),
      tag: t('practice.tagCore'),
      tagTone: 'brand',
    },
    {
      to: '/speed',
      icon: practiceIcons.speed,
      title: t('practiceShell.speed'),
      text: t('practice.speedText'),
      tag: t('practice.tagFun'),
      tagTone: 'success',
    },
  ]

  const reinforce: ModeCard[] = [
    {
      to: '/review?course=programmer-basics',
      icon: practiceIcons.review,
      title: t('practice.reviewTitle'),
      text: t('practice.reviewText'),
      tag: t('practice.tagReinforce'),
      tagTone: 'neutral',
    },
    {
      to: '/quiz',
      icon: practiceIcons.quiz,
      title: t('practice.quizTitle'),
      text: t('practice.quizText'),
      tag: t('practice.tagReinforce'),
      tagTone: 'neutral',
    },
    {
      to: '/exam',
      icon: practiceIcons.exam,
      title: t('practice.examTitle'),
      text: t('practice.examText'),
      tag: t('practice.tagReinforce'),
      tagTone: 'neutral',
    },
  ]

  return (
    <PageShell width="5xl">
      <PageHeader
        eyebrow={t('practice.eyebrow')}
        title={t('practice.title')}
        subtitle={t('practice.subtitle')}
      />

      <section className="mt-2" aria-labelledby="practice-skills-heading">
        <SectionIntro
          id="practice-skills-heading"
          title={t('practice.skillsSection')}
          description={t('practice.skillsSectionDesc')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {skills.map((card, i) => (
            <ModeCardLink key={card.to} card={card} index={i} />
          ))}
        </div>
      </section>

      <section id="reinforce" className="mt-12 scroll-mt-24" aria-labelledby="practice-reinforce-heading">
        <SectionIntro
          id="practice-reinforce-heading"
          title={t('practice.reinforceSection')}
          description={t('practice.reinforceSectionDesc')}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reinforce.map((card, i) => (
            <ModeCardLink key={card.to} card={card} index={i + skills.length} />
          ))}
        </div>
      </section>

      <GlassCard className="mt-12 !p-6 sm:!p-8">
        <p className="font-semibold text-[var(--text-primary)]">{t('practice.journeyTitle')}</p>
        <ol className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
          {[t('practice.step1'), t('practice.step2'), t('practice.step3'), t('practice.step4')].map(
            (step, i) => (
              <li key={step} className="flex gap-3">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    'bg-brand-50 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300',
                  )}
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ),
          )}
        </ol>
        <Link to="/courses/computer-basics" className="btn-primary mt-6 inline-flex">
          {t('practice.startCourse')}
        </Link>
      </GlassCard>
    </PageShell>
  )
}
