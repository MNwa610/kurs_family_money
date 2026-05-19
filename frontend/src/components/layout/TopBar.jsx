import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import Button from '@/components/ui/Button.jsx';
import MonthSelect from '@/components/ui/MonthSelect.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { useMonth } from '@/context/MonthContext.jsx';

const titles = {
  '/': { title: 'Добрый день', subtitle: 'Обзор за' },
  '/transactions': { title: 'Транзакции', subtitle: 'История доходов и расходов' },
  '/reports': { title: 'Отчёты', subtitle: 'Анализ доходов и расходов' },
};

export default function TopBar({ onAddClick }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { label } = useMonth();
  const page = titles[pathname] ?? titles['/'];
  const greeting = user?.name ? `${page.title}, ${user.name}` : page.title;
  const subtitle = pathname === '/' ? `${page.subtitle} ${label}` : page.subtitle;

  return (
    <header className="topbar">
      <div className="topbar__greeting">
        <h1>{greeting}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar__actions">
        <MonthSelect />
        <Button onClick={onAddClick}>
          <Plus size={18} />
          Добавить операцию
        </Button>
      </div>
    </header>
  );
}
