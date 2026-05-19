import { LayoutDashboard, LogOut, PieChart, Receipt, Wallet } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Главная', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Транзакции', icon: Receipt },
  { to: '/reports', label: 'Отчёты', icon: PieChart },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Wallet size={20} />
        </div>
        <span className="sidebar__title">Семейный бюджет</span>
      </div>
      <nav className="sidebar__nav">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__user">
        <div className="sidebar__avatar">{initial}</div>
        <span className="sidebar__user-name">{user?.name ?? user?.email}</span>
        <button
          type="button"
          className="btn btn--icon"
          onClick={handleLogout}
          aria-label="Выйти"
          title="Выйти"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
