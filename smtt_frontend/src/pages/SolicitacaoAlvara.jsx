import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function SolicitacaoAlvara() {
  const navigate = useNavigate();

  // Estados do formulário
  const [tipoServico, setTipoServico] = useState('Renovação de Alvará');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [placaVeiculo, setPlacaVeiculo] = useState('');
  const [fatorRh, setFatorRh] = useState('');

  // Auxiliar/Defensor
  const [temAuxiliar, setTemAuxiliar] = useState(false);
  const [nomeAuxiliar, setNomeAuxiliar] = useState('');
  const [cpfAuxiliar, setCpfAuxiliar] = useState('');

  // Arquivos do Permissionário
  const [arquivos, setArquivos] = useState({
    requerimento: null,
    cnh: null,
    crlv: null,
    titulo_eleitoral: null,
    certidao_eleitoral: null,
    antecedentes_criminais: null,
    comprovante_endereco: null,
    certificado_curso: null,
    cadastro_cnis: null,
    regularidade_cnis: null,
    foto: null,
    fator_rh: null
  });

  // Arquivos do Auxiliar
  const [arquivosAuxiliar, setArquivosAuxiliar] = useState({
    cnh_auxiliar: null,
    crlv_auxiliar: null,
    titulo_eleitoral_auxiliar: null,
    certidao_eleitoral_auxiliar: null,
    antecedentes_criminais_auxiliar: null,
    comprovante_endereco_auxiliar: null,
    certificado_curso_auxiliar: null,
    cadastro_cnis_auxiliar: null,
    regularidade_cnis_auxiliar: null,
    foto_auxiliar: null,
    fator_rh_auxiliar: null
  });

  // Estados de controle
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [protocoloGerado, setProtocoloGerado] = useState('');

  // Documentos necessários por tipo de serviço
  const docsTitularNecessarios = tipoServico === 'Renovação de Alvará' 
    ? [
        { key: 'requerimento', label: 'Requerimento Preenchido e Assinado *' },
        { key: 'cnh', label: 'Cópia da CNH *' },
        { key: 'crlv', label: 'Cópia do CRLV *' },
        { key: 'certidao_eleitoral', label: 'Certidão Eleitoral *' },
        { key: 'antecedentes_criminais', label: 'Certidão Negativa Antecedentes Criminais *' },
        { key: 'comprovante_endereco', label: 'Comprovante de endereço atual (últimos 60 dias) *' },
        { key: 'certificado_curso', label: 'Certificado do curso *' },
        { key: 'regularidade_cnis', label: 'Declaração de regularidade CNIS *' },
        { key: 'foto', label: 'Foto 3/4 *' }
      ]
    : [
        { key: 'requerimento', label: 'Requerimento Preenchido e Assinado *' },
        { key: 'cnh', label: 'Cópia da CNH *' },
        { key: 'crlv', label: 'Cópia do CRLV *' },
        { key: 'titulo_eleitoral', label: 'Título Eleitoral *' },
        { key: 'certidao_eleitoral', label: 'Certidão Eleitoral *' },
        { key: 'antecedentes_criminais', label: 'Certidão Negativa Antecedentes Criminais *' },
        { key: 'comprovante_endereco', label: 'Comprovante de endereço atual (últimos 60 dias) *' },
        { key: 'certificado_curso', label: 'Certificado do curso *' },
        { key: 'cadastro_cnis', label: 'Cadastro CNIS *' },
        { key: 'regularidade_cnis', label: 'Declaração de regularidade CNIS *' },
        { key: 'foto', label: 'Foto 3/4 *' },
        { key: 'fator_rh', label: 'Comprovante Fator RH (Opcional)' }
      ];

  const docsAuxiliarNecessarios = tipoServico === 'Renovação de Alvará'
    ? [
        { key: 'cnh_auxiliar', label: 'Cópia da CNH do Auxiliar *' },
        { key: 'crlv_auxiliar', label: 'Cópia do CRLV do Auxiliar *' },
        { key: 'certidao_eleitoral_auxiliar', label: 'Certidão Eleitoral do Auxiliar *' },
        { key: 'antecedentes_criminais_auxiliar', label: 'Certidão Negativa Antecedentes Criminais do Auxiliar *' },
        { key: 'comprovante_endereco_auxiliar', label: 'Comprovante de endereço atual do Auxiliar *' },
        { key: 'certificado_curso_auxiliar', label: 'Certificado do curso do Auxiliar *' },
        { key: 'regularidade_cnis_auxiliar', label: 'Declaração de regularidade CNIS do Auxiliar *' },
        { key: 'foto_auxiliar', label: 'Foto 3/4 do Auxiliar *' }
      ]
    : [
        { key: 'cnh_auxiliar', label: 'Cópia da CNH do Auxiliar *' },
        { key: 'crlv_auxiliar', label: 'Cópia do CRLV do Auxiliar *' },
        { key: 'titulo_eleitoral_auxiliar', label: 'Título Eleitoral do Auxiliar *' },
        { key: 'certidao_eleitoral_auxiliar', label: 'Certidão Eleitoral do Auxiliar *' },
        { key: 'antecedentes_criminais_auxiliar', label: 'Certidão Negativa Antecedentes Criminais do Auxiliar *' },
        { key: 'comprovante_endereco_auxiliar', label: 'Comprovante de endereço atual do Auxiliar *' },
        { key: 'certificado_curso_auxiliar', label: 'Certificado do curso do Auxiliar *' },
        { key: 'cadastro_cnis_auxiliar', label: 'Cadastro CNIS do Auxiliar *' },
        { key: 'regularidade_cnis_auxiliar', label: 'Declaração de regularidade CNIS do Auxiliar *' },
        { key: 'foto_auxiliar', label: 'Foto 3/4 do Auxiliar *' },
        { key: 'fator_rh_auxiliar', label: 'Comprovante Fator RH do Auxiliar (Opcional)' }
      ];

  const handleFileChange = (key, file, isAux = false) => {
    if (isAux) {
      setArquivosAuxiliar(prev => ({ ...prev, [key]: file }));
    } else {
      setArquivos(prev => ({ ...prev, [key]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);

    // Validações de documentos obrigatórios do titular
    for (let doc of docsTitularNecessarios) {
      if (doc.label.includes('*') && !arquivos[doc.key]) {
        setErro(`O documento "${doc.label.replace(' *', '')}" é obrigatório.`);
        setEnviando(false);
        return;
      }
    }

    // Validações do auxiliar se ativo
    if (temAuxiliar) {
      if (!nomeAuxiliar || !cpfAuxiliar) {
        setErro('Por favor, informe o nome e CPF do condutor auxiliar.');
        setEnviando(false);
        return;
      }
      for (let doc of docsAuxiliarNecessarios) {
        if (doc.label.includes('*') && !arquivosAuxiliar[doc.key]) {
          setErro(`O documento "${doc.label.replace(' *', '')}" do auxiliar é obrigatório.`);
          setEnviando(false);
          return;
        }
      }
    }

    try {
      const formData = new FormData();
      formData.append('tipo_servico', tipoServico);
      formData.append('nome', nome);
      formData.append('cpf', cpf);
      formData.append('email', email);
      formData.append('telefone', telefone);
      formData.append('placa_veiculo', placaVeiculo);
      formData.append('fator_rh', fatorRh);
      
      formData.append('tem_auxiliar', temAuxiliar);
      formData.append('nome_auxiliar', nomeAuxiliar);
      formData.append('cpf_auxiliar', cpfAuxiliar);

      // Anexa arquivos do permissionário
      Object.keys(arquivos).forEach(key => {
        if (arquivos[key]) {
          formData.append(key, arquivos[key]);
        }
      });

      // Anexa arquivos do auxiliar se houver
      if (temAuxiliar) {
        Object.keys(arquivosAuxiliar).forEach(key => {
          if (arquivosAuxiliar[key]) {
            formData.append(key, arquivosAuxiliar[key]);
          }
        });
      }

      const response = await api.post('/public/solicitacao-alvara', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProtocoloGerado(response.data.protocolo);
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      setErro(error.response?.data?.erro || 'Ocorreu um erro ao enviar sua solicitação. Verifique se preencheu todos os dados corretamente.');
    } finally {
      setEnviando(false);
    }
  };

  const limparFormulario = () => {
    setNome('');
    setCpf('');
    setEmail('');
    setTelefone('');
    setPlacaVeiculo('');
    setFatorRh('');
    setTemAuxiliar(false);
    setNomeAuxiliar('');
    setCpfAuxiliar('');
    setProtocoloGerado('');
    setArquivos({
      requerimento: null, cnh: null, crlv: null, titulo_eleitoral: null, certidao_eleitoral: null,
      antecedentes_criminais: null, comprovante_endereco: null, certificado_curso: null,
      cadastro_cnis: null, regularidade_cnis: null, foto: null, fator_rh: null
    });
    setArquivosAuxiliar({
      cnh_auxiliar: null, crlv_auxiliar: null, titulo_eleitoral_auxiliar: null, certidao_eleitoral_auxiliar: null,
      antecedentes_criminais_auxiliar: null, comprovante_endereco_auxiliar: null, certificado_curso_auxiliar: null,
      cadastro_cnis_auxiliar: null, regularidade_cnis_auxiliar: null, foto_auxiliar: null, fator_rh_auxiliar: null
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Logo SMTT" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg text-gray-900 leading-tight">SMTT Propriá</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Transportes e Trânsito</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-primary-600 flex items-center gap-1 transition-colors font-semibold"
          >
            <i className="fa-solid fa-arrow-left"></i> Voltar ao Início
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Instructions */}
        <div className="lg:w-4/12 space-y-6">
          <div className="bg-primary-900 text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-800 rounded-full translate-x-8 -translate-y-8 opacity-50"></div>
            
            <h2 className="text-2xl font-bold mb-4 relative z-10">Alvará & Permissionários</h2>
            <p className="text-primary-100 text-sm mb-6 leading-relaxed relative z-10">
              Solicite online a Renovação de Alvará ou a Inclusão de novos Permissionários junto à SMTT Propriá/SE.
            </p>

            <div className="space-y-6 relative z-10">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-secondary-500 text-primary-950 font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-sm">Selecione o Serviço</h3>
                  <p className="text-xs text-primary-100 mt-1">Escolha entre Renovação de Alvará (Pessoa Física) ou Inclusão de Permissionário.</p>
                </div>
              </div>

               <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-secondary-500 text-primary-950 font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-sm">Preencha o Formulário</h3>
                  <p className="text-xs text-primary-100 mt-1">Preencha todos os campos solicitados no formulário de requisição e anexe junto aos documentos. (Clique no link abaixo para fazer o download do modelo  de requerimento.)</p>
                  
                  <a
                    href="/formulario-alvara.pdf"
                    download
                    className="inline-flex items-center gap-2 mt-3 bg-white text-primary-950 font-bold text-xs px-4 py-2 rounded-lg hover:bg-secondary-500 hover:text-primary-950 transition-colors shadow"
                  >
                    <i className="fa-solid fa-file-pdf text-red-600"></i> Download Requerimento (PDF)
                  </a>
                
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-secondary-500 text-primary-950 font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-sm">Organize a Documentação</h3>
                  <p className="text-xs text-primary-100 mt-1">Digitalize todos os documentos exigidos. Formatos aceitos: PDF ou Imagem.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-secondary-500 text-primary-950 font-bold flex items-center justify-center shrink-0">4</div>
                <div>
                  <h3 className="font-bold text-sm">Condutor Auxiliar (Defensor)</h3>
                  <p className="text-xs text-primary-100 mt-1">Se houver condutor auxiliar, marque a opção correspondente e anexe também todos os documentos do auxiliar.</p>
                </div>
              </div>

             
            </div>

            <div className="border-t border-primary-800 pt-6 mt-8 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-secondary-500 mb-1">Aviso Importante:</h4>
                <p className="text-xs text-primary-100 leading-relaxed">
                  Para condutores Auxiliares (Defensores), será exigido exatamente o mesmo checklist de documentação do permissionário titular.
                </p>
              </div>
            </div>
            <div className="border-t border-primary-800 pt-6 mt-8 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-secondary-500 mb-1">INSTRUÇÕES PARA ENVIO DE FOTO:</h4>
                <p className="text-xs text-primary-100 leading-relaxed">
                  Selecionar a opção "Foto 3/4" no formulário e anexe a imagem. A foto deve ser nítida, sem óculos escuros ou chapéus, para garantir a identificação correta.;<br /> 
                  Tire uma foto recente, de rosto inteiro, com fundo neutro e boa iluminação. 
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form / Success Card */}
        <div className="lg:w-8/12">
          {!protocoloGerado ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-5 mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Requerimento de Serviço</h2>
                  <p className="text-xs text-gray-500 mt-1">Preencha os dados e anexe as cópias digitais dos documentos.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => { setTipoServico('Renovação de Alvará'); setErro(''); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tipoServico === 'Renovação de Alvará' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Renovação de Alvará
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTipoServico('Inclusão de Permissionário'); setErro(''); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tipoServico === 'Inclusão de Permissionário' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Inclusão de Permissionário
                  </button>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 border border-red-200 flex items-start gap-3">
                  <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
                  <span>{erro}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Titular Data */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wider border-b border-gray-100 pb-1.5 flex items-center gap-2">
                    <i className="fa-solid fa-user text-secondary-500"></i> Dados do Permissionário / Titular
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nome Completo *</label>
                      <input
                        type="text"
                        placeholder="Ex: José dos Santos"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">CPF *</label>
                      <input
                        type="text"
                        placeholder="Apenas números"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">E-mail de Contato *</label>
                      <input
                        type="email"
                        placeholder="Ex: titular@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Placa do Veículo (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: ABC1D23"
                        value={placaVeiculo}
                        onChange={(e) => setPlacaVeiculo(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Fator RH / Grupo Sanguíneo</label>
                      <select
                        value={fatorRh}
                        onChange={(e) => setFatorRh(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                      >
                        <option value="">Não informado</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Documents Titular */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wider border-b border-gray-100 pb-1.5 flex items-center gap-2">
                    <i className="fa-solid fa-file-pdf text-secondary-500"></i> Documentos Obrigatórios do Permissionário
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docsTitularNecessarios.map((doc) => (
                      <div key={doc.key} className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-gray-100/50 transition-colors relative flex items-center justify-between min-h-[84px]">
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleFileChange(doc.key, e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex-1 pr-3">
                          <span className="block font-semibold text-xs text-gray-700 leading-tight">{doc.label}</span>
                          <span className="block text-[10px] text-gray-400 mt-1">PDF ou Imagem</span>
                        </div>
                        <div className="shrink-0">
                          {arquivos[doc.key] ? (
                            <span className="bg-green-100 text-green-800 border border-green-200 rounded-full w-8 h-8 flex items-center justify-center" title={arquivos[doc.key].name}>
                              <i className="fa-solid fa-check text-xs"></i>
                            </span>
                          ) : (
                            <span className="bg-gray-200/60 text-gray-400 rounded-full w-8 h-8 flex items-center justify-center">
                              <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Condutor Auxiliar Toggle */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">Condutor Auxiliar (Defensor)</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Deseja cadastrar e enviar a documentação de um condutor auxiliar?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={temAuxiliar}
                        onChange={(e) => setTemAuxiliar(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {temAuxiliar && (
                    <div className="mt-6 space-y-6 border-t border-gray-200 pt-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nome Completo do Auxiliar *</label>
                          <input
                            type="text"
                            placeholder="Ex: Maria dos Santos"
                            value={nomeAuxiliar}
                            onChange={(e) => setNomeAuxiliar(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">CPF do Auxiliar *</label>
                          <input
                            type="text"
                            placeholder="Apenas números"
                            value={cpfAuxiliar}
                            onChange={(e) => setCpfAuxiliar(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Documents Auxiliar */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <i className="fa-solid fa-file-shield text-secondary-500"></i> Documentos Obrigatórios do Auxiliar
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {docsAuxiliarNecessarios.map((doc) => (
                            <div key={doc.key} className="border border-dashed border-gray-300 rounded-xl p-4 bg-white hover:bg-gray-100/50 transition-colors relative flex items-center justify-between min-h-[84px]">
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleFileChange(doc.key, e.target.files[0], true);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="flex-1 pr-3">
                                <span className="block font-semibold text-xs text-gray-700 leading-tight">{doc.label}</span>
                                <span className="block text-[10px] text-gray-400 mt-1">PDF ou Imagem</span>
                              </div>
                              <div className="shrink-0">
                                {arquivosAuxiliar[doc.key] ? (
                                  <span className="bg-green-100 text-green-800 border border-green-200 rounded-full w-8 h-8 flex items-center justify-center" title={arquivosAuxiliar[doc.key].name}>
                                    <i className="fa-solid fa-check text-xs"></i>
                                  </span>
                                ) : (
                                  <span className="bg-gray-200/60 text-gray-400 rounded-full w-8 h-8 flex items-center justify-center">
                                    <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-75 disabled:transform-none"
                >
                  {enviando ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Enviando Requerimento...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i> Enviar Requerimento
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl text-center space-y-6 max-w-xl mx-auto">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border-2 border-green-200">
                <i className="fa-solid fa-check text-4xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Requerimento Enviado!</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Sua solicitação de <strong>{tipoServico}</strong> foi enviada com sucesso para a SMTT Propriá.
                </p>
              </div>

              <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100 text-center">
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider block mb-1">Número de Protocolo</span>
                <span className="font-mono text-3xl font-extrabold text-primary-950 tracking-wider block select-all">{protocoloGerado}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(protocoloGerado);
                    alert('Protocolo copiado para a área de transferência!');
                  }}
                  className="mt-3 text-xs text-primary-700 hover:text-primary-900 font-bold flex items-center gap-1.5 justify-center mx-auto"
                >
                  <i className="fa-solid fa-copy"></i> Copiar Código
                </button>
              </div>

              <div className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
                Guarde este número de protocolo. Você poderá utilizá-lo na página de <strong>Consulta de Protocolo</strong> da SMTT para acompanhar a análise de trânsito e o parecer técnico final.
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={limparFormulario}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-colors text-sm"
                >
                  Fazer Novo Requerimento
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow transition-colors text-sm"
                >
                  Voltar para a Home
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default SolicitacaoAlvara;
