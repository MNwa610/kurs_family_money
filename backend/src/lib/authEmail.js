/** Частые опечатки демо-email → канонический адрес из seed. */
const EMAIL_ALIASES = {
  'demo@femily.local': 'demo@family.local',
};

export function normalizeAuthEmail(email) {
  const normalized = email.trim().toLowerCase();
  return EMAIL_ALIASES[normalized] ?? normalized;
}

export const DEMO_EMAIL = 'demo@family.local';
