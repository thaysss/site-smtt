import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import './Home.css';

function FaleConosco() {
  const navigate = useNavigate();
  const [showTopBtn, setShowTopBtn] = useState(false);

  // Estados do Formulário de Ouvidoria
  const [ouvidoriaNome, setOuvidoriaNome] = useState('');
  const [ouvidoriaEmail, setOuvidoriaEmail] = useState('');
  const [ouvidoriaAssunto, setOuvidoriaAssunto] = useState('Sugestão');
  const [ouvidoriaMensagem, setOuvidoriaMensagem] = useState('');
  const [ouvidoriaLoading, setOuvidoriaLoading] = useState(false);
  const [ouvidoriaProtocolo, setOuvidoriaProtocolo] = useState(null);

  // Efeito de Scroll (Botão Topo)
  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div id="top" className="home-page font-sans text-slate-800 bg-white flex flex-col min-h-screen">

      <SiteHeader />

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow">
        {/* Banner Title */}
        <header className="border-b border-slate-200 bg-slate-50 py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-700 mb-3">Atendimento ao cidadão</p>
            <h1 className="font-sora text-4xl md:text-5xl font-semibold tracking-tight text-primary-950">Fale Conosco</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Use os canais oficiais da SMTT para enviar dúvidas, sugestões, reclamações, elogios ou pedidos de informação.
            </p>
          </div>
        </header>

        {/* Ouvidoria Section */}
        <section id="ouvidoria-form" className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

              {/* Info Column */}
              <div className="lg:col-span-5 border-t-4 border-primary-800 bg-slate-50 p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary-700 mb-3">Ouvidoria Digital</p>
                <h2 className="text-2xl font-sora font-semibold text-primary-950 leading-tight">Canais de Atendimento</h2>
                <div className="h-px w-full bg-slate-300 mt-4"></div>
                
                <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                  Utilize este canal para registrar sugestões, reclamações, elogios ou solicitar informações à SMTT Propriá. Sua participação é fundamental para melhorarmos a segurança e mobilidade do nosso município.
                </p>

                <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
                  <div className="flex items-start gap-4 py-5">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wide mb-1">Atendimento Telefônico</span>
                      <strong className="text-sm text-slate-800">(79) 99665-4115</strong>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 py-5">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wide mb-1">E-mail Institucional</span>
                      <a href="mailto:smtt@propria.se.gov.br" className="text-sm text-primary-700 font-semibold hover:underline">smtt@propria.se.gov.br</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 py-5">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wide mb-1">Sede Presencial</span>
                      <span className="text-sm text-slate-800 font-semibold block leading-tight">Avenida João Barbosa Pôrto, 1829</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Column */}
              <div className="lg:col-span-7 border border-slate-200 bg-white p-6 md:p-8">
                <h3 className="text-xl font-semibold text-primary-950 mb-2 font-sora">Formulário de Ouvidoria</h3>
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
                        maxLength={150}
                        placeholder="Ex: João da Silva"
                        className="w-full text-sm placeholder-slate-400 border-slate-200 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">E-mail para Retorno</label>
                      <input
                        type="email"
                        value={ouvidoriaEmail}
                        onChange={(e) => setOuvidoriaEmail(e.target.value)}
                        maxLength={100}
                        placeholder="Ex: joao@exemplo.com"
                        className="w-full text-sm placeholder-slate-400 border-slate-200 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Assunto</label>
                      <select
                        value={ouvidoriaAssunto}
                        onChange={(e) => setOuvidoriaAssunto(e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white transition-colors"
                        required
                      >
                        <option value="Sugestão">Sugestão</option>
                        <option value="Reclamação">Reclamação</option>
                        <option value="Elogio">Elogio</option>
                        <option value="Informação">Solicitação de Informação</option>
                        <option value="Denúncia">Denúncia</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Sua Mensagem</label>
                      <textarea
                        value={ouvidoriaMensagem}
                        onChange={(e) => setOuvidoriaMensagem(e.target.value)}
                        maxLength={2000}
                        placeholder="Descreva detalhadamente a sua solicitação..."
                        rows="5"
                        className="w-full text-sm placeholder-slate-400 border-slate-200 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none font-sans transition-colors"
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={ouvidoriaLoading}
                      className="w-full bg-primary-900 hover:bg-primary-950 text-white font-bold py-3.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
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
      <footer id="contato" className="home-footer">
        <div className="home-footer-container">
          <div className="home-footer-main">
            <div className="home-footer-brand">
              <a href="/" className="home-footer-logo" aria-label="SMTT Propriá — início" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                <img src="/vc.png" alt="SMTT Propriá" />
              </a>
              <p className="home-footer-description">Trabalhando pela segurança viária e pela mobilidade de todos os cidadãos.</p>
              <div className="home-footer-socials">
                <a href="https://www.instagram.com/smttpropria/" target="_blank" rel="noopener noreferrer" aria-label="Instagram da SMTT Propriá">
                  <i className="fa-brands fa-instagram" aria-hidden="true"></i>
                </a>
              </div>
              <span className="home-footer-social-label">Acompanhe nossas redes</span>
            </div>

            <nav aria-label="Links úteis do rodapé" className="home-footer-links">
              <h3>Acesso rápido</h3>
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                <span><i className="fa-solid fa-user"></i>Painel do Cidadão</span>
                <i className="fa-solid fa-chevron-right home-footer-arrow"></i>
              </a>
              <a href="/consultar" onClick={(e) => { e.preventDefault(); navigate('/consultar'); }}>
                <span><i className="fa-regular fa-file-lines"></i>Consultar protocolo</span>
                <i className="fa-solid fa-chevron-right home-footer-arrow"></i>
              </a>
              <a href="/fale-conosco" onClick={(e) => { e.preventDefault(); document.getElementById('ouvidoria-form')?.scrollIntoView({ behavior: 'smooth' }); }}>
                <span><i className="fa-solid fa-headset"></i>Ouvidoria SMTT</span>
                <i className="fa-solid fa-chevron-right home-footer-arrow"></i>
              </a>
              <a href="https://www.propria.se.gov.br/" target="_blank" rel="noopener noreferrer">
                <span><i className="fa-solid fa-building"></i>Portal da Prefeitura</span>
                <i className="fa-solid fa-arrow-up-right-from-square home-footer-arrow"></i>
              </a>
            </nav>

            <div className="home-footer-contact">
              <h3>Atendimento</h3>
              <address>
                <div className="home-footer-contact-row">
                  <div className="home-footer-contact-icon"><i className="fa-solid fa-location-dot" aria-hidden="true"></i></div>
                  <p><a href="https://maps.app.goo.gl/hKUQCpSY8B2c8kpq5" target="_blank" rel="noopener noreferrer">Avenida João Barbosa Pôrto, 1829<br />Propriá – SE · CEP 49900-000</a></p>
                </div>
                <div className="home-footer-contact-row">
                  <div className="home-footer-contact-icon"><i className="fa-solid fa-phone" aria-hidden="true"></i></div>
                  <a href="tel:+5579996654115">(79) 99665-4115</a>
                </div>
                <div className="home-footer-contact-row">
                  <div className="home-footer-contact-icon"><i className="fa-regular fa-envelope" aria-hidden="true"></i></div>
                  <a href="mailto:smtt@propria.se.gov.br">smtt@propria.se.gov.br</a>
                </div>
                <div className="home-footer-contact-row">
                  <div className="home-footer-contact-icon"><i className="fa-regular fa-clock" aria-hidden="true"></i></div>
                  <p>Seg a Sex, 07h às 13h</p>
                </div>
              </address>
            </div>

            <div className="home-footer-action">
              <h3>Fale com a SMTT</h3>
              <p>Dúvidas, sugestões ou solicitações?<br />Estamos à disposição para te atender.</p>
              <a className="home-footer-cta" href="#ouvidoria-form">Ir para o formulário<i className="fa-solid fa-arrow-up" aria-hidden="true"></i></a>
            </div>
          </div>

          <div className="home-footer-bottom">
            <p>© {new Date().getFullYear()} SMTT Propriá. Governo Municipal. Todos os direitos reservados.</p>
            <nav aria-label="Informações legais">
              <a href="/privacidade" onClick={(e) => { e.preventDefault(); navigate('/privacidade'); }}>Privacidade</a>
              <span className="home-footer-divider"></span>
              <a href="/termos" onClick={(e) => { e.preventDefault(); navigate('/termos'); }}>Termos de uso</a>
              <span className="home-footer-divider"></span>
              <a href="#main-content">Acessibilidade</a>
            </nav>
            <div className="home-footer-prefeitura">
              <a href="https://www.propria.se.gov.br/" target="_blank" rel="noopener noreferrer" aria-label="Portal da Prefeitura de Propriá">
                <img src="/prefe.jpg" alt="Prefeitura de Propriá" />
              </a>
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
</div>
  );
}

export default FaleConosco;
