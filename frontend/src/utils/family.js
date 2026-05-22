export const RELATION_OPTIONS = [
  { value: 'self', label: 'Я' },
  { value: 'partner', label: 'Супруг(а)' },
  { value: 'child', label: 'Ребёнок' },
  { value: 'parent', label: 'Родитель' },
  { value: 'other', label: 'Другое' },
];

export function relationLabel(relation) {
  if (!relation) return '';
  return RELATION_OPTIONS.find((o) => o.value === relation)?.label ?? relation;
}
