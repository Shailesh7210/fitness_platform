import { Navigate }     from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { PageSpinner }  from './ui/Spinner';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user, isLoading } = useAuthStore();
  if (isLoading)              return <PageSpinner />;
  if (!token)                 return <Navigate to="/login"     replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}