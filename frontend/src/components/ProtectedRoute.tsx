import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { PageSpinner }  from './ui/Spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuthStore();
  if (isLoading) return <PageSpinner />;
  if (!token)    return <Navigate to="/login" replace />;
  return <>{children}</>;
}