import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, Accessibility, ChevronDown, 
  ArrowRight, Menu, X, Bus, FileText, Search, Scale, MapPin, PhoneCall, 
  ArrowUp, TrafficCone, AlertTriangle, Check 
} from 'lucide-react';

function Home() {
  const navigate = useNavigate();
  
  // Estados de UI (Slider, Menu, Scroll)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [shrinkHeader, setShrinkHeader] = useState(false);

  // Estados de Dados (Busca e Alertas)
  const [alertas, setAlertas] = useState([]);
  const [placaBusca, setPlacaBusca] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // Efeito do Slider Hero
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2); // Alterna entre 0 e 1
    }, 6000);
    return () => clearInterval(slideInterval);
  }, []);

  // Efeito de Scroll (Botão Topo e Header)
  useEffect(() => {
    const handleScroll = () => {
      setShrinkHeader(window.scrollY > 20);
      setShowTopBtn(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Carregar Alertas da API
  useEffect(() => {
    const carregarAlertas = async () => {
      try {
        const response = await api.get('/public/alertas');
        setAlertas(response.data);
      } catch (error) {
        console.error("Erro ao carregar alertas:", error);
      }
    };
    carregarAlertas();
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
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div id="top" className="font-body text-gray-800 bg-gray-50 antialiased selection:bg-brand-blue selection:text-white relative">
      
      {/* BARRA DE TOPO */}
      <div className="bg-brand-dark text-white/80 py-2 text-xs font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent-yellow" />
            <span className="hidden sm:inline">Bem-Vindo à Superintendência Municipal de Transportes e Trânsito de Propriá!</span>
            <span className="sm:hidden">Portal Oficial de Propriá</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-accent-yellow transition-colors flex items-center gap-1">
              <Accessibility className="w-4 h-4" /> <span className="hidden sm:inline">Acessibilidade</span>
            </a>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className={`glass-header sticky top-0 z-50 border-b border-gray-100 shadow-sm transition-all duration-300 ${shrinkHeader ? 'py-0' : 'py-2'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3 group">
            {/* Antes estava aquele nome gigante: 484322399_2421491... */}
            <img src="/logo.png" alt="Logo SMTT" className="w-14 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />
            <div>
              <h1 className="font-sora text-xl font-bold text-brand-blue tracking-tight leading-none group-hover:text-brand-light transition-colors">SMTT</h1>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mt-1">Propriá / SE</span>
            </div>
          </a>

          <nav className="hidden lg:block">
            <ul className="flex items-center gap-1">
              <li><a href="#top" className="px-4 py-2 font-sora text-sm font-semibold text-brand-blue bg-blue-50 rounded-md">Início</a></li>
              <li className="relative group">
                <button className="px-4 py-2 font-sora text-sm font-semibold text-gray-700 hover:text-brand-blue hover:bg-gray-50 rounded-md flex items-center gap-1 transition-colors">
                  Institucional <ChevronDown className="w-4 h-4" />
                </button>
              </li>
              <li className="relative group">
                <a href="#servicos" className="px-4 py-2 font-sora text-sm font-semibold text-gray-700 hover:text-brand-blue hover:bg-gray-50 rounded-md flex items-center gap-1 transition-colors">
                  Serviços <ChevronDown className="w-4 h-4" />
                </a>
                
                {/* Dropdown de Serviços ao Cidadão */}
                <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button onClick={() => navigate('/login')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-brand-blue transition-colors font-medium flex items-center gap-2">
                    <Search className="w-4 h-4 text-brand-blue" /> Minhas Multas
                  </button>
                  <button onClick={() => navigate('/login')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-brand-blue transition-colors font-medium flex items-center gap-2">
                    <Scale className="w-4 h-4 text-brand-blue" /> Defesa Prévia / JARI
                  </button>
                  <button onClick={() => navigate('/consultar')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-brand-blue transition-colors font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-blue" /> Consultar Protocolo
                  </button>
                </div>
              </li>
              <li><a href="#noticias" className="px-4 py-2 font-sora text-sm font-semibold text-gray-700 hover:text-brand-blue hover:bg-gray-50 rounded-md transition-colors">Notícias</a></li>
              <li><button onClick={() => navigate('/consultar')} className="px-4 py-2 font-sora text-sm font-semibold text-gray-700 hover:text-brand-blue hover:bg-gray-50 rounded-md transition-colors">Consultar Protocolos </button></li>
            </ul>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="bg-accent-yellow hover:bg-accent-hover text-brand-blue font-sora font-bold text-sm px-6 py-2.5 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
              Entrar no Painel <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button className="lg:hidden p-2 text-gray-600 hover:text-brand-blue rounded-md" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* MENU MOBILE */}
      <div className={`fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`absolute top-0 right-0 w-[80%] max-w-sm h-full bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="font-sora font-bold text-brand-blue">Menu de Navegação</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto no-scrollbar flex-1 space-y-4">
            <a href="#top" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 px-4 rounded-lg bg-blue-50 text-brand-blue font-sora font-semibold">Início</a>
            
            <div className="border-t border-gray-100 pt-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-4 mb-2">Serviços ao Cidadão</span>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="w-full text-left py-3 px-4 rounded-lg text-gray-700 font-sora font-semibold hover:bg-gray-50 flex items-center gap-2 mb-1">
                <Search className="w-4 h-4 text-brand-blue" /> Minhas Multas
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="w-full text-left py-3 px-4 rounded-lg text-gray-700 font-sora font-semibold hover:bg-gray-50 flex items-center gap-2 mb-1">
                <Scale className="w-4 h-4 text-brand-blue" /> Defesa Prévia / JARI
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/consultar'); }} className="w-full text-left py-3 px-4 rounded-lg text-gray-700 font-sora font-semibold hover:bg-gray-50 flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-brand-blue" /> Consultar Protocolo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HERO SLIDER */}
      <section className="relative h-[500px] md:h-[600px] lg:h-[700px] bg-brand-dark overflow-hidden">
        
        {/* Slide 1 */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Trânsito" className="absolute w-full h-full object-cover object-center scale-105" />
          <div className="absolute inset-0 hero-gradient"></div>
          <div className="absolute inset-0 flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`max-w-2xl transition-all duration-700 transform ${currentSlide === 0 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <span className="inline-flex items-center gap-1 bg-accent-yellow text-brand-blue font-sora text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-6">
                <TrafficCone className="w-4 h-4" /> Gestão de Trânsito
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-sora font-bold text-white leading-tight mb-6">Mobilidade Urbana para Propriá</h2>
              <p className="text-lg md:text-xl text-gray-200 mb-8 font-light max-w-lg">Segurança, fluidez e qualidade no trânsito e nos transportes públicos do nosso município.</p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('/login')} className="bg-accent-yellow hover:bg-accent-hover text-brand-blue font-sora font-bold px-8 py-3.5 rounded-full shadow-lg hover:-translate-y-1 transition-all">Acessar Meu Painel</button>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 2 */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Transporte" className="absolute w-full h-full object-cover object-center scale-105" />
          <div className="absolute inset-0 hero-gradient"></div>
          <div className="absolute inset-0 flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`max-w-2xl transition-all duration-700 transform ${currentSlide === 1 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <span className="inline-flex items-center gap-1 bg-green-500 text-white font-sora text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-6">
                <Bus className="w-4 h-4" /> Transporte Público
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-sora font-bold text-white leading-tight mb-6">Transporte eficiente e de qualidade</h2>
              <p className="text-lg md:text-xl text-gray-200 mb-8 font-light max-w-lg">Fiscalização e planejamento contínuo garantindo o melhor atendimento à população.</p>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
          <button onClick={() => setCurrentSlide(0)} className={`w-3 h-3 rounded-full transition-all ${currentSlide === 0 ? 'bg-accent-yellow ring-4 ring-white/20' : 'bg-white/40'}`}></button>
          <button onClick={() => setCurrentSlide(1)} className={`w-3 h-3 rounded-full transition-all ${currentSlide === 1 ? 'bg-accent-yellow ring-4 ring-white/20' : 'bg-white/40'}`}></button>
        </div>
      </section>

      {/* FAIXA RÁPIDA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-12 z-30 mb-10 hidden md:block">
        <div className="bg-white rounded-2xl shadow-soft flex overflow-hidden border border-gray-100">
          <div className="flex-1 p-6 flex items-center gap-4 hover:bg-blue-50 transition-colors border-r border-gray-100 group cursor-pointer" onClick={() => navigate('/consultar')}>
            <div className="w-12 h-12 bg-blue-100 text-brand-blue rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileText /></div>
            <div>
              <h3 className="font-sora font-bold text-gray-800 text-sm">Consultar Protocolo</h3>
              <p className="text-xs text-gray-500 mt-1">Acompanhe o andamento dos recursos</p>
            </div>
          </div>
          <div className="flex-1 p-6 flex items-center gap-4 hover:bg-orange-50 transition-colors border-r border-gray-100 group cursor-pointer" onClick={() => navigate('/login')}>
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Search /></div>
            <div>
              <h3 className="font-sora font-bold text-gray-800 text-sm">Minhas Multas</h3>
              <p className="text-xs text-gray-500 mt-1">Verifique pendências</p>
            </div>
          </div>
          <div className="flex-1 p-6 flex items-center gap-4 hover:bg-purple-50 transition-colors group">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><TrafficCone /></div>
            <div>
              <h3 className="font-sora font-bold text-gray-800 text-sm">Avisos na Via</h3>
              <p className="text-xs text-gray-500 mt-1">Acompanhe interdições</p>
            </div>
          </div>
        </div>
      </div>

      {/* INTEGRAÇÃO: BUSCA DE PLACA E ALERTAS DA SMTT */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Módulo Consulta Rápida */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-lg flex items-center justify-center"><Search className="w-5 h-5" /></div>
              <h3 className="font-sora font-bold text-xl text-gray-900">Consulta de Veículo</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">Verifique se há infrações ou pendências registradas para o seu veículo na base da SMTT Propriá.</p>
            
            <form onSubmit={handleBuscarPlaca} className="flex gap-3">
              <input type="text" maxLength="7" placeholder="Placa (Ex: ABC1D23)" value={placaBusca} onChange={(e) => setPlacaBusca(e.target.value.toUpperCase())} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none uppercase font-bold" required />
              <button type="submit" disabled={buscando} className="bg-brand-blue hover:bg-blue-800 text-white font-sora font-bold px-6 py-3 rounded-lg transition-colors">
                {buscando ? 'Buscando...' : 'Consultar'}
              </button>
            </form>

            {resultadoBusca && (
              <div className={`mt-6 p-4 rounded-xl border ${resultadoBusca.tem_multas ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-start gap-3">
                  {resultadoBusca.tem_multas ? <AlertTriangle className="text-yellow-600 mt-0.5" /> : <Check className="text-green-600 mt-0.5" />}
                  <div>
                    <h4 className={`font-bold ${resultadoBusca.tem_multas ? 'text-yellow-800' : 'text-green-800'}`}>
                      {resultadoBusca.tem_multas ? 'Atenção: Infrações Encontradas' : 'Nada Consta'}
                    </h4>
                    <p className={`text-sm mt-1 ${resultadoBusca.tem_multas ? 'text-yellow-700' : 'text-green-700'}`}>{resultadoBusca.mensagem}</p>
                    {resultadoBusca.tem_multas && (
                      <button onClick={() => navigate('/login')} className="mt-4 bg-brand-blue text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-blue-800 w-full transition-colors">
                        Fazer Login para Recorrer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Módulo Alertas de Trânsito */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center"><TrafficCone className="w-5 h-5" /></div>
              <h3 className="font-sora font-bold text-xl text-gray-900">Alertas de Interdição</h3>
            </div>
            
            {alertas.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 border border-gray-100">
                <Check className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                Trânsito fluindo normalmente.<br/>Não há interdições registradas hoje.
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {alertas.map((alerta) => (
                  <div key={alerta.id} className="p-4 rounded-xl bg-red-50 border-l-4 border-red-500">
                    <h4 className="font-bold text-red-700 text-sm mb-1">{alerta.rua_bairro}</h4>
                    <p className="text-xs text-red-600">{alerta.descricao}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-brand-blue font-sora text-sm font-bold tracking-wider uppercase bg-blue-50 px-4 py-1.5 rounded-full inline-block mb-4">Serviços ao Cidadão</span>
            <h2 className="text-3xl md:text-4xl font-sora font-bold text-gray-900 mb-4 tracking-tight">Acesse de forma rápida e fácil</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <button onClick={() => navigate('/login')} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-hover hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-blue mb-6 group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300"><Search className="w-8 h-8" /></div>
              <h3 className="font-sora font-bold text-gray-900 mb-3 group-hover:text-brand-blue transition-colors">Minhas Multas</h3>
              <p className="text-sm text-gray-500 mb-6 flex-1">Verifique e acompanhe as infrações do seu veículo.</p>
            </button>
            <button onClick={() => navigate('/login')} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-hover hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-blue mb-6 group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300"><Scale className="w-8 h-8" /></div>
              <h3 className="font-sora font-bold text-gray-900 mb-3 group-hover:text-brand-blue transition-colors">Defesa Prévia / JARI</h3>
              <p className="text-sm text-gray-500 mb-6 flex-1">Apresente defesa ou recurso contra autuações de trânsito.</p>
            </button>
            <button onClick={() => navigate('/consultar')} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-hover hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-blue mb-6 group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300"><FileText className="w-8 h-8" /></div>
              <h3 className="font-sora font-bold text-gray-900 mb-3 group-hover:text-brand-blue transition-colors">Consultar Protocolo</h3>
              <p className="text-sm text-gray-500 mb-6 flex-1">Acompanhe o status e pareceres dos seus recursos abertos.</p>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#050B14] pt-16 pb-8 border-t-[6px] border-accent-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <a href="#top" className="flex items-center gap-3 mb-6">
                {/* Antes estava aquele nome gigante: 484322399_2421491... */}
                <img src="/logon.png" alt="Logo SMTT" className="w-14 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />  
                <div>
                  <h1 className="font-sora text-xl font-bold text-white leading-none">SMTT</h1>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mt-1">Propriá / SE</span>
                </div>
              </a>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">Trabalhando diariamente pela segurança, planejamento e fiscalização da mobilidade urbana em prol dos nossos cidadãos.</p>
            </div>
            
            <div>
              <h4 className="text-white font-sora font-bold mb-6 text-sm uppercase tracking-wider">Acesso Rápido</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-accent-yellow text-sm transition-colors">Painel do Cidadão</button></li>
                <li><button onClick={() => navigate('/consultar')} className="text-gray-400 hover:text-accent-yellow text-sm transition-colors">Consulta de Protocolo</button></li>
                <li><button onClick={() => navigate('/admin/login')} className="text-gray-400 hover:text-accent-yellow text-sm transition-colors">Acesso Servidor</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-sora font-bold mb-6 text-sm uppercase tracking-wider">Sede Central</h4>
              <address className="not-italic text-gray-400 text-sm space-y-4">
                <p className="flex items-start gap-3"><MapPin className="w-5 h-5 text-accent-yellow" /> Avenida João Barbosa Pôrto, 1829 - Propriá/SE</p>
                <p className="flex items-center gap-3"><PhoneCall className="w-5 h-5 text-accent-yellow" /> (79) 99665-4115</p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 mt-8 flex justify-between items-center text-xs text-gray-500">
            <p>© 2026 SMTT – Superintendência Municipal de Transportes e Trânsito.</p>
          </div>
        </div>
      </footer>

      {/* BOTÃO VOLTAR AO TOPO */}
      <a href="#top" className={`fixed bottom-6 right-6 z-50 bg-brand-blue hover:bg-brand-light text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <ArrowUp className="w-6 h-6" />
      </a>

    </div>
  );
}

export default Home;