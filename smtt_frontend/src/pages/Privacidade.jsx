// src/pages/Privacidade.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import './Termos.css';

function Privacidade() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('introducao');

  const sections = [
    { id: 'introducao', label: '1. Compromisso e LGPD' },
    { id: 'coleta', label: '2. Dados coletados' },
    { id: 'uso', label: '3. Finalidades do uso' },
    { id: 'compartilhamento', label: '4. Compartilhamento' },
    { id: 'seguranca', label: '5. Segurança da informação' },
    { id: 'direitos', label: '6. Direitos do titular' },
    { id: 'cookies', label: '7. Política de cookies' },
    { id: 'contato', label: '8. Contato e ouvidoria' },
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="terms-page flex flex-col">
      <SiteHeader />

      <header className="terms-heading">
        <div className="terms-container">
          <nav className="terms-breadcrumb" aria-label="Navegação estrutural">
            <Link to="/">Início</Link>
            <span aria-hidden="true">›</span>
            <span>Política de Privacidade</span>
          </nav>
          <p className="terms-kicker">Informação institucional</p>
          <h1>Política de Privacidade</h1>
          <p className="terms-summary">Este documento explica como a SMTT de Propriá coleta, utiliza, armazena e protege dados pessoais nos seus serviços digitais.</p>
          <p className="terms-updated">Publicado em 21 de julho de 2026 <span aria-hidden="true">•</span> Última atualização em 21 de julho de 2026</p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-3 sticky top-28 border-r border-slate-200 pr-6 hidden lg:block">
            <h3 className="font-sora font-semibold text-xs text-slate-500 uppercase tracking-wider mb-4">Tópicos do Documento</h3>
            <nav className="space-y-0.5">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left py-2.5 pl-3 pr-2 border-l-2 transition-colors text-sm ${
                    activeSection === section.id
                      ? 'border-primary-700 text-primary-800 font-semibold bg-slate-50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-xs text-slate-500 leading-relaxed">
                Esta política assegura transparência no tratamento de dados pessoais no âmbito da SMTT Propriá/SE.
              </p>
            </div>
          </aside>

          {/* Legal Text Panel */}
          <main className="lg:col-span-9 leading-relaxed space-y-12">
            
            {/* Secção 1 */}
            <section id="introducao" className="scroll-mt-32 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="font-sora text-xl font-semibold text-primary-950">1. Compromisso com a Privacidade e LGPD</h2>
              </div>
              <p className="text-slate-700 text-[15px]">
                A <strong>Superintendência Municipal de Transportes e Trânsito (SMTT) de Propriá/SE</strong> valoriza a segurança, privacidade e confidencialidade dos dados pessoais de todos os cidadãos proprietários e usuários de nossos canais eletrônicos.
              </p>
              <p className="text-slate-700 text-[15px]">
                Esta Política de Privacidade descreve de forma clara e transparente como coletamos, armazenamos, processamos e protegemos suas informações de acordo com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei Federal nº 13.709/2018)</strong> e demais legislações brasileiras de direito digital.
              </p>
            </section>

            {/* Secção 2 */}
            <section id="coleta" className="scroll-mt-32 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="font-sora text-xl font-semibold text-primary-950">2. Dados Pessoais Coletados</h2>
              </div>
              <p className="text-slate-700 text-[15px]">
                Para o cumprimento das atribuições legais de mobilidade urbana, segurança viária e prestação de serviços municipais, coletamos os seguintes tipos de dados pessoais:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-slate-700 text-[15px]">
                <li><strong>Dados de Cadastro do Cidadão:</strong> Nome completo, número de CPF, endereço residencial ou comercial, número de telefone para contato e endereço de e-mail ativo.</li>
                <li><strong>Dados do Veículo e Infrações:</strong> Placa do veículo, número do chassi, Renavam, dados contidos na Carteira Nacional de Habilitação (CNH) e históricos de multas ou autuações registradas na base municipal.</li>
                <li><strong>Dados de Atendimento e Ouvidoria:</strong> Conteúdo das mensagens de solicitações, defesas de autuação anexadas pelo usuário, documentos comprobatórios e registros de reclamações.</li>
                <li><strong>Dados de Conexão:</strong> Endereço IP do dispositivo, tipo de navegador, sistema operacional e carimbos de data/hora (logs) das interações com o sistema.</li>
              </ul>
            </section>

            {/* Secção 3 */}
            <section id="uso" className="scroll-mt-32 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="font-sora text-xl font-semibold text-primary-950">3. Finalidades do Tratamento de Dados</h2>
              </div>
              <p className="text-slate-700 text-[15px]">
                O tratamento de dados pessoais pela SMTT Propriá/SE é fundamentado em bases legais adequadas, principalmente no <strong>exercício regular de direitos e deveres do poder público municipal</strong> (Artigo 7º, III, da LGPD). Os dados são coletados especificamente para:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-slate-700 text-[15px]">
                <li>Identificar e autenticar formalmente o cidadão que acessa o Painel de Serviços;</li>
                <li>Processar defesas, contestações e recursos de multas de trânsito em âmbito administrativo;</li>
                <li>Analisar e conceder Alvarás especiais de tráfego, autorização de eventos e interdições de vias públicas;</li>
                <li>Responder a reclamações, elogios, dúvidas e denúncias protocoladas no canal de Ouvidoria ou Fale Conosco;</li>
                <li>Enviar avisos de segurança viária, alertas de tráfego crítico no município ou informativos oficiais relevantes.</li>
              </ul>
            </section>

            {/* Secção 4 */}
            <section id="compartilhamento" className="scroll-mt-32 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="font-sora text-xl font-semibold text-primary-950">4. Compartilhamento de Dados com Terceiros</h2>
              </div>
              <p className="text-slate-700 text-[15px]">
                A SMTT Propriá/SE <strong>não vende, aluga ou cede dados pessoais</strong> coletados em seu portal digital. O compartilhamento de dados ocorre de forma restrita e somente nas seguintes situações:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-slate-700 text-[15px]">
                <li>Com órgãos parceiros de fiscalização de trânsito em nível estadual e nacional (DETRAN/SE, PRF, SENATRAN), visando o processamento legal das infrações de trânsito;</li>
                <li>Com outras secretarias do Governo Municipal de Propriá/SE, no âmbito de análises integradas de alvarás urbanos;</li>
                <li>Para atendimento de decisões judiciais, auditorias dos órgãos de controle (como Tribunal de Contas do Estado) ou requisições formais do Ministério Público.</li>
              </ul>
            </section>

            {/* Secção 5 */}
            <section id="seguranca" className="scroll-mt-32 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="font-sora text-xl font-semibold text-primary-950">5. Segurança e Proteção das Informações</h2>
              </div>
              <p className="text-slate-700 text-[15px]">
                Para garantir a integridade dos dados, adotamos medidas técnicas, administrativas e organizacionais rígidas de segurança da informação:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-slate-700 text-[15px]">
                <li>Uso de criptografia para o tráfego de dados sensíveis na internet (protocolo de segurança HTTPS / SSL);</li>
                <li>Armazenamento de senhas de acesso de usuários em banco de dados usando algoritmos seguros (hash criptográfico);</li>
                <li>Controles de acesso rigorosos aos sistemas administrativos (somente servidores autorizados acessam os processos dos cidadãos);</li>
                <li>Auditoria periódica de logs de acesso para detecção precoce de atividades atípicas ou tentativas de invasão.</li>
              </ul>
            </section>

            {/* Secção 6 */}
            <section id="direitos" className="scroll-mt-32 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="font-sora text-xl font-semibold text-primary-950">6. Seus Direitos como Titular de Dados</h2>
              </div>
              <p className="text-slate-700 text-[15px]">
                Em conformidade com a LGPD (Artigo 18), o cidadão possui total controle sobre seus dados e pode requerer à SMTT Propriá/SE:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-slate-700 text-[15px]">
                <li>Confirmação da existência de tratamento de seus dados pessoais;</li>
                <li>Acesso facilitado aos dados mantidos no sistema;</li>
                <li>Correção de dados pessoais incompletos, inexatos ou desatualizados;</li>
                <li>Informações detalhadas sobre entidades públicas ou privadas com as quais compartilhamos dados;</li>
                <li>Eliminação dos dados tratados com base exclusiva no consentimento do titular (quando aplicável e não conflitar com obrigações legais da administração pública).</li>
              </ul>
            </section>

            {/* Secção 7 */}
            <section id="cookies" className="scroll-mt-32 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="font-sora text-xl font-semibold text-primary-950">7. Política de Cookies</h2>
              </div>
              <p className="text-slate-700 text-[15px]">
                Utilizamos cookies de navegação apenas para garantir o funcionamento correto e seguro de nosso portal eletrônico (cookies necessários), tais como:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-slate-700 text-[15px]">
                <li>Manter o usuário autenticado de forma segura no Painel do Cidadão durante sua sessão de uso;</li>
                <li>Lembrar escolhas de acessibilidade de tela feitas pelo cidadão (como contraste e ajuste de zoom visual).</li>
              </ul>
              <p className="text-slate-700 text-[15px]">
                O usuário pode configurar seu navegador de internet para desativar ou rejeitar cookies. Contudo, alertamos que isso poderá impedir o funcionamento adequado de ferramentas de login e processamento de solicitações no site.
              </p>
            </section>

            {/* Secção 8 */}
            <section id="contato" className="scroll-mt-32 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="font-sora text-xl font-semibold text-primary-950">8. DPO e Ouvidoria SMTT</h2>
              </div>
              <p className="text-slate-700 text-[15px]">
                Para exercer seus direitos de privacidade, tirar dúvidas relacionadas ao tratamento de dados pessoais no portal ou relatar qualquer inconformidade legal, o cidadão pode acionar o nosso Encarregado de Proteção de Dados (DPO - Data Protection Officer).
              </p>
              <p className="text-slate-700 text-[15px]">
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
