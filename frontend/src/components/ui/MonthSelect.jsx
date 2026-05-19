import { useMonth } from '@/context/MonthContext.jsx';
import { getMonthOptions } from '@/utils/monthOptions.js';

const OPTIONS = getMonthOptions();

export default function MonthSelect({ style, className = 'select' }) {
  const { month, setMonth } = useMonth();

  return (
    <select
      className={className}
      aria-label="Период"
      value={month}
      onChange={(e) => setMonth(e.target.value)}
      style={style}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
