import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = ({ activeItem, onTabChange }) => {
  const navigate = useNavigate();
  const adminNome = localStorage.getItem('adminNome') || 'Administrador';
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === 'true');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', String(newState));
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente encerrar a sessão?")) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminNome');
      navigate('/admin/login');
    }
  };

  const menuItems = [
    { id: 'recursos', label: 'Recursos', icon: 'fa-folder-open', isTab: true },
    { id: 'eventos', label: 'Eventos', icon: 'fa-calendar-days', isTab: true },
    { id: 'alvaras', label: 'Alvarás', icon: 'fa-id-card-clip', isTab: true },
    { id: 'infracoes', label: 'Infrações Lançadas', icon: 'fa-list-check', isTab: true },
    { id: 'noticias', label: 'Notícias', icon: 'fa-newspaper', isTab: true },
    { id: 'estatisticas', label: 'Estatísticas', icon: 'fa-chart-line', isTab: true },
    { id: 'lancar-infracao', label: 'Lançar Infração', icon: 'fa-file-signature', isTab: false },

    { id: 'alertas', label: 'Avisos de Interdição', icon: 'fa-triangle-exclamation', isTab: false },
  ];

  const handleItemClick = (item) => {
    if (item.isTab) {
      localStorage.setItem('adminMenuAtivo', item.id);
      if (onTabChange) {
        onTabChange(item.id);
      } else {
        navigate('/admin/painel');
      }
    } else {
      if (item.id === 'lancar-infracao') {
        navigate('/admin/infracoes');
      } else if (item.id === 'veiculos') {
        navigate('/admin/veiculos');
      } else if (item.id === 'alertas') {
        navigate('/admin/alertas');
      }
    }
  };

  // Filter items based on search query
  const filteredItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`relative bg-primary-900 text-white flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out hidden md:flex shrink-0 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute top-10 -right-3 w-6 h-6 bg-primary-800 text-white rounded-full flex items-center justify-center border border-white/10 shadow-lg cursor-pointer hover:bg-primary-700 hover:scale-110 transition-all z-30"
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        <i className={`fa-solid fa-chevron-${isCollapsed ? 'right' : 'left'} text-[10px]`}></i>
      </button>

      {/* Header / Logo */}
      <div className={`p-4 border-b border-white/10 flex items-center gap-3 overflow-hidden h-20 shrink-0 ${isCollapsed ? 'justify-center' : 'px-6'}`}>
        <img src="/logo.png" alt="Logo SMTT" className="w-10 h-14 object-contain shrink-0" />
        {!isCollapsed && (
          <div className="animate-fadeIn">
            <h2 className="font-bold text-lg leading-tight whitespace-nowrap">SMTT Admin</h2>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block whitespace-nowrap">Portal do Servidor</span>
          </div>
        )}
      </div>

      {/* User Info Card */}
      <div className={`shrink-0 ${isCollapsed ? 'py-4 flex justify-center' : 'p-4'}`}>
        {isCollapsed ? (
          <div className="relative group">
            <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center font-bold text-sm text-secondary-500 shadow-inner cursor-pointer hover:bg-primary-600 transition-colors">
              {adminNome.substring(0, 2).toUpperCase()}
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg border border-white/5 font-semibold">
              {adminNome}
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-black/20 rounded-2xl flex items-center gap-3 border border-white/5 animate-fadeIn">
            <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center font-bold text-sm text-secondary-500 shrink-0 shadow-inner">
              {adminNome.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white truncate leading-tight" title={adminNome}>{adminNome}</h4>
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block mt-0.5">Agente Autuador</span>
            </div>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className={`shrink-0 mb-3 ${isCollapsed ? 'flex justify-center' : 'px-4'}`}>
        {isCollapsed ? (
          <div className="relative group">
            <div className="w-10 h-10 rounded-xl bg-black/20 hover:bg-black/30 text-gray-400 flex items-center justify-center cursor-pointer transition-colors border border-white/5">
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg border border-white/5 font-semibold">
              Buscar no menu
            </div>
          </div>
        ) : (
          <div className="relative animate-fadeIn">
            <input
              type="text"
              placeholder="Buscar menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-500 text-xs"></i>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-2 px-3 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {filteredItems.map((item) => {
          const isActive = activeItem === item.id;

          if (isCollapsed) {
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-12 h-12 mx-auto flex items-center justify-center rounded-xl transition-all border ${isActive
                      ? 'bg-primary-600 text-white shadow-md border-primary-700'
                      : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                >
                  <i className={`fa-solid ${item.icon} text-lg ${isActive ? 'text-secondary-500' : 'text-gray-400'}`}></i>
                </button>
                {/* Tooltip */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg border border-white/5 font-bold">
                  {item.label}
                </div>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all border text-left ${isActive
                  ? 'bg-primary-600 text-white shadow-md border-primary-700'
                  : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
                }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center transition-colors ${isActive ? 'text-secondary-500' : 'text-gray-400'}`}></i>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className={`p-4 border-t border-white/10 bg-black/10 shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <div className="relative group">
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition-all border border-red-500/20"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg border border-red-500/20 font-bold">
              Encerrar Sessão
            </div>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition-all text-xs border border-red-500/20"
          >
            <span>Encerrar Sessão</span>
            <i className="fa-solid fa-right-from-bracket text-xs"></i>
          </button>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
