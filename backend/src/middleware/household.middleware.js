import { getHouseholdContext } from '../lib/household.js';

export async function householdMiddleware(req, res, next) {
  try {
    const ctx = await getHouseholdContext(req.user.id);
    req.householdId = ctx.householdId;
    req.householdRole = ctx.role;
    req.householdName = ctx.householdName;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireOwner(req, res, next) {
  if (req.householdRole !== 'owner') {
    return res.status(403).json({ message: 'Только владелец семьи может выполнить это действие' });
  }
  return next();
}
