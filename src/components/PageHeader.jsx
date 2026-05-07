function PageHeader({ title, description, actions }) {
  return (
    <header className="page-header">
      <div className="stack">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? <div className="toolbar-actions">{actions}</div> : null}
    </header>
  )
}

export default PageHeader
