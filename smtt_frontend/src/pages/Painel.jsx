// src/pages/Painel.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import html2pdf from 'html2pdf.js';
import { 
  Building2, LogOut, Car, AlertCircle, FileText, Download, 
  Upload, Plus, ShieldAlert, CheckCircle, FileDigit, X 
} from 'lucide-react';
import formularioPDF from '../assets/formulario_jari.pdf'; 


const apiBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
const montarUrlArquivo = (caminho) => {
  if (!caminho) return '';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${apiBaseUrl}${caminho}`;
};

function Painel() {
  const [veiculos, setVeiculos] = useState([]);
  const [multas, setMultas] = useState([]);
  
  // Estados para o formulário de novo veículo
  const [placa, setPlaca] = useState('');
  const [renavam, setRenavam] = useState('');
  
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  
  // Estados do Modal de Recurso
  const [modalAberto, setModalAberto] = useState(false);
  const [multaSelecionada, setMultaSelecionada] = useState(null);
  const [recursoSucesso, setRecursoSucesso] = useState('');
  const [recursoErro, setRecursoErro] = useState('');
  const [tipoRecurso, setTipoRecurso] = useState('Defesa Prévia');

  const navigate = useNavigate();
  const nomeUsuario = localStorage.getItem('nomeUsuario');
  const [arquivoCidadao, setArquivoCidadao] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    api.defaults.headers.Authorization = `Bearer ${token}`;
    carregarDados();
  }, [navigate]);

  const carregarDados = async () => {
    try {
      const respVeiculos = await api.get('/servicos/veiculos');
      setVeiculos(respVeiculos.data);

      const respMultas = await api.get('/servicos/infracoes');
      setMultas(respMultas.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleCadastrarVeiculo = async (e) => {
    e.preventDefault();
    setMensagem(''); setErro('');
    try {
      const response = await api.post('/servicos/veiculos', { placa, renavam });
      setMensagem(response.data.mensagem);
      setPlaca(''); setRenavam('');
      carregarDados();
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao cadastrar.');
    }
  };

  const handleEnviarRecurso = async (e) => {
    e.preventDefault();
    setRecursoErro(''); 
    setRecursoSucesso('');

    if (!arquivoCidadao) {
      setRecursoErro('Por favor, anexe o formulário preenchido.');
      return;
    }

    try {
      const tokenValido = localStorage.getItem('token');

      // Cria o pacote de envio com arquivo (FormData)
      const formData = new FormData();
      formData.append('arquivo_recurso', arquivoCidadao);
      formData.append('tipo_recurso', tipoRecurso);

      const response = await api.post(
        `/servicos/infracoes/${multaSelecionada.id}/recurso`,
        formData, // Envia o formData em vez de {}
        {
          headers: {
            Authorization: `Bearer ${tokenValido}`,
            'Content-Type': 'multipart/form-data' // Avisa que tem arquivo
          }
        }
      );

      setRecursoSucesso(`Sucesso! Seu protocolo é: ${response.data.protocolo}`);
      setArquivoCidadao(null); // Limpa o arquivo
      setTipoRecurso('Defesa Prévia');
      carregarDados(); 

    } catch (error) {
      console.error(error.response);
      setRecursoErro(error.response?.data?.erro || 'Erro ao enviar recurso.');
    }
  };

  const gerarPDF = (multa) => {
    const elemento = document.createElement('div');
    elemento.innerHTML = `
      <div style="padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
        <div style="border-bottom: 3px solid #003399; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1 style="color: #003399; margin: 0; font-size: 24px;">SMTT Digital</h1>
            <p style="margin: 5px 0 0 0; color: #555; font-size: 14px;">Secretaria Municipal de Trânsito e Transporte - Propriá/SE</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #888;">
            Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; border: 1px dashed #ccc; padding: 20px; text-align: center; margin-bottom: 30px; border-radius: 8px;">
          <h2 style="margin: 0; color: #003399; font-size: 18px; text-transform: uppercase;">Comprovante de Abertura de Recurso</h2>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Auto de Infração: <strong>${multa.numero_ait}</strong></p>
        </div>

        <h3 style="color: #003399; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 16px;">Detalhes do Processo</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; width: 30%; color: #666;"><strong>Requerente:</strong></td> <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #111;">${nomeUsuario}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Data da Infração:</strong></td> <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #111;">${multa.data_hora_infracao}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Local:</strong></td> <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #111;">${multa.local_cometimento}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Status Atual:</strong></td> <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #003399;"><b>${multa.fase_atual}</b></td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Efeito Suspensivo:</strong></td> <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #111;">Ativo (Cobrança suspensa)</td></tr>
        </table>

        <div style="margin-top: 40px; background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 6px; font-size: 12px; color: #856404;">
          <strong>Informação Importante:</strong> O andamento deste processo pode ser acompanhado consultando o número do protocolo na tela inicial do portal da SMTT Digital.
        </div>
      </div>
    `;

    const opcoes = {
      margin: 10,
      filename: `Comprovante_${multa.numero_ait}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opcoes).from(elemento).save();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nomeUsuario');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-body text-gray-800 selection:bg-brand-blue selection:text-white pb-20">
      
      {/* HEADER DO PAINEL */}
      <header className="bg-brand-dark text-white py-4 px-6 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="text-accent-yellow w-6 h-6" />
            <div>
              <h1 className="font-sora font-bold text-lg leading-none hidden sm:block">SMTT Digital</h1>
              <span className="text-xs text-gray-400">Área do Cidadão</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium hidden md:block">Olá, <strong className="text-accent-yellow">{nomeUsuario}</strong></span>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors font-bold bg-white/5 px-4 py-2 rounded-lg">
              Sair <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: GESTÃO DE VEÍCULOS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Adicionar Veículo */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Car className="text-brand-blue w-5 h-5" />
              <h2 className="font-sora font-bold text-lg text-gray-900">Vincular Veículo</h2>
            </div>
            
            {mensagem && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 border border-green-100 flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" />{mensagem}</div>}
            {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center gap-2"><ShieldAlert className="w-4 h-4 shrink-0" />{erro}</div>}

            <form onSubmit={handleCadastrarVeiculo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Placa</label>
                <input type="text" maxLength="7" placeholder="ABC1D23" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none uppercase font-bold text-gray-700 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Renavam</label>
                <div className="relative">
                  <FileDigit className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" maxLength="11" placeholder="Somente números" value={renavam} onChange={(e) => setRenavam(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none transition-all" required />
                </div>
              </div>
              <button type="submit" className="w-full bg-brand-blue hover:bg-blue-800 text-white font-sora font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar Veículo
              </button>
            </form>
          </div>

          {/* Lista de Veículos */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
            <h3 className="font-sora font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">Meus Veículos</h3>
            {veiculos.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum veículo vinculado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {veiculos.map(v => (
                  <div key={v.id} className="flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-brand-blue/30 transition-colors">
                    <div>
                      <span className="block font-sora font-bold text-lg text-brand-dark uppercase tracking-widest">{v.placa}</span>
                      <span className="text-xs text-gray-500">Renavam: {v.renavam}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-brand-blue flex items-center justify-center">
                      <Car className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: MULTAS E INFRAÇÕES */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-500 w-6 h-6" />
                <h2 className="font-sora font-bold text-xl text-gray-900">Minhas Infrações</h2>
              </div>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                {multas.length} registro(s)
              </span>
            </div>

            {multas.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p className="font-sora font-bold text-lg text-gray-600">Nada Consta</p>
                <p className="text-sm mt-1">Nenhuma infração registrada para os seus veículos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {multas.map(multa => (
                  <div key={multa.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    
                    {/* Cabeçalho do Card da Multa */}
                    <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-brand-dark text-accent-yellow font-bold text-xs px-2 py-1 rounded uppercase tracking-wider">{multa.placa_veiculo}</span>
                        <span className="text-sm font-bold text-gray-700">{multa.numero_ait}</span>
                        {multa.recurso?.protocolo && (
                          <span className="text-xs font-mono font-bold bg-blue-50 text-brand-blue border border-blue-200 px-2 py-0.5 rounded">
                            Protocolo: {multa.recurso.protocolo}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        multa.fase_atual.includes('Cancelada') || multa.fase_atual.includes('Deferida')
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : multa.fase_atual.includes('Análise') || multa.fase_atual.includes('Recurso')
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {multa.fase_atual}
                      </span>
                    </div>
                    
                    {/* Corpo do Card da Multa */}
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-800"><strong className="text-gray-500">Data:</strong> {multa.data_hora_infracao}</p>
                          <p className="text-sm text-gray-800"><strong className="text-gray-500">Local:</strong> {multa.local_cometimento}</p>
                          <p className="text-sm text-gray-800"><strong className="text-gray-500">Valor:</strong> <span className="font-bold text-red-600">R$ {multa.valor_final}</span></p>
                        </div>
                        
                        {/* Ações */}
                        <div className="w-full md:w-auto">
                          {!multa.recurso && !multa.fase_atual.includes('Cancelada') && !multa.fase_atual.includes('Deferida') && (
                            <button 
                              onClick={() => { setMultaSelecionada(multa); setModalAberto(true); setRecursoSucesso(''); setRecursoErro(''); setTipoRecurso('Defesa Prévia'); }}
                              className="w-full md:w-auto bg-accent-yellow hover:bg-accent-hover text-brand-dark font-sora font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <FileText className="w-4 h-4" /> Recorrer (JARI)
                            </button>
                          )}

                          {(multa.recurso || multa.fase_atual.includes('Análise') || multa.fase_atual.includes('Recurso')) && (
                            <button 
                              onClick={() => gerarPDF(multa)}
                              className="w-full md:w-auto bg-brand-blue hover:bg-blue-800 text-white font-sora font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Baixar PDF
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Caixa de detalhes do recurso aberto e resposta da JARI */}
                      {multa.recurso && (
                        <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 relative overflow-hidden text-left">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-blue"></div>
                          
                          <div className="flex flex-wrap justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">
                            <span>Protocolo: <span className="text-brand-blue font-mono font-bold">{multa.recurso.protocolo}</span></span>
                            <span>Tipo: <span className="text-gray-700">{multa.recurso.tipo_recurso}</span></span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm pl-2">
                            <span className="font-bold text-gray-600">Resultado:</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              multa.recurso.resultado_julgamento === 'Deferido' ? 'bg-green-50 text-green-700 border-green-200' :
                              multa.recurso.resultado_julgamento === 'Indeferido' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                              {multa.recurso.resultado_julgamento}
                            </span>
                          </div>

                          {multa.recurso.resultado_julgamento !== 'Em Análise' && multa.recurso.justificativa_julgamento && (
                            <div className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 mt-2 pl-4">
                              <strong className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Parecer Oficial da Junta (JARI):</strong>
                              <p className="italic leading-relaxed text-gray-800">"{multa.recurso.justificativa_julgamento}"</p>
                              
                              {multa.recurso.anexo_resposta_jari && (
                                <a 
                                  href={montarUrlArquivo(multa.recurso.anexo_resposta_jari)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-brand-blue font-bold rounded-lg hover:bg-blue-100 transition-colors text-xs mt-3 shadow-sm"
                                >
                                  <Download className="w-3.5 h-3.5" /> Baixar Resposta Oficial JARI
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* JANELA MODAL DE RECURSO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
            
            <button onClick={() => setModalAberto(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-sora font-bold text-2xl text-gray-900 mb-2">Abertura de Recurso</h3>
            <p className="text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
              Auto de Infração: <strong className="text-brand-blue">{multaSelecionada?.numero_ait}</strong>
            </p>

            {recursoErro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center gap-2"><ShieldAlert className="w-4 h-4 shrink-0" />{recursoErro}</div>}
            
            {recursoSucesso ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-sora font-bold text-lg text-gray-900 mb-2">Defesa Enviada!</h4>
                <p className="text-gray-600 text-sm mb-6">{recursoSucesso}</p>
                <button onClick={() => setModalAberto(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-xl transition-colors w-full">
                  Fechar Janela
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnviarRecurso} className="space-y-6">
                
                {/* Passo 1 */}
                <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-brand-dark mb-2 text-sm">Passo a Passo para o Recurso:</h4>
                  <ol className="text-sm text-gray-700 list-decimal ml-4 space-y-1 mb-4">
                    <li>Baixe o formulário oficial abaixo.</li>
                    <li>Preencha, assine e escaneie (ou tire uma foto nítida).</li>
                    <li>Anexe o documento preenchido e envie.</li>
                  </ol>
                  
                  {/* ESTE É O BOTÃO DE DOWNLOAD QUE PEGA O ARQUIVO DA PASTA PUBLIC */}
                  <a 
                    href={formularioPDF}
                    download="Requerimento_JARI_SMTT.pdf" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-brand-blue font-bold hover:bg-gray-50 transition-colors text-sm shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Baixar Formulário Padrão JARI
                  </a>
                </div>

                {/* Campo para escolher o tipo de recurso */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Tipo de Recurso *</label>
                  <select
                    value={tipoRecurso}
                    onChange={(e) => setTipoRecurso(e.target.value)}
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-brand-blue outline-none transition-all cursor-pointer"
                  >
                    <option value="Defesa Prévia">Defesa Prévia</option>
                    <option value="Recurso JARI">Recurso JARI</option>
                  </select>
                </div>

                {/* Campo para anexar o arquivo (Futuramente ligaremos isso ao Supabase Storage) */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Anexar Formulário Preenchido *</label>
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setArquivoCidadao(e.target.files[0])} // 👉 ADICIONE ISSO
                    required 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" 
                  />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-md hover:bg-blue-800 transition-colors">Enviar Recurso</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default Painel;