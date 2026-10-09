export default function StatCard({ icon, label, value, subtext, badge, badgeColor }) {
  return (
    <div className="c2c-editorial-card p-3 h-100 d-flex flex-column justify-content-between">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span className="fs-3">{icon}</span>
        {badge && (
          <span className={`badge ${badgeColor ? `bg-${badgeColor}` : 'bg-charcoal'} text-white rounded-1 px-2 py-1 small`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <div className="fw-bold fs-3 text-charcoal font-editorial lh-1 mb-1">{value}</div>
        <div className="text-muted small fw-semibold">{label}</div>
        {subtext && <div className="text-sage-dark small mt-1">{subtext}</div>}
      </div>
    </div>
  );
}
