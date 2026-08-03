import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/authStore'
import { useT } from '@/shared/i18n'

export function HomePage() {
  const user = useAuthStore((s) => s.user)
  const t = useT()

  const features = [
    { title: t('home.f1Title'), text: t('home.f1Text') },
    { title: t('home.f2Title'), text: t('home.f2Text') },
    { title: t('home.f3Title'), text: t('home.f3Text') },
  ]

  return (
    <div>
      <section className="gradient-hero relative overflow-hidden px-4 pb-32 pt-20 md:pt-28">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-72 max-w-2xl rounded-full bg-brand-500/12 blur-3xl dark:bg-brand-400/10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-7 flex justify-center"
          >
            <img
              src="/logo-mark.png"
              alt=""
              width={72}
              height={72}
              className="h-[4.5rem] w-[4.5rem] rounded-2xl object-contain shadow-[0_20px_50px_-24px_rgb(13_148_136_/_0.75)]"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl font-semibold tracking-tight text-ink dark:text-white md:text-7xl"
          >
            KeyMaster
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-lg font-medium tracking-tight text-ink-soft dark:text-slate-300 md:text-2xl"
          >
            {t('home.headline')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-slate-600 dark:text-slate-400"
          >
            {t('home.lead')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to={user ? '/path' : '/register'} className="btn-primary px-7 py-3 text-[15px]">
              {user ? t('home.ctaPath') : t('home.ctaStart')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/courses" className="btn-secondary px-7 py-3 text-[15px]">
              {t('home.ctaCourses')}
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-28">
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {features.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              className="border-t border-black/[0.08] pt-6 dark:border-white/[0.1]"
            >
              <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-brand-700 dark:text-brand-300">
                0{i + 1}
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
