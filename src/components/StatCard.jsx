function StatCard({ label, value, hint, icon = null, tone = '', className = '' }) {
  return (
    <article className={`stat-card ${tone} ${className}`.trim()}>
      <div className="split-line">
        <span className="muted">{label}</span>
        {icon ? <span className="stat-icon">{icon}</span> : null}
      </div>
      <strong>{value}</strong>
      {hint ? <span className="muted">{hint}</span> : null}
    </article>
  )
}

export default StatCard
