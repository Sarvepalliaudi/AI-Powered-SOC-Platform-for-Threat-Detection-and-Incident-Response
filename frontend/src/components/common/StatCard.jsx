export default function StatCard({ title, value, icon: Icon, trend, color = 'accent', loading }) {
  const colors = {
    accent: 'text-soc-accent border-soc-accent/30',
    danger: 'text-soc-danger border-soc-danger/30',
    warning: 'text-soc-warning border-soc-warning/30',
    info: 'text-soc-accent2 border-soc-accent2/30',
  };

  return (
    <div className="glass-card-hover p-5 animate-slide-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-soc-muted text-sm mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
          ) : (
            <p className={`text-3xl font-bold font-display ${colors[color].split(' ')[0]}`}>{value}</p>
          )}
          {trend && <p className="text-xs text-soc-muted mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-white/5 border ${colors[color]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
