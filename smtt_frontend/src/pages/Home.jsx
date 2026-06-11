import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Home() {
  const navigate = useNavigate();

  // Estados de UI (Slider, Menu, Scroll)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  // Estados de Dados (Busca, Alertas e Notícias)
  const [alertas, setAlertas] = useState([]);
  const [placaBusca, setPlacaBusca] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [noticias, setNoticias] = useState([]);

  // Efeito do Slider Hero
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2); // Alterna entre 0 e 1
    }, 6000);
    return () => clearInterval(slideInterval);
  }, []);

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
    alert(`O serviço "${nomeServico}" estará disponível online em breve! Por favor, dirija-se à sede da SMTT Propriá para atendimento presencial.`);
  };

  return (
    <div id="top" className="font-sans text-gray-800 bg-gray-50 flex flex-col min-h-screen">

      {/* Accessibility / Top Bar */}
      <div className="bg-primary-900 text-white text-xs py-2 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex space-x-4">
          <a href="#main-content" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">Ir para o conteúdo</a>
          <span>|</span>
          <a href="#" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">Alto Contraste</a>
        </div>
        <div className="hidden sm:block">
          <span>Bem-Vindo à Superintendência Municipal de Transportes e Trânsito de Propriá!</span>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <a href="#top" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary-600 rounded">
                <img src="/logo.png" alt="Logo SMTT" className="w-12 h-12 object-contain" />
                <div>
                  <h1 className="font-bold text-xl leading-tight text-gray-900">SMTT</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Transportes e Trânsito / Propriá - SE</p>
                </div>
              </a>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex space-x-8 items-center">
              <a href="#top" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Início</a>

              {/* Dropdown Institucional */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 focus:outline-none">
                  Institucional <i className="fa-solid fa-chevron-down text-xs"></i>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <a href="#" onClick={(e) => { e.preventDefault(); alert("SMTT - Superintendência Municipal de Transportes e Trânsito de Propriá/SE."); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sobre a SMTT</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert("Portal de legislação municipal e resoluções de trânsito em breve."); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Legislação</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert("Equipe diretiva e organograma da SMTT de Propriá."); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Equipe Diretiva</a>
                </div>
              </div>

              <a href="#servicos" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Serviços</a>
              <a href="#noticias" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Notícias</a>
              <a href="#contato" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Contato</a>
            </nav>

            {/* CTA Button Desktop */}
            <div className="hidden md:flex items-center">
              <button onClick={() => navigate('/login')} className="bg-secondary-500 hover:bg-secondary-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 flex items-center gap-2">
                <i className="fa-solid fa-laptop"></i> Serviços Online
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button id="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 p-2 rounded-md">
                <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-2xl`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <div id="mobile-menu" className={`md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#top" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 bg-primary-50">Início</a>
            <a href="#servicos" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">Serviços</a>
            <a href="#noticias" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">Notícias</a>
            <a href="#contato" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">Contato</a>
            <div className="mt-4 pt-4 border-t border-gray-200 px-3">
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="w-full text-center block bg-secondary-500 text-white px-4 py-2 rounded-md font-bold">Serviços Online</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow">

        {/* Hero Section with slider background */}
        <section className="relative bg-primary-900 text-white overflow-hidden min-h-[500px] lg:min-h-[600px] flex items-center">

          {/* Background Slide 1 */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Trânsito da cidade" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-primary-900 mix-blend-multiply opacity-80"></div>
          </div>

          {/* Background Slide 2 */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Transporte público" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-primary-900 mix-blend-multiply opacity-80"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center z-20 w-full">
            {/* Text Content Block */}
            <div className="lg:w-1/2 lg:pr-12 text-center lg:text-left flex flex-col justify-center mb-8 lg:mb-0">
              {currentSlide === 0 ? (
                <div className="transition-all duration-500">
                  <span className="inline-block py-1 px-3 rounded-full bg-primary-700 text-primary-100 text-sm font-semibold mb-6 border border-primary-600">Campanha Maio Amarelo 2026</span>
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                    No trânsito,<br />
                    <span className="text-secondary-500">escolha a vida.</span>
                  </h2>
                  <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl mx-auto lg:mx-0 font-light">
                    Paz no trânsito começa por você. Respeite os limites de velocidade e as faixas de pedestres.
                  </p>
                </div>
              ) : (
                <div className="transition-all duration-500">
                  <span className="inline-block py-1 px-3 rounded-full bg-blue-700 text-white text-sm font-semibold mb-6 border border-blue-600">Segurança & Fluidez</span>
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                    SMTT Presente<br />
                    <span className="text-secondary-500">no Trânsito de Propriá.</span>
                  </h2>
                  <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl mx-auto lg:mx-0 font-light">
                    Fiscalização e planejamento contínuo para garantir um trânsito mais eficiente para todos os cidadãos de Propriá.
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="#servicos" className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-transform transform hover:-translate-y-1 text-center">
                  Acessar Serviços
                </a>
                <button onClick={() => navigate('/login')} className="bg-white hover:bg-gray-100 text-primary-900 px-8 py-3 rounded-lg font-bold shadow-lg transition-transform transform hover:-translate-y-1 text-center">
                  Minhas Multas
                </button>
              </div>
            </div>

            {/* Quick Info Card: Avisos Importantes */}
            <div className="lg:w-1/2 w-full max-w-md mx-auto">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden text-gray-800 border border-gray-100">
                <div className="bg-primary-50 p-4 border-b border-primary-100 flex items-center justify-between">
                  <h3 className="font-bold text-primary-900 flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation text-secondary-500"></i> Avisos Importantes
                  </h3>
                  <span className="bg-primary-100 text-primary-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Hoje</span>
                </div>
                <div className="p-6">
                  {alertas.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="fa-solid fa-circle-check text-xl"></i>
                      </div>
                      <p className="font-semibold text-sm text-gray-700">Trânsito fluindo normalmente</p>
                      <p className="text-xs text-gray-500 mt-1">Não há alertas ou interdições registradas no momento em Propriá.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                      {alertas.map((alerta, index) => (
                        <div key={alerta.id || index} className={`flex gap-4 items-start ${index < alertas.length - 1 ? 'pb-4 border-b border-gray-100' : ''}`}>
                          <div className="bg-red-100 text-red-600 p-2.5 rounded-lg flex-shrink-0">
                            <i className="fa-solid fa-cone"></i>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900">{alerta.rua_bairro}</h4>
                            <p className="text-xs text-gray-500 mt-1">{alerta.descricao}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Slider Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 z-30">
            <button onClick={() => setCurrentSlide(0)} className={`w-3 h-3 rounded-full transition-all ${currentSlide === 0 ? 'bg-secondary-500 ring-4 ring-white/20' : 'bg-white/40'}`} aria-label="Slide 1"></button>
            <button onClick={() => setCurrentSlide(1)} className={`w-3 h-3 rounded-full transition-all ${currentSlide === 1 ? 'bg-secondary-500 ring-4 ring-white/20' : 'bg-white/40'}`} aria-label="Slide 2"></button>
          </div>
        </section>

        {/* Serviços (Quick Access) */}
        <section id="servicos" className="py-16 bg-gray-50 relative -mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Grid of Services */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">

              {/* Service Card 1 */}
              <button onClick={() => navigate('/login')} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 w-full">
                <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                  <i className="fa-solid fa-file-invoice-dollar text-2xl"></i>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">Consulta de Multas</h3>
              </button>

              {/* Service Card 2 */}
              <button onClick={() => handleServicoBreve('Horários de Ônibus')} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 w-full">
                <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                  <i className="fa-solid fa-bus text-2xl"></i>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">Horários de Ônibus</h3>
              </button>

              {/* Service Card 3 */}
              <button onClick={() => navigate('/solicitacao-evento')} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 w-full">
                <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                  <i className="fa-solid fa-calendar-check text-2xl"></i>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">Solicitação para Eventos</h3>
              </button>

              {/* Service Card 4 */}
              <button onClick={() => navigate('/consultar')} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 w-full">
                <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                  <i className="fa-solid fa-file-signature text-2xl"></i>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">Consulta de Protocolo</h3>
              </button>

              {/* Service Card 5 */}
              <button onClick={() => handleServicoBreve('Cartão Idoso/PCD')} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 w-full">
                <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                  <i className="fa-solid fa-id-card text-2xl"></i>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">Cartão Idoso/PCD</h3>
              </button>

              {/* Service Card 6 */}
              <button onClick={() => navigate('/login')} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 w-full">
                <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                  <i className="fa-solid fa-scale-balanced text-2xl"></i>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">Defesa de Autuação</h3>
              </button>

            </div>

            <div className="mt-12 text-center">
              <a href="#servicos" className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-800 transition-colors">
                Veja os serviços disponíveis online acima
              </a>
            </div>
          </div>
        </section>

        {/* Módulo Consulta de Placa */}
        <section className="py-12 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-md">
              <div className="flex items-center gap-3 mb-4 justify-center">
                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-magnifying-glass text-lg"></i>
                </div>
                <h3 className="font-bold text-xl text-gray-900">Consulta Rápida de Veículo</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6 text-center max-w-md mx-auto">
                Verifique se há infrações ou pendências registradas para o seu veículo na base da SMTT Propriá.
              </p>

              <form onSubmit={handleBuscarPlaca} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  maxLength="7"
                  placeholder="Placa (Ex: ABC1D23)"
                  value={placaBusca}
                  onChange={(e) => setPlacaBusca(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none uppercase font-bold text-center sm:text-left text-lg tracking-wider"
                  required
                />
                <button
                  type="submit"
                  disabled={buscando}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {buscando ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Consultando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-search"></i> Consultar
                    </>
                  )}
                </button>
              </form>

              {resultadoBusca && (
                <div className={`mt-6 p-4 rounded-xl border ${resultadoBusca.tem_multas ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${resultadoBusca.tem_multas ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                      <i className={`fa-solid ${resultadoBusca.tem_multas ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm">
                        {resultadoBusca.tem_multas ? 'Atenção: Infrações Encontradas' : 'Nada Consta'}
                      </h4>
                      <p className="text-xs mt-1 text-gray-600">{resultadoBusca.mensagem}</p>
                      {resultadoBusca.tem_multas && (
                        <button
                          onClick={() => navigate('/login')}
                          className="mt-3 bg-primary-600 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-primary-700 w-full transition-colors flex items-center justify-center gap-1"
                        >
                          <i className="fa-solid fa-right-to-bracket"></i> Acessar Painel para Recorrer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Notícias Section */}
        <section id="noticias" className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Últimas Notícias</h2>
                <div className="h-1 w-20 bg-secondary-500 mt-2 rounded"></div>
              </div>
              <a 
                href="/noticias" 
                onClick={(e) => { e.preventDefault(); navigate('/noticias'); }} 
                className="hidden sm:block text-primary-600 hover:underline font-medium"
              >
                Ver mais notícias
              </a>
            </div>

            {noticias.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Nenhuma notícia publicada recentemente.
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
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
                      case 'Educação': return 'bg-blue-50';
                      case 'Mobilidade': return 'bg-green-50';
                      case 'Infraestrutura': return 'bg-yellow-50';
                      case 'Comunicados': return 'bg-red-50';
                      default: return 'bg-gray-50';
                    }
                  };

                  const getCategoriaBadgeColor = (categoria) => {
                    switch (categoria) {
                      case 'Educação': return 'bg-primary-600 text-white';
                      case 'Mobilidade': return 'bg-green-600 text-white';
                      case 'Infraestrutura': return 'bg-secondary-500 text-primary-950';
                      case 'Comunicados': return 'bg-red-600 text-white';
                      default: return 'bg-gray-600 text-white';
                    }
                  };

                  return (
                    <article 
                      key={item.id} 
                      onClick={() => navigate(`/noticias/${item.id}`)}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer"
                    >
                      <div className="h-48 overflow-hidden relative shrink-0">
                        {imageSrc ? (
                          <img 
                            src={imageSrc} 
                            alt={item.titulo} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className={`w-full h-full ${getPlaceholderBg(item.categoria)} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
                            <i className={`fa-solid ${getPlaceholderIcon(item.categoria)} text-5xl`}></i>
                          </div>
                        )}
                        <div className={`absolute top-4 left-4 text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wider ${getCategoriaBadgeColor(item.categoria)}`}>
                          {item.categoria}
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-gray-500 font-medium mb-2 block">
                            <i className="fa-regular fa-calendar mr-1"></i> {item.criado_em?.split(' ')[0]}
                          </span>
                          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                            {item.titulo}
                          </h3>
                          {item.subtitulo && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                              {item.subtitulo}
                            </p>
                          )}
                        </div>
                        <span className="text-primary-600 font-semibold text-sm hover:underline flex items-center gap-1.5 mt-2">
                          Ler matéria completa <i className="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-0.5"></i>
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div className="mt-6 text-center sm:hidden">
              <a 
                href="/noticias" 
                onClick={(e) => { e.preventDefault(); navigate('/noticias'); }} 
                className="text-primary-600 font-medium hover:underline"
              >
                Ver mais notícias
              </a>
            </div>
          </div>
        </section>

        {/* Numeros / Estatisticas */}
        <section className="py-12 bg-primary-900 text-white border-b-8 border-secondary-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-secondary-500 mb-2">150k+</div>
                <div className="text-sm text-primary-100">Veículos Fiscalizados/Mês</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-secondary-500 mb-2">45</div>
                <div className="text-sm text-primary-100">Linhas de Ônibus</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-secondary-500 mb-2">12k</div>
                <div className="text-sm text-primary-100">Atendimentos Online</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-secondary-500 mb-2">-15%</div>
                <div className="text-sm text-primary-100">Acidentes neste ano</div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-white pt-16 pb-8 border-t-[6px] border-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 border-b border-gray-800 pb-12">

            {/* Col 1: About/Logo */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/logon.png" alt="Logo SMTT" className="w-12 h-12 object-contain" />
                <div>
                  <h2 className="font-bold text-xl text-white">SMTT</h2>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Propriá / SE</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Superintendência Municipal de Transportes e Trânsito de Propriá/SE. Trabalhando para um trânsito mais seguro e uma mobilidade eficiente para todos os cidadãos.
              </p>
              <div className="flex space-x-4">
                <a href="#" onClick={(e) => e.preventDefault()} className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-colors" aria-label="Facebook">
                  <i className="fa-brands fa-facebook-f"></i>
                </a>
                <a href="https://www.instagram.com/smttpropria?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-colors" aria-label="Instagram">
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a href="#" onClick={(e) => e.preventDefault()} className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-colors" aria-label="Twitter">
                  <i className="fa-brands fa-twitter"></i>
                </a>
                <a href="#" onClick={(e) => e.preventDefault()} className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-colors" aria-label="YouTube">
                  <i className="fa-brands fa-youtube"></i>
                </a>
              </div>
            </div>

            {/* Col 2: Links */}
            <div>
              <h3 className="font-bold text-lg mb-6 border-l-2 border-secondary-500 pl-3">Acesso Rápido</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-angle-right text-[10px]"></i> Painel do Cidadão</button></li>
                <li><button onClick={() => navigate('/consultar')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-angle-right text-[10px]"></i> Consultar Protocolo</button></li>
                <li><button onClick={() => navigate('/admin/login')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-angle-right text-[10px]"></i> Acesso Servidor / Administrativo</button></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Portal de Licitações da Prefeitura em breve."); }} className="hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-angle-right text-[10px]"></i> Licitações e Contratos</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Ouvidoria do Município de Propriá."); }} className="hover:text-white transition-colors flex items-center gap-2"><i className="fa-solid fa-angle-right text-[10px]"></i> Ouvidoria SMTT</a></li>
              </ul>
            </div>

            {/* Col 3: Contact */}
            <div>
              <h3 className="font-bold text-lg mb-6 border-l-2 border-secondary-500 pl-3">Atendimento</h3>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-location-dot mt-1 text-secondary-500"></i>
                  <span>Avenida João Barbosa Pôrto, 1829<br />Propriá - SE - CEP 49900-000<br />Horário: 08h às 14h</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fa-solid fa-phone text-secondary-500"></i>
                  <span>(79) 99665-4115</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fa-solid fa-envelope text-secondary-500"></i>
                  <a href="mailto:smtt@propria.se.gov.br" className="hover:text-white transition-colors">smtt@propria.se.gov.br</a>
                </li>
              </ul>
            </div>



          </div>

          {/* Bottom Copyright */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 pt-8 border-t border-gray-800">
            <p>&copy; 2026 SMTT - Superintendência Municipal de Transportes e Trânsito de Propriá/SE. Todos os direitos reservados.</p>
            <div className="mt-4 md:mt-0 flex gap-4">
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">Política de Privacidade</a>
              <span>|</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">Termos de Uso</a>
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

    </div>
  );
}

export default Home;