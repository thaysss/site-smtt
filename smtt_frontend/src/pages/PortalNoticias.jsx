// src/pages/PortalNoticias.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import SiteHeader from '../components/SiteHeader';

const apiBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
const montarUrlArquivo = (caminho) => {
  if (!caminho) return '';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${apiBaseUrl}${caminho}`;
};

function PortalNoticias() {
  const [noticias, setNoticias] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [busca, setBusca] = useState(() => searchParams.get('q') || '');
  const [categoriaAtiva, setCategoriaAtiva] = useState(() => searchParams.get('categoria') || 'Todas');
  const [paginaAtual, setPaginaAtual] = useState(() => Math.max(1, Number(searchParams.get('pagina')) || 1));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const carregarNoticias = async () => {
      try {
        const response = await api.get('/public/noticias');
        setNoticias(response.data);
      } catch (error) {
        console.error("Erro ao carregar notícias:", error);
      } finally {
        setLoading(false);
      }
    };
    carregarNoticias();
  }, []);

  useEffect(() => {
    const params = {};
    if (busca.trim()) params.q = busca.trim();
    if (categoriaAtiva !== 'Todas') params.categoria = categoriaAtiva;
    if (paginaAtual > 1) params.pagina = String(paginaAtual);
    setSearchParams(params, { replace: true });
  }, [busca, categoriaAtiva, paginaAtual, setSearchParams]);

  const selecionarCategoria = (categoria) => {
    setCategoriaAtiva(categoria);
    setPaginaAtual(1);
  };
  const categorias = ['Todas', 'Educação', 'Mobilidade', 'Infraestrutura', 'Comunicados', 'Geral'];

  const noticiasFiltradas = noticias.filter((noticia) => {
    const correspondeBusca = noticia.titulo.toLowerCase().includes(busca.toLowerCase()) || 
                             (noticia.subtitulo && noticia.subtitulo.toLowerCase().includes(busca.toLowerCase()));
    
    const correspondeCategoria = categoriaAtiva === 'Todas' || noticia.categoria === categoriaAtiva;
    
    return correspondeBusca && correspondeCategoria;
  });

  const itensPorPagina = 6;
  const noticiasSecundarias = noticiasFiltradas;
  const totalPaginas = Math.max(1, Math.ceil(noticiasSecundarias.length / itensPorPagina));
  const noticiasPaginadas = noticiasSecundarias.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);


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
      case 'Educação': return 'bg-blue-100 text-blue-800';
      case 'Mobilidade': return 'bg-green-100 text-green-800';
      case 'Infraestrutura': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Comunicados': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <SiteHeader />

      {/* Hero Section das Notícias */}
      <section className="relative overflow-hidden bg-[#0b1c3e] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Notícias e comunicados</h2>
          <p className="text-gray-300 max-w-xl mx-auto text-sm md:text-base">
            Acompanhe ações de mobilidade, mudanças no trânsito, serviços e campanhas da SMTT de Propriá.
          </p>
        </div>
      </section>

      {/* Área Principal de Filtros e Listagem */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Barra de Ações (Busca e Categorias) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Campo de Busca */}
          <div className="relative w-full md:max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="search" aria-label="Pesquisar notícias" placeholder="Busque por título ou assunto"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
            />
          </div>

          {/* Categorias (Abas Horizontais) */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none py-1 max-w-full">
            {categorias.map((cat) => {
              const ativo = categoriaAtiva === cat;
              return (
                <button
                  key={cat}
                  onClick={() => selecionarCategoria(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    ativo 
                      ? 'bg-primary-600 border-primary-600 text-white shadow-sm' 
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {!loading && noticiasFiltradas.length > 0 && (
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Conteúdo atualizado</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Últimas notícias</h2>
            </div>
            <span className="text-sm text-slate-500">{noticiasFiltradas.length} {noticiasFiltradas.length === 1 ? 'matéria' : 'matérias'}</span>
          </div>
        )}
        {/* Listagem */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Carregando notícias">
            {[1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white animate-pulse"><div className="aspect-[16/10] bg-slate-200"></div><div className="p-6 space-y-3"><div className="h-3 w-24 rounded bg-slate-200"></div><div className="h-5 rounded bg-slate-200"></div><div className="h-4 w-2/3 rounded bg-slate-100"></div></div></div>)}
          </div>
        ) : noticiasFiltradas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
            <i className="fa-solid fa-newspaper text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-bold text-gray-700 mb-1">Nenhuma matéria encontrada</h3>
            <p className="text-xs text-gray-400 font-medium">Tente outro termo ou selecione outra categoria.</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {noticiasPaginadas.map((noticia, index) => (
              <article 
                key={noticia.id}
                onClick={() => navigate(`/noticias/${noticia.id}`)}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all group flex flex-col h-full cursor-pointer ${paginaAtual === 1 && index === 0 ? 'md:col-span-2 lg:col-span-2' : ''}`}
              >
                {/* Imagem de Capa */}
                <div className="aspect-[16/10] overflow-hidden relative shrink-0 bg-slate-100">
                  {noticia.imagem_url ? (
                    <img 
                      src={montarUrlArquivo(noticia.imagem_url)} 
                      alt={noticia.titulo} 
                      loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full ${getPlaceholderBg(noticia.categoria)} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
                      <i className={`fa-solid ${getPlaceholderIcon(noticia.categoria)} text-5xl`}></i>
                    </div>
                  )}
                  <div className={`absolute top-4 left-4 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow ${getCategoriaBadgeColor(noticia.categoria)}`}>
                    {noticia.categoria}
                  </div>
                </div>

                {/* Corpo do Card */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-2 block tracking-wider">
                      <i className="fa-regular fa-calendar mr-1"></i> {noticia.criado_em?.split(' ')[0]}
                    </span>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                      {noticia.titulo}
                    </h3>
                    {noticia.subtitulo && (
                      <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {noticia.subtitulo}
                      </p>
                    )}
                  </div>
                  <span className="text-primary-600 font-bold text-xs hover:underline flex items-center gap-1.5 mt-2">
                    Continuar lendo <i className="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-1"></i>
                  </span>
                </div>
              </article>
            ))}
          </div>
          {totalPaginas > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Paginação de notícias">
              <button disabled={paginaAtual === 1} onClick={() => setPaginaAtual((pagina) => pagina - 1)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 disabled:opacity-40">Anterior</button>
              <span className="text-sm text-slate-500">Página <strong className="text-slate-800">{paginaAtual}</strong> de {totalPaginas}</span>
              <button disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual((pagina) => pagina + 1)} className="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold disabled:opacity-40">Próxima</button>
            </nav>
          )}
          </>
        )}

      </main>

      {/* Footer Simples */}
      <footer className="bg-primary-950 text-gray-400 py-8 border-t border-white/5 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 SMTT Propriá/SE. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/privacidade')} className="hover:text-white transition-colors">Privacidade</button>
            <span>|</span>
            <button onClick={() => navigate('/termos')} className="hover:text-white transition-colors">Termos</button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default PortalNoticias;
