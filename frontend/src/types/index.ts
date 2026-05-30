// ── Auth ────────────────────────────────────────────────────────────
export interface User {
  id:          string;
  firstName:   string;
  lastName:    string;
  email:       string;
  role:        'member' | 'admin';
  isActive:    boolean;
  lastLoginAt: string | null;
  createdAt:   string;
}

export interface AuthResponse {
  token: string;
  user:  User;
}

// ── Challenge ───────────────────────────────────────────────────────
export interface Challenge {
  _id:           string;
  title:         string;
  description:   string;
  type:          'steps' | 'nutrition' | 'mindfulness' | 'weight_loss' | 'custom';
  status:        'draft' | 'published' | 'paused' | 'archived';
  startDate:     string;
  endDate:       string;
  goal:          { target: number; unit: string };
  rules:         string;
  imageUrl:      string;
  enrolledCount: number;
  isEnrolled?:   boolean;
  createdAt:     string;
}

// ── Leaderboard ─────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank:   number;
  score:  number;
  userId: string;
  name:   string;
  isMe:   boolean;
}

export interface LeaderboardResponse {
  challenge:  { id: string; title: string; type: string };
  myRank:     number | null;
  myScore:    number;
  entries:    LeaderboardEntry[];
  pagination: Pagination;
}

// ── Nutrition ───────────────────────────────────────────────────────
export interface MealLog {
  _id:      string;
  date:     string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  protein:  number;
  carbs:    number;
  fat:      number;
  quantity: number;
  unit:     string;
  notes:    string;
}

export interface WeightLog {
  _id:    string;
  weight: number;
  unit:   'kg' | 'lbs';
  date:   string;
  notes:  string;
}

export interface NutritionGoal {
  dailyCalories:  number;
  dailyProtein:   number;
  dailyCarbs:     number;
  dailyFat:       number;
  targetWeight:   number;
  weeklyLossRate: number;
  dietType:       'standard' | 'keto' | 'vegetarian' | 'vegan' | 'paleo';
}

export interface Recommendation {
  type:     string;
  priority: 'high' | 'medium' | 'low';
  message:  string;
  action:   string;
}

// ── Programs ────────────────────────────────────────────────────────
export interface Activity {
  title:       string;
  type:        string;
  durationMin: number;
  description: string;
}

export interface MindProgram {
  _id:          string;
  title:        string;
  description:  string;
  category:     'meditation' | 'sleep' | 'stress' | 'focus' | 'resilience';
  durationDays: number;
  difficulty:   'beginner' | 'intermediate' | 'advanced';
  imageUrl:     string;
  isEnrolled?:  boolean;
  currentDay?:  number;
  streak?:      number;
}

export interface TodayProgram {
  currentDay:    number;
  totalDays:     number;
  streak:        number;
  alreadyLogged: boolean;
  dayTitle:      string;
  activities:    Activity[];
  daysRemaining: number;
}

// ── Onboarding ──────────────────────────────────────────────────────
export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id:             string;
  type:           'text' | 'single' | 'multi' | 'number' | 'boolean';
  label:          string;
  required:       boolean;
  options:        QuestionOption[];
  nextQuestionId: string;
  branchMap:      Record<string, string>;
  showIf:         { questionId: string; operator: string; value: unknown } | null;
}

export interface Questionnaire {
  _id:       string;
  version:   number;
  name:      string;
  questions: Question[];
}

// ── Devices ─────────────────────────────────────────────────────────
export interface DeviceIntegration {
  platform:       string;
  status:         'connected' | 'disconnected' | 'error' | 'syncing';
  lastSyncAt:     string | null;
  lastSyncStatus: string;
  errorMessage:   string;
  retryCount:     number;
}

// ── Posts ───────────────────────────────────────────────────────────
export interface Post {
  _id:         string;
  authorId:    { _id: string; firstName: string; lastName: string };
  body:        string;
  imageUrl:    string;
  status:      string;
  reportCount: number;
  createdAt:   string;
}

// ── Chat ────────────────────────────────────────────────────────────
export interface ChatMessage {
  role:      'user' | 'assistant';
  content:   string;
  flagged:   boolean;
  createdAt: string;
}

// ── Config ──────────────────────────────────────────────────────────
export interface TenantConfig {
  branding: {
    appName:      string;
    primaryColor: string;
    accentColor:  string;
    logoUrl:      string;
    fontFamily:   string;
  };
  labels: {
    challengesSingular: string;
    challengesPlural:   string;
    pointsLabel:        string;
  };
  features: {
    leaderboard:  boolean;
    socialFeed:   boolean;
    nutrition:    boolean;
    mindPrograms: boolean;
    deviceSync:   boolean;
    chatbot:      boolean;
    onboarding:   boolean;
  };
}

// ── Admin ───────────────────────────────────────────────────────────
export interface AdminStats {
  users: {
    total:         number;
    active:        number;
    newThisMonth:  number;
    growthPercent: number;
  };
  challenges: {
    total:            number;
    published:        number;
    totalEnrollments: number;
  };
  content: {
    totalPosts:              number;
    pendingModeration:       number;
    totalMealLogs:           number;
    totalProgramEnrollments: number;
  };
}

export interface PipelineRun {
  _id:         string;
  date:        string;
  status:      'pending' | 'running' | 'completed' | 'failed';
  triggeredBy: string;
  startedAt:   string | null;
  doneAt:      string | null;
  stages: {
    stage:   string;
    status:  string;
    records: number;
    error:   string;
  }[];
}

// ── Shared ──────────────────────────────────────────────────────────
export interface Pagination {
  total: number;
  page:  number;
  limit: number;
  pages: number;
}