import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import './Termos.css';

const sections = [
  ['sobre', 'Sobre estes termos'], ['servicos', 'Serviços disponíveis'],
  ['acesso', 'Cadastro e acesso'], ['responsabilidades', 'Responsabilidades do usuário'],
  ['conteudo', 'Conteúdo e propriedade intelectual'], ['disponibilidade', 'Disponibilidade do portal'],
  ['alteracoes', 'Alterações deste documento'], ['contato', 'Contato e legislação'],
];

function LegalSection({ number, id, title, children }) {
  return <section id={id}><p className="terms-section-number">{number}</p><h2>{title}</h2>{children}</section>;
}

function Termos() {
  const [activeSection, setActiveSection] = useState(sections[0][0]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { rootMargin: '-18% 0px -68% 0px' });
    sections.forEach(([id]) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const goToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="terms-page">
      <SiteHeader />
      <main>
        <header className="terms-heading"><div className="terms-container">
          <nav className="terms-breadcrumb" aria-label="Navegação estrutural"><Link to="/">Início</Link><span aria-hidden="true">›</span><span>Termos de Uso</span></nav>
          <p className="terms-kicker">Informação institucional</p><h1>Termos de Uso</h1>
          <p className="terms-summary">Este documento explica as condições para acessar e utilizar o portal e os serviços digitais da SMTT de Propriá.</p>
          <p className="terms-updated">Publicado em 21 de julho de 2026 <span aria-hidden="true">•</span> Última atualização em 21 de julho de 2026</p>
        </div></header>

        <div className="terms-container terms-layout">
          <aside className="terms-index" aria-label="Seções deste documento">
            <p className="terms-index-title">Nesta página</p>
            <nav>{sections.map(([id, label], index) => (
              <button key={id} type="button" onClick={() => goToSection(id)} className={activeSection === id ? 'is-active' : ''} aria-current={activeSection === id ? 'location' : undefined}>
                <span>{String(index + 1).padStart(2, '0')}</span>{label}
              </button>
            ))}</nav>
          </aside>

          <article className="terms-document">
            <div className="terms-notice"><strong>Em resumo</strong><p>Use o portal de forma responsável, informe dados corretos e mantenha sua senha protegida. Ao continuar a navegação, você declara que leu estas condições.</p></div>
            <LegalSection number="01" id="sobre" title="Sobre estes termos">
              <p>Estes Termos de Uso estabelecem as regras para utilização do portal de serviços da Superintendência Municipal de Transportes e Trânsito de Propriá (SMTT). Eles se aplicam à navegação, ao cadastro e ao uso das funcionalidades oferecidas neste endereço.</p>
              <p>Ao utilizar o portal, você declara ter lido e compreendido este documento. Caso não concorde com alguma condição, interrompa o uso do serviço e entre em contato com a SMTT para esclarecimentos.</p>
            </LegalSection>
            <LegalSection number="02" id="servicos" title="Serviços disponíveis">
              <p>O portal reúne informações e serviços digitais relacionados à mobilidade e ao trânsito municipal, entre eles:</p>
              <ul><li>defesa e acompanhamento de autuações de trânsito;</li><li>consulta de protocolos e informações de veículos;</li><li>solicitação de alvarás e autorizações;</li><li>pedidos relacionados a eventos e intervenções em vias;</li><li>canais de atendimento ao cidadão.</li></ul>
              <p>Dependendo do serviço, a SMTT poderá solicitar documentos complementares ou a apresentação dos originais para conferência presencial.</p>
            </LegalSection>
            <LegalSection number="03" id="acesso" title="Cadastro e acesso">
              <p>Algumas funcionalidades exigem cadastro. Nesse caso, o usuário deve fornecer informações verdadeiras, completas e atualizadas. Dados incorretos podem impedir a análise de uma solicitação ou o envio de comunicações sobre o atendimento.</p>
              <p>Login e senha são pessoais e não devem ser compartilhados. Se houver suspeita de acesso indevido, altere a senha e comunique a SMTT pelos canais indicados ao final deste documento.</p>
              <p>O tratamento de dados pessoais é detalhado na <Link to="/privacidade">Política de Privacidade</Link> do portal.</p>
            </LegalSection>
            <LegalSection number="04" id="responsabilidades" title="Responsabilidades do usuário">
              <p>Ao utilizar o portal, o usuário se compromete a:</p>
              <ul><li>informar somente dados que esteja autorizado a fornecer;</li><li>não enviar conteúdo ilegal, ofensivo, fraudulento ou que viole direitos de terceiros;</li><li>não tentar acessar áreas restritas, testar vulnerabilidades ou comprometer o serviço;</li><li>conferir os dados e documentos antes de concluir uma solicitação;</li><li>respeitar a legislação e as orientações apresentadas em cada serviço.</li></ul>
            </LegalSection>
            <LegalSection number="05" id="conteudo" title="Conteúdo e propriedade intelectual">
              <p>Textos, marcas, identidade visual, imagens, sistemas e demais conteúdos do portal são protegidos pela legislação aplicável. Conteúdos identificados como pertencentes a terceiros permanecem sujeitos aos direitos de seus respectivos titulares.</p>
              <p>Informações públicas podem ser consultadas e compartilhadas, desde que a fonte seja indicada e o conteúdo não seja alterado de forma que prejudique sua compreensão ou atribua à SMTT uma declaração que ela não tenha feito.</p>
            </LegalSection>
            <LegalSection number="06" id="disponibilidade" title="Disponibilidade do portal">
              <p>A SMTT adota medidas para manter o portal seguro e disponível. Ainda assim, o acesso poderá ser interrompido temporariamente por manutenção, atualização, falhas de conexão ou situações fora do controle da administração.</p>
              <p>Informações fornecidas pelo próprio usuário são de sua responsabilidade. Quando um prazo administrativo estiver em curso, não deixe o envio para o último momento e guarde o comprovante ou número de protocolo.</p>
            </LegalSection>
            <LegalSection number="07" id="alteracoes" title="Alterações deste documento">
              <p>Estes termos podem ser atualizados para refletir mudanças nos serviços, nos procedimentos da SMTT ou na legislação. A versão vigente será sempre a publicada nesta página, acompanhada da data de atualização.</p>
            </LegalSection>
            <LegalSection number="08" id="contato" title="Contato e legislação">
              <p>O uso deste portal observa a legislação brasileira, incluindo, quando aplicáveis, o Marco Civil da Internet (Lei nº 12.965/2014), a Lei de Defesa dos Usuários de Serviços Públicos (Lei nº 13.460/2017) e a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).</p>
              <p>Dúvidas sobre estes termos podem ser encaminhadas para <a href="mailto:smtt@propria.se.gov.br">smtt@propria.se.gov.br</a> ou pelo <Link to="/fale-conosco">Fale Conosco</Link>.</p>
            </LegalSection>
            <div className="terms-document-end"><p>Fim do documento</p><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Voltar ao início</button></div>
          </article>
        </div>
      </main>
      <footer className="terms-footer"><div className="terms-container"><p>© 2026 SMTT Propriá. Governo Municipal de Propriá.</p><div><Link to="/privacidade">Política de Privacidade</Link><Link to="/fale-conosco">Contato</Link></div></div></footer>
    </div>
  );
}

export default Termos;
