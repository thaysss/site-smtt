import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function SolicitacaoEvento() {
  const navigate = useNavigate();

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [localEvento, setLocalEvento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState(null);

  // Estados de controle
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [protocoloGerado, setProtocoloGerado] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setArquivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);

    if (!arquivo) {
      setErro('O formulário de requerimento assinado é obrigatório.');
      setEnviando(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('cpf_cnpj', cpfCnpj);
      formData.append('email', email);
      formData.append('telefone', telefone);
      formData.append('data_evento', dataEvento);
      formData.append('local_evento', localEvento);
      formData.append('descricao', descricao);
      formData.append('arquivo', arquivo);

      const response = await api.post('/public/solicitacao-evento', formData, {
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo-smtt.png" alt="Logo SMTT" className="h-14 w-auto object-contain" />
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

        {/* Left column: Instructions */}
        <div className="lg:w-5/12 space-y-6">
          <div className="bg-primary-900 text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
            {/* Background Pattern Deco */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-800 rounded-full translate-x-8 -translate-y-8 opacity-50"></div>

            <h2 className="text-2xl font-bold mb-4 relative z-10">Orientações para Solicitação de Evento</h2>
            <p className="text-primary-100 text-sm mb-6 leading-relaxed relative z-10">
              Para solicitar a interdição temporária de vias para a realização de eventos esportivos, culturais, religiosos ou de lazer em Propriá/SE, siga os passos abaixo:
            </p>

            <div className="space-y-6 relative z-10">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-secondary-500 text-primary-950 font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-sm">Baixe o Requerimento</h3>
                  <p className="text-xs text-primary-100 mt-1">Clique no link abaixo para fazer o download do modelo oficial de requerimento de eventos.</p>
                  <a
                    href="/modelo_requerimento_evento.pdf"
                    download
                    className="inline-flex items-center gap-2 mt-3 bg-white text-primary-950 font-bold text-xs px-4 py-2 rounded-lg hover:bg-secondary-500 hover:text-primary-950 transition-colors shadow"
                  >
                    <i className="fa-solid fa-file-pdf text-red-600"></i> Download Requerimento (PDF)
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-secondary-500 text-primary-950 font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-sm">Preencha e Assine</h3>
                  <p className="text-xs text-primary-100 mt-1">Preencha todos os campos do arquivo com caneta azul ou preta (ou assine digitalmente). Especifique as vias públicas que precisarão de bloqueio e desvios de trânsito.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-secondary-500 text-primary-950 font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-sm">Preencha o Formulário e Envie</h3>
                  <p className="text-xs text-primary-100 mt-1">Preencha os dados do responsável pelo evento ao lado, anexe o arquivo escaneado do requerimento assinado e clique em "Enviar Solicitação".</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-secondary-500 text-primary-950 font-bold flex items-center justify-center shrink-0">4</div>
                <div>
                  <h3 className="font-bold text-sm">Observações</h3>
                  <p className="text-xs text-primary-100 mt-1">1-	A apresentação do requerimento não garante que o evento será autorizado.<br />
                    2- Em decorrênica da análise do requerimento poderão ser solicitadas informações e/ou documentos complementares para viabilizar a autorização, bem como, reunião de alinhamento.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-primary-800 pt-6 mt-8">
              <h4 className="font-bold text-sm text-secondary-500 mb-2">Importante:</h4>
              <p className="text-xs text-primary-100 leading-relaxed">
                As solicitações devem ser enviadas com no mínimo <strong>5 dias úteis</strong> de antecedência da data prevista do evento para permitir o planejamento das equipes de fiscalização e pintura de trânsito.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Form / Success Card */}
        <div className="lg:w-7/12">
          {!protocoloGerado ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Formulário de Solicitação</h2>

              {erro && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 border border-red-200 flex items-start gap-3">
                  <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
                  <span>{erro}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nome Completo do Responsável *</label>
                    <input
                      type="text"
                      placeholder="Ex: João da Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">CPF ou CNPJ *</label>
                    <input
                      type="text"
                      placeholder="Apenas números"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
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
                      placeholder="Ex: contato@exemplo.com"
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
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Data do Evento *</label>
                    <input
                      type="text"
                      placeholder="Ex: 25/07/2026 - 18h às 22h"
                      value={dataEvento}
                      onChange={(e) => setDataEvento(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Vias a serem Interditadas / Local </label>
                    <input
                      type="text"
                      placeholder="Ex: Av. Beira Rio (entre ruas A e B)"
                      value={localEvento}
                      onChange={(e) => setLocalEvento(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"

                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Finalidade do Evento e Descrição Adicional</label>
                  <textarea
                    rows="3"
                    placeholder="Descreva brevemente o evento (Ex: Procissão religiosa, Caminhada esportiva, Show festivo...)"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all resize-none"
                  />
                </div>

                <div className="border border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 hover:bg-gray-100/50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="text-center">
                    <i className="fa-solid fa-cloud-arrow-up text-3xl text-gray-400 mb-2 block"></i>
                    <span className="block font-bold text-sm text-gray-700">Anexar Requerimento Assinado *</span>
                    <span className="block text-xs text-gray-400 mt-1">Arraste ou clique para selecionar o arquivo (Formatos PDF ou Imagem)</span>
                    {arquivo && (
                      <span className="inline-block mt-3 bg-primary-100 text-primary-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-primary-200">
                        <i className="fa-solid fa-file-check mr-1 text-green-600"></i> {arquivo.name}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-75 disabled:transform-none"
                >
                  {enviando ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Enviando Solicitação...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i> Enviar Solicitação
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
                <h2 className="text-2xl font-bold text-gray-900">Solicitação Enviada!</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Seu pedido de solicitação de evento foi recebido com sucesso pela SMTT de Propriá.
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
                Guarde este número de protocolo. Você poderá utilizá-lo na página de <strong>Consulta de Protocolo</strong> da SMTT para verificar a aprovação e o parecer técnico do pedido.
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setNome(''); setCpfCnpj(''); setEmail(''); setTelefone('');
                    setDataEvento(''); setLocalEvento(''); setDescricao('');
                    setArquivo(null); setProtocoloGerado('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-colors text-sm"
                >
                  Fazer Nova Solicitação
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

export default SolicitacaoEvento;
