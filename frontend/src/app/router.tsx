import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import { LoginPage, RegisterPage } from '@/features/auth/AuthPages'
import { CourseDetailPage, CoursesPage } from '@/features/courses/CoursesPages'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { HomePage } from '@/features/home/HomePage'
import { LessonPage } from '@/features/lessons/LessonPage'
import { AchievementsPage, LeaderboardPage } from '@/features/social/SocialPages'
import { AdminPage } from '@/features/admin/AdminPage'
import { StatsPage } from '@/features/stats/StatsPages'
import { LearningPathPage } from '@/features/path/LearningPathPage'
import { ExamPage } from '@/features/training/ExamPage'
import { SpeedModePage } from '@/features/training/SpeedModePage'
import { TrainingPage } from '@/features/training/TrainingPage'
import { AppLayout } from '@/shared/components/AppLayout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'

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
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:slug" element={<CourseRoute />} />
        <Route path="lessons/:id" element={<LessonRoute />} />
        <Route path="path" element={<LearningPathPage />} />
        <Route path="training" element={<TrainingPage />} />
        <Route path="speed" element={<SpeedModePage />} />
        <Route path="exam" element={<ExamPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route
          path="achievements"
          element={
            <ProtectedRoute>
              <AchievementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="stats"
          element={
            <ProtectedRoute>
              <StatsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
