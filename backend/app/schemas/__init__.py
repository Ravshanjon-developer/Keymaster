import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=12, max_length=128)
    display_name: str = Field(min_length=1, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: str
    display_name: str
    xp: int
    level: int
    streak_days: int
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfile(UserPublic):
    completion_percent: float = 0
    level_title: str = "Новичок"


class LessonPublic(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    action_prompt: str
    keys: list[str]
    usage_example: str
    xp_reward: int
    sort_order: int
    course_slug: str | None = None
    category_slug: str | None = None

    model_config = {"from_attributes": True}


class CategoryPublic(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    sort_order: int
    lessons: list[LessonPublic] = []

    model_config = {"from_attributes": True}


class CoursePublic(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    description: str
    icon: str
    sort_order: int
    lesson_count: int = 0
    category_count: int = 0

    model_config = {"from_attributes": True}


class CourseDetail(CoursePublic):
    categories: list[CategoryPublic] = []


class TrainingSubmit(BaseModel):
    lesson_id: uuid.UUID
    correct: bool
    response_time_ms: int = 0


class TrainingResult(BaseModel):
    xp_gained: int
    total_xp: int
    level: int
    level_title: str
    streak_days: int
    new_achievements: list[str] = []


class AchievementPublic(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    description: str
    icon: str
    xp_bonus: int
    unlocked: bool = False
    unlocked_at: datetime | None = None

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    display_name: str
    xp: int
    level: int
    level_title: str


class DailyChallengePublic(BaseModel):
    challenge_type: str
    title: str
    target: int
    progress: int
    completed: bool
    xp_reward: int


class StatsPublic(BaseModel):
    total_correct: int
    total_wrong: int
    accuracy: float
    combos_best: int
    speed_best_score: int
    exam_best_score: int
    study_time_seconds: int
    streak_days: int
    favorite_course_slug: str | None
    avg_response_ms: int
    combinations_learned: int


class CourseProgressPublic(BaseModel):
    course_id: uuid.UUID
    slug: str
    title: str
    icon: str
    lesson_count: int
    completed_lessons: int
    percent: float
    xp_earned: int
    xp_total: int


class LessonProgressPublic(BaseModel):
    lesson_id: uuid.UUID
    course_slug: str
    title: str
    keys: list[str]
    completed: bool
    attempts: int
    correct_count: int
    xp_reward: int



class ExamSubmit(BaseModel):
    course_slug: str | None = None
    answers: list[dict]


class ExamResult(BaseModel):
    score_percent: float
    wrong_count: int
    duration_seconds: int
    grade: str
    certificate_eligible: bool
    xp_gained: int


class AdminOverview(BaseModel):
    users: int
    courses: int
    lessons: int
    achievements: int
    lessons_completed: int
    admins: int


class AdminCourseCreate(BaseModel):
    slug: str
    title: str
    description: str = ""
    icon: str = "keyboard"
    sort_order: int = 0


class AdminCourseUpdate(BaseModel):
    slug: str | None = None
    title: str | None = None
    description: str | None = None
    icon: str | None = None
    sort_order: int | None = None


class AdminCategoryCreate(BaseModel):
    course_id: uuid.UUID
    slug: str
    title: str
    sort_order: int = 0


class AdminCategoryUpdate(BaseModel):
    slug: str | None = None
    title: str | None = None
    sort_order: int | None = None


class AdminLessonCreate(BaseModel):
    category_id: uuid.UUID
    title: str
    description: str = ""
    action_prompt: str
    keys: list[str]
    usage_example: str = ""
    xp_reward: int = 10
    sort_order: int = 0


class AdminLessonUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    title: str | None = None
    description: str | None = None
    action_prompt: str | None = None
    keys: list[str] | None = None
    usage_example: str | None = None
    xp_reward: int | None = None
    sort_order: int | None = None


class AdminUserUpdate(BaseModel):
    display_name: str | None = None
    xp: int | None = None
    level: int | None = None
    streak_days: int | None = None
    is_admin: bool | None = None


class AchievementAdmin(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    description: str
    icon: str
    xp_bonus: int
    condition_type: str
    condition_value: int

    model_config = {"from_attributes": True}


class AdminAchievementCreate(BaseModel):
    slug: str
    title: str
    description: str = ""
    icon: str = "trophy"
    xp_bonus: int = 50
    condition_type: str = "correct_answers"
    condition_value: int = 1


class AdminAchievementUpdate(BaseModel):
    slug: str | None = None
    title: str | None = None
    description: str | None = None
    icon: str | None = None
    xp_bonus: int | None = None
    condition_type: str | None = None
    condition_value: int | None = None
