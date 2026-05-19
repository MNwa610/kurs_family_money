import {
  Briefcase,
  Car,
  Film,
  ShoppingCart,
  Wallet,
} from 'lucide-react';

import { formatMoney } from '@/utils/format.js';

const icons = {
  shopping: ShoppingCart,
  wallet: Wallet,
  car: Car,
  film: Film,
  briefcase: Briefcase,
};

export default function TransactionRow({ tx }) {
  const Icon = icons[tx.icon] || Wallet;
  const isIncome = tx.type === 'income';

  return (
    <article className="transaction-row">
      <div
        className="transaction-row__icon"
        style={{ background: tx.iconBg, color: isIncome ? 'var(--income)' : 'var(--expense)' }}
      >
        <Icon size={20} />
      </div>
      <div className="transaction-row__body">
        <div className="transaction-row__title">{tx.title}</div>
        <div className="transaction-row__subtitle">{tx.subtitle}</div>
        {tx.meta && <div className="transaction-row__meta">{tx.meta}</div>}
      </div>
      <div>
        <div
          className={`transaction-row__amount ${
            isIncome ? 'transaction-row__amount--income' : 'transaction-row__amount--expense'
          }`}
        >
          {formatMoney(tx.amount)}
        </div>
        <div className="transaction-row__date">{tx.dateLabel}</div>
      </div>
    </article>
  );
}
