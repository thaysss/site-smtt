import './AdminCountBadge.css';

export default function AdminCountBadge({ icon: Icon, label, value, tone = 'blue', description, onClick }) {
  const Container = onClick ? 'button' : 'article';
  return (
    <Container type={onClick ? 'button' : undefined} onClick={onClick} className={`admin-count-badge admin-count-badge--${tone}`}>
      <span className="admin-count-badge-icon" aria-hidden="true"><Icon size={25} /></span>
      <div className="admin-count-badge-content">
        <span className="admin-count-badge-label">{label}</span>
        <strong className="admin-count-badge-value">{value}</strong>
        {description && <span className="admin-count-badge-description">{description}</span>}
      </div>
    </Container>
  );
}
