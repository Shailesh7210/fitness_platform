import { useEffect }        from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster }          from 'react-hot-toast';
import { useAuthStore }     from './store/authStore';
import { api }              from './api/client';
import { ProtectedRoute }   from './components/ProtectedRoute';
import { AdminRoute }       from './components/AdminRoute';

// Auth
import { LoginPage }    from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Phase 3
import { DashboardPage }       from './pages/user/DashboardPage';
import { ChallengePage }       from './pages/user/ChallengePage';
import { ChallengeDetailPage } from './pages/user/ChallengeDetailPage';
import { LeaderboardPage }     from './pages/user/LeaderboardPage';
import { ProfilePage }         from './pages/user/ProfilePage';

// Phase 4
import { NutritionPage }     from './pages/user/NutritionPage';
import { ProgramsPage }      from './pages/user/ProgramsPage';
import { ProgramDetailPage } from './pages/user/ProgramDetailPage';
import { OnboardingPage }    from './pages/user/OnboardingPage';
import { DevicesPage }       from './pages/user/DevicesPage';

export default function App() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/api/auth/me')
      .then(res => setAuth(res.data, token))
      .catch(() => { clearAuth(); setLoading(false); });
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '10px',
            background:   '#1e293b',
            color:        '#f1f5f9',
            fontSize:     '14px',
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Phase 3 */}
        <Route path="/dashboard"       element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/challenges"      element={<ProtectedRoute><ChallengePage /></ProtectedRoute>} />
        <Route path="/challenges/:id"  element={<ProtectedRoute><ChallengeDetailPage /></ProtectedRoute>} />
        <Route path="/leaderboard/:id" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/profile"         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Phase 4 */}
        <Route path="/nutrition"     element={<ProtectedRoute><NutritionPage /></ProtectedRoute>} />
        <Route path="/programs"      element={<ProtectedRoute><ProgramsPage /></ProtectedRoute>} />
        <Route path="/programs/:id"  element={<ProtectedRoute><ProgramDetailPage /></ProtectedRoute>} />
        <Route path="/onboarding"    element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/devices"       element={<ProtectedRoute><DevicesPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}