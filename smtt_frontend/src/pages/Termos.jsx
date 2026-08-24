// src/pages/Termos.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Termos() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('introducao');

  const sections = [
    { id: 'introducao', label: '1. Introdução e Aceitação', icon: 'fa-solid fa-handshake' },
    { id: 'servicos', label: '2. Serviços Online', icon: 'fa-solid fa-laptop-code' },
    { id: 'cadastro', label: '3. Cadastro e Segurança', icon: 'fa-solid fa-user-lock' },
    { id: 'responsabilidade', label: '4. Suas Obrigações', icon: 'fa-solid fa-circle-exclamation' },
    { id: 'propriedade', label: '5. Propriedade Intelectual', icon: 'fa-solid fa-gavel' },
    { id: 'limitacao', label: '6. Limites de Responsabilidade', icon: 'fa-solid fa-shield-halved' },
    { id: 'alteracoes', label: '7. Modificações dos Termos', icon: 'fa-solid fa-pen-to-square' },
    { id: 'contato', label: '8. Contato e Legislação', icon: 'fa-solid fa-building-columns' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 120;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col selection:bg-primary-600 selection:text-white">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center cursor-pointer gap-3" onClick={() => navigate('/')}>
            <img src="/SMTT.png" alt="Logo SMTT" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="font-sora font-extrabold text-sm text-primary-900 leading-none">SMTT Propriá</h1>
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Governo Municipal</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-primary-650 flex items-center gap-2 transition-colors font-semibold bg-gray-100 hover:bg-gray-200/80 px-4 py-2 rounded-xl"
          >
            <i className="fa-solid fa-arrow-left text-xs"></i> Voltar ao Início
          </button>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 text-white py-14 px-6 border-b-[6px] border-secondary-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left">
          <span className="bg-secondary-500/20 text-secondary-500 font-sora font-bold text-xs uppercase px-3 py-1 rounded-full border border-secondary-500/30">Documento Legal</span>
          <h1 className="font-sora text-3xl md:text-4xl font-extrabold mt-3 tracking-tight">Termos de Uso</h1>
          <p className="text-slate-300 text-sm mt-2 font-medium">Última atualização: 21 de Julho de 2026</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-4 sticky top-28 bg-white rounded-2xl border border-gray-100 p-5 shadow-soft hidden lg:block">
            <h3 className="font-sora font-bold text-sm text-gray-450 uppercase tracking-wider mb-4 px-3">Tópicos do Documento</h3>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3.5 transition-all text-xs font-semibold ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-750 border-l-4 border-primary-600 shadow-sm translate-x-1'
                      : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <i className={`${section.icon} text-sm ${activeSection === section.id ? 'text-primary-600' : 'text-gray-400'}`}></i>
                  {section.label}
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-5 border-t border-gray-100 px-3">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Ao utilizar nossos serviços, você declara estar ciente e de acordo com todas as regras expressas neste termo.
              </p>
            </div>
          </aside>

          {/* Legal Text Panel */}
          <main className="lg:col-span-8 bg-white rounded-2xl border border-gray-150 p-6 md:p-10 shadow-soft leading-relaxed space-y-12">
            
            {/* Secção 1 */}
            <section id="introducao" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-handshake text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">1. Introdução e Aceitação</h2>
              </div>
              <p className="text-gray-650 text-sm">
                Seja bem-vindo ao portal de serviços da <strong>Superintendência Municipal de Transportes e Trânsito (SMTT) de Propriá/SE</strong>. Ao acessar, navegar ou utilizar as funcionalidades digitais disponibilizadas neste sítio eletrônico, você (doravante denominado "Usuário") concorda integralmente e de forma expressa em cumprir estes Termos de Uso e todas as leis e regulamentos vigentes.
              </p>
              <p className="text-gray-650 text-sm">
                Se você não concordar com qualquer termo estabelecido neste instrumento, recomendamos que não utilize os nossos canais de serviços digitais. A utilização contínua deste portal será considerada aceitação tácita de todas as diretrizes expressas e atualizadas.
              </p>
            </section>

            {/* Secção 2 */}
            <section id="servicos" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-laptop-code text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">2. Serviços Online</h2>
              </div>
              <p className="text-gray-650 text-sm">
                A SMTT de Propriá/SE disponibiliza um portal digital com finalidade de aproximar a gestão municipal e o cidadão, oferecendo facilidades como:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-650 text-sm">
                <li>Abertura e acompanhamento de recursos de multas de trânsito (Contestação de Multas);</li>
                <li>Consulta de situação de veículos cadastrados e licenciamento municipal aplicável;</li>
                <li>Solicitação de emissão de Alvarás e autorizações de tráfego especiais;</li>
                <li>Agendamento e solicitação de fechamento de vias para eventos coletivos ou obras públicas;</li>
                <li>Canal direto de Ouvidoria e "Fale Conosco" para solicitações, sugestões ou denúncias de trânsito.</li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl">
                <p className="text-yellow-850 text-xs font-semibold flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation"></i> Importante:
                </p>
                <p className="text-yellow-750 text-xs mt-1">
                  Alguns serviços podem requerer validação física de documentos originais adicionais na sede física da SMTT Propriá/SE.
                </p>
              </div>
            </section>

            {/* Secção 3 */}
            <section id="cadastro" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-user-lock text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">3. Cadastro e Segurança da Conta</h2>
              </div>
              <p className="text-gray-650 text-sm">
                Para ter acesso às funcionalidades exclusivas do Painel do Cidadão, o usuário deverá preencher um formulário eletrônico de cadastro, informando dados como CPF, Nome Completo, Telefone, E-mail e criar uma senha de segurança pessoal.
              </p>
              <p className="text-gray-650 text-sm">
                É responsabilidade exclusiva do usuário fornecer informações verídicas, exatas e devidamente atualizadas. O uso de dados de terceiros sem autorização constitui crime e implicará na imediata exclusão da conta e nas devidas sanções penais e administrativas previstas na legislação federal brasileira.
              </p>
              <p className="text-gray-650 text-sm">
                A senha de acesso criada pelo usuário é estritamente pessoal, intransferível e de sua exclusiva responsabilidade. Em caso de perda, roubo ou suspeita de uso indevido de sua conta, o usuário deve atualizar imediatamente seus dados ou contatar nossa central de suporte técnico.
              </p>
            </section>

            {/* Secção 4 */}
            <section id="responsabilidade" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-circle-exclamation text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">4. Responsabilidades do Usuário</h2>
              </div>
              <p className="text-gray-650 text-sm">
                Ao utilizar os serviços digitais da SMTT Propriá/SE, você compromete-se a:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-650 text-sm">
                <li>Não submeter informações falsas, difamatórias, caluniosas, preconceituosas ou que violem a moral e os bons costumes;</li>
                <li>Não utilizar o portal para enviar arquivos maliciosos, vírus, Cavalos de Troia ou qualquer outro programa que possa comprometer a integridade física ou operacional do servidor;</li>
                <li>Respeitar a propriedade intelectual das imagens, textos, marcas e códigos de desenvolvimento contidos no portal;</li>
                <li>Não realizar varreduras automatizadas de vulnerabilidade ou ataques cibernéticos do tipo Negação de Serviço (DoS/DDoS).</li>
              </ul>
            </section>

            {/* Secção 5 */}
            <section id="propriedade" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-gavel text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">5. Propriedade Intelectual</h2>
              </div>
              <p className="text-gray-650 text-sm">
                Todo o conteúdo deste portal, incluindo marcas, logotipos oficiais, designs visuais, códigos-fonte, estruturas de banco de dados, notícias e textos publicados, são de propriedade intelectual exclusiva da Superintendência Municipal de Transportes e Trânsito de Propriá ou de seus respectivos desenvolvedores.
              </p>
              <p className="text-gray-650 text-sm">
                É proibida a reprodução, cópia, alteração ou distribuição não autorizada de materiais proprietários sem a expressa e formal anuência da SMTT de Propriá/SE.
              </p>
            </section>

            {/* Secção 6 */}
            <section id="limitacao" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-shield-halved text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">6. Limitações de Responsabilidade</h2>
              </div>
              <p className="text-gray-650 text-sm">
                A SMTT Propriá trabalha continuamente para manter a segurança, precisão e estabilidade do portal de serviços digitais. No entanto, não nos responsabilizamos por:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-650 text-sm">
                <li>Instabilidades temporárias no servidor, falhas elétricas locais ou perda de conexão à internet por parte do provedor do usuário;</li>
                <li>Danos diretos ou indiretos causados por vírus ou spywares nos dispositivos do cidadão;</li>
                <li>Decisões tomadas a partir de informações inseridas incorretamente pelo próprio cidadão nos campos de formulários.</li>
              </ul>
            </section>

            {/* Secção 7 */}
            <section id="alteracoes" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-pen-to-square text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">7. Modificações dos Termos</h2>
              </div>
              <p className="text-gray-650 text-sm">
                A SMTT de Propriá/SE reserva-se o direito de, a qualquer momento e a seu exclusivo critério, alterar, atualizar ou revisar estes Termos de Uso para adequá-lo às novas legislações, jurisprudências ou aprimoramento operacional de suas ferramentas.
              </p>
              <p className="text-gray-650 text-sm">
                As modificações entrarão em vigor imediatamente após sua publicação oficial no site. Recomenda-se aos usuários que revisitem periodicamente esta seção para manter-se informados acerca de seus deveres e direitos.
              </p>
            </section>

            {/* Secção 8 */}
            <section id="contato" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-building-columns text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">8. Contato e Legislação Aplicável</h2>
              </div>
              <p className="text-gray-650 text-sm">
                Estes termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer conflitos, controvérsias ou dúvidas técnicas, fica eleito como competente o foro da Comarca de Propriá, Estado de Sergipe.
              </p>
              <p className="text-gray-650 text-sm">
                Havendo dúvidas em relação às disposições contidas nos Termos de Uso, entre em contato através de nossa Ouvidoria Geral ou envie uma mensagem diretamente pelo endereço eletrônico: <a href="mailto:smtt@propria.se.gov.br" className="text-primary-600 font-semibold hover:underline">smtt@propria.se.gov.br</a>.
              </p>
            </section>

          </main>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary-950 text-gray-400 py-10 border-t border-white/5 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 SMTT Propriá/SE. Todos os direitos reservados. Governo Municipal.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/privacidade')} className="hover:text-white transition-colors">Privacidade</button>
            <span>|</span>
            <button onClick={() => scrollToSection('introducao')} className="hover:text-white transition-colors">Voltar ao topo</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Termos;
