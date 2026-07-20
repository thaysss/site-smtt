// src/pages/AdminInfracoes.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Car, ShieldAlert, CheckCircle,
  CarFront, MapPin, Calendar, FileDigit, Clock, AlignLeft, AlertOctagon, Info, CreditCard,
  ChevronLeft, ChevronRight, Search, Sparkles, Printer, ClipboardCheck, ShieldCheck
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

const INFRACOES_COMUNS_CTB = [
  {
    codigo: '74550',
    descricao: 'Transitar em velocidade superior à máxima permitida em até 20%',
    amparo_legal: 'Art. 218, I',
    gravidade: 'Média',
    pontos: '4',
    valor: '130.16'
  },
  {
    codigo: '74630',
    descricao: 'Transitar em velocidade superior à máxima permitida em mais de 20% até 50%',
    amparo_legal: 'Art. 218, II',
    gravidade: 'Grave',
    pontos: '5',
    valor: '195.23'
  },
  {
    codigo: '74710',
    descricao: 'Transitar em velocidade superior à máxima permitida em mais de 50%',
    amparo_legal: 'Art. 218, III',
    gravidade: 'Gravíssima',
    pontos: '7',
    valor: '880.41'
  },
  {
    codigo: '5541',
    descricao: 'Estacionar em desacordo com a regulamentação especificada pela sinalização (Zona Azul)',
    amparo_legal: 'Art. 181, XVII',
    gravidade: 'Média',
    pontos: '4',
    valor: '130.16'
  },
  {
    codigo: '51851',
    descricao: 'Deixar o condutor de usar o cinto de segurança',
    amparo_legal: 'Art. 167',
    gravidade: 'Grave',
    pontos: '5',
    valor: '195.23'
  },
  {
    codigo: '51852',
    descricao: 'Deixar o passageiro de usar o cinto de segurança',
    amparo_legal: 'Art. 167',
    gravidade: 'Grave',
    pontos: '5',
    valor: '195.23'
  },
  {
    codigo: '60501',
    descricao: 'Avançar o sinal vermelho do semáforo',
    amparo_legal: 'Art. 208',
    gravidade: 'Gravíssima',
    pontos: '7',
    valor: '293.47'
  },
  {
    codigo: '60502',
    descricao: 'Avançar o sinal de parada obrigatória',
    amparo_legal: 'Art. 208',
    gravidade: 'Gravíssima',
    pontos: '7',
    valor: '293.47'
  },
  {
    codigo: '73662',
    descricao: 'Dirigir veículo segurando ou manuseando telefone celular',
    amparo_legal: 'Art. 252, PÚ',
    gravidade: 'Gravíssima',
    pontos: '7',
    valor: '293.47'
  },
  {
    codigo: '65992',
    descricao: 'Conduzir o veículo registrado que não esteja devidamente licenciado',
    amparo_legal: 'Art. 230, V',
    gravidade: 'Gravíssima',
    pontos: '7',
    valor: '293.47'
  },
  {
    codigo: '50100',
    descricao: 'Dirigir veículo sem possuir Carteira Nacional de Habilitação (CNH)',
    amparo_legal: 'Art. 162, I',
    gravidade: 'Gravíssima',
    pontos: '7',
    valor: '880.41'
  },
  {
    codigo: '51691',
    descricao: 'Dirigir sob a influência de álcool (Lei Seca)',
    amparo_legal: 'Art. 165',
    gravidade: 'Gravíssima',
    pontos: '7',
    valor: '2934.70'
  }
];

function AdminInfracoes() {
  const [step, setStep] = useState(1);

  const [placa, setPlaca] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [local, setLocal] = useState('');
  const [valor, setValor] = useState('0.00');

  const [codigoInfracao, setCodigoInfracao] = useState('');
  const [descricaoInfracao, setDescricaoInfracao] = useState('');
  const [amparoLegal, setAmparoLegal] = useState('Art. 181, XVII');
  const [gravidade, setGravidade] = useState('Média');
  const [pontos, setPontos] = useState('0');
  const [vencimentoDefesa, setVencimentoDefesa] = useState('');
  const [sugestoesCTB, setSugestoesCTB] = useState([]);

  // Novos campos do veículo
  const [anoFabricacao, setAnoFabricacao] = useState('');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [cor, setCor] = useState('');

  // Novos campos de controle e medições
  const [numeroAit, setNumeroAit] = useState('');
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
  const [faseAtual, setFaseAtual] = useState('Autuação');

  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);
  const [veiculoConsultado, setVeiculoConsultado] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) navigate('/admin/login');
    else api.defaults.headers.Authorization = `Bearer ${adminToken}`;
  }, [navigate]);

  // Função para lidar com alteração no código CTB e preenchimento automático
  const handleCodigoCTBChange = async (val) => {
    setCodigoInfracao(val);

    if (val.trim() === '') {
      setSugestoesCTB([]);
      return;
    }

    // Filtro local nas infrações comuns
    const filtradas = INFRACOES_COMUNS_CTB.filter(item =>
      item.codigo.includes(val) || item.descricao.toLowerCase().includes(val.toLowerCase())
    );
    setSugestoesCTB(filtradas);

    // Se bater exatamente com um código local, preenche
    const correspondenteLocal = INFRACOES_COMUNS_CTB.find(item => item.codigo === val.trim());
    if (correspondenteLocal) {
      setDescricaoInfracao(correspondenteLocal.descricao);
      setAmparoLegal(correspondenteLocal.amparo_legal || 'Art. 181, XVII');
      setGravidade(correspondenteLocal.gravidade);
      setPontos(correspondenteLocal.pontos);
      setValor(correspondenteLocal.valor);
      setSugestoesCTB([]);

      // Se tiver medição aferida, recalcula velocidade considerada
      if (isSpeedLimitInfraction(val.trim()) && medicaoAferida) {
        recalculateSpeed(val.trim(), medicaoAferida);
      }
      return;
    }

    // Se tiver 4 ou mais dígitos, busca também no banco de dados (tipos já usados)
    if (val.trim().length >= 4) {
      try {
        const res = await api.get(`/admin/tipos-infracao?codigo=${val.trim()}`);
        if (res.data) {
          setDescricaoInfracao(res.data.descricao);
          setAmparoLegal(res.data.amparo_legal || 'Art. 181, XVII');
          setGravidade(res.data.gravidade);
          setPontos(res.data.pontos.toString());
          setValor(res.data.valor_base.toFixed(2));
          setSugestoesCTB([]);

          if (isSpeedLimitInfraction(val.trim()) && medicaoAferida) {
            recalculateSpeed(val.trim(), medicaoAferida);
          }
        }
      } catch (err) {
        // Ignora se não localizado no banco
      }
    }
  };

  // Função para gerenciar alteração de data/hora e calcular datas futuras
  const handleDataHoraChange = (val) => {
    setDataHora(val);
    if (!val) return;

    const dataInfracao = new Date(val);
    if (isNaN(dataInfracao.getTime())) return;

    // Vencimento Defesa (+30 dias)
    const dataDefesa = new Date(dataInfracao);
    dataDefesa.setDate(dataDefesa.getDate() + 30);
    setVencimentoDefesa(dataDefesa.toISOString().split('T')[0]);

    // Vencimento Boleto (+45 dias)
    const dataBoleto = new Date(dataInfracao);
    dataBoleto.setDate(dataBoleto.getDate() + 45);
    setDataVencimentoBoleto(dataBoleto.toISOString().split('T')[0]);

    // Expedição (Hoje)
    const hoje = new Date();
    setDataExpedicao(hoje.toISOString().split('T')[0]);
  };

  // Função para consultar dados da placa via backend (APIPlacas/Mock)
  const handleConsultarPlaca = async (placaAConsultar) => {
    const placaAlvo = (placaAConsultar || placa).trim().toUpperCase().replace('-', '');
    if (placaAlvo.length < 7) return;

    setBuscandoPlaca(true);
    setErro('');
    setMensagem('');
    setVeiculoConsultado(null);

    try {
      const response = await api.get(`/admin/veiculos/consulta/${placaAlvo}`);
      const { marca_modelo, cor: corVeiculo, ano_fabricacao, renavam: renavamVeiculo } = response.data;

      if (marca_modelo) setMarcaModelo(marca_modelo);
      if (corVeiculo) setCor(corVeiculo);
      if (ano_fabricacao) setAnoFabricacao(ano_fabricacao.toString());
      if (renavamVeiculo && !nossoNumero) setNossoNumero(renavamVeiculo);

      setVeiculoConsultado({
        marca_modelo,
        cor: corVeiculo,
        ano_fabricacao,
        renavam: renavamVeiculo
      });

      setMensagem('Veículo localizado! Características preenchidas de forma automática.');
    } catch (err) {
      console.error("Erro ao consultar placa:", err);
      setErro('Veículo não localizado na base. Preencha as características manualmente.');
      setVeiculoConsultado({
        marca_modelo: '',
        cor: '',
        ano_fabricacao: '',
        renavam: '',
        isManual: true
      });
    } finally {
      setBuscandoPlaca(false);
    }
  };

  // Trata digitação da placa e aplica máscara
  const handlePlacaChange = (val) => {
    const formatted = formatPlaca(val);
    setPlaca(formatted);
    const cleanPlaca = formatted.replace('-', '').trim();
    if (cleanPlaca.length === 7) {
      handleConsultarPlaca(formatted);
    }
  };

  // Helper de máscara da placa
  const formatPlaca = (val) => {
    let cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length > 7) cleaned = cleaned.substring(0, 7);

    if (cleaned.length === 7) {
      const mercosulRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
      if (mercosulRegex.test(cleaned)) {
        return cleaned;
      }
      const tradicionalRegex = /^[A-Z]{3}[0-9]{4}$/;
      if (tradicionalRegex.test(cleaned)) {
        return cleaned.substring(0, 3) + '-' + cleaned.substring(3);
      }
    }

    if (cleaned.length > 3) {
      const letras = cleaned.substring(0, 3).replace(/[^A-Z]/g, '');
      const resto = cleaned.substring(3);

      if (/^[0-9]/.test(resto)) {
        if (resto.length >= 2 && /^[A-Z]/.test(resto[1])) {
          return letras + resto;
        }
        return letras + '-' + resto;
      }
    }
    return cleaned;
  };

  const isPlacaValida = (p) => {
    const clean = p.replace('-', '').trim().toUpperCase();
    if (clean.length !== 7) return false;
    const regexTradicional = /^[A-Z]{3}[0-9]{4}$/;
    const regexMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    return regexTradicional.test(clean) || regexMercosul.test(clean);
  };

  const isSpeedLimitInfraction = (code) => {
    return ['74550', '74630', '74710'].includes(code);
  };

  const handleMedicaoAferidaChange = (val) => {
    setMedicaoAferida(val);
    recalculateSpeed(codigoInfracao, val);
  };

  const recalculateSpeed = (codigo, aferidaVal) => {
    if (!aferidaVal || isNaN(aferidaVal)) {
      setMedicaoConsiderada('');
      return;
    }

    const aferida = parseFloat(aferidaVal);
    if (isSpeedLimitInfraction(codigo)) {
      let considerada = 0;
      if (aferida <= 100) {
        considerada = aferida - 7;
      } else {
        considerada = Math.round(aferida * 0.93);
      }
      setMedicaoConsiderada(Math.max(0, considerada).toString());
    }
  };

  const getExcessoSpeedInfo = () => {
    const reg = parseFloat(medicaoRegulamentada);
    const cons = parseFloat(medicaoConsiderada);
    if (!reg || !cons || cons <= reg) return null;

    const excesso = cons - reg;
    const pct = (excesso / reg) * 100;

    let enquadramentoSugerido = '';
    let codigoSugerido = '';
    if (pct <= 20) {
      enquadramentoSugerido = 'até 20% acima do limite (Infração Média)';
      codigoSugerido = '74550';
    } else if (pct <= 50) {
      enquadramentoSugerido = 'de 20% a 50% acima do limite (Infração Grave)';
      codigoSugerido = '74630';
    } else {
      enquadramentoSugerido = 'mais de 50% acima do limite (Infração Gravíssima)';
      codigoSugerido = '74710';
    }

    return {
      pct: pct.toFixed(1),
      enquadramentoSugerido,
      codigoSugerido,
      isDivergent: codigoInfracao !== codigoSugerido
    };
  };

  const getCorHex = (corName) => {
    const upper = corName.toUpperCase();
    if (upper.includes('BRANCA') || upper.includes('BRANCO')) return '#FFFFFF';
    if (upper.includes('PRETA') || upper.includes('PRETO')) return '#000000';
    if (upper.includes('PRATA')) return '#C0C0C0';
    if (upper.includes('CINZA')) return '#808080';
    if (upper.includes('VERMELHA') || upper.includes('VERMELHO')) return '#FF0000';
    if (upper.includes('AZUL')) return '#0000FF';
    if (upper.includes('VERDE')) return '#008000';
    if (upper.includes('AMARELA') || upper.includes('AMARELO')) return '#FFFF00';
    if (upper.includes('MARROM')) return '#8B4513';
    return '#CBD5E1';
  };

  const handleGerarDadosBoleto = () => {
    if (!placa) {
      setErro('Preencha a placa na primeira etapa antes de gerar dados de boleto.');
      return;
    }

    const nossoNum = nossoNumero || `84${Math.floor(10000000 + Math.random() * 90000000)}`;
    setNossoNumero(nossoNum);

    const valFormatado = parseFloat(valor || 0).toFixed(2).replace('.', '');
    const valPad = valFormatado.padStart(10, '0');
    const linhaFicticia = `34191.79${Math.floor(100 + Math.random() * 900)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} ${Math.floor(1 + Math.random() * 9)} ${valPad}`;

    setLinhaDigitavel(linhaFicticia);

    const dataBase = dataHora ? new Date(dataHora) : new Date();
    const vctBoleto = new Date(dataBase);
    vctBoleto.setDate(vctBoleto.getDate() + 45);
    setDataVencimentoBoleto(vctBoleto.toISOString().split('T')[0]);

    setMensagem('Dados de pagamento e boleto gerados com sucesso!');
  };

  const nextStep = () => {
    if (step === 1) {
      if (!placa) {
        setErro('A placa do veículo é obrigatória.');
        return;
      }
      if (!isPlacaValida(placa)) {
        setErro('Placa inválida. Insira no formato AAA-1234 ou AAA1D23.');
        return;
      }
      if (!dataHora) {
        setErro('A data e hora do cometimento são obrigatórias.');
        return;
      }
      if (!local) {
        setErro('O local do cometimento é obrigatório.');
        return;
      }
    } else if (step === 2) {
      if (!codigoInfracao) {
        setErro('O código da infração é obrigatório.');
        return;
      }
      if (!descricaoInfracao) {
        setErro('A descrição do enquadramento é obrigatória.');
        return;
      }
      if (!valor || parseFloat(valor) <= 0) {
        setErro('O valor da infração deve ser maior que zero.');
        return;
      }
      if (!vencimentoDefesa) {
        setErro('A data de vencimento da defesa prévia é obrigatória.');
        return;
      }
    } else if (step === 3) {
      if (isSpeedLimitInfraction(codigoInfracao)) {
        if (medicaoAferida && !medicaoRegulamentada) {
          setErro('Para infrações de velocidade, informe a velocidade regulamentada da via.');
          return;
        }
      }
    }

    setErro('');
    setMensagem('');
    setStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setErro('');
    setMensagem('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleRegistrarMulta = async (e) => {
    e.preventDefault();
    setMensagem(''); setErro('');

    try {
      const dataFormatada = dataHora.replace('T', ' ') + ':00';
      const response = await api.post('/admin/infracoes', {
        placa: placa.toUpperCase().replace('-', ''),
        data_hora_infracao: dataFormatada,
        local_cometimento: local,
        valor_final: parseFloat(valor),
        codigo_infracao: codigoInfracao,
        descricao_infracao: descricaoInfracao,
        amparo_legal: amparoLegal,
        gravidade: gravidade,
        pontos: parseInt(pontos),
        data_vencimento_defesa: vencimentoDefesa,

        // Novos campos passados ao payload
        numero_ait: numeroAit,
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
        data_vencimento_boleto: dataVencimentoBoleto || null,
        fase_atual: faseAtual
      });

      setMensagem(`Sucesso! Auto de Infração gerado: ${response.data.numero_ait}`);

      // Limpa os campos
      setPlaca(''); setDataHora(''); setLocal(''); setCodigoInfracao('');
      setDescricaoInfracao(''); setAmparoLegal('Art. 181, XVII'); setVencimentoDefesa('');
      setAnoFabricacao(''); setMarcaModelo(''); setCor('');
      setNumeroAit('');
      setAgenteAparelho(''); setDesdobramento('1'); setMedicaoAferida('');
      setMedicaoConsiderada(''); setMedicaoRegulamentada(''); setCodigoRenainf('');
      setNumeroNait(''); setNumeroNip(''); setDataExpedicao('');
      setLinhaDigitavel(''); setNossoNumero(''); setDataVencimentoBoleto('');
      setFaseAtual('Autuação');
      setVeiculoConsultado(null);
      setStep(1);

    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao registrar a infração. Verifique os dados inseridos.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 selection:bg-primary-600 selection:text-white">

      {/* Sidebar */}
      <AdminSidebar activeItem="lancar-infracao" />

      {/* ÁREA PRINCIPAL DO FORMULÁRIO */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <header className="mb-8">
          <span className="text-primary-600 font-semibold text-xs font-bold tracking-wider uppercase bg-blue-100 px-3 py-1 rounded-full mb-3 inline-block">Operacional</span>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lançamento de AIT</h1>
          <p className="text-gray-500 text-sm">Registre os Autos de Infração com todos os dados legais necessários para notificação.</p>
        </header>

        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8 max-w-4xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-secondary-500"></div>

          {mensagem && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-200 flex items-start gap-3 font-medium animate-fadeIn">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              {mensagem}
            </div>
          )}
          {erro && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-200 flex items-start gap-3 font-medium animate-fadeIn">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              {erro}
            </div>
          )}

          {/* Stepper progress bar */}
          <div className="mb-10">
            <div className="flex justify-between items-center max-w-xl mx-auto relative text-center">
              {/* Background Bar */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 transform -translate-y-1/2 -z-10 rounded-full"></div>
              {/* Active Progress Bar */}
              <div
                className="absolute top-1/2 left-0 h-1 bg-primary-600 transform -translate-y-1/2 -z-10 transition-all duration-300 rounded-full"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              ></div>

              {[
                { num: 1, label: "Veículo", icon: Car },
                { num: 2, label: "CTB", icon: FileDigit },
                { num: 3, label: "Medição", icon: Clock },
                { num: 4, label: "Controle", icon: Info },
                { num: 5, label: "Revisão", icon: ClipboardCheck }
              ].map((s) => {
                const IconComp = s.icon;
                const isCompleted = step > s.num;
                const isActive = step === s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (s.num < step) {
                          setStep(s.num);
                        }
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${isCompleted
                          ? 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700'
                          : isActive
                            ? 'bg-white border-primary-600 text-primary-600 font-bold scale-110 ring-4 ring-primary-100'
                            : 'bg-white border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      disabled={s.num > step}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5 text-secondary-500" /> : <IconComp className="w-5 h-5" />}
                    </button>
                    <span className={`text-[10px] font-bold tracking-wide mt-2 uppercase transition-all duration-200 ${isActive ? 'text-primary-600 font-extrabold' : isCompleted ? 'text-primary-800' : 'text-gray-400'
                      }`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleRegistrarMulta} className="space-y-6">

            {/* ETAPA 1: VEÍCULO E LOCAL */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary-950">1. Identificação do Veículo e Fato</h3>
                    <p className="text-xs text-gray-400">Insira a placa para buscar o veículo e os dados geográficos da ocorrência.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Placa do Veículo *</label>
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
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none uppercase font-bold text-gray-800 transition-all placeholder-gray-300 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={buscandoPlaca || placa.replace('-', '').trim().length < 7}
                        onClick={() => handleConsultarPlaca()}
                        className="px-5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 shrink-0 animate-fadeIn"
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
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Data e Hora do Cometimento *</label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="datetime-local"
                        value={dataHora}
                        onChange={(e) => handleDataHoraChange(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium text-gray-700 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Card do Veículo Consultado */}
                {veiculoConsultado && (
                  <div className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100 rounded-2xl p-5 mt-4 relative overflow-hidden animate-fadeIn shadow-sm">
                    <div className="absolute right-3 top-3 opacity-10">
                      <Car className="w-24 h-24 text-primary-900" />
                    </div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${veiculoConsultado.isManual ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {veiculoConsultado.isManual ? <Info className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-primary-950">
                          {veiculoConsultado.isManual ? 'Cadastro Manual do Veículo' : 'Veículo Localizado (Base SMTT/DETRAN)'}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Detalhamento do Registro</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Marca / Modelo</span>
                        <span className="text-xs font-bold text-primary-900">{marcaModelo || 'Não Informado'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Cor Oficial</span>
                        <span className="text-xs font-bold text-primary-900 flex items-center gap-1.5">
                          {cor && (
                            <span className="w-2.5 h-2.5 rounded-full border border-gray-300" style={{ backgroundColor: getCorHex(cor) }} />
                          )}
                          {cor || 'Não Informada'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Ano Fabricação</span>
                        <span className="text-xs font-bold text-primary-900">{anoFabricacao || 'Não Informado'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Nº Registro (Renavam)</span>
                        <span className="text-xs font-bold text-primary-900">{nossoNumero || 'Pendente'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos do veículo editáveis/manuais */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-150 space-y-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Características Físicas do Veículo</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Marca / Modelo</label>
                      <input
                        type="text"
                        placeholder="Ex: RENAULT/OROCH 16"
                        value={marcaModelo}
                        onChange={(e) => setMarcaModelo(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Cor do Veículo</label>
                      <input
                        type="text"
                        placeholder="Ex: Cinza"
                        value={cor}
                        onChange={(e) => setCor(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Ano de Fabricação</label>
                      <input
                        type="number"
                        placeholder="Ex: 2016"
                        value={anoFabricacao}
                        onChange={(e) => setAnoFabricacao(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Local do Cometimento (Endereço Completo) *</label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Ex: Av. Governador João Alves Filho, 120 - Propriá-SE"
                      value={local}
                      onChange={(e) => setLocal(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: ENQUADRAMENTO DA INFRAÇÃO */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600">
                    <FileDigit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary-950">2. Enquadramento e Tipo (Código CTB)</h3>
                    <p className="text-xs text-gray-400">Pesquise pelo código CTB ou digite palavras-chave da infração cometida.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                  <div className="col-span-1 relative">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Código da Infração *</label>
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Ex: 5541" 
                        value={codigoInfracao} 
                        onChange={(e) => handleCodigoCTBChange(e.target.value)} 
                        required 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-gray-700 transition-all text-sm" 
                      />
                      
                      {sugestoesCTB.length > 0 && (
                        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                          {sugestoesCTB.map((sug) => (
                            <button
                              key={sug.codigo}
                              type="button"
                              onClick={() => {
                                setCodigoInfracao(sug.codigo);
                                setDescricaoInfracao(sug.descricao);
                                setAmparoLegal(sug.amparo_legal || 'Art. 181, XVII');
                                setGravidade(sug.gravidade);
                                setPontos(sug.pontos);
                                setValor(sug.valor);
                                setSugestoesCTB([]);
                                if (isSpeedLimitInfraction(sug.codigo) && medicaoAferida) {
                                  recalculateSpeed(sug.codigo, medicaoAferida);
                                }
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-primary-50 flex items-start gap-3 transition-colors text-xs"
                            >
                              <FileDigit className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-bold text-sm text-primary-950">Código {sug.codigo}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    sug.gravidade === 'Leve' ? 'bg-green-100 text-green-700' :
                                    sug.gravidade === 'Média' ? 'bg-amber-100 text-amber-700' :
                                    sug.gravidade === 'Grave' ? 'bg-orange-100 text-orange-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {sug.gravidade}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{sug.descricao}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Amparo Legal (CTB) *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Art. 181, XVII" 
                      value={amparoLegal} 
                      onChange={(e) => setAmparoLegal(e.target.value)} 
                      required 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Descrição do Enquadramento *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Estacionar em desacordo com a regulamentação..." 
                      value={descricaoInfracao} 
                      onChange={(e) => setDescricaoInfracao(e.target.value)} 
                      required 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Gravidade *</label>
                    <select
                      value={gravidade}
                      onChange={(e) => setGravidade(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all cursor-pointer text-sm"
                    >
                      <option value="Leve">Leve</option>
                      <option value="Média">Média</option>
                      <option value="Grave">Grave</option>
                      <option value="Gravíssima">Gravíssima</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Pontos *</label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={pontos}
                      onChange={(e) => setPontos(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Valor Base (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-red-600 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Limite Defesa *</label>
                    <input
                      type="date"
                      value={vencimentoDefesa}
                      onChange={(e) => setVencimentoDefesa(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Fase Atual *</label>
                    <select
                      value={faseAtual}
                      onChange={(e) => setFaseAtual(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all cursor-pointer text-sm"
                    >
                      <option value="Autuação">Autuação</option>
                      <option value="Penalidade">Penalidade</option>
                      <option value="Recurso">Recurso</option>
                    </select>
                  </div>
                </div>

                {/* Resumo da Penalidade */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm mt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gravidade === 'Leve' ? 'bg-green-50 text-green-600' :
                        gravidade === 'Média' ? 'bg-amber-50 text-amber-600' :
                          gravidade === 'Grave' ? 'bg-orange-50 text-orange-600' :
                            'bg-red-50 text-red-600'
                      }`}>
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Enquadramento Penalidade</span>
                      <h4 className="font-bold text-sm text-gray-900">
                        Gravidade {gravidade} • {pontos} Pontos na CNH
                      </h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Valor Base da Multa</span>
                    <span className="text-lg font-bold text-red-600">
                      R$ {parseFloat(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: MEDIÇÕES DE TRÂNSITO */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary-950">3. Medições e Equipamentos (Radar/Bafômetro)</h3>
                    <p className="text-xs text-gray-400">Preencha dados aferidos por aparelhos. Margens do CONTRAN são estimadas automaticamente.</p>
                  </div>
                </div>

                {isSpeedLimitInfraction(codigoInfracao) && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 mt-2 mb-4 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                      <h4 className="font-bold text-sm text-amber-900">Calculadora de Velocidade (CONTRAN 798/20)</h4>
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Informe a velocidade registrada pelo radar (Aferida). O sistema calculará a velocidade considerada com o desconto regulamentar (7 km/h para até 100 km/h ou 7% acima disso).
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      {isSpeedLimitInfraction(codigoInfracao) ? 'Velocidade Aferida (km/h)' : 'Medição Aferida'}
                    </label>
                    <input
                      type="text"
                      placeholder={isSpeedLimitInfraction(codigoInfracao) ? 'Ex: 84' : 'Ex: 0.34 mg/L'}
                      value={medicaoAferida}
                      onChange={(e) => handleMedicaoAferidaChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      {isSpeedLimitInfraction(codigoInfracao) ? 'Velocidade Considerada (km/h)' : 'Medição Considerada'}
                    </label>
                    <input
                      type="text"
                      placeholder="Calculado automaticamente"
                      value={medicaoConsiderada}
                      onChange={(e) => setMedicaoConsiderada(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold text-primary-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      {isSpeedLimitInfraction(codigoInfracao) ? 'Limite da Via (km/h)' : 'Medição Regulamentada'}
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 60"
                      value={medicaoRegulamentada}
                      onChange={(e) => setMedicaoRegulamentada(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Banner de Validação Automática de Velocidade */}
                {isSpeedLimitInfraction(codigoInfracao) && medicaoConsiderada && medicaoRegulamentada && (
                  (() => {
                    const info = getExcessoSpeedInfo();
                    if (!info) return null;
                    return (
                      <div className={`p-4 rounded-xl text-sm border flex items-start gap-3 ${info.isDivergent ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                        <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-bold text-xs uppercase tracking-wider mb-1">Análise de Excesso de Velocidade</p>
                          <p className="text-xs leading-relaxed">
                            O veículo transitou a <strong>{medicaoConsiderada} km/h</strong> (considerada) em uma via regulamentada para <strong>{medicaoRegulamentada} km/h</strong>.
                            Isso representa um excesso de <strong>{info.pct}%</strong>, correspondente a: <strong>{info.enquadramentoSugerido}</strong>.
                          </p>
                          {info.isDivergent && (
                            <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 animate-fadeIn">
                              <span className="text-xs font-bold text-red-800">⚠️ Enquadramento selecionado divergente do calculado.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const matched = INFRACOES_COMUNS_CTB.find(item => item.codigo === info.codigoSugerido);
                                  if (matched) {
                                    setCodigoInfracao(matched.codigo);
                                    setDescricaoInfracao(matched.descricao);
                                    setGravidade(matched.gravidade);
                                    setPontos(matched.pontos);
                                    setValor(matched.valor);
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                              >
                                Ajustar para Código {info.codigoSugerido}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}

                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-150 space-y-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Identificação do Instrumento</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Código RENAINF</label>
                      <input
                        type="text"
                        placeholder="Ex: 11255979160"
                        value={codigoRenainf}
                        onChange={(e) => setCodigoRenainf(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Identificador do Agente / Aparelho</label>
                      <input
                        type="text"
                        placeholder="Ex: 257"
                        value={agenteAparelho}
                        onChange={(e) => setAgenteAparelho(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Desdobramento</label>
                      <input
                        type="text"
                        placeholder="Ex: 1"
                        value={desdobramento}
                        onChange={(e) => setDesdobramento(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 4: DADOS FISCAIS E PRAZOS */}
            {step === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary-950">4. Dados Fiscais, Prazos e Controle Legal</h3>
                    <p className="text-xs text-gray-400">Preencha datas de notificação, números de protocolo e dados do boleto bancário.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      Número do Auto (AIT)
                      <span className="group relative cursor-pointer text-gray-400 hover:text-gray-600">
                        <Info className="w-3.5 h-3.5" />
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block w-48 p-2 bg-gray-900 text-[10px] text-white rounded-lg shadow-md leading-relaxed z-30 font-normal text-center">
                          Deixe em branco para o sistema gerar automaticamente.
                        </span>
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="AIT (Autogerado se vazio)"
                      value={numeroAit}
                      onChange={(e) => setNumeroAit(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none uppercase font-bold text-gray-800 transition-all text-sm placeholder-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Número NAIT</label>
                    <input
                      type="text"
                      placeholder="Ex: 7003209824"
                      value={numeroNait}
                      onChange={(e) => setNumeroNait(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Número NIP</label>
                    <input
                      type="text"
                      placeholder="Ex: 7003190223"
                      value={numeroNip}
                      onChange={(e) => setNumeroNip(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Data de Expedição</label>
                    <input
                      type="date"
                      value={dataExpedicao}
                      onChange={(e) => setDataExpedicao(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Nosso Número (Boleto)</label>
                    <input
                      type="text"
                      placeholder="Identificador do Boleto"
                      value={nossoNumero}
                      onChange={(e) => setNossoNumero(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Vencimento do Boleto</label>
                    <input
                      type="date"
                      value={dataVencimentoBoleto}
                      onChange={(e) => setDataVencimentoBoleto(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Linha Digitável do Boleto</label>
                    <input
                      type="text"
                      placeholder="Ex: 34191.79001 01043.513184..."
                      value={linhaDigitavel}
                      onChange={(e) => setLinhaDigitavel(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Cartão de Ações do Financeiro */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Faturamento da Autuação</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Você pode gerar automaticamente a linha digitável do boleto bancário de pagamento com base no valor e data de vencimento.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGerarDadosBoleto}
                    className="w-full md:w-auto px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0 animate-fadeIn"
                  >
                    <Sparkles className="w-4 h-4 text-secondary-500" />
                    Gerar Dados de Pagamento
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 5: REVISÃO E CONFIRMAÇÃO (GUIA DE TICKET PREVIEW) */}
            {step === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary-950">5. Revisão da Notificação e Gravação</h3>
                    <p className="text-xs text-gray-400">Verifique os dados na guia oficial simulada do Auto de Infração antes de assinar digitalmente.</p>
                  </div>
                </div>

                {/* Notificação Visual Simulada */}
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden select-none">
                  {/* Watermark do Fundo */}
                  <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center pointer-events-none">
                    <Car className="w-96 h-96" />
                  </div>

                  {/* Cabeçalho do Órgão */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center shrink-0">
                        <img src="/SMTT.png" alt="Logo SMTT" className="w-10 h-10 object-contain" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900 uppercase">SMTT - MUN. DE PROPRIÁ - SE</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Autuação do Órgão Municipal de Trânsito</p>
                      </div>
                    </div>
                    <div className="text-left md:text-right bg-primary-50 border border-primary-100 px-4 py-2 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-primary-500 block">Número do Auto</span>
                      <span className="text-sm font-extrabold text-primary-950 font-mono">
                        {numeroAit || 'GRAVAÇÃO AUTOMÁTICA'}
                      </span>
                    </div>
                  </div>

                  {/* Grid de Informações Técnicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-gray-200">
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-blue-50 px-2 py-1 rounded inline-block">Ficha do Veículo</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Placa</span>
                          <span className="text-xs font-bold text-gray-800 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 inline-block">{placa}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Marca / Modelo</span>
                          <span className="text-xs font-bold text-gray-800">{marcaModelo || 'Não Informado'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Cor Oficial</span>
                          <span className="text-xs font-bold text-gray-800">{cor || 'Não Informada'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Ano de Fabricação</span>
                          <span className="text-xs font-bold text-gray-800">{anoFabricacao || 'Não Informado'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-blue-50 px-2 py-1 rounded inline-block">Detalhes Fiscais e Enquadramento</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Código CTB / Amparo</span>
                          <span className="text-xs font-bold text-gray-800 font-mono">{codigoInfracao} • {amparoLegal}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Gravidade</span>
                          <span className="text-xs font-bold text-gray-800">{gravidade}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Pontuação CNH</span>
                          <span className="text-xs font-bold text-gray-800">{pontos} Pontos</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Valor Estimado</span>
                          <span className="text-xs font-bold text-red-600">R$ {parseFloat(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Local e Medição */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-gray-200">
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-blue-50 px-2 py-1 rounded inline-block">Local e Data / Hora</h5>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Endereço da Ocorrência</span>
                        <p className="text-xs font-medium text-gray-800 leading-relaxed">{local}</p>
                      </div>
                      <div className="mt-2">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Data e Horário</span>
                        <span className="text-xs font-bold text-gray-800">
                          {dataHora ? new Date(dataHora).toLocaleString('pt-BR') : ''}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-blue-50 px-2 py-1 rounded inline-block">Dados de Medições</h5>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Regulamentada</span>
                          <span className="text-xs font-bold text-gray-800">{medicaoRegulamentada ? `${medicaoRegulamentada} km/h` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Aferida</span>
                          <span className="text-xs font-bold text-gray-800">{medicaoAferida ? `${medicaoAferida} km/h` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Considerada</span>
                          <span className="text-xs font-bold text-primary-800">{medicaoConsiderada ? `${medicaoConsiderada} km/h` : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Enquadramento Legal</span>
                        <span className="text-xs font-medium text-gray-700 block line-clamp-2" title={descricaoInfracao}>
                          {descricaoInfracao}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes de Prazos e Controle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-gray-200">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">Código RENAINF</span>
                      <span className="text-xs font-bold text-gray-800">{codigoRenainf || 'Não Vinculado'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">Vencimento da Defesa Prévia</span>
                      <span className="text-xs font-bold text-primary-700">{vencimentoDefesa ? new Date(vencimentoDefesa).toLocaleDateString('pt-BR') : 'Não Configurado'}</span>
                    </div>
                  </div>

                  {/* Código de barras simulado */}
                  <div className="flex flex-col items-center p-3 bg-gray-50 border border-gray-200 rounded-xl mt-6">
                    <span className="text-[10px] text-gray-400 font-bold mb-1">CÓDIGO DE BARRAS DE NOTIFICAÇÃO</span>
                    <div className="flex h-10 w-full max-w-xs items-end justify-center bg-white border border-gray-100 p-1">
                      {Array.from({ length: 48 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="bg-black h-full"
                          style={{ width: `${(idx % 3 === 0 ? 3 : idx % 2 === 0 ? 1 : 2)}px`, marginLeft: `${(idx % 4 === 0 ? 2 : 1)}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] font-mono mt-1 text-gray-500">{linhaDigitavel || 'AIT-AUTO-GERADO-PENDENTE-DE-GRAVACAO'}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 text-sm"
                  >
                    <AlertOctagon className="w-5 h-5 text-secondary-500" />
                    Gravar Auto de Infração Oficial
                  </button>
                </div>
              </div>
            )}

            {/* BOTÕES DE NAVEGAÇÃO DA ETAPA */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
              ) : (
                <div></div>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 ml-auto"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div></div>
              )}
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminInfracoes;