import { api, getToken } from './client.js';

export function login(email, password) {
  return api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function register(email, password, name) {
  return api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
}

export function fetchMe() {
  return api('/auth/me');
}

export function updateProfile(body) {
  return api('/auth/me', { method: 'PATCH', body: JSON.stringify(body) });
}

export function createFamilyMember(body) {
  return api('/family-members', { method: 'POST', body: JSON.stringify(body) });
}

export function updateFamilyMember(id, body) {
  return api(`/family-members/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteFamilyMember(id) {
  return api(`/family-members/${id}`, { method: 'DELETE' });
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
  return { blob, filename: match?.[1] ?? 'report.csv' };
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

export function updateIncome(id, body) {
  return api(`/incomes/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function updateExpense(id, body) {
  return api(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteIncome(id) {
  return api(`/incomes/${id}`, { method: 'DELETE' });
}

export function deleteExpense(id) {
  return api(`/expenses/${id}`, { method: 'DELETE' });
}

export function createHousehold(name) {
  return api('/household/create', {
    method: 'POST',
    body: JSON.stringify(name ? { name } : {}),
  });
}

export function fetchHousehold() {
  return api('/household');
}

export function updateHousehold(name) {
  return api('/household', { method: 'PATCH', body: JSON.stringify({ name }) });
}

export function createHouseholdInvite(email) {
  return api('/household/invites', { method: 'POST', body: JSON.stringify({ email }) });
}

export function acceptHouseholdInvite(token) {
  return api('/household/invites/accept', { method: 'POST', body: JSON.stringify({ token }) });
}

export function cancelHouseholdInvite(inviteId) {
  return api(`/household/invites/${inviteId}`, { method: 'DELETE' });
}

export function declineHouseholdInvite(inviteId) {
  return api(`/notifications/invites/${inviteId}`, { method: 'DELETE' });
}

export function fetchNotifications() {
  return api('/notifications');
}

export function removeHouseholdMember(memberId) {
  return api(`/household/members/${memberId}`, { method: 'DELETE' });
}

export function fetchBudgets(month) {
  return api(`/budgets?month=${encodeURIComponent(month)}`);
}

export function upsertBudget(body) {
  return api('/budgets', { method: 'PUT', body: JSON.stringify(body) });
}

export function deleteBudget(id) {
  return api(`/budgets/${id}`, { method: 'DELETE' });
}

export function fetchRecurring() {
  return api('/recurring');
}

export function createRecurring(body) {
  return api('/recurring', { method: 'POST', body: JSON.stringify(body) });
}

export function updateRecurring(id, body) {
  return api(`/recurring/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteRecurring(id) {
  return api(`/recurring/${id}`, { method: 'DELETE' });
}

export function processRecurring() {
  return api('/household/recurring/process', { method: 'POST' });
}
