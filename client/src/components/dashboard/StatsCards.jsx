import { HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlineChartBar, HiOutlineLightningBolt } from 'react-icons/hi';

export default function StatsCards({ stats = {} }) {
  const cards = [
    {
      label: 'Current Reading',
      value: `${stats.current || 0} PPM`,
      icon: HiOutlineLightningBolt,
      color: 'from-electric-500 to-blue-600',
      textColor: 'text-electric-400',
    },
    {
      label: 'Max Today',
      value: `${stats.max || 0} PPM`,
      icon: HiOutlineTrendingUp,
      color: 'from-red-500 to-orange-600',
      textColor: 'text-red-400',
    },
    {
      label: 'Min Today',
      value: `${stats.min || 0} PPM`,
      icon: HiOutlineTrendingDown,
      color: 'from-emerald-500 to-green-600',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Average Today',
      value: `${stats.avg || 0} PPM`,
      icon: HiOutlineChartBar,
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} bg-opacity-20`}>
                <Icon className="text-white text-sm" />
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.textColor} tabular-nums`}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
