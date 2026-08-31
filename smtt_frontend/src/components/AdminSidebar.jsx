import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing, CalendarDays, ChartNoAxesCombined, ChevronLeft, ChevronRight,
  FilePenLine, FolderOpen, IdCard, ListChecks, LogOut, Menu, Newspaper,
  Search, X, LayoutDashboard,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, isTab: false },
  { id: 'recursos', label: 'Recursos', icon: FolderOpen, isTab: true },
  { id: 'eventos', label: 'Eventos', icon: CalendarDays, isTab: true },
  { id: 'alvaras', label: 'Alvarás', icon: IdCard, isTab: true },
  { id: 'infracoes', label: 'Infrações lançadas', icon: ListChecks, isTab: true },
  { id: 'noticias', label: 'Notícias', icon: Newspaper, isTab: true },
  { id: 'estatisticas', label: 'Estatísticas', icon: ChartNoAxesCombined, isTab: true },
  { id: 'lancar-infracao', label: 'Lançar AIT', icon: FilePenLine, isTab: false },
  { id: 'alertas', label: 'Avisos de interdição', icon: BellRing, isTab: false },
];

function AdminSidebar({ activeItem, onTabChange }) {
  const navigate = useNavigate();
  const adminNome = localStorage.getItem('adminNome') || 'Administrador';
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem('adminSidebarCollapsed') === 'true',
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem('adminSidebarCollapsed', String(nextValue));
  };

  const handleLogout = () => {
    if (!window.confirm('Deseja realmente encerrar a sessão?')) return;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminNome');
    navigate('/admin/login');
  };

  const handleItemClick = (item) => {
    if (item.id === 'dashboard') {
      navigate('/admin/dashboard');
    } else if (item.isTab) {
      localStorage.setItem('adminMenuAtivo', item.id);
      if (onTabChange) onTabChange(item.id);
      else navigate('/admin/painel');
    } else if (item.id === 'lancar-infracao') {
      navigate('/admin/infracoes');
    } else if (item.id === 'alertas') {
      navigate('/admin/alertas');
    }
    setIsMobileOpen(false);
  };

  const filteredItems = menuItems.filter((item) =>
    item.label.toLocaleLowerCase('pt-BR').includes(searchQuery.toLocaleLowerCase('pt-BR')),
  );

  return (
    <>
      <header className="admin-mobile-bar">
        <div className="admin-brand admin-brand--mobile">
          <img src="/SMTT.png" alt="SMTT Propriá" />
          <div>
            <strong>SMTT Propriá</strong>
            <span>Gestão administrativa</span>
          </div>
        </div>
        <button type="button" onClick={() => setIsMobileOpen(true)} aria-label="Abrir menu administrativo">
          <Menu size={22} />
        </button>
      </header>

      {isMobileOpen && (
        <button type="button" className="admin-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} aria-label="Fechar menu administrativo" />
      )}

      <aside className={`admin-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${isMobileOpen ? 'is-mobile-open' : ''}`}>
        <button type="button" className="admin-sidebar-close" onClick={() => setIsMobileOpen(false)} aria-label="Fechar menu">
          <X size={20} />
        </button>

        <button type="button" className="admin-sidebar-collapse" onClick={toggleCollapse} title={isCollapsed ? 'Expandir menu' : 'Recolher menu'} aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}>
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="admin-brand">
          <img src="/SMTT.png" alt="SMTT Propriá" />
          <div className="admin-sidebar-copy">
            <strong>SMTT Propriá</strong>
            <span>Gestão administrativa</span>
          </div>
        </div>



        <div className="admin-menu-search">
          <Search size={16} />
          <input type="search" placeholder="Buscar no menu" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-label="Buscar no menu administrativo" />
        </div>

        <nav className="admin-menu" aria-label="Navegação administrativa">
          <span className="admin-menu-label admin-sidebar-copy">Gestão e operações</span>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button type="button" key={item.id} onClick={() => handleItemClick(item)} className={isActive ? 'is-active' : ''} aria-current={isActive ? 'page' : undefined} title={isCollapsed ? item.label : undefined}>
                <Icon size={20} />
                <span className="admin-sidebar-copy">{item.label}</span>
              </button>
            );
          })}
        </nav>

          <div className="admin-user-card">
          <span className="admin-avatar">{adminNome.substring(0, 2).toUpperCase()}</span>
          <div className="admin-sidebar-copy">
            <strong title={adminNome}>{adminNome}</strong>

          </div>
        </div>

        <div className="admin-sidebar-footer">
          <button type="button" onClick={handleLogout} title="Encerrar sessão">
            <LogOut size={19} />
            <span className="admin-sidebar-copy">Encerrar sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
