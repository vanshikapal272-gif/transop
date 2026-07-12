function Badge({ children, variant = 'neutral', dot = true, className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export default Badge;
