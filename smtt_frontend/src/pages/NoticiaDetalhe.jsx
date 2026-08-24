// src/pages/NoticiaDetalhe.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const apiBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
const montarUrlArquivo = (caminho) => {
  if (!caminho) return '';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${apiBaseUrl}${caminho}`;
};

function NoticiaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [noticia, setNoticia] = useState(null);
  const [outrasNoticias, setOutrasNoticias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarNoticia = async () => {
      setLoading(true);
      try {
        // Carrega a notícia específica
        const response = await api.get(`/public/noticias/${id}`);
        setNoticia(response.data);

        // Carrega outras notícias para sugestão
        const listaResponse = await api.get('/public/noticias');
        const filtradas = listaResponse.data
          .filter((n) => n.id !== parseInt(id))
          .slice(0, 3);
        setOutrasNoticias(filtradas);
      } catch (error) {
        console.error("Erro ao carregar detalhes da notícia:", error);
      } finally {
        setLoading(false);
      }
    };
    carregarNoticia();
  }, [id]);

  const getCategoriaBadgeColor = (categoria) => {
    switch (categoria) {
      case 'Educação': return 'bg-blue-100 text-blue-800';
      case 'Mobilidade': return 'bg-green-100 text-green-800';
      case 'Infraestrutura': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Comunicados': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary-600"></i>
        <p className="text-gray-500 text-sm mt-3 font-semibold">Carregando matéria...</p>
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans text-center px-4">
        <i className="fa-solid fa-triangle-exclamation text-5xl text-red-500 mb-4"></i>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Notícia não localizada</h3>
        <p className="text-gray-500 text-sm max-w-sm mb-6">A matéria que você tentou acessar não existe ou foi removida pelo administrador.</p>
        <button 
          onClick={() => navigate('/noticias')}
          className="bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 transition-colors shadow-md text-sm"
        >
          Ir para o Portal de Notícias
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-850">
      
      {/* Header Fixo */}
      <header className="bg-primary-900 text-white shadow-md py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logon.png" alt="Logo SMTT" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg leading-tight">SMTT Propriá</h1>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Leitor de Matérias</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/noticias')} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/20 hover:bg-white/10 transition-colors"
          >
            <i className="fa-solid fa-arrow-left"></i> Todas as Notícias
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Coluna do Artigo */}
          <article className="lg:col-span-8 bg-white rounded-3xl border border-gray-150 shadow-sm p-6 md:p-10">
            {/* Categoria e Data */}
            <div className="flex items-center gap-3 mb-6">
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider ${getCategoriaBadgeColor(noticia.categoria)}`}>
                {noticia.categoria}
              </span>
              <span className="text-xs text-gray-400 font-bold tracking-wide">
                <i className="fa-regular fa-calendar mr-1"></i> {noticia.criado_em}
              </span>
            </div>

            {/* Título e Subtítulo */}
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
              {noticia.titulo}
            </h1>
            {noticia.subtitulo && (
              <h2 className="text-gray-500 text-sm md:text-base mb-8 font-medium leading-relaxed border-l-4 border-secondary-500 pl-4">
                {noticia.subtitulo}
              </h2>
            )}

            {/* Imagem de Capa da Notícia */}
            <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 shadow-sm">
              {noticia.imagem_url ? (
                <img 
                  src={montarUrlArquivo(noticia.imagem_url)} 
                  alt={noticia.titulo} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full ${getPlaceholderBg(noticia.categoria)} flex items-center justify-center`}>
                  <i className={`fa-solid ${getPlaceholderIcon(noticia.categoria)} text-7xl`}></i>
                </div>
              )}
            </div>

            {/* Conteúdo Principal (parágrafos dinâmicos) */}
            <div className="text-gray-700 leading-relaxed text-base space-y-6">
              {noticia.conteudo.split('\n').map((paragrafo, idx) => {
                const trimmed = paragrafo.trim();
                if (!trimmed) return null;
                return <p key={idx}>{trimmed}</p>;
              })}
            </div>

            {/* Ações / Compartilhamento Simples */}
            <div className="border-t border-gray-100 pt-6 mt-10 flex flex-wrap justify-between items-center gap-4">
              <button 
                onClick={() => navigate('/noticias')}
                className="text-primary-600 hover:text-primary-800 font-bold text-sm flex items-center gap-2"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i> Voltar para a listagem
              </button>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Compartilhar:</span>
                <button 
                  onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copiado para a área de transferência!"); }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-primary-600 hover:text-white text-gray-600 transition-colors flex items-center justify-center" 
                  title="Copiar Link"
                >
                  <i className="fa-solid fa-link text-xs"></i>
                </button>
              </div>
            </div>
          </article>

          {/* Coluna Lateral (Sugestões) */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6">
              <h3 className="font-extrabold text-lg text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <i className="fa-solid fa-newspaper text-primary-600 text-sm"></i> Outras Matérias
              </h3>
              
              {outrasNoticias.length === 0 ? (
                <p className="text-gray-400 text-xs italic">Nenhuma outra notícia cadastrada no momento.</p>
              ) : (
                <div className="space-y-6">
                  {outrasNoticias.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => navigate(`/noticias/${item.id}`)}
                      className="group cursor-pointer flex gap-3.5 items-start hover:bg-gray-50/50 p-2 rounded-xl transition-colors"
                    >
                      {/* Mini imagem de capa */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                        {item.imagem_url ? (
                          <img 
                            src={montarUrlArquivo(item.imagem_url)} 
                            alt={item.titulo} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full ${getPlaceholderBg(item.categoria)} flex items-center justify-center`}>
                            <i className={`fa-solid ${getPlaceholderIcon(item.categoria)} text-lg`}></i>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">
                          {item.criado_em?.split(' ')[0]}
                        </span>
                        <h4 className="font-bold text-sm text-gray-800 leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
                          {item.titulo}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card de Informação Rápida */}
            <div className="bg-primary-900 text-white rounded-2xl p-6 shadow-sm border border-primary-950/20 text-center relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full"></div>
              <img src="/logon.png" alt="SMTT" className="w-12 h-12 mx-auto mb-4 object-contain" />
              <h4 className="font-bold text-base mb-2">Canais de Atendimento</h4>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">Dúvidas sobre trânsito, multas ou interdições? Acesse nosso portal público ou fale com a ouvidoria.</p>
              <button 
                onClick={() => navigate('/')}
                className="w-full py-2.5 bg-secondary-500 hover:bg-secondary-600 text-primary-950 font-bold rounded-xl text-xs transition-colors shadow"
              >
                Página Inicial
              </button>
            </div>
          </aside>

        </div>
      </main>

      {/* Footer */}
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

export default NoticiaDetalhe;
