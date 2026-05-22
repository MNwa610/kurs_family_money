import { Router } from 'express';

import accountRoutes from './account.routes.js';
import authRoutes from './auth.routes.js';
import budgetRoutes from './budget.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import householdRoutes from './household.routes.js';
import notificationsRoutes from './notifications.routes.js';
import recurringRoutes from './recurring.routes.js';
import expenseRoutes from './expense.routes.js';
import expenseCategoryRoutes from './expenseCategory.routes.js';
import familyMemberRoutes from './familyMember.routes.js';
import incomeRoutes from './income.routes.js';
import incomeTypeRoutes from './incomeType.routes.js';
import reportsRoutes from './reports.routes.js';
import transactionRoutes from './transaction.routes.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    service: 'family-budget-api',
    version: '1.0',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me', 'PATCH /api/auth/me'],
      dashboard: ['GET /api/dashboard?month=YYYY-MM'],
      transactions: ['GET /api/transactions'],
      reports: ['GET /api/reports/summary', 'GET /api/reports/export'],
      household: [
        'POST /api/household/create',
        'GET /api/household',
        'POST /api/household/invites',
        'POST /api/household/invites/accept',
      ],
      budgets: ['GET /api/budgets', 'PUT /api/budgets'],
      recurring: ['GET /api/recurring', 'POST /api/recurring'],
    },
  });
});

router.use('/auth', authRoutes);
router.use('/household', householdRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/budgets', budgetRoutes);
router.use('/recurring', recurringRoutes);
router.use('/family-members', familyMemberRoutes);
router.use('/accounts', accountRoutes);
router.use('/income-types', incomeTypeRoutes);
router.use('/expense-categories', expenseCategoryRoutes);
router.use('/incomes', incomeRoutes);
router.use('/expenses', expenseRoutes);
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);

export default router;
