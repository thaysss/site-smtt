import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Home() {
  const navigate = useNavigate();

  // Estados de UI (Slider, Menu, Scroll)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Estados de Acessibilidade e Modais
  const [altoContraste, setAltoContraste] = useState(() => localStorage.getItem('altoContraste') === 'true');
  const [modalConteudo, setModalConteudo] = useState(null);
  const [servicoIndisponivel, setServicoIndisponivel] = useState('');

  const [activeHeroTab, setActiveHeroTab] = useState('placa'); // 'placa' ou 'avisos'
  const [openFaq, setOpenFaq] = useState(null);

  // Estados de Dados (Busca, Alertas e Notícias)
  const [alertas, setAlertas] = useState([]);
  const [placaBusca, setPlacaBusca] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [noticias, setNoticias] = useState([]);
  const [estatisticas, setEstatisticas] = useState([]);

  // Efeito do Modo Alto Contraste (Acessibilidade)
  useEffect(() => {
    if (altoContraste) {
      document.body.classList.add('alto-contraste');
    } else {
      document.body.classList.remove('alto-contraste');
    }
    localStorage.setItem('altoContraste', altoContraste);
  }, [altoContraste]);

  // Efeito do Slider Hero (pausa rotação automática se o usuário estiver digitando a placa)
  useEffect(() => {
    if (placaBusca.length > 0) return;
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2); // Alterna entre 0 e 1
    }, 6000);
    return () => clearInterval(slideInterval);
  }, [placaBusca]);

  // Efeito de Scroll (Botão Topo)
  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Carregar Alertas e Notícias da API
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const resAlertas = await api.get('/public/alertas');
        setAlertas(resAlertas.data);
      } catch (error) {
        console.error("Erro ao carregar alertas:", error);
      }
      try {
        const resNoticias = await api.get('/public/noticias');
        setNoticias(resNoticias.data.slice(0, 3));
      } catch (error) {
        console.error("Erro ao carregar notícias:", error);
      }
      try {
        const resStats = await api.get('/public/estatisticas');
        setEstatisticas(resStats.data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };
    carregarDados();
  }, []);

  // Função de Buscar Placa
  const handleBuscarPlaca = async (e) => {
    e.preventDefault();
    setBuscando(true);
    setResultadoBusca(null);
    try {
      const response = await api.post('/public/consulta-placa', { placa: placaBusca });
      setResultadoBusca(response.data);
    } catch (error) {
      console.error("Erro ao buscar placa:", error);
      setResultadoBusca({
        tem_multas: false,
        mensagem: "Erro ao conectar com o servidor. Tente novamente mais tarde."
      });
    } finally {
      setBuscando(false);
    }
  };

  // Funções para serviços indisponíveis temporariamente
  const handleServicoBreve = (nomeServico) => {
    setServicoIndisponivel(nomeServico);
    setModalConteudo('servico-breve');
  };

  return (
    <div id="top" className="font-sans text-gray-800 bg-[#f8fafc] flex flex-col min-h-screen">

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
              <a href="#" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); }} className="px-4 py-3 rounded-xl font-bold text-primary-600 bg-primary-50 flex items-center gap-3 transition-colors">
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

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow">

        {/* Hero Section with slider background */}
        <section className="relative bg-primary-900 text-white overflow-hidden min-h-[550px] lg:min-h-[620px] flex items-center border-b border-primary-950">

          {/* Background Slide 1 */}
          <div className={`absolute inset-0 transition-all duration-[1500ms] ease-in-out ${currentSlide === 0 ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'}`}>
            <img src="/propria.png" alt="Trânsito da cidade" className="w-full h-full object-cover animate-kenburns" />
            <div className="absolute inset-0 bg-primary-900 mix-blend-multiply opacity-80"></div>
          </div>

          {/* Background Slide 2 */}
          <div className={`absolute inset-0 transition-all duration-[1500ms] ease-in-out ${currentSlide === 1 ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'}`}>
            <img src="/propri.png" alt="Transporte público" className="w-full h-full object-cover animate-kenburns" />
            <div className="absolute inset-0 bg-primary-900 mix-blend-multiply opacity-80"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center z-20 w-full gap-12 lg:gap-8">
            {/* Text Content Block */}
            <div className="lg:w-1/2 lg:pr-6 text-center lg:text-left flex flex-col justify-center mb-8 lg:mb-0" key={currentSlide}>
              {currentSlide === 0 ? (
                <div className="animate-fadeInUp">
                  <span className="inline-block py-1 px-3.5 rounded-full bg-primary-800/80 text-primary-100 text-xs font-bold mb-6 border border-primary-700 backdrop-blur-sm tracking-wider uppercase">Campanha Maio Amarelo 2026</span>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-sora font-extrabold tracking-tight mb-6 leading-[1.1] text-white">
                    No trânsito,<br />
                    <span className="text-secondary-500">escolha a vida.</span>
                  </h2>
                  <p className="text-base md:text-lg text-primary-100 mb-8 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                    Paz no trânsito começa por você. Respeite os limites de velocidade e proteja a vida de quem caminha pelas faixas de pedestres.
                  </p>
                </div>
              ) : (
                <div className="animate-fadeInUp">
                  <span className="inline-block py-1 px-3.5 rounded-full bg-emerald-950/80 text-emerald-100 text-xs font-bold mb-6 border border-emerald-800 backdrop-blur-sm tracking-wider uppercase">Segurança & Fluidez</span>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-sora font-extrabold tracking-tight mb-6 leading-[1.1] text-white">
                    SMTT Ativa<br />
                    <span className="text-secondary-500">no Trânsito de Propriá.</span>
                  </h2>
                  <p className="text-base md:text-lg text-primary-100 mb-8 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                    Fiscalização constante e planejamento urbano inteligente para assegurar vias fluidas, sinalizadas e seguras a todos os cidadãos.
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="#servicos" className="bg-secondary-500 hover:bg-secondary-600 text-primary-950 px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-secondary-500/20 transition-all duration-300 hover:-translate-y-0.5 text-center text-sm">
                  Acessar Serviços
                </a>
                <button onClick={() => navigate('/login')} className="bg-white/5 border border-white/30 text-white hover:bg-white/10 hover:border-white px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:-translate-y-0.5 text-center text-sm">
                  Conheça a SMTT
                </button>
              </div>
            </div>

            {/* Quick Info Card: Dynamic Content with Tabs (Consulta de Placa / Avisos Importantes) */}
            <div className="lg:w-1/2 w-full max-w-md mx-auto z-20">
              <div className="bg-white/95 rounded-2xl shadow-xl overflow-hidden text-slate-800 border border-slate-200/85 relative animate-fadeInUp flex flex-col backdrop-blur-md">
                {/* Custom Glass Header with Tabs */}
                <div className="bg-slate-50 border-b border-slate-100 flex">

                  <button
                    onClick={() => setActiveHeroTab('avisos')}
                    className={`flex-1 py-4 px-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all duration-300 relative ${activeHeroTab === 'avisos'
                      ? 'border-primary-600 text-primary-600 bg-white'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <i className="fa-solid fa-triangle-exclamation"></i> Avisos Importantes
                    {alertas.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 animate-pulse">
                        {alertas.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('placa')}
                    className={`flex-1 py-4 px-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all duration-300 ${activeHeroTab === 'placa'
                      ? 'border-primary-600 text-primary-600 bg-white'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <i className="fa-solid fa-magnifying-glass"></i> Consulta de Veículo
                  </button>
                  
                </div>

                {/* Tab Contents */}
                <div className="p-6 flex-grow">
                  {activeHeroTab === 'placa' ? (
                    <div className="animate-fadeIn">
                      <p className="text-xs text-slate-500 mb-6 text-center leading-relaxed">
                        Consulte infrações ou pendências registradas para o seu veículo na base da SMTT Propriá.
                      </p>

                      <form onSubmit={(e) => { e.preventDefault(); handleBuscarPlaca(e); }} className="flex flex-col items-center">
                        {/* Desenho Interativo da Placa Mercosul */}
                        <div className="w-full max-w-[300px] mx-auto mb-6 p-1 bg-slate-900 rounded-xl shadow-lg border border-slate-200">
                          <div className="relative bg-white rounded-lg border-[3px] border-slate-900 overflow-hidden flex flex-col items-center">
                            {/* Faixa Azul Mercosul */}
                            <div className="w-full bg-[#003399] px-3 py-1 flex justify-between items-center text-white select-none">
                              <span className="text-[7px] font-extrabold tracking-tighter opacity-80">MERCOSUL</span>
                              <span className="font-sora font-black text-[9px] tracking-[0.2em] text-white">BRASIL</span>
                              <div className="w-5 h-3 bg-green-600 relative overflow-hidden flex items-center justify-center rounded-[1px] border border-green-700 scale-75">
                                <div className="w-2.5 h-2.5 bg-yellow-400 rotate-45 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-blue-800 rounded-full"></div>
                                </div>
                              </div>
                            </div>
                            {/* Campo de Entrada da Placa */}
                            <div className="w-full bg-white px-2 py-2.5 flex items-center justify-center relative">
                              <input
                                type="text"
                                maxLength="7"
                                placeholder="ABC1D23"
                                value={placaBusca}
                                onChange={(e) => setPlacaBusca(e.target.value.toUpperCase())}
                                className="w-full text-center text-3xl font-mono font-black tracking-[0.15em] text-slate-900 border-none outline-none focus:ring-0 focus:outline-none placeholder-slate-200 uppercase py-0.5"
                                required
                              />
                            </div>
                            {/* Detalhes de Rodapé da Placa */}
                            <div className="w-full bg-slate-50 border-t border-slate-100 py-1 px-3 flex justify-between items-center text-[8px] text-slate-400 font-bold select-none tracking-wider">
                              <span>SMTT PROPRIÁ</span>
                              <span>SE</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={buscando}
                          className="w-full bg-secondary-500 hover:bg-secondary-600 text-primary-950 font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 text-sm hover:shadow-secondary-500/10 active:scale-[0.98]"
                        >
                          {buscando ? (
                            <>
                              <i className="fa-solid fa-circle-notch fa-spin"></i> Consultando...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-search"></i> Consultar Placa
                            </>
                          )}
                        </button>
                      </form>

                      {resultadoBusca && (
                        <div className={`mt-5 p-4 rounded-xl border ${resultadoBusca.tem_multas ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'} animate-fadeInUp`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg border flex-shrink-0 ${resultadoBusca.tem_multas ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-emerald-100 border-emerald-200 text-emerald-700'}`}>
                              <i className={`fa-solid ${resultadoBusca.tem_multas ? 'fa-triangle-exclamation' : 'fa-circle-check'} text-sm`}></i>
                            </div>
                            <div className="flex-grow text-left">
                              <h4 className="font-extrabold text-xs text-slate-900">
                                {resultadoBusca.tem_multas ? 'Registro de Infrações' : 'Situação Regular (Nada Consta)'}
                              </h4>
                              <p className="text-[11px] mt-1.5 text-slate-600 leading-normal font-medium">{resultadoBusca.mensagem}</p>
                              {resultadoBusca.tem_multas && (
                                <button
                                  onClick={() => navigate('/login')}
                                  className="mt-3.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-1.5 w-full"
                                >
                                  <i className="fa-solid fa-right-to-bracket text-[10px]"></i> Acessar Painel do Cidadão
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="animate-fadeIn">
                      {alertas.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                            <i className="fa-solid fa-circle-check text-2xl animate-pulse"></i>
                          </div>
                          <p className="font-bold text-slate-800 text-sm">Trânsito fluindo normalmente</p>
                          <p className="text-xs text-slate-500 mt-2 max-w-[240px] mx-auto leading-relaxed">Não há alertas de obras, desvios ou interdições de trânsito em Propriá no momento.</p>
                        </div>
                      ) : (
                        <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin">
                          {alertas.map((alerta, index) => {
                            const descLow = (alerta.descricao || '').toLowerCase();
                            const ruaLow = (alerta.rua_bairro || '').toLowerCase();

                            let cardBg = 'bg-red-50 border-red-200 text-red-900';
                            let iconBg = 'bg-red-100 text-red-600 border-red-200';
                            let iconClass = 'fa-road-barrier';

                            if (descLow.includes('acidente') || descLow.includes('perigo') || descLow.includes('colisão') || ruaLow.includes('perigo')) {
                              cardBg = 'bg-amber-50 border-amber-200 text-amber-900';
                              iconBg = 'bg-amber-100 text-amber-600 border-amber-200';
                              iconClass = 'fa-triangle-exclamation';
                            } else if (descLow.includes('evento') || descLow.includes('festa') || descLow.includes('desvio') || descLow.includes('procissão')) {
                              cardBg = 'bg-blue-50 border-blue-200 text-blue-900';
                              iconBg = 'bg-blue-100 text-blue-600 border-blue-200';
                              iconClass = 'fa-route';
                            }

                            return (
                              <div
                                key={alerta.id || index}
                                className={`p-4 border rounded-xl flex gap-3.5 items-start ${cardBg} transition-all duration-300 hover:scale-[1.01]`}
                              >
                                <div className={`${iconBg} p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center`}>
                                  <i className={`fa-solid ${iconClass} text-sm`}></i>
                                </div>
                                <div className="flex-grow">
                                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{alerta.rua_bairro}</h4>
                                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{alerta.descricao}</p>
                                  {alerta.data_inicio && (
                                    <span className="text-[9px] text-slate-500 font-bold block mt-2.5 uppercase tracking-wide">
                                      <i className="fa-regular fa-clock mr-1"></i> Publicado em: {alerta.data_inicio}h
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Slider Dots */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3.5 z-30">
            <button onClick={() => setCurrentSlide(0)} className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${currentSlide === 0 ? 'bg-secondary-500 w-7' : 'bg-white/45'}`} aria-label="Slide 1"></button>
            <button onClick={() => setCurrentSlide(1)} className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${currentSlide === 1 ? 'bg-secondary-500 w-7' : 'bg-white/45'}`} aria-label="Slide 2"></button>
          </div>
        </section>

        {/* Serviços (Quick Access) */}
        <section id="servicos" className="py-20 bg-[#f8fafc] relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-sora font-extrabold text-slate-900">Portal de Serviços Online</h2>
              <div className="h-1 w-16 bg-secondary-500 mx-auto mt-3.5 rounded-full"></div>
              <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto">Acesso rápido e desburocratizado para resolver suas demandas de trânsito.</p>
            </div>

            {/* Grid of Services */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">

              {/* Service Card 1 */}
              <button onClick={() => navigate('/login')} className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-between text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-hover hover:border-primary-500/20 group focus:outline-none focus:ring-2 focus:ring-primary-500 relative overflow-hidden h-full shadow-soft">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-slate-100">
                  <i className="fa-solid fa-file-invoice-dollar text-2xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary-700 transition-colors">Consulta de Multas</h3>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">Consulte infrações e débitos de seu veículo de forma simplificada.</p>
                </div>
              </button>

              {/* Service Card 2 */}
              <button onClick={() => navigate('/solicitacao-alvara')} className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-between text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-hover hover:border-emerald-500/20 group focus:outline-none focus:ring-2 focus:ring-primary-500 relative overflow-hidden h-full shadow-soft">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:from-emerald-600 group-hover:to-teal-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-slate-100">
                  <i className="fa-solid fa-id-card-clip text-2xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">Alvará & Permissionários</h3>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">Emissão e renovação de credenciais para taxistas, mototaxistas e transporte escolar.</p>
                </div>
              </button>

              {/* Service Card 3 */}
              <button onClick={() => navigate('/solicitacao-evento')} className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-between text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-hover hover:border-purple-500/20 group focus:outline-none focus:ring-2 focus:ring-primary-500 relative overflow-hidden h-full shadow-soft">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-fuchsia-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:from-purple-600 group-hover:to-fuchsia-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-slate-100">
                  <i className="fa-solid fa-calendar-check text-2xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-purple-700 transition-colors">Solicitação para Eventos</h3>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">Peça autorizações para interdições parciais ou totais de vias para realização de eventos.</p>
                </div>
              </button>

              {/* Service Card 4 */}
              <button onClick={() => navigate('/consultar')} className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-between text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-hover hover:border-amber-500/20 group focus:outline-none focus:ring-2 focus:ring-primary-500 relative overflow-hidden h-full shadow-soft">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:from-amber-600 group-hover:to-orange-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-slate-100">
                  <i className="fa-solid fa-file-signature text-2xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-amber-700 transition-colors">Consulta de Protocolo</h3>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">Insira o código do seu protocolo para verificar o status de análise de sua solicitação.</p>
                </div>
              </button>

              {/* Service Card 5 */}
              <button onClick={() => handleServicoBreve('Cartão Idoso/PCD')} className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-between text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-hover hover:border-sky-500/20 group focus:outline-none focus:ring-2 focus:ring-primary-500 relative overflow-hidden h-full shadow-soft">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-50 to-cyan-100 text-sky-600 rounded-2xl flex items-center justify-center mb-4 group-hover:from-sky-600 group-hover:to-cyan-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-slate-100">
                  <i className="fa-solid fa-id-card text-2xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-sky-700 transition-colors">Cartão Idoso/PCD</h3>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">Credencial especial para uso legal de vagas de estacionamento reservadas.</p>
                </div>
              </button>

              {/* Service Card 6 */}
              <button onClick={() => navigate('/contestacao-multa')} className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-between text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-hover hover:border-rose-500/20 group focus:outline-none focus:ring-2 focus:ring-primary-500 relative overflow-hidden h-full shadow-soft">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-50 to-red-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:from-rose-600 group-hover:to-red-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-slate-100">
                  <i className="fa-solid fa-scale-balanced text-2xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-rose-700 transition-colors">Defesa de Autuação</h3>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">Apresente recursos, defesas prévias ou indicação de real infrator digitalmente.</p>
                </div>
              </button>

            </div>
          </div>
        </section>

        {/* Notícias Section */}
        <section id="noticias" className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-sora font-extrabold text-slate-900">Últimas Notícias</h2>
                <div className="h-1 w-16 bg-secondary-500 mt-3 rounded-full"></div>
              </div>
              <a
                href="/noticias"
                onClick={(e) => { e.preventDefault(); navigate('/noticias'); }}
                className="hidden sm:inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-bold text-sm transition-colors"
              >
                Ver mais notícias <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </a>
            </div>

            {noticias.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <i className="fa-solid fa-newspaper text-4xl mb-3 text-slate-300"></i>
                <p className="text-sm font-medium">Nenhuma notícia publicada recentemente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {noticias.map((item) => {
                  const apiBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
                  const imageSrc = item.imagem_url
                    ? (item.imagem_url.startsWith('http') ? item.imagem_url : `${apiBaseUrl}${item.imagem_url}`)
                    : '';

                  const getPlaceholderIcon = (categoria) => {
                    switch (categoria) {
                      case 'Educação': return 'fa-graduation-cap text-blue-400';
                      case 'Mobilidade': return 'fa-bicycle text-green-400';
                      case 'Infraestrutura': return 'fa-traffic-light text-yellow-500';
                      case 'Comunicados': return 'fa-bullhorn text-red-400';
                      default: return 'fa-newspaper text-gray-400';
                    }
                  };

                  const getPlaceholderBg = (categoria) => {
                    switch (categoria) {
                      case 'Educação': return 'bg-blue-50/50';
                      case 'Mobilidade': return 'bg-green-50/50';
                      case 'Infraestrutura': return 'bg-yellow-50/50';
                      case 'Comunicados': return 'bg-red-50/50';
                      default: return 'bg-gray-55';
                    }
                  };

                  const getCategoriaBadgeColor = (categoria) => {
                    switch (categoria) {
                      case 'Educação': return 'bg-blue-600 text-white';
                      case 'Mobilidade': return 'bg-emerald-600 text-white';
                      case 'Infraestrutura': return 'bg-secondary-500 text-primary-950';
                      case 'Comunicados': return 'bg-red-650 text-white';
                      default: return 'bg-slate-600 text-white';
                    }
                  };

                  return (
                    <article
                      key={item.id}
                      onClick={() => navigate(`/noticias/${item.id}`)}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200/60 -translate-y-0.5 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-full cursor-pointer"
                    >
                      <div className="h-52 overflow-hidden relative shrink-0">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={item.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className={`w-full h-full ${getPlaceholderBg(item.categoria)} flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out`}>
                            <i className={`fa-solid ${getPlaceholderIcon(item.categoria)} text-5xl`}></i>
                          </div>
                        )}
                        <div className={`absolute top-4 left-4 text-[9px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm z-10 ${getCategoriaBadgeColor(item.categoria)}`}>
                          {item.categoria}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 font-bold mb-2.5 block uppercase tracking-wide">
                            <i className="fa-regular fa-calendar mr-1.5"></i> {item.criado_em?.split(' ')[0]}
                          </span>
                          <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                            {item.titulo}
                          </h3>
                          {item.subtitulo && (
                            <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed">
                              {item.subtitulo}
                            </p>
                          )}
                        </div>
                        <span className="text-primary-600 font-bold text-xs hover:text-primary-800 flex items-center gap-1.5 mt-4 transition-colors">
                          Ler matéria completa <i className="fa-solid fa-arrow-right text-[9px] transition-transform duration-300 group-hover:translate-x-1"></i>
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div className="mt-8 text-center sm:hidden">
              <a
                href="/noticias"
                onClick={(e) => { e.preventDefault(); navigate('/noticias'); }}
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-bold text-sm"
              >
                Ver todas as notícias <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </a>
            </div>
          </div>
        </section>

        {/* Numeros / Estatisticas */}
        <section className="relative py-20 bg-primary-900 text-white border-b-8 border-secondary-500 overflow-hidden">
          {/* Subtle graphic pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {estatisticas.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center animate-pulse h-36">
                    <div className="h-10 w-24 bg-white/10 rounded-xl mb-3"></div>
                    <div className="h-4 w-32 bg-white/5 rounded-lg"></div>
                  </div>
                ))
              ) : (
                estatisticas.slice(0, 4).map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center transition-all duration-300 hover:border-secondary-500/30 hover:bg-white/10 hover:-translate-y-1.5 shadow-lg group">
                    <div className="text-4xl md:text-5xl font-extrabold text-secondary-500 mb-3 flex items-center justify-center gap-3 group-hover:scale-105 transition-transform duration-300">
                      {item.icone && <i className={`fa-solid ${item.icone} text-2xl text-secondary-500/30 group-hover:text-secondary-500 transition-colors duration-300 shrink-0`}></i>}
                      <span className="tracking-tight font-sora">{item.valor}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">{item.titulo}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* FAQ / Dúvidas Frequentes Section */}
        <section id="faq" className="py-20 bg-slate-50 border-t border-b border-slate-100 relative z-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block py-1.5 px-4 rounded-full bg-secondary-50 text-secondary-700 text-xs font-bold mb-3.5 uppercase tracking-wider border border-secondary-200/60">
                Dúvidas Frequentes
              </span>
              <h2 className="text-3xl font-sora font-extrabold text-slate-900">Perguntas Comuns dos Cidadãos</h2>
              <div className="h-1 w-16 bg-secondary-500 mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Como posso consultar as multas e a situação do meu veículo?",
                  a: "Você pode consultar de duas formas: usando a busca rápida na aba 'Consulta de Veículo' no topo desta página digitando a placa do veículo, ou fazendo login no 'Painel do Cidadão' com seu CPF/CNPJ e senha para visualizar o extrato completo e emitir boletos."
                },
                {
                  q: "Qual o prazo e como posso apresentar uma Defesa de Autuação (recurso de multa)?",
                  a: "O prazo limite para apresentar a Defesa da Autuação consta na notificação enviada ao proprietário (geralmente 30 dias a partir da data de postagem ou notificação). Você pode realizar a solicitação de forma digital clicando em 'Defesa de Autuação' no nosso Portal de Serviços e anexando a documentação exigida."
                },
                {
                  q: "Como renovar ou solicitar o Alvará de Permissionários (Táxi, Mototáxi, Escolar)?",
                  a: "Acesse o serviço 'Alvará & Permissionários' no menu de serviços online. Preencha o formulário eletrônico com os dados do condutor e do veículo e anexe as certidões necessárias. O status da análise poderá ser acompanhado no menu 'Consulta de Protocolo' utilizando o código emitido."
                },
                {
                  q: "Como obter a Credencial de Estacionamento para Idoso ou Pessoa com Deficiência (PCD)?",
                  a: "Atualmente a credencial deve ser solicitada presencialmente na sede da SMTT Propriá. É necessário apresentar documento de identidade com foto, comprovante de residência atualizado no município e laudo médico recente (para o caso de PCD). Estamos trabalhando para disponibilizar este serviço de forma online em breve."
                },
                {
                  q: "Como solicitar a interdição parcial ou total de uma via pública para a realização de um evento?",
                  a: "A solicitação deve ser feita com antecedência mínima de 10 dias úteis através do serviço 'Solicitação para Eventos' no portal. Informe o local, data, horários, tipo de evento e anexe uma descrição simples ou croqui do desvio de tráfego proposto para análise técnica."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4.5 text-left flex justify-between items-center gap-4 focus:outline-none"
                  >
                    <span className="font-bold text-slate-800 text-sm md:text-base leading-snug hover:text-primary-700 transition-colors">
                      {faq.q}
                    </span>
                    <span className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180 bg-primary-50 text-primary-600 border-primary-100' : ''}`}>
                      <i className="fa-solid fa-chevron-down text-[10px]"></i>
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaq === index ? 'max-h-[300px] border-t border-slate-100' : 'max-h-0'}`}
                  >
                    <div className="p-6 text-xs md:text-sm text-slate-650 leading-relaxed bg-slate-50/50 font-sans">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>



      </main>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-white pt-16 pb-8 border-t-[6px] border-secondary-500 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* FAQ Section Inside Footer (Dark Theme) */}

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
                <li><button onClick={() => navigate('/fale-conosco')} className="hover:text-white transition-colors flex items-center gap-2.5 text-left"><i className="fa-solid fa-chevron-right text-[8px] text-secondary-500 shrink-0 mt-0.5"></i> Ouvidoria SMTT</button></li>
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
              <img src="/SMTT.png" alt="Prefeitura de Propriá" className="h-6 w-auto object-contain opacity-70" />
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

      {/* BOTÃO VOLTAR AO TOPO */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Voltar ao topo"
      >
        <i className="fa-solid fa-arrow-up"></i>
      </button>

      {/* Modal Institucional / Acessos */}
      {modalConteudo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-gray-150 shadow-2xl relative transition-transform duration-300 transform scale-100">
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

              {modalConteudo === 'sobre' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-circle-info text-primary-600"></i> Sobre a SMTT
                  </h3>
                  <div className="text-gray-600 text-sm space-y-4 leading-relaxed">
                    <p>
                      A <strong>Superintendência Municipal de Transportes e Trânsito (SMTT)</strong> de Propriá/SE é o órgão executivo de trânsito e rodoviário do município.
                    </p>
                    <p>
                      Nossa missão é planejar, projetar, regulamentar e fiscalizar o trânsito de Propriá, garantindo a segurança viária de motoristas e pedestres, além de gerenciar a fluidez e a mobilidade urbana da cidade.
                    </p>
                    <p>
                      Atuamos ativamente na educação para o trânsito, engenharia de tráfego, sinalização viária e atendimento a ocorrências e eventos nas vias públicas municipais.
                    </p>
                  </div>
                </div>
              )}

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
                          <span className="text-[11px] text-gray-500">Direção Geral de Operações e Planejamento</span>
                        </div>
                      </li>
                      <li className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-950 flex items-center justify-center font-extrabold shrink-0">
                          CO
                        </div>
                        <div>
                          <strong className="text-gray-900 block text-xs">Coordenação Operacional</strong>
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
                      Você pode entrar em contato conosco das seguintes maneiras:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-phone text-secondary-500 w-5"></i>
                        <span>Telefone: <strong>(79) 99665-4115</strong> (Segunda a Sexta, das 07h às 13h)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-envelope text-secondary-500 w-5"></i>
                        <span>E-mail: <strong>smtt@propria.se.gov.br</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <i className="fa-solid fa-location-dot text-secondary-500 w-5 mt-0.5"></i>
                        <span>Presencialmente: Avenida João Barbosa Pôrto, 1829, Propriá/SE.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalConteudo === 'servico-breve' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-laptop text-primary-600"></i> Serviço em Breve
                  </h3>
                  <div className="text-gray-600 text-sm space-y-4 leading-relaxed">
                    <p>
                      O serviço online de <strong>{servicoIndisponivel}</strong> está sendo integrado ao nosso portal de serviços da SMTT de Propriá.
                    </p>
                    <p>
                      Para realizar este atendimento imediatamente, dirija-se presencialmente à sede da SMTT Propriá (Avenida João Barbosa Pôrto, 1829) munido dos seguintes documentos:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>Documento de Identidade oficial com foto (RG/CNH);</li>
                      <li>Comprovante de residência atualizado no município;</li>
                      <li>Laudo médico ou credenciais de comprovação (para PCD/Idoso se aplicável).</li>
                    </ul>
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

export default Home;