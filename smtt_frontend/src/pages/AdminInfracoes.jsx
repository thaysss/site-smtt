// src/pages/AdminInfracoes.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, LogOut, FileEdit, LayoutDashboard, Car, AlertTriangle, ShieldAlert, CheckCircle, 
  CarFront, MapPin, Calendar, FileDigit, Clock, AlignLeft, AlertOctagon, Info
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

function AdminInfracoes() {
  const [placa, setPlaca] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [local, setLocal] = useState('');
  const [valor, setValor] = useState('0.00');
  
  const [codigoInfracao, setCodigoInfracao] = useState('');
  const [descricaoInfracao, setDescricaoInfracao] = useState('');
  const [gravidade, setGravidade] = useState('Média');
  const [pontos, setPontos] = useState('0');
  const [vencimentoDefesa, setVencimentoDefesa] = useState('');

  // Novos campos do veículo
  const [anoFabricacao, setAnoFabricacao] = useState('');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [cor, setCor] = useState('');

  // Novos campos de controle e medições
  const [agenteAparelho, setAgenteAparelho] = useState('');
  const [desdobramento, setDesdobramento] = useState('1');
  const [medicaoAferida, setMedicaoAferida] = useState('');
  const [medicaoConsiderada, setMedicaoConsiderada] = useState('');
  const [medicaoRegulamentada, setMedicaoRegulamentada] = useState('');
  const [codigoRenainf, setCodigoRenainf] = useState('');
  const [numeroNait, setNumeroNait] = useState('');
  const [numeroNip, setNumeroNip] = useState('');
  const [dataExpedicao, setDataExpedicao] = useState('');
  const [linhaDigitavel, setLinhaDigitavel] = useState('');
  const [nossoNumero, setNossoNumero] = useState('');
  const [dataVencimentoBoleto, setDataVencimentoBoleto] = useState('');

  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);
  
  const navigate = useNavigate();
  const adminNome = localStorage.getItem('adminNome');

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) navigate('/admin/login');
    else api.defaults.headers.Authorization = `Bearer ${adminToken}`;
  }, [navigate]);

  // Função para consultar dados da placa via backend (APIPlacas/Mock)
  const handleConsultarPlaca = async (placaAConsultar) => {
    const placaAlvo = (placaAConsultar || placa).trim().toUpperCase().replace('-', '');
    if (placaAlvo.length < 7) return;

    setBuscandoPlaca(true);
    setErro('');
    setMensagem('');

    try {
      const response = await api.get(`/admin/veiculos/consulta/${placaAlvo}`);
      const { marca_modelo, cor: corVeiculo, ano_fabricacao, renavam: renavamVeiculo } = response.data;

      if (marca_modelo) setMarcaModelo(marca_modelo);
      if (corVeiculo) setCor(corVeiculo);
      if (ano_fabricacao) setAnoFabricacao(ano_fabricacao.toString());
      if (renavamVeiculo && !nossoNumero) setNossoNumero(renavamVeiculo);

      setMensagem('Veículo localizado! Características preenchidas de forma automática.');
    } catch (err) {
      console.error("Erro ao consultar placa:", err);
      setErro('Veículo não localizado na base. Preencha as características manualmente.');
    } finally {
      setBuscandoPlaca(false);
    }
  };

  // Trata digitação da placa e autoprocura ao completar 7 caracteres
  const handlePlacaChange = (val) => {
    const upperVal = val.toUpperCase().replace(' ', '');
    setPlaca(upperVal);
    if (upperVal.replace('-', '').trim().length === 7) {
      handleConsultarPlaca(upperVal);
    }
  };

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
        data_vencimento_defesa: vencimentoDefesa,

        // Novos campos passados ao payload
        ano_fabricacao: anoFabricacao ? parseInt(anoFabricacao) : null,
        marca_modelo: marcaModelo,
        cor: cor,
        agente_aparelho: agenteAparelho,
        desdobramento: desdobramento,
        medicao_aferida: medicaoAferida,
        medicao_considerada: medicaoConsiderada,
        medicao_regulamentada: medicaoRegulamentada,
        codigo_renainf: codigoRenainf,
        numero_nait: numeroNait,
        numero_nip: numeroNip,
        data_expedicao: dataExpedicao || null,
        linha_digitavel: linhaDigitavel,
        nosso_numero: nossoNumero,
        data_vencimento_boleto: dataVencimentoBoleto || null
      });

      setMensagem(`Sucesso! Auto de Infração gerado: ${response.data.numero_ait}`);
      
      // Limpa os campos
      setPlaca(''); setDataHora(''); setLocal(''); setCodigoInfracao(''); 
      setDescricaoInfracao(''); setVencimentoDefesa('');
      setAnoFabricacao(''); setMarcaModelo(''); setCor('');
      setAgenteAparelho(''); setDesdobramento('1'); setMedicaoAferida('');
      setMedicaoConsiderada(''); setMedicaoRegulamentada(''); setCodigoRenainf('');
      setNumeroNait(''); setNumeroNip(''); setDataExpedicao('');
      setLinhaDigitavel(''); setNossoNumero(''); setDataVencimentoBoleto('');
      
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
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 selection:bg-primary-600 selection:text-white">
      
      {/* Sidebar */}
      <AdminSidebar activeItem="lancar-infracao" />

      {/* ÁREA PRINCIPAL DO FORMULÁRIO */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <header className="mb-10">
          <span className="text-primary-600 font-semibold text-xs font-bold tracking-wider uppercase bg-blue-100 px-3 py-1 rounded-full mb-3 inline-block">Operacional</span>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lançamento de AIT</h1>
          <p className="text-gray-500">Registre os Autos de Infração com todos os dados legais necessários para notificação.</p>
        </header>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 max-w-4xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-secondary-500"></div>

          {mensagem && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{mensagem}</div>}
          {erro && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-200 flex items-start gap-3 font-medium"><ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />{erro}</div>}

          <form onSubmit={handleRegistrarMulta} className="space-y-8">
            
            {/* SEÇÃO 1: VEÍCULO */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-primary-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Car className="text-primary-600 w-5 h-5" /> 1. Veículo e Local
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Placa *</label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <CarFront className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        maxLength="8" 
                        placeholder="Ex: QKV9D21"
                        value={placa} 
                        onChange={(e) => handlePlacaChange(e.target.value)} 
                        required 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none uppercase font-bold text-gray-800 transition-all" 
                      />
                    </div>
                    <button
                      type="button"
                      disabled={buscandoPlaca || placa.replace('-', '').trim().length < 7}
                      onClick={() => handleConsultarPlaca()}
                      className="px-5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {buscandoPlaca ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        'Consultar'
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Data e Hora *</label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium text-gray-700 transition-all" />
                  </div>
                </div>
              </div>

              {/* Características físicas adicionais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Marca / Modelo</label>
                  <input type="text" placeholder="Ex: RENAULT/OROCH 16" value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Cor do Veículo</label>
                  <input type="text" placeholder="Ex: Cinza" value={cor} onChange={(e) => setCor(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Ano de Fabricação</label>
                  <input type="number" placeholder="Ex: 2016" value={anoFabricacao} onChange={(e) => setAnoFabricacao(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Local do Cometimento *</label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" value={local} onChange={(e) => setLocal(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: DETALHES DA INFRAÇÃO (CTB) */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-primary-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <AlignLeft className="text-primary-600 w-5 h-5" /> 2. Enquadramento e Tipo (CTB)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Código (CTB) *</label>
                  <div className="relative">
                    <FileDigit className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Ex: 5541" value={codigoInfracao} onChange={(e) => setCodigoInfracao(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-gray-700 transition-all" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Descrição do Tipo de Infração *</label>
                  <input type="text" placeholder="Ex: Estacionar em desacordo com a regulamentação..." value={descricaoInfracao} onChange={(e) => setDescricaoInfracao(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Gravidade *</label>
                  <select value={gravidade} onChange={(e) => setGravidade(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all cursor-pointer">
                    <option value="Leve">Leve</option>
                    <option value="Média">Média</option>
                    <option value="Grave">Grave</option>
                    <option value="Gravíssima">Gravíssima</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Pontos *</label>
                  <input type="number" min="0" max="7" value={pontos} onChange={(e) => setPontos(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Valor Base (R$) *</label>
                  <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-red-600 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Vencimento Defesa *</label>
                  <input type="date" value={vencimentoDefesa} onChange={(e) => setVencimentoDefesa(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: MEDIÇÕES ADICIONAIS (OPCIONAL) */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-primary-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Clock className="text-primary-600 w-5 h-5" /> 3. Dados de Medição (Radar/Bafômetro - Opcional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Medição Aferida</label>
                  <input type="text" placeholder="Ex: 84 km/h" value={medicaoAferida} onChange={(e) => setMedicaoAferida(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Medição Considerada</label>
                  <input type="text" placeholder="Ex: 77 km/h" value={medicaoConsiderada} onChange={(e) => setMedicaoConsiderada(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Medição Regulamentada</label>
                  <input type="text" placeholder="Ex: 60 km/h" value={medicaoRegulamentada} onChange={(e) => setMedicaoRegulamentada(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: DADOS DE CONTROLE LEGAIS */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-primary-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Info className="text-primary-600 w-5 h-5" /> 4. Identificação Legal e Controle
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Código RENAINF</label>
                  <input type="text" placeholder="Ex: 11255979160" value={codigoRenainf} onChange={(e) => setCodigoRenainf(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Agente / Aparelho</label>
                  <input type="text" placeholder="Ex: 257" value={agenteAparelho} onChange={(e) => setAgenteAparelho(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Número NAIT</label>
                  <input type="text" placeholder="Ex: 7003209824" value={numeroNait} onChange={(e) => setNumeroNait(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Número NIP</label>
                  <input type="text" placeholder="Ex: 7003190223" value={numeroNip} onChange={(e) => setNumeroNip(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Desdobramento</label>
                  <input type="text" placeholder="Ex: 1" value={desdobramento} onChange={(e) => setDesdobramento(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Data de Expedição</label>
                  <input type="date" value={dataExpedicao} onChange={(e) => setDataExpedicao(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6">
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-secondary-500" /> Gravar Auto de Infração Oficial
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminInfracoes;