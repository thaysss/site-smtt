// src/pages/ConsultaProtocolo.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Building2, ArrowLeft, Search, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

function ConsultaProtocolo() {
  const [numeroProtocolo, setNumeroProtocolo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [buscando, setBuscando] = useState(false);
  const navigate = useNavigate();

  const handleConsultar = async (e) => {
    e.preventDefault();
    setErro(''); setResultado(null); setBuscando(true);
    try {
      const response = await api.get(`/public/protocolos/${numeroProtocolo}`);
      setResultado(response.data);
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao consultar sistema.');
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-body text-gray-800 flex flex-col selection:bg-brand-blue selection:text-white">
      
      {/* HEADER SIMPLIFICADO */}
      <header className="bg-brand-dark text-white py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <Building2 className="text-accent-yellow group-hover:scale-110 transition-transform" />
            <span className="font-sora font-bold text-lg tracking-tight">SMTT Digital</span>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-gray-300 hover:text-accent-yellow flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-soft border border-gray-100">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-sora font-bold text-gray-900 mb-2">Consulta de Processo JARI</h2>
            <p className="text-gray-500">Acompanhe o andamento do seu recurso de defesa de infração.</p>
          </div>
          
          <form onSubmit={handleConsultar} className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Nº do Protocolo (Ex: DEF12345)" value={numeroProtocolo} onChange={(e) => setNumeroProtocolo(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none uppercase font-bold text-lg transition-all" />
            </div>
            <button type="submit" disabled={buscando} className="bg-brand-blue hover:bg-blue-800 text-white font-sora font-bold px-8 py-4 rounded-xl shadow-md transition-colors sm:w-auto w-full disabled:opacity-70">
              {buscando ? 'Consultando...' : 'Consultar'}
            </button>
          </form>

          {erro && <div className="bg-red-50 text-red-600 px-4 py-4 rounded-xl text-center border border-red-100 font-medium">{erro}</div>}

          {/* RESULTADO DA BUSCA */}
          {resultado && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="font-sora font-bold text-brand-blue mb-6">Resultado Oficial</h3>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 text-sm font-bold uppercase">Protocolo Gerado</span>
                  <span className="font-sora font-bold text-lg text-gray-900">{resultado.numero_protocolo}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 text-sm font-bold uppercase">Data de Abertura</span>
                  <span className="font-sora font-bold text-gray-900">{resultado.data_abertura}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-center p-5 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-blue-800 text-sm font-bold uppercase mb-2 sm:mb-0">Situação JARI</span>
                  <div className="flex items-center gap-2">
                    {resultado.status_julgamento === 'Deferido' && <CheckCircle className="text-green-600" />}
                    {resultado.status_julgamento === 'Indeferido' && <XCircle className="text-red-600" />}
                    {resultado.status_julgamento === 'Em Análise' && <Clock className="text-yellow-600" />}
                    <span className={`font-sora font-bold text-xl ${resultado.status_julgamento === 'Deferido' ? 'text-green-600' : resultado.status_julgamento === 'Indeferido' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {resultado.status_julgamento}
                    </span>
                  </div>
                </div>

                {resultado.status_julgamento !== 'Em Análise' && (
                  <div className="p-6 bg-white rounded-xl border border-gray-200 mt-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue"></div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Parecer Oficial da Junta</span>
                    <p className="text-gray-700 leading-relaxed italic">"{resultado.parecer_jari}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ConsultaProtocolo;