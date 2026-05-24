import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useToast } from './hooks/useToast';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PredictionPage from './pages/PredictionPage';
import PatientsPage from './pages/PatientsPage';
import MetricsPage from './pages/MetricsPage';
import AdminPage from './pages/AdminPage';
import { Loader2 } from 'lucide-react';

function Router() {
  const { session, loading } = useAuth();
  const [path, setPath] = useState(window.location.pathname);
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    void addToast;
    function onPop() {
      setPath(window.location.pathname);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [addToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando HeartPredict AI...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        {authPage === 'login'
          ? <LoginPage onNavigate={p => setAuthPage(p as 'login' | 'register')} />
          : <RegisterPage onNavigate={p => setAuthPage(p as 'login' | 'register')} />
        }
        <Toast toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  const routes: Record<string, JSX.Element> = {
    '/dashboard': <DashboardPage />,
    '/predict': <PredictionPage />,
    '/patients': <PatientsPage />,
    '/metrics': <MetricsPage />,
    '/admin': <AdminPage />,
  };

  const page = routes[path] || routes['/dashboard'];

  return (
    <>
      {page}
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  );
}
