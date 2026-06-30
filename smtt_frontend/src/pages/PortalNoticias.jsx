// src/pages/PortalNoticias.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const apiBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
const montarUrlArquivo = (caminho) => {
  if (!caminho) return '';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${apiBaseUrl}${caminho}`;
};

function PortalNoticias() {
  const [noticias, setNoticias] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
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

  const categorias = ['Todas', 'Educação', 'Mobilidade', 'Infraestrutura', 'Comunicados', 'Geral'];

  const noticiasFiltradas = noticias.filter((noticia) => {
    const correspondeBusca = noticia.titulo.toLowerCase().includes(busca.toLowerCase()) || 
                             (noticia.subtitulo && noticia.subtitulo.toLowerCase().includes(busca.toLowerCase()));
    
    const correspondeCategoria = categoriaAtiva === 'Todas' || noticia.categoria === categoriaAtiva;
    
    return correspondeBusca && correspondeCategoria;
  });

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
      
      {/* Header Simplificado */}
      <header className="bg-primary-900 text-white shadow-md py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/SMTT.png" alt="Logo SMTT" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg leading-tight">SMTT Propriá</h1>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Portal de Notícias</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/20 hover:bg-white/10 transition-colors"
          >
            <i className="fa-solid fa-arrow-left"></i> Voltar ao Portal
          </button>
        </div>
      </header>

      {/* Hero Section das Notícias */}
      <section className="bg-gradient-to-r from-primary-900 to-primary-850 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Notícias e Comunicados</h2>
          <p className="text-gray-300 max-w-xl mx-auto text-sm md:text-base">
            Fique por dentro das ações de mobilidade urbana, infraestrutura viária e campanhas de educação no trânsito em Propriá/SE.
          </p>
        </div>
      </section>

      {/* Área Principal de Filtros e Listagem */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Barra de Ações (Busca e Categorias) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Campo de Busca */}
          <div className="relative w-full md:max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Pesquisar notícias..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
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
                  onClick={() => setCategoriaAtiva(cat)}
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

        {/* Listagem */}
        {loading ? (
          <div className="text-center py-20">
            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary-600"></i>
            <p className="text-gray-500 text-sm mt-3 font-semibold">Carregando notícias...</p>
          </div>
        ) : noticiasFiltradas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
            <i className="fa-solid fa-newspaper text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-bold text-gray-700 mb-1">Nenhuma matéria localizada</h3>
            <p className="text-xs text-gray-400 font-medium">Nenhuma notícia correspondente aos filtros de pesquisa foi encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {noticiasFiltradas.map((noticia) => (
              <article 
                key={noticia.id}
                onClick={() => navigate(`/noticias/${noticia.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full cursor-pointer"
              >
                {/* Imagem de Capa */}
                <div className="h-48 overflow-hidden relative shrink-0">
                  {noticia.imagem_url ? (
                    <img 
                      src={montarUrlArquivo(noticia.imagem_url)} 
                      alt={noticia.titulo} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                      <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">
                        {noticia.subtitulo}
                      </p>
                    )}
                  </div>
                  <span className="text-primary-600 font-bold text-xs hover:underline flex items-center gap-1.5 mt-2">
                    Ler matéria completa <i className="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-1"></i>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

      </main>

      {/* Footer Simples */}
      <footer className="bg-primary-950 text-gray-400 py-8 border-t border-white/5 text-center text-xs">
        <p>© 2026 SMTT Propriá/SE. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}

export default PortalNoticias;
