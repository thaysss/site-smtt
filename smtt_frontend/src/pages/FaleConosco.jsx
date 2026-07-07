import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function FaleConosco() {
  const navigate = useNavigate();

  // Estados de UI (Menu, Scroll)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Estados de Acessibilidade e Modais
  const [altoContraste, setAltoContraste] = useState(() => localStorage.getItem('altoContraste') === 'true');
  const [modalConteudo, setModalConteudo] = useState(null);
  const [servicoIndisponivel, setServicoIndisponivel] = useState('');

  // Estados do Formulário de Ouvidoria
  const [ouvidoriaNome, setOuvidoriaNome] = useState('');
  const [ouvidoriaEmail, setOuvidoriaEmail] = useState('');
  const [ouvidoriaAssunto, setOuvidoriaAssunto] = useState('Sugestão');
  const [ouvidoriaMensagem, setOuvidoriaMensagem] = useState('');
  const [ouvidoriaLoading, setOuvidoriaLoading] = useState(false);
  const [ouvidoriaProtocolo, setOuvidoriaProtocolo] = useState(null);

  // Efeito do Modo Alto Contraste (Acessibilidade)
  useEffect(() => {
    if (altoContraste) {
      document.body.classList.add('alto-contraste');
    } else {
      document.body.classList.remove('alto-contraste');
    }
    localStorage.setItem('altoContraste', altoContraste);
  }, [altoContraste]);

  // Efeito de Scroll (Botão Topo)
  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div id="top" className="font-sans text-gray-800 bg-[#f8fafc] flex flex-col min-h-screen">

      {/* Accessibility / Top Bar */}
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
          <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-secondary-500 transition-colors">
            <i className="fa-brands fa-twitter text-sm"></i>
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
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <img src="/logo-smtt.png" alt="Logo SMTT" className="h-14 w-auto object-contain" />
              </a>
            </div>

            {/* Desktop Menu - styled exactly like the screenshot */}
            <nav className="hidden lg:flex items-center text-sm font-bold tracking-wider text-slate-800 font-sans">
              
              {/* HOME */}
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); navigate('/'); }} 
                className="relative px-4 py-2 text-slate-700 hover:text-primary-650 transition-colors duration-300"
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
                  <button onClick={() => setModalConteudo('equipe')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Equipe Diretiva</button>
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
                  <button onClick={() => { navigate('/'); setTimeout(() => { document.getElementById('noticias')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Últimas Notícias</button>
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
                  <button onClick={() => setModalConteudo('legislacao')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Leis & Resoluções</button>
                </div>
              </div>

              <span className="text-gray-300 px-3 select-none">/</span>

              {/* OUTROS (Dropdown) */}
              <div className="relative group">
                <button className="flex items-center gap-1 py-2 px-4 hover:text-primary-650 focus:outline-none">
                  OUTROS <i className="fa-solid fa-chevron-down text-[9px] transition-transform duration-300 group-hover:rotate-180"></i>
                </button>
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-150 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-1.5 text-left normal-case font-medium">
                  <button onClick={() => navigate('/login')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-semibold text-secondary-600">Serviços Online</button>
                  <button onClick={() => setModalConteudo('ouvidoria')} className="w-full text-left block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all font-medium">Ouvidoria Digital</button>
                </div>
              </div>

              <span className="text-gray-300 px-3 select-none">/</span>

              {/* CONTATO */}
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); }} 
                className="relative px-4 py-2 text-primary-900 border-b-2 border-primary-900 hover:text-primary-650 transition-colors duration-300"
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
              <button id="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700 hover:text-primary-600 focus:outline-none focus:bg-primary-50 p-2 rounded-xl transition-colors">
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
              <img src="/logo-nome.png" alt="Logo SMTT" className="h-10 w-auto object-contain" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-primary-600 p-2 bg-gray-100 hover:bg-primary-50 rounded-full transition-all">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <nav className="flex flex-col space-y-3.5 mt-8 overflow-y-auto pr-1">
              <a href="#" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); navigate('/'); }} className="px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors text-gray-700 hover:bg-gray-50">
                <i className="fa-solid fa-house"></i> Início
              </a>
              <div className="px-4 pt-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Institucional</div>
              <a href="https://www.propria.se.gov.br/orgao/autarquia/superintend%C3%AAncia-municipal-de-transporte-e-tr%C3%A2nsito" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3">
                <i className="fa-solid fa-circle-info text-gray-400 w-5"></i> Sobre a SMTT
              </a>
              <button onClick={() => { setIsMobileMenuOpen(false); setModalConteudo('equipe'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
                <i className="fa-solid fa-users text-gray-400 w-5"></i> Equipe Diretiva
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); setModalConteudo('legislacao'); }} className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-3 text-left">
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
              <button onClick={() => { setIsMobileMenuOpen(false); }} className="px-4 py-2.5 rounded-bold text-primary-600 bg-primary-50 flex items-center gap-3 text-left w-full">
                <i className="fa-solid fa-phone w-5 text-primary-600"></i> Contato (Fale Conosco)
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

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow py-12">
        
        {/* Banner Title */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-gradient-to-r from-primary-900 to-primary-950 text-white rounded-3xl p-8 md:p-12 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
            <span className="inline-block py-1 px-3 rounded-full bg-secondary-500/20 text-secondary-500 text-xs font-bold mb-3 uppercase tracking-wider">
              Atendimento ao Cidadão
            </span>
            <h1 className="text-3xl md:text-4xl font-sora font-extrabold tracking-tight">Fale Conosco</h1>
            <p className="text-sm md:text-base text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Tem alguma dúvida, crítica, elogio ou deseja fazer uma solicitação de informação? 
              Entre em contato conosco através dos nossos canais oficiais de atendimento ou envie uma mensagem direta abaixo.
            </p>
          </div>
        </div>

        {/* Ouvidoria Section */}
        <section id="ouvidoria-form" className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

              {/* Info Column */}
              <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-soft">
                <span className="inline-block py-1 px-3 rounded-full bg-secondary-500/10 text-secondary-600 text-xs font-bold mb-3 uppercase tracking-wider">
                  Ouvidoria Digital
                </span>
                <h2 className="text-2xl font-sora font-extrabold text-slate-900 leading-tight">Canais de Atendimento</h2>
                <div className="h-1 w-16 bg-secondary-500 mt-3 rounded-full"></div>
                
                <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                  Utilize este canal para registrar sugestões, reclamações, elogios ou solicitar informações à SMTT Propriá. Sua participação é fundamental para melhorarmos a segurança e mobilidade do nosso município.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-phone"></i>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Atendimento Telefônico</span>
                      <strong className="text-xs text-slate-700">(79) 99665-4115</strong>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-envelope"></i>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">E-mail Institucional</span>
                      <a href="mailto:smtt@propria.se.gov.br" className="text-xs text-primary-600 font-bold hover:underline">smtt@propria.se.gov.br</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-location-dot"></i>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Sede Presencial</span>
                      <span className="text-xs text-slate-700 font-semibold block leading-tight">Avenida João Barbosa Pôrto, 1829</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Column */}
              <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-soft">
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-sora">Formulário de Ouvidoria</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Envie sua solicitação diretamente para o nosso setor administrativo. O prazo de resposta padrão é de até 5 dias úteis.
                </p>

                {ouvidoriaProtocolo ? (
                  <div className="text-center py-8 animate-fadeIn">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="fa-solid fa-circle-check text-3xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 font-sora">Mensagem Enviada!</h3>
                    <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                      Agradecemos o seu contato. Sua mensagem foi protocolada com sucesso e será analisada pela nossa equipe.
                    </p>
                    <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 inline-block">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Número do Protocolo</span>
                      <span className="text-lg font-mono font-black text-slate-800 tracking-wider">{ouvidoriaProtocolo}</span>
                    </div>
                    <button
                      onClick={() => setOuvidoriaProtocolo(null)}
                      className="mt-8 text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <i className="fa-solid fa-arrow-left text-[10px]"></i> Enviar outra mensagem
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setOuvidoriaLoading(true);
                      setTimeout(() => {
                        const randomNum = Math.floor(10000 + Math.random() * 90000);
                        setOuvidoriaProtocolo(`OUV-2026-${randomNum}`);
                        setOuvidoriaNome('');
                        setOuvidoriaEmail('');
                        setOuvidoriaAssunto('Sugestão');
                        setOuvidoriaMensagem('');
                        setOuvidoriaLoading(false);
                      }, 1200);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Nome Completo</label>
                      <input
                        type="text"
                        value={ouvidoriaNome}
                        onChange={(e) => setOuvidoriaNome(e.target.value)}
                        placeholder="Ex: João da Silva"
                        className="w-full text-sm placeholder-slate-400 border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">E-mail para Retorno</label>
                      <input
                        type="email"
                        value={ouvidoriaEmail}
                        onChange={(e) => setOuvidoriaEmail(e.target.value)}
                        placeholder="Ex: joao@exemplo.com"
                        className="w-full text-sm placeholder-slate-400 border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Assunto</label>
                      <select
                        value={ouvidoriaAssunto}
                        onChange={(e) => setOuvidoriaAssunto(e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white transition-all duration-300 shadow-sm"
                        required
                      >
                        <option value="Sugestão">💡 Sugestão</option>
                        <option value="Reclamação">⚠️ Reclamação</option>
                        <option value="Elogio">👏 Elogio</option>
                        <option value="Informação">ℹ️ Solicitação de Informação</option>
                        <option value="Denúncia">🚨 Denúncia</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Sua Mensagem</label>
                      <textarea
                        value={ouvidoriaMensagem}
                        onChange={(e) => setOuvidoriaMensagem(e.target.value)}
                        placeholder="Descreva detalhadamente a sua solicitação..."
                        rows="5"
                        className="w-full text-sm placeholder-slate-400 border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none font-sans transition-all duration-300 shadow-sm"
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={ouvidoriaLoading}
                      className="w-full bg-primary-900 hover:bg-primary-950 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-primary-500/10 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                    >
                      {ouvidoriaLoading ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin"></i> Enviando...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-paper-plane"></i> Enviar Mensagem
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8 border-t-[6px] border-secondary-500 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 border-b border-white/5 pb-12">

            {/* Col 1: Sobre a SMTT */}
            <div>
              
              <div className="flex items-center gap-3 mb-4">
                <img src="/SMTT.png" alt="Logo SMTT" className="w-10 h-10 object-contain" />
                <div>
                  <h4 className="font-sora font-extrabold text-sm text-white">SMTT Propriá</h4>
                  <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider block">Propriá / SE</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Superintendência Municipal de Transportes e Trânsito de Propriá/SE. Atuando continuamente para promover um trânsito mais seguro, ordeiro e com mobilidade eficiente para todos os cidadãos propriaenses.
              </p>
              <div className="flex space-x-3.5">
                <a href="#" onClick={(e) => e.preventDefault()} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-[#003399] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-md" aria-label="Facebook">
                  <i className="fa-brands fa-facebook-f text-sm"></i>
                </a>
                <a href="https://www.instagram.com/smttpropria?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-red-500 hover:to-purple-650 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-md" aria-label="Instagram">
                  <i className="fa-brands fa-instagram text-sm"></i>
                </a>
                <a href="#" onClick={(e) => e.preventDefault()} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-[#1da1f2] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-md" aria-label="Twitter">
                  <i className="fa-brands fa-twitter text-sm"></i>
                </a>
                <a href="#" onClick={(e) => e.preventDefault()} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-red-600 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-md" aria-label="YouTube">
                  <i className="fa-brands fa-youtube text-sm"></i>
                </a>
              </div>
            </div>

            {/* Col 2: Links */}
            <div>
              <h3 className="font-sora font-bold text-base mb-6 border-l-4 border-secondary-500 pl-3">Acesso Rápido</h3>
              <ul className="space-y-3.5 text-xs font-medium text-slate-400">
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors flex items-center gap-2.5"><i className="fa-solid fa-chevron-right text-[8px] text-secondary-500"></i> Painel do Cidadão</button></li>
                <li><button onClick={() => navigate('/consultar')} className="hover:text-white transition-colors flex items-center gap-2.5"><i className="fa-solid fa-chevron-right text-[8px] text-secondary-500"></i> Consultar Protocolo</button></li>
                <li><button onClick={() => navigate('/admin/login')} className="hover:text-white transition-colors flex items-center gap-2.5"><i className="fa-solid fa-chevron-right text-[8px] text-secondary-500"></i> Acesso Administrativo</button></li>
                <li><button onClick={() => setModalConteudo('ouvidoria')} className="hover:text-white transition-colors flex items-center gap-2.5 text-left"><i className="fa-solid fa-chevron-right text-[8px] text-secondary-500 shrink-0 mt-0.5"></i> Ouvidoria SMTT</button></li>
                <li><a href="https://www.propria.se.gov.br/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2.5"><i className="fa-solid fa-chevron-right text-[8px] text-secondary-500"></i> Portal da Prefeitura</a></li>
              </ul>
            </div>

            {/* Col 3: Contact */}
            <div>
              <h3 className="font-sora font-bold text-base mb-6 border-l-4 border-secondary-500 pl-3">Atendimento</h3>
              <ul className="space-y-4 text-xs text-slate-400 font-medium">
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-location-dot mt-0.5 text-secondary-500 text-sm"></i>
                  <span className="leading-relaxed">Avenida João Barbosa Pôrto, 1829<br />Propriá - SE - CEP 49900-000<br />Funcionamento: 07h às 13h</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fa-solid fa-phone text-secondary-500 text-sm"></i>
                  <span>(79) 99665-4115</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fa-solid fa-envelope text-secondary-500 text-sm"></i>
                  <a href="mailto:smtt@propria.se.gov.br" className="hover:text-white transition-colors">smtt@propria.se.gov.br</a>
                </li>
              </ul>
            </div>

         

          </div>

          {/* Bottom Copyright */}
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 pt-8 border-t border-white/5 gap-4">
            <div className="flex items-center gap-3">
              
              <p className="text-center md:text-left">&copy; 2026 SMTT Propriá/SE. Todos os direitos reservados. Governo Municipal.</p>
            </div>
            <div className="flex gap-4">
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Privacidade</a>
              <span>|</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Termos</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Voltar ao topo"
      >
        <i className="fa-solid fa-arrow-up"></i>
      </button>

      {/* Modals from Home layout for menu navigation items */}
      {modalConteudo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-gray-150 shadow-2xl relative transition-transform duration-300 transform scale-100 animate-fadeIn">
            {/* Modal header border */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-600 to-secondary-500"></div>

            <div className="p-6 md:p-8">
              {/* Modal Close Button */}
              <button
                onClick={() => setModalConteudo(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full w-8 h-8 flex items-center justify-center bg-gray-100 transition-colors"
                title="Fechar"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>

              {modalConteudo === 'legislacao' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-gavel text-primary-600"></i> Legislação e Resoluções
                  </h3>
                  <div className="text-gray-600 text-sm space-y-4 leading-relaxed">
                    <p>
                      A SMTT atua sob as diretrizes do <strong>Código de Trânsito Brasileiro (CTB)</strong>, das resoluções do CONTRAN, CONTRAND e das regulamentações e decretos municipais de Propriá/SE.
                    </p>
                    <p>
                      Esta seção servirá em breve como repositório online das resoluções internas da SMTT, decretos de interdições regulares, portarias de nomeação de agentes e editais de trânsito.
                    </p>
                    <p className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100 font-medium text-xs">
                      <i className="fa-solid fa-clock mr-1"></i> A base digital de leis e portarias municipais de trânsito está em fase de catalogação e estará disponível em breve no portal público.
                    </p>
                  </div>
                </div>
              )}

              {modalConteudo === 'equipe' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-users text-primary-600"></i> Equipe Diretiva
                  </h3>
                  <div className="text-gray-600 text-sm space-y-4 leading-relaxed">
                    <p>
                      A gestão administrativa e operacional da Superintendência Municipal de Transportes e Trânsito é composta pela seguinte estrutura de liderança:
                    </p>
                    <ul className="space-y-3 pt-2">
                      <li className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-950 flex items-center justify-center font-extrabold shrink-0">
                          SP
                        </div>
                        <div>
                          <strong className="text-gray-900 block text-xs">Superintendente Geral</strong>
                          <span className="text-[11px] text-gray-500">Superintendente de Trânsito e Transportes</span>
                        </div>
                      </li>
                      <li className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-950 flex items-center justify-center font-extrabold shrink-0">
                          DF
                        </div>
                        <div>
                          <strong className="text-gray-900 block text-xs">Diretoria de Fiscalização e Trânsito</strong>
                          <span className="text-[11px] text-gray-500">Liderança de Agentes e Fiscalização de Campo</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {modalConteudo === 'ouvidoria' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-comments text-primary-600"></i> Ouvidoria SMTT
                  </h3>
                  <div className="text-gray-600 text-sm space-y-4 leading-relaxed">
                    <p>
                      A Ouvidoria é o canal direto de comunicação entre o cidadão e a SMTT de Propriá/SE para sugestões, reclamações, elogios ou denúncias.
                    </p>
                    <p>
                      Você já está na nossa página de Ouvidoria e Contato. Utilize o formulário ao lado para registrar sua manifestação de forma rápida e segura!
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setModalConteudo(null)}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl shadow transition-colors text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default FaleConosco;
