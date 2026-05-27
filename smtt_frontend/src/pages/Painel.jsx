// src/pages/Painel.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import html2pdf from 'html2pdf.js';
import { 
  Building2, LogOut, Car, AlertCircle, FileText, Download, 
  Upload, Plus, ShieldAlert, CheckCircle, FileDigit 
} from 'lucide-react';

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

  const navigate = useNavigate();
  const nomeUsuario = localStorage.getItem('nomeUsuario');

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
    setRecursoErro(''); setRecursoSucesso('');
    try {
      const response = await api.post(`/servicos/infracoes/${multaSelecionada.id}/recurso`, {
        justificativa: "Recurso anexado via formulário padrão."
      });
      setRecursoSucesso(`Sucesso! Seu protocolo é: ${response.data.protocolo}`);
      carregarDados();
    } catch (error) {
      setRecursoErro(error.response?.data?.erro || 'Erro ao abrir recurso.');
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
                      <div className="flex items-center gap-3">
                        <span className="bg-brand-dark text-accent-yellow font-bold text-xs px-2 py-1 rounded uppercase tracking-wider">{multa.placa_veiculo}</span>
                        <span className="text-sm font-bold text-gray-700">{multa.numero_ait}</span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${multa.fase_atual.includes('Análise') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {multa.fase_atual}
                      </span>
                    </div>
                    
                    {/* Corpo do Card da Multa */}
                    <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-800"><strong className="text-gray-500">Data:</strong> {multa.data_hora_infracao}</p>
                        <p className="text-sm text-gray-800"><strong className="text-gray-500">Local:</strong> {multa.local_cometimento}</p>
                        <p className="text-sm text-gray-800"><strong className="text-gray-500">Valor:</strong> <span className="font-bold text-red-600">R$ {multa.valor_final}</span></p>
                      </div>
                      
                      {/* Ações */}
                      <div className="w-full md:w-auto">
                        {!multa.fase_atual.includes('Análise') && !multa.fase_atual.includes('Cancelada') && (
                          <button 
                            onClick={() => { setMultaSelecionada(multa); setModalAberto(true); setRecursoSucesso(''); setRecursoErro(''); }}
                            className="w-full md:w-auto bg-accent-yellow hover:bg-accent-hover text-brand-dark font-sora font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> Recorrer (JARI)
                          </button>
                        )}

                        {multa.fase_atual.includes('Análise') && (
                          <button 
                            onClick={() => gerarPDF(multa)}
                            className="w-full md:w-auto bg-brand-blue hover:bg-blue-800 text-white font-sora font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Baixar PDF
                          </button>
                        )}
                      </div>
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
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
                  <p className="text-sm text-blue-800 font-medium mb-3">1º Passo: Baixe o requerimento padrão da JARI, imprima, preencha e assine.</p>
                  <a href="/requerimento_jari_padrao.pdf" download className="inline-flex items-center gap-2 bg-white text-brand-blue border border-brand-blue font-bold px-4 py-2 rounded-lg text-sm hover:bg-brand-blue hover:text-white transition-colors shadow-sm">
                    <Download className="w-4 h-4" /> Baixar Formulário
                  </a>
                </div>

                {/* Passo 2 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">2º Passo: Anexe o requerimento assinado</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 border border-gray-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Aceita arquivos em PDF, JPG ou PNG.</p>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setModalAberto(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 bg-brand-blue hover:bg-blue-800 text-white font-sora font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" /> Enviar Defesa
                  </button>
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