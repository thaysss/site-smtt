// src/pages/AdminInfracoes.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, LogOut, FileEdit, LayoutDashboard, Car, AlertTriangle, ShieldAlert, CheckCircle, 
  CarFront, MapPin, DollarSign, Calendar, FileDigit, Clock, AlignLeft, AlertOctagon 
} from 'lucide-react';

function AdminInfracoes() {
  const [placa, setPlaca] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [local, setLocal] = useState('');
  const [valor, setValor] = useState('130.16');
  
  const [codigoInfracao, setCodigoInfracao] = useState('');
  const [descricaoInfracao, setDescricaoInfracao] = useState('');
  const [gravidade, setGravidade] = useState('Média');
  const [pontos, setPontos] = useState('4');
  const [vencimentoDefesa, setVencimentoDefesa] = useState('');

  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  
  const navigate = useNavigate();
  const adminNome = localStorage.getItem('adminNome');

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) navigate('/admin/login');
    else api.defaults.headers.Authorization = `Bearer ${adminToken}`;
  }, [navigate]);

  const handleRegistrarMulta = async (e) => {
    e.preventDefault();
    setMensagem(''); setErro('');

    try {
      const dataFormatada = dataHora.replace('T', ' ') + ':00';
      const response = await api.post('/admin/infracoes', {
        placa: placa.toUpperCase(),
        data_hora_infracao: dataFormatada,
        local_cometimento: local,
        valor_final: parseFloat(valor),
        codigo_infracao: codigoInfracao,
        descricao_infracao: descricaoInfracao,
        gravidade: gravidade,
        pontos: parseInt(pontos),
        data_vencimento_defesa: vencimentoDefesa
      });

      setMensagem(`Sucesso! Auto de Infração gerado: ${response.data.numero_ait}`);
      setPlaca(''); setDataHora(''); setLocal(''); setCodigoInfracao(''); 
      setDescricaoInfracao(''); setVencimentoDefesa('');
    } catch (error) {
      setErro('Erro ao registrar a infração. Verifique os dados inseridos.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminNome');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-body text-gray-800 selection:bg-brand-blue selection:text-white">
      
      {/* SIDEBAR RESTAURADA AQUI */}
      <aside className="w-64 bg-brand-dark text-white flex flex-col shadow-2xl z-20 hidden md:flex">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Building2 className="text-accent-yellow w-8 h-8 shrink-0" />
          <div>
            <h2 className="font-sora font-bold text-lg leading-tight">SMTT Admin</h2>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Portal do Servidor</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          <button onClick={() => navigate('/admin/painel')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Recursos JARI
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold bg-brand-blue text-white rounded-xl shadow-md transition-colors border border-blue-600">
            <FileEdit className="w-5 h-5 text-accent-yellow" /> Lançar Infração
          </button>
          
          <button onClick={() => navigate('/admin/veiculos')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <Car className="w-5 h-5" /> Base de Veículos
          </button>
          
          <button onClick={() => navigate('/admin/alertas')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <AlertTriangle className="w-5 h-5" /> Avisos de Interdição
          </button>
        </nav>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="text-xs text-gray-400 mb-3">Agente Autuador:<br/><strong className="text-white text-sm">{adminNome}</strong></div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg transition-colors text-sm border border-red-500/20">
            Encerrar Sessão <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DO FORMULÁRIO */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <header className="mb-10">
          <span className="text-brand-blue font-sora text-xs font-bold tracking-wider uppercase bg-blue-100 px-3 py-1 rounded-full mb-3 inline-block">Operacional</span>
          <h1 className="text-3xl font-sora font-bold text-gray-900 mb-2">Lançamento de AIT</h1>
          <p className="text-gray-500">Registre os Autos de Infração com todos os dados legais necessários para notificação.</p>
        </header>

        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8 max-w-4xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue to-accent-yellow"></div>

          {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}
          {erro && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-200 flex items-start gap-3 font-medium"><ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />{erro}</div>}

          <form onSubmit={handleRegistrarMulta} className="space-y-6">
            
            {/* SEÇÃO 1: VEÍCULO */}
            <div>
              <h3 className="font-sora font-bold text-lg text-brand-dark mb-4 border-b border-gray-100 pb-2">1. Veículo e Local</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Placa *</label>
                  <div className="relative">
                    <CarFront className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" maxLength="7" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none uppercase font-bold text-gray-800 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Data e Hora *</label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-medium text-gray-700 transition-all" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Local do Cometimento *</label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" value={local} onChange={(e) => setLocal(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: DETALHES DA INFRAÇÃO (CTB) */}
            <div>
              <h3 className="font-sora font-bold text-lg text-brand-dark mb-4 border-b border-gray-100 pb-2">2. Enquadramento e Tipo (CTB)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Código (CTB) *</label>
                  <div className="relative">
                    <FileDigit className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Ex: 7455-0" value={codigoInfracao} onChange={(e) => setCodigoInfracao(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-bold text-gray-700 transition-all" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Descrição do Tipo de Infração *</label>
                  <div className="relative">
                    <AlignLeft className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Ex: Transitar em velocidade superior à máxima..." value={descricaoInfracao} onChange={(e) => setDescricaoInfracao(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Gravidade *</label>
                  <select value={gravidade} onChange={(e) => setGravidade(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none transition-all">
                    <option value="Leve">Leve</option>
                    <option value="Média">Média</option>
                    <option value="Grave">Grave</option>
                    <option value="Gravíssima">Gravíssima</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Pontos *</label>
                  <input type="number" min="0" max="7" value={pontos} onChange={(e) => setPontos(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Valor (R$) *</label>
                  <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-bold text-red-600 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Vencimento Defesa *</label>
                  <input type="date" value={vencimentoDefesa} onChange={(e) => setVencimentoDefesa(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6">
              <button type="submit" className="w-full bg-brand-blue hover:bg-blue-800 text-white font-sora font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2">
                <AlertOctagon className="w-5 h-5" /> Gravar Auto de Infração Oficial
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminInfracoes;