import { FileText, Coins, Gavel, CheckCircle2 } from 'lucide-react';

export default function StatisticsPanel({ stats }) {
  const cards = [
    { label: 'Total Procurements', value: stats?.total_procurements ?? 0, icon: FileText, color: 'blue' },
    { label: 'Total Contract Value', value: formatCurrency(stats?.total_contract_value ?? 0), icon: Coins, color: 'emerald' },
    { label: 'Active Bids', value: stats?.active_bids ?? 0, icon: Gavel, color: 'amber' },
    { label: 'Completed Projects', value: stats?.completed_projects ?? 0, icon: CheckCircle2, color: 'green' },
  ];

  const colorMap = {
    blue: { icon: 'text-blue-600', bg: 'bg-blue-50' },
    emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-50' },
    amber: { icon: 'text-amber-600', bg: 'bg-amber-50' },
    green: { icon: 'text-green-600', bg: 'bg-green-50' },
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const cm = colorMap[card.color];
        return (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${cm.bg}`}>
                <card.icon size={16} className={cm.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{card.label}</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5 truncate">{card.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
