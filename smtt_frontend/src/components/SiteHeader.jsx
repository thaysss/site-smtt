import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SiteHeader() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [altoContraste, setAltoContraste] = useState(() => localStorage.getItem('altoContraste') === 'true');

  useEffect(() => {
    document.body.classList.toggle('alto-contraste', altoContraste);
    localStorage.setItem('altoContraste', altoContraste);
  }, [altoContraste]);

  return (
    <>
      {/* Redesigned Accessibility / Top Bar */}
      <div className="bg-[#0b1c3e] text-white text-xs py-2 px-4 sm:px-6 lg:px-8 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center space-x-4">
          <span className="text-white/80">
            Bem Vindo à <strong className="text-white font-semibold">Superintendência Municipal de Transportes e Trânsito de Propriá</strong>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {/* Social Icons */}
          <a href="https://www.instagram.com/smttpropria?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="hover:text-secondary-500 transition-colors">
            <i className="fa-brands fa-instagram text-sm"></i>
          </a>
          <span className="text-white/20">|</span>
          <button
            onClick={() => setAltoContraste(!altoContraste)}
            className="hover:text-secondary-500 focus:outline-none flex items-center gap-1.5 transition-colors"
          >
            <i className="fa-solid fa-circle-half-stroke"></i> Alto Contraste
          </button>
        </div>
      </div>

      {/* Redesigned Main Navigation */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-8xl mx-auto px-4 sm:px-10 lg:px-10">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <img src="/vc.png" alt="Logo SMTT" className="h-16 w-auto object-contain" />
              </a>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden lg:flex items-center text-sm font-bold tracking-wider text-slate-800 font-sans">

              {/* HOME */}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); navigate('/'); }}
                className="relative px-4 py-2 text-primary-900 border-b-2 border-primary-900 hover:text-primary-650 transition-colors duration-300"
              >
                HOME
              </a>

              <span className="text-gray-300 px-3 select-none">/</span>

              {/* MENU (Dropdown) */}
              <div className="relative group">
                <button className="flex items-center gap-1 py-2 px-4 hover:text-primary-650 focus:outline-none">
                  MENU <i className="fa-solid fa-chevron-down text-[9px] transition-transform duration-300 group-hover:rotate-180"></i>
                </button>
                <div className="absolute left-0 mt-2 w-60 bg-white border border-slate-150 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-1.5 text-left normal-case font-medium">
                  <a href="https://www.propria.se.gov.br/orgao/autarquia/superintend%C3%AAncia-municipal-de-transporte-e-tr%C3%A2nsito" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Sobre a SMTT</a>
                  <button onClick={() => navigate('/#equipe')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Equipe Diretiva</button>
                </div>
              </div>

              <span className="text-gray-300 px-3 select-none">/</span>

              {/* NOTÍCIAS (Dropdown) */}
              <div className="relative group">
                <button onClick={() => navigate('/noticias')} className="flex items-center gap-1 py-2 px-4 hover:text-primary-650 focus:outline-none">
                  NOTÍCIAS <i className="fa-solid fa-chevron-down text-[9px] transition-transform duration-300 group-hover:rotate-180"></i>
                </button>
                <div className="absolute left-0 mt-2 w-60 bg-white border border-slate-150 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-1.5 text-left normal-case font-medium">
                  <button onClick={() => navigate('/noticias')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Portal de Notícias</button>
                  <a href="#noticias" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Últimas Notícias</a>
                </div>
              </div>

              <span className="text-gray-300 px-3 select-none">/</span>

              {/* SERVIÇOS (Dropdown) */}
              <div className="relative group">
                <button className="flex items-center gap-1 py-2 px-4 hover:text-primary-650 focus:outline-none">
                  SERVIÇOS <i className="fa-solid fa-chevron-down text-[9px] transition-transform duration-300 group-hover:rotate-180"></i>
                </button>
                <div className="absolute left-0 mt-2 w-68 bg-white border border-slate-150 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-1.5 text-left normal-case font-medium">
                  <button onClick={() => navigate('/login')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Consulta de Multas</button>
                  <button onClick={() => navigate('/contestacao-multa')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Defesa de Autuação</button>
                  <button onClick={() => navigate('/solicitacao-alvara')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Alvará & Permissionário</button>
                  <button onClick={() => navigate('/solicitacao-evento')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Solicitação para Eventos</button>
                  <button onClick={() => navigate('/consultar')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Consulta de Protocolo</button>
                </div>
              </div>

              <span className="text-gray-300 px-3 select-none">/</span>

              {/* LEGISLAÇÃO (Dropdown) */}
              <div className="relative group">
                <button className="flex items-center gap-1 py-2 px-4 hover:text-primary-650 focus:outline-none">
                  LEGISLAÇÃO <i className="fa-solid fa-chevron-down text-[9px] transition-transform duration-300 group-hover:rotate-180"></i>
                </button>
                <div className="absolute left-0 mt-2 w-60 bg-white border border-slate-150 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-1.5 text-left normal-case font-medium">
                  <button onClick={() => navigate('/#legislacao')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Leis & Resoluções</button>
                </div>
              </div>

              <span className="text-gray-300 px-3 select-none">/</span>

              {/* OUTROS (Dropdown) */}
              <div className="relative group">
                <button className="flex items-center gap-1 py-2 px-4 hover:text-primary-650 focus:outline-none">
                  OUTROS <i className="fa-solid fa-chevron-down text-[9px] transition-transform duration-300 group-hover:rotate-180"></i>
                </button>
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-150 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-1.5 text-left normal-case font-medium">
                  
                  <button onClick={() => navigate('/#ouvidoria')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Ouvidoria Digital</button>
                </div>
              </div>

              <span className="text-gray-300 px-3 select-none">/</span>

              {/* CONTATO */}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); navigate('/fale-conosco'); }}
                className="relative px-4 py-2 text-slate-700 hover:text-primary-650 transition-colors duration-300"
              >
                CONTATO
              </a>

              <span className="text-gray-300 px-3 select-none">/</span>

              {/* BUSCAR */}
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="flex items-center gap-1.5 py-2 px-4 hover:text-primary-650 focus:outline-none uppercase"
                >
                  <i className="fa-solid fa-search text-sm"></i> BUSCAR
                </button>
                {isSearchOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-150 rounded-xl shadow-xl p-3 z-50 normal-case font-medium">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const query = e.target.searchQuery.value.trim();
                      if (query) {
                        if (/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i.test(query)) {
                          navigate('/login');
                        } else {
                          navigate(`/noticias?q=${encodeURIComponent(query)}`);
                        }
                        setIsSearchOpen(false);
                      }
                    }} className="flex gap-2">
                      <input
                        type="text"
                        name="searchQuery"
                        placeholder="Buscar placa ou notícias..."
                        className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                        autoFocus
                      />
                      <button type="submit" className="bg-primary-900 text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-950">
                        Ir
                      </button>
                    </form>
                  </div>
                )}
              </div>

            </nav>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <button id="mobile-menu-btn" aria-label="Abrir menu" aria-expanded={isMobileMenuOpen} aria-controls="mobile-menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700 hover:text-primary-600 focus:outline-none focus:bg-primary-50 p-2 rounded-xl transition-colors">
                <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-2xl`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer Panel */}
        <div id="mobile-menu" className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsMobileMenuOpen(false)}></div>
          {/* Drawer Content */}
          <div className={`absolute top-0 right-0 w-80 max-w-sm h-full bg-white shadow-2xl flex flex-col p-6 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center pb-6 border-b border-gray-100">
              <img src="/vc.png" alt="Logo SMTT" className="h-10 w-auto object-contain" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-primary-600 p-2 bg-gray-100 hover:bg-primary-50 rounded-full transition-all">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <nav className="flex flex-col space-y-3.5 mt-8 overflow-y-auto pr-1">
              <a href="#" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); navigate('/'); }} className="px-4 py-3 rounded-xl font-bold text-primary-600 bg-primary-50 flex items-center gap-3 transition-colors">
                <i className="fa-solid fa-house"></i> Início
              </a>
              <div className="px-4 pt-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Institucional</div>
              <a href="https://www.propria.se.gov.br/orgao/autarquia/superintend%C3%AAncia-municipal-de-transporte-e-tr%C3%A2nsito" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3">
                <i className="fa-solid fa-circle-info text-gray-400 w-5"></i> Sobre a SMTT
              </a>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/#equipe'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
                <i className="fa-solid fa-users text-gray-400 w-5"></i> Equipe Diretiva
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/#legislacao'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
                <i className="fa-solid fa-gavel text-gray-400 w-5"></i> Legislação
              </button>

              <div className="px-4 pt-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Serviços</div>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
                <i className="fa-solid fa-magnifying-glass text-gray-400 w-5"></i> Consulta de Multas
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/contestacao-multa'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
                <i className="fa-solid fa-file-signature text-gray-400 w-5"></i> Defesa de Autuação
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/solicitacao-alvara'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
                <i className="fa-solid fa-id-card text-gray-400 w-5"></i> Alvará & Permissionário
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/solicitacao-evento'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
                <i className="fa-solid fa-calendar-day text-gray-400 w-5"></i> Solicitação para Eventos
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/consultar'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
                <i className="fa-solid fa-clipboard-list text-gray-400 w-5"></i> Consulta de Protocolo
              </button>

              <div className="px-4 pt-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Outros</div>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/noticias'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
                <i className="fa-solid fa-newspaper text-gray-400 w-5"></i> Notícias
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/fale-conosco'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
                <i className="fa-solid fa-phone text-gray-400 w-5"></i> Contato (Fale Conosco)
              </button>
            </nav>
            <div className="mt-auto pt-6 border-t border-gray-100">
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="w-full bg-secondary-500 hover:bg-secondary-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-secondary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-laptop"></i> Serviços Online
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default SiteHeader;
