import { api, getToken } from './client.js';

export function login(email, password) {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(email, password, name) {
  return api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export function fetchMe() {
  return api('/auth/me');
}

export function fetchDashboard(month) {
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  return api(`/dashboard${q}`);
}

export function fetchTransactions(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') search.set(key, value);
  }
  const q = search.toString();
  return api(`/transactions${q ? `?${q}` : ''}`);
}

export function fetchReportsSummary(month) {
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  return api(`/reports/summary${q}`);
}

export async function exportReports(month) {
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  const token = getToken();
  const res = await fetch(`/api/reports/export${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Ошибка экспорта');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match?.[1] ?? 'report.csv';
  return { blob, filename };
}

export function fetchFamilyMembers() {
  return api('/family-members');
}

export function fetchExpenseCategories() {
  return api('/expense-categories');
}

export function fetchIncomeTypes() {
  return api('/income-types');
}

export function fetchAccounts() {
  return api('/accounts');
}

export function createIncome(body) {
  return api('/incomes', { method: 'POST', body: JSON.stringify(body) });
}

export function createExpense(body) {
  return api('/expenses', { method: 'POST', body: JSON.stringify(body) });
}
