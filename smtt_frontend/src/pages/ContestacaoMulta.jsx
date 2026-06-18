import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  CheckCircle, 
  Download, 
  Upload, 
  FileText, 
  ShieldAlert, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import api from '../services/api';
import formularioPDF from '../assets/formulario_jari1.pdf';

function ContestacaoMulta() {
  const navigate = useNavigate();

  // Etapa ativa do formulário (1: Dados Gerais, 2: Uploads)
  const [etapa, setEtapa] = useState(1);

  // Estados do Formulário - Dados Gerais
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [placa, setPlaca] = useState('');
  const [numeroAit, setNumeroAit] = useState('');
  const [tipoRecurso, setTipoRecurso] = useState('Defesa Prévia');

  // Estados do Formulário - Arquivos
  const [requerimento, setRequerimento] = useState(null);
  const [documentoIdentificacao, setDocumentoIdentificacao] = useState(null);
  const [crlv, setCrlv] = useState(null);
  const [notificacao, setNotificacao] = useState(null);
  const [selfieDocumento, setSelfieDocumento] = useState(null);
  const [outrosAnexos, setOutrosAnexos] = useState([]);

  // Estados de Controle
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [protocoloGerado, setProtocoloGerado] = useState('');

  // Consentimento LGPD
  const [concordouLGPD, setConcordouLGPD] = useState(false);

  const handleOutrosAnexosChange = (e) => {
    if (e.target.files) {
      const novos = Array.from(e.target.files);
      setOutrosAnexos(prev => [...prev, ...novos]);
    }
  };

  const removerOutroAnexo = (idx) => {
    setOutrosAnexos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAvancarEtapa = (e) => {
    e.preventDefault();
    setErro('');

    if (!concordouLGPD) {
      setErro('Você precisa declarar concordância com o Termo de Consentimento para Tratamento de Dados Pessoais.');
      return;
    }

    const cleanedPlaca = placa.replace(/[-\s]/g, '').toUpperCase();

    if (!nome || !cpf || !email || !telefone || !cleanedPlaca || !numeroAit) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (cleanedPlaca.length !== 7) {
      setErro('A placa do veículo deve conter exatamente 7 caracteres.');
      return;
    }

    setPlaca(cleanedPlaca);
    setEtapa(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);

    const cleanedPlaca = placa.replace(/[-\s]/g, '').toUpperCase();
    if (cleanedPlaca.length !== 7) {
      setErro('A placa do veículo deve conter exatamente 7 caracteres.');
      setEnviando(false);
      return;
    }

    // Validação de arquivos obrigatórios
    if (!requerimento) {
      setErro('O envio do Formulário de Requerimento Único assinado é obrigatório.');
      setEnviando(false);
      return;
    }
    if (!documentoIdentificacao) {
      setErro('O envio da cópia do Documento de Identificação (CNH ou RG) é obrigatório.');
      setEnviando(false);
      return;
    }
    if (!crlv) {
      setErro('O envio da cópia do CRLV do veículo é obrigatório.');
      setEnviando(false);
      return;
    }
    if (!notificacao) {
      setErro('O envio da cópia da Notificação de Autuação é obrigatória.');
      setEnviando(false);
      return;
    }
    if (!selfieDocumento) {
      setErro('O envio da foto segurando o documento oficial ao lado do rosto (Selfie) é obrigatório.');
      setEnviando(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('placa', cleanedPlaca);
      formData.append('numero_ait', numeroAit);
      formData.append('tipo_recurso', tipoRecurso);
      formData.append('nome_solicitante', nome);
      formData.append('cpf_solicitante', cpf);
      formData.append('email_solicitante', email);
      formData.append('telefone_solicitante', telefone);

      // Arquivos principais
      formData.append('requerimento', requerimento);
      formData.append('documento_identificacao', documentoIdentificacao);
      formData.append('crlv', crlv);
      formData.append('notificacao', notificacao);
      formData.append('selfie_documento', selfieDocumento);

      // Outros arquivos opcionais
      outrosAnexos.forEach((file) => {
        formData.append('outros_anexos', file);
      });

      const response = await api.post('/public/recurso-multa', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProtocoloGerado(response.data.protocolo);
    } catch (error) {
      console.error('Erro ao enviar recurso:', error);
      setErro(error.response?.data?.erro || 'Ocorreu um erro ao enviar sua contestação. Verifique se preencheu todos os dados corretamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo-horizontal.png" alt="Logo SMTT" className="h-10 w-auto object-contain" />
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-primary-600 flex items-center gap-1 transition-colors font-semibold bg-transparent border-0 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left"></i> Voltar ao Início
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left column: Instructions and Info */}
        <div className="lg:w-5/12 space-y-6">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              Defesa de Autuação (Defesa Prévia) - SMTT
            </h2>

            {/* LGPD Consent (Red Text as in screenshot) */}
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-xs text-red-700 leading-relaxed mb-6 space-y-3 font-semibold">
              <h4 className="font-bold uppercase tracking-wider text-red-800">Termo de Consentimento para Tratamento de Dados Pessoais</h4>
              <p>
                Ao dar prosseguimento, <strong>CONCORDO</strong>, por meio deste e por minha livre manifestação de forma inequívoca com o tratamento de meus dados pessoais, inclusive fotografia, para finalidade específica dos procedimentos administrativos da SMTT Propriá, em conformidade com o artigo 11, inciso I da Lei nº 13.709/2018 - Lei Geral de Proteção de Dados Pessoais (LGPD).
              </p>
              <p>
                Ao dar prosseguimento, <strong>DECLARO</strong>, para os devidos fins e efeitos legais, serem pessoais e verdadeiras as informações inseridas no presente cadastro, sobre as quais assumo todas as responsabilidades, sob pena de incorrer nas sanções previstas nos artigos 299 e 307 do Código Penal Brasileiro.
              </p>
            </div>

            <div className="space-y-5 text-sm text-gray-700">
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">O que é?</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  É a apresentação da defesa de autuação de multa de trânsito emitida pela Superintendência Municipal de Transportes e Trânsito (SMTT).
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Qual o Prazo?</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  O <strong>prazo limite</strong> para apresentar a defesa de autuação consta na Notificação de Autuação enviada ao proprietário, e é o mesmo prazo para identificar o condutor infrator.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">Documentos necessários (PDF):</h3>
                <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                  <li>Cópia, <strong>legível</strong>, da notificação da autuação ou outro documento que identifique o auto de infração;</li>
                  <li>Cópia, <strong>legível</strong>, do Certificado de Registro e Licenciamento do Veículo (CRLV);</li>
                  <li>Cópia, <strong>legível</strong>, do documento de identificação do proprietário do veículo ou do condutor identificado (CNH ou RG);</li>
                  <li>Cópia, <strong>legível</strong>, de procuração, quando for o caso (cópia simples);</li>
                  <li>A defesa/recurso deverá ter somente <strong>um auto de infração como objeto</strong>;</li>
                  <li>Toda documentação enviada ao nosso portal devra ter resolução mínima de 300 "dpi" e <strong>digitalização colorida, obrigatoriamente na extensão ".pdf" ou ".jpg/.png"</strong>.</li>
                </ul>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Instruções de Uso</h4>
                
                <div className="flex gap-3 items-start text-xs">
                  <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <div>
                    <span className="font-bold block text-gray-800">Baixe o Requerimento Único</span>
                    <span className="text-gray-600 block mb-2">Acesse e preencha previamente para o cadastro de seu pedido.</span>
                    <a
                      href={formularioPDF}
                      download="Requerimento_JARI_SMTT.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-primary-700 font-bold hover:bg-blue-100 transition-colors shadow-sm text-[11px]"
                    >
                      <Download className="w-3.5 h-3.5" /> Requerimento Único (PDF)
                    </a>
                  </div>
                </div>

                <div className="flex gap-3 items-start text-xs">
                  <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div className="space-y-1">
                    <span className="font-bold block text-gray-800">Confirme sua Identidade (Selfie)</span>
                    <span className="text-gray-600 block">
                      Tire uma foto sua segurando o documento oficial com foto ao lado do seu rosto, conforme o modelo abaixo. A imagem deve ter resolução nítida e sem desfoque.
                    </span>
                    
                    {/* Silhouette Box representation */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center max-w-[200px] mx-auto mt-2">
                      <svg viewBox="0 0 100 100" className="w-20 h-20 text-gray-400 mx-auto" fill="currentColor">
                        {/* Body base */}
                        <path d="M50 50c-13.8 0-25 11.2-25 25v5h50v-5c0-13.8-11.2-25-25-25z" fill="#D1D5DB" />
                        {/* Head */}
                        <circle cx="50" cy="30" r="14" fill="#9CA3AF" />
                        {/* Document card next to face */}
                        <rect x="62" y="24" width="20" height="13" rx="1.5" fill="#3B82F6" transform="rotate(-6 72 30.5)" />
                        <rect x="64" y="26" width="6" height="5" fill="#FFFFFF" opacity="0.9" />
                        <rect x="72" y="26" width="7" height="1" fill="#FFFFFF" opacity="0.9" />
                        <rect x="72" y="29" width="7" height="1" fill="#FFFFFF" opacity="0.9" />
                        <rect x="72" y="32" width="7" height="1" fill="#FFFFFF" opacity="0.9" />
                        {/* Hand holding it */}
                        <circle cx="62" cy="33" r="3" fill="#E5E7EB" />
                      </svg>
                      <span className="text-[9px] font-bold text-gray-400 block mt-1 uppercase">Exemplo de Foto</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start text-xs">
                  <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    <span className="font-bold block text-gray-800">Envie Tudo Digitalizado</span>
                    <span className="text-gray-600 block">
                      Requerimento preenchido + Documentos originais obrigatórios escaneados em PDF ou fotos nítidas.
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 items-start text-xs">
                  <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
                  <div>
                    <span className="font-bold block text-gray-800">Aguarde o Julgamento</span>
                    <span className="text-gray-600 block">
                      Em um prazo de 2 a 7 dias úteis você será informado do seu protocolo para acompanhamento do pedido.
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-gray-500 italic pt-2 border-t border-gray-100">
                *** NOTA IMPORTANTE: O procedimento para pessoa jurídica deverá respeitar o exigido na Resolução nº 918/2022 do CONTRAN.
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form Wizard */}
        <div className="lg:w-7/12">
          {!protocoloGerado ? (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
              
              {/* Form Title & Step Indicators */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Formulário de Contestação</h2>
                <p className="text-xs text-gray-500">
                  Preencha os dados e anexe a documentação necessária para abrir o processo administrativo.
                </p>

                {/* Progress bar */}
                <div className="flex items-center gap-3 mt-6">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      etapa >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {etapa > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                    </span>
                    <span className={`text-xs font-bold ${etapa >= 1 ? 'text-primary-700' : 'text-gray-400'}`}>
                      Dados Gerais
                    </span>
                  </div>
                  <div className="flex-grow h-0.5 bg-gray-200 rounded">
                    <div className={`h-full bg-primary-600 rounded transition-all duration-300 ${
                      etapa > 1 ? 'w-full' : 'w-0'
                    }`}></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      etapa === 2 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      2
                    </span>
                    <span className={`text-xs font-bold ${etapa === 2 ? 'text-primary-700' : 'text-gray-400'}`}>
                      Envio de Arquivos
                    </span>
                  </div>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{erro}</span>
                </div>
              )}

              {/* STEP 1: General Info */}
              {etapa === 1 && (
                <form onSubmit={handleAvancarEtapa} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nome do Requerente *</label>
                      <input
                        type="text"
                        placeholder="Nome completo conforme RG/CNH"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">CPF do Requerente *</label>
                      <input
                        type="text"
                        placeholder="Apenas números (11 dígitos)"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">E-mail de Contato *</label>
                      <input
                        type="email"
                        placeholder="exemplo@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Telefone com WhatsApp *</label>
                      <input
                        type="tel"
                        placeholder="Ex: (79) 99999-9999"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Placa do Veículo *</label>
                      <input
                        type="text"
                        placeholder="Ex: QMA4A90 ou AAA1234"
                        value={placa}
                        onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nº do Auto de Infração (AIT) *</label>
                      <input
                        type="text"
                        placeholder="Ex: AM01234567"
                        value={numeroAit}
                        onChange={(e) => setNumeroAit(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tipo de Recurso *</label>
                      <select
                        value={tipoRecurso}
                        onChange={(e) => setTipoRecurso(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all text-sm cursor-pointer font-bold text-gray-700"
                        required
                      >
                        <option value="Defesa Prévia">Defesa Prévia</option>
                        <option value="Recurso JARI">Recurso JARI</option>
                        <option value="Indicação de Real Infrator">Indicação de Real Infrator</option>
                      </select>
                    </div>
                  </div>

                  {/* LGPD Checkbox consent check */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="lgpdConsent"
                      checked={concordouLGPD}
                      onChange={(e) => setConcordouLGPD(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="lgpdConsent" className="text-xs text-gray-600 cursor-pointer select-none leading-relaxed">
                      Declaro que <strong>CONCORDO</strong> com o tratamento de meus dados pessoais descritos no Termo de Consentimento ao lado, e <strong>DECLARO</strong> que as informações inseridas neste cadastro são verdadeiras, sob pena das sanções cabíveis.
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 transition-colors text-sm border-0 cursor-pointer"
                    >
                      Avançar para Documentos <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: File Uploads */}
              {etapa === 2 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-primary-950 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-primary-600" />
                    <p>
                      Todos os arquivos devem estar nítidos, coloridos, legíveis e preferencialmente no formato <strong>PDF</strong> ou imagens nos formatos <strong>JPG, JPEG ou PNG</strong>. Tamanho máximo recomendado de 5MB por arquivo.
                    </p>
                  </div>

                  {/* Upload 1: Requerimento */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      1. Requerimento Único Preenchido e Assinado *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setRequerimento(e.target.files[0])}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                      required
                    />
                    {requerimento && (
                      <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Arquivo anexado: {requerimento.name}
                      </p>
                    )}
                  </div>

                  {/* Upload 2: Documento Identificacao */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      2. Cópia do Documento de Identificação (CNH ou RG) *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDocumentoIdentificacao(e.target.files[0])}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                      required
                    />
                    {documentoIdentificacao && (
                      <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Arquivo anexado: {documentoIdentificacao.name}
                      </p>
                    )}
                  </div>

                  {/* Upload 3: CRLV */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      3. Cópia do CRLV do Veículo *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setCrlv(e.target.files[0])}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                      required
                    />
                    {crlv && (
                      <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Arquivo anexado: {crlv.name}
                      </p>
                    )}
                  </div>

                  {/* Upload 4: Notificação */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      4. Cópia da Notificação de Autuação / AIT *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setNotificacao(e.target.files[0])}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                      required
                    />
                    {notificacao && (
                      <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Arquivo anexado: {notificacao.name}
                      </p>
                    )}
                  </div>

                  {/* Upload 5: Selfie */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      5. Foto segurando o documento oficial ao lado do rosto (Selfie) *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelfieDocumento(e.target.files[0])}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                      required
                    />
                    {selfieDocumento && (
                      <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Arquivo anexado: {selfieDocumento.name}
                      </p>
                    )}
                  </div>

                  {/* Optional Outros Anexos */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5 text-gray-500" /> Outros Documentos e Provas (Opcional)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleOutrosAnexosChange}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                    />

                    {outrosAnexos.length > 0 && (
                      <div className="space-y-2 mt-3 max-h-32 overflow-y-auto pr-1">
                        {outrosAnexos.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-xs">
                            <span className="flex items-center gap-2 text-gray-700 truncate max-w-[280px]">
                              <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removerOutroAnexo(idx)}
                              className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setEtapa(1)}
                      className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-150 rounded-xl transition-colors border border-gray-200 bg-white cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 inline-block mr-1.5 align-text-bottom" /> Voltar
                    </button>
                    
                    <button
                      type="submit"
                      disabled={enviando}
                      className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 border-0 cursor-pointer"
                    >
                      {enviando ? 'Enviando...' : 'Enviar Contestação'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            
            /* Success Screen (Step 3) */
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center space-y-6">
              <div className="w-16 h-16 bg-green-150 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Contestação Enviada com Sucesso!</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  Sua defesa/recurso foi registrado em nosso sistema e encaminhado para análise da equipe administrativa da SMTT.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 max-w-sm mx-auto space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Número de Protocolo</span>
                <div className="text-2xl font-mono font-bold text-primary-600 select-all">
                  {protocoloGerado}
                </div>
                <p className="text-[10px] text-gray-400">
                  Guarde este número para consultar o andamento da sua contestação no portal.
                </p>
              </div>

              <div className="space-y-3 pt-4 max-w-xs mx-auto">
                <button
                  onClick={() => navigate('/consultar')}
                  className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 transition-colors border-0 cursor-pointer text-sm"
                >
                  Consultar Protocolo
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors border-0 cursor-pointer text-sm"
                >
                  Voltar para a Página Inicial
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ContestacaoMulta;
