// src/pages/Privacidade.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Privacidade() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('introducao');

  const sections = [
    { id: 'introducao', label: '1. Compromisso e LGPD', icon: 'fa-solid fa-user-shield' },
    { id: 'coleta', label: '2. Dados Coletados', icon: 'fa-solid fa-database' },
    { id: 'uso', label: '3. Finalidades do Uso', icon: 'fa-solid fa-chart-line' },
    { id: 'compartilhamento', label: '4. Compartilhamento', icon: 'fa-solid fa-share-nodes' },
    { id: 'seguranca', label: '5. Segurança da Informação', icon: 'fa-solid fa-key' },
    { id: 'direitos', label: '6. Seus Direitos (Titular)', icon: 'fa-solid fa-circle-check' },
    { id: 'cookies', label: '7. Política de Cookies', icon: 'fa-solid fa-cookie-bite' },
    { id: 'contato', label: '8. DPO e Ouvidoria', icon: 'fa-solid fa-envelope-open-text' },
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
          <span className="bg-secondary-500/20 text-secondary-500 font-sora font-bold text-xs uppercase px-3 py-1 rounded-full border border-secondary-500/30">Privacidade & Proteção</span>
          <h1 className="font-sora text-3xl md:text-4xl font-extrabold mt-3 tracking-tight">Política de Privacidade</h1>
          <p className="text-slate-300 text-sm mt-2 font-medium">Em conformidade com a LGPD • Última atualização: 21 de Julho de 2026</p>
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
                Esta política assegura transparência no tratamento de dados pessoais no âmbito da SMTT Propriá/SE.
              </p>
            </div>
          </aside>

          {/* Legal Text Panel */}
          <main className="lg:col-span-8 bg-white rounded-2xl border border-gray-150 p-6 md:p-10 shadow-soft leading-relaxed space-y-12">
            
            {/* Secção 1 */}
            <section id="introducao" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-user-shield text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">1. Compromisso com a Privacidade e LGPD</h2>
              </div>
              <p className="text-gray-650 text-sm">
                A <strong>Superintendência Municipal de Transportes e Trânsito (SMTT) de Propriá/SE</strong> valoriza a segurança, privacidade e confidencialidade dos dados pessoais de todos os cidadãos proprietários e usuários de nossos canais eletrônicos.
              </p>
              <p className="text-gray-650 text-sm">
                Esta Política de Privacidade descreve de forma clara e transparente como coletamos, armazenamos, processamos e protegemos suas informações de acordo com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei Federal nº 13.709/2018)</strong> e demais legislações brasileiras de direito digital.
              </p>
            </section>

            {/* Secção 2 */}
            <section id="coleta" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-database text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">2. Dados Pessoais Coletados</h2>
              </div>
              <p className="text-gray-650 text-sm">
                Para o cumprimento das atribuições legais de mobilidade urbana, segurança viária e prestação de serviços municipais, coletamos os seguintes tipos de dados pessoais:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-650 text-sm">
                <li><strong>Dados de Cadastro do Cidadão:</strong> Nome completo, número de CPF, endereço residencial ou comercial, número de telefone para contato e endereço de e-mail ativo.</li>
                <li><strong>Dados do Veículo e Infrações:</strong> Placa do veículo, número do chassi, Renavam, dados contidos na Carteira Nacional de Habilitação (CNH) e históricos de multas ou autuações registradas na base municipal.</li>
                <li><strong>Dados de Atendimento e Ouvidoria:</strong> Conteúdo das mensagens de solicitações, defesas de autuação anexadas pelo usuário, documentos comprobatórios e registros de reclamações.</li>
                <li><strong>Dados de Conexão:</strong> Endereço IP do dispositivo, tipo de navegador, sistema operacional e carimbos de data/hora (logs) das interações com o sistema.</li>
              </ul>
            </section>

            {/* Secção 3 */}
            <section id="uso" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-chart-line text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">3. Finalidades do Tratamento de Dados</h2>
              </div>
              <p className="text-gray-650 text-sm">
                O tratamento de dados pessoais pela SMTT Propriá/SE é fundamentado em bases legais adequadas, principalmente no <strong>exercício regular de direitos e deveres do poder público municipal</strong> (Artigo 7º, III, da LGPD). Os dados são coletados especificamente para:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-650 text-sm">
                <li>Identificar e autenticar formalmente o cidadão que acessa o Painel de Serviços;</li>
                <li>Processar defesas, contestações e recursos de multas de trânsito em âmbito administrativo;</li>
                <li>Analisar e conceder Alvarás especiais de tráfego, autorização de eventos e interdições de vias públicas;</li>
                <li>Responder a reclamações, elogios, dúvidas e denúncias protocoladas no canal de Ouvidoria ou Fale Conosco;</li>
                <li>Enviar avisos de segurança viária, alertas de tráfego crítico no município ou informativos oficiais relevantes.</li>
              </ul>
            </section>

            {/* Secção 4 */}
            <section id="compartilhamento" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-share-nodes text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">4. Compartilhamento de Dados com Terceiros</h2>
              </div>
              <p className="text-gray-650 text-sm">
                A SMTT Propriá/SE <strong>não vende, aluga ou cede dados pessoais</strong> coletados em seu portal digital. O compartilhamento de dados ocorre de forma restrita e somente nas seguintes situações:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-650 text-sm">
                <li>Com órgãos parceiros de fiscalização de trânsito em nível estadual e nacional (DETRAN/SE, PRF, SENATRAN), visando o processamento legal das infrações de trânsito;</li>
                <li>Com outras secretarias do Governo Municipal de Propriá/SE, no âmbito de análises integradas de alvarás urbanos;</li>
                <li>Para atendimento de decisões judiciais, auditorias dos órgãos de controle (como Tribunal de Contas do Estado) ou requisições formais do Ministério Público.</li>
              </ul>
            </section>

            {/* Secção 5 */}
            <section id="seguranca" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-key text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">5. Segurança e Proteção das Informações</h2>
              </div>
              <p className="text-gray-650 text-sm">
                Para garantir a integridade dos dados, adotamos medidas técnicas, administrativas e organizacionais rígidas de segurança da informação:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-650 text-sm">
                <li>Uso de criptografia para o tráfego de dados sensíveis na internet (protocolo de segurança HTTPS / SSL);</li>
                <li>Armazenamento de senhas de acesso de usuários em banco de dados usando algoritmos seguros (hash criptográfico);</li>
                <li>Controles de acesso rigorosos aos sistemas administrativos (somente servidores autorizados acessam os processos dos cidadãos);</li>
                <li>Auditoria periódica de logs de acesso para detecção precoce de atividades atípicas ou tentativas de invasão.</li>
              </ul>
            </section>

            {/* Secção 6 */}
            <section id="direitos" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-circle-check text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">6. Seus Direitos como Titular de Dados</h2>
              </div>
              <p className="text-gray-650 text-sm">
                Em conformidade com a LGPD (Artigo 18), o cidadão possui total controle sobre seus dados e pode requerer à SMTT Propriá/SE:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-650 text-sm">
                <li>Confirmação da existência de tratamento de seus dados pessoais;</li>
                <li>Acesso facilitado aos dados mantidos no sistema;</li>
                <li>Correção de dados pessoais incompletos, inexatos ou desatualizados;</li>
                <li>Informações detalhadas sobre entidades públicas ou privadas com as quais compartilhamos dados;</li>
                <li>Eliminação dos dados tratados com base exclusiva no consentimento do titular (quando aplicável e não conflitar com obrigações legais da administração pública).</li>
              </ul>
            </section>

            {/* Secção 7 */}
            <section id="cookies" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-cookie-bite text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">7. Política de Cookies</h2>
              </div>
              <p className="text-gray-650 text-sm">
                Utilizamos cookies de navegação apenas para garantir o funcionamento correto e seguro de nosso portal eletrônico (cookies necessários), tais como:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-650 text-sm">
                <li>Manter o usuário autenticado de forma segura no Painel do Cidadão durante sua sessão de uso;</li>
                <li>Lembrar escolhas de acessibilidade de tela feitas pelo cidadão (como contraste e ajuste de zoom visual).</li>
              </ul>
              <p className="text-gray-650 text-sm">
                O usuário pode configurar seu navegador de internet para desativar ou rejeitar cookies. Contudo, alertamos que isso poderá impedir o funcionamento adequado de ferramentas de login e processamento de solicitações no site.
              </p>
            </section>

            {/* Secção 8 */}
            <section id="contato" className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i className="fa-solid fa-envelope-open-text text-lg"></i>
                </div>
                <h2 className="font-sora text-xl font-bold text-primary-900">8. DPO e Ouvidoria SMTT</h2>
              </div>
              <p className="text-gray-650 text-sm">
                Para exercer seus direitos de privacidade, tirar dúvidas relacionadas ao tratamento de dados pessoais no portal ou relatar qualquer inconformidade legal, o cidadão pode acionar o nosso Encarregado de Proteção de Dados (DPO - Data Protection Officer).
              </p>
              <p className="text-gray-650 text-sm">
                Entre em contato através do e-mail da nossa Ouvidoria Geral: <a href="mailto:smtt@propria.se.gov.br" className="text-primary-600 font-semibold hover:underline">smtt@propria.se.gov.br</a> ou envie uma notificação física para a sede de atendimento localizada na Avenida João Barbosa Pôrto, 1829, Propriá/SE.
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
            <button onClick={() => navigate('/termos')} className="hover:text-white transition-colors">Termos de Uso</button>
            <span>|</span>
            <button onClick={() => scrollToSection('introducao')} className="hover:text-white transition-colors">Voltar ao topo</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Privacidade;
