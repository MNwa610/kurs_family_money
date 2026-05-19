import { createContext, useContext, useMemo, useState } from 'react';

import { currentMonthParam, formatMonthLabel } from '@/utils/format.js';

const MonthContext = createContext(null);

export function MonthProvider({ children }) {
  const [month, setMonth] = useState(currentMonthParam);
  const label = useMemo(() => formatMonthLabel(month), [month]);

  const value = useMemo(() => ({ month, setMonth, label }), [month, label]);

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used within MonthProvider');
  return ctx;
}
