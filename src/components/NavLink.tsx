import { Video as LucideIcon } from 'lucide-react';

interface Props {
  to: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export function NavLink({ to, icon: Icon, label, onClick }: Props) {
  const isActive = window.location.pathname === to || window.location.pathname.startsWith(to + '/');

  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
        onClick?.();
      }}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
        ${isActive
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
        }
      `}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </a>
  );
}
