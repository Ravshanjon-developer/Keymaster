import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import { AppLayout } from '@/shared/components/AppLayout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { Skeleton } from '@/shared/components/ui'

const HomePage = lazy(() => import('@/features/home/HomePage').then((m) => ({ default: m.HomePage })))
const LoginPage = lazy(() => import('@/features/auth/AuthPages').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() =>
  import('@/features/auth/AuthPages').then((m) => ({ default: m.RegisterPage })),
)
const VerifyEmailPage = lazy(() =>
  import('@/features/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
)
const AuthCallbackPage = lazy(() =>
  import('@/features/auth/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage })),
)
const CoursesPage = lazy(() =>
  import('@/features/courses/CoursesPages').then((m) => ({ default: m.CoursesPage })),
)
const CourseDetailPage = lazy(() =>
  import('@/features/courses/CoursesPages').then((m) => ({ default: m.CourseDetailPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const LessonPage = lazy(() =>
  import('@/features/lessons/LessonPage').then((m) => ({ default: m.LessonPage })),
)
const AchievementsPage = lazy(() =>
  import('@/features/social/SocialPages').then((m) => ({ default: m.AchievementsPage })),
)
const LeaderboardPage = lazy(() =>
  import('@/features/social/SocialPages').then((m) => ({ default: m.LeaderboardPage })),
)
const AdminPage = lazy(() => import('@/features/admin/AdminPage').then((m) => ({ default: m.AdminPage })))
const StatsPage = lazy(() => import('@/features/stats/StatsPages').then((m) => ({ default: m.StatsPage })))
const LearningPathPage = lazy(() =>
  import('@/features/path/LearningPathPage').then((m) => ({ default: m.LearningPathPage })),
)
const ExamPage = lazy(() => import('@/features/training/ExamPage').then((m) => ({ default: m.ExamPage })))
const SpeedModePage = lazy(() =>
  import('@/features/training/SpeedModePage').then((m) => ({ default: m.SpeedModePage })),
)
const ReviewPage = lazy(() =>
  import('@/features/mobile/ReviewPage').then((m) => ({ default: m.ReviewPage })),
)
const QuizPage = lazy(() => import('@/features/mobile/QuizPage').then((m) => ({ default: m.QuizPage })))
const TrainingPage = lazy(() =>
  import('@/features/training/TrainingPage').then((m) => ({ default: m.TrainingPage })),
)

function PageFallback() {
  return <Skeleton className="mx-auto mt-16 h-64 max-w-2xl" />
}

function CourseRoute() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/courses" replace />
  return <CourseDetailPage slug={slug} />
}

function LessonRoute() {
  const { id } = useParams()
  if (!id) return <Navigate to="/courses" replace />
  return <LessonPage lessonId={id} />
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="auth/callback" element={<AuthCallbackPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:slug" element={<CourseRoute />} />
          <Route path="lessons/:id" element={<LessonRoute />} />
          <Route
            path="path"
            element={
              <ProtectedRoute>
                <LearningPathPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="review"
            element={
              <ProtectedRoute>
                <ReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="quiz"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="training"
            element={
              <ProtectedRoute>
                <TrainingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="speed"
            element={
              <ProtectedRoute>
                <SpeedModePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="exam"
            element={
              <ProtectedRoute>
                <ExamPage />
              </ProtectedRoute>
            }
          />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route
            path="achievements"
            element={
              <ProtectedRoute redirect="login">
                <AchievementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute redirect="login">
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="stats"
            element={
              <ProtectedRoute redirect="login">
                <StatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute redirect="login">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
