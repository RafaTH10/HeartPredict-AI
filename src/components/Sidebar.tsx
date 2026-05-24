import { NavLink } from './NavLink';
import {
  LayoutDashboard,
  HeartPulse,
  Users,
  BarChart3,
  ShieldCheck,
  LogOut,
  Activity,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/predict', icon: HeartPulse, label: 'Predicción' },
  { to: '/patients', icon: Users, label: 'Pacientes' },
  { to: '/metrics', icon: BarChart3, label: 'Métricas ML' },
];

const adminItems = [
  { to: '/admin', icon: ShieldCheck, label: 'Administrador' },
];

export default function Sidebar({ open, onClose }: Props) {
  const { profile, signOut } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">HeartPredict</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">AI Medical System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Principal</p>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} icon={item.icon} label={item.label} onClick={onClose} />
          ))}

          {profile?.role === 'admin' && (
            <>
              <p className="px-3 mt-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sistema</p>
              {adminItems.map(item => (
                <NavLink key={item.to} to={item.to} icon={item.icon} label={item.label} onClick={onClose} />
              ))}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {profile?.full_name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{profile?.role || 'doctor'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
