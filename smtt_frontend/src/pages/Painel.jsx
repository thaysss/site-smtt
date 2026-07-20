// src/pages/Painel.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import html2pdf from 'html2pdf.js';
import {
  Car, AlertCircle, FileText, Download,
  Upload, Plus, ShieldAlert, CheckCircle, FileDigit, X, Coins, ExternalLink, Compass,
  Info
} from 'lucide-react';
import formularioPDF from '../assets/requerimento.pdf';


const apiBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
const montarUrlArquivo = (caminho) => {
  if (!caminho) return '';
  if (caminho.startsWith('http://') || caminho.startsWith('https://')) return caminho;
  return `${apiBaseUrl}${caminho.startsWith('/') ? '' : '/'}${caminho}`;
};

const getInfracaoInfoByCodigo = (codigo) => {
  const cod = String(codigo || '').trim();
  switch (cod) {
    case '74550':
      return {
        amparo: 'Art. 218, I',
        descricao: 'TRANSITAR EM VELOCIDADE SUPERIOR À MÁXIMA PERMITIDA EM ATÉ 20%'
      };
    case '74630':
      return {
        amparo: 'Art. 218, II',
        descricao: 'TRANSITAR EM VELOCIDADE SUPERIOR À MÁXIMA PERMITIDA EM MAIS DE 20% ATÉ 50%'
      };
    case '74710':
      return {
        amparo: 'Art. 218, III',
        descricao: 'TRANSITAR EM VELOCIDADE SUPERIOR À MÁXIMA PERMITIDA EM MAIS DE 50%'
      };
    case '5541':
      return {
        amparo: 'Art. 181, XVII',
        descricao: 'ESTACIONAR EM DESACORDO COM A REGULAMENTAÇÃO ESPECIFICADA PELA SINALIZAÇÃO (ZONA AZUL)'
      };
    case '51851':
      return {
        amparo: 'Art. 167',
        descricao: 'DEIXAR O CONDUTOR DE USAR O CINTO DE SEGURANÇA'
      };
    case '51852':
      return {
        amparo: 'Art. 167',
        descricao: 'DEIXAR O PASSAGEIRO DE USAR O CINTO DE SEGURANÇA'
      };
    case '60501':
      return {
        amparo: 'Art. 208',
        descricao: 'AVANÇAR O SINAL VERMELHO DO SEMÁFORO'
      };
    case '60502':
      return {
        amparo: 'Art. 208',
        descricao: 'AVANÇAR O SINAL DE PARADA OBRIGATÓRIA'
      };
    case '73662':
      return {
        amparo: 'Art. 252, PARÁGRAFO ÚNICO',
        descricao: 'DIRIGIR VEÍCULO SEGURANDO OU MANUSEANDO TELEFONE CELULAR'
      };
    case '65992':
      return {
        amparo: 'Art. 230, V',
        descricao: 'CONDUZIR O VEÍCULO REGISTRADO QUE NÃO ESTEJA DEVIDAMENTE LICENCIADO'
      };
    case '50100':
      return {
        amparo: 'Art. 162, I',
        descricao: 'DIRIGIR VEÍCULO SEM POSSUIR CARTEIRA NACIONAL DE HABILITAÇÃO (CNH)'
      };
    case '51691':
      return {
        amparo: 'Art. 165',
        descricao: 'DIRIGIR SOB A INFLUÊNCIA DE ÁLCOOL (LEI SECA)'
      };
    default:
      return null;
  }
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
  const [abaAtiva, setAbaAtiva] = useState('formulario'); // 'formulario' ou 'anexos'
  const [arquivosAdicionais, setArquivosAdicionais] = useState([]);
  const [buscaInfracao, setBuscaInfracao] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  const navigate = useNavigate();
  const nomeUsuario = localStorage.getItem('nomeUsuario');
  const [arquivoCidadao, setArquivoCidadao] = useState(null);

  async function carregarDados() {
    try {
      const respVeiculos = await api.get('/servicos/veiculos');
      setVeiculos(respVeiculos.data);

      const respMultas = await api.get('/servicos/infracoes');
      setMultas(respMultas.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      if (error.response?.status === 401) {
        handleLogout('Sua sessão expirou. Por favor, faça login novamente.');
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    api.defaults.headers.Authorization = `Bearer ${token}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

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

      // Anexar múltiplos arquivos adicionais
      arquivosAdicionais.forEach(file => {
        formData.append('arquivos', file);
      });

      const response = await api.post(
        `/servicos/infracoes/${multaSelecionada.id}/recurso`,
        formData, // Envia o formData
        {
          headers: {
            Authorization: `Bearer ${tokenValido}`
          }
        }
      );

      setRecursoSucesso(`Sucesso! Seu protocolo é: ${response.data.protocolo}`);
      setArquivoCidadao(null); // Limpa o arquivo principal
      setArquivosAdicionais([]); // Limpa arquivos adicionais
      setTipoRecurso('Defesa Prévia');
      setAbaAtiva('formulario');
      carregarDados();

    } catch (error) {
      console.error(error.response);
      setRecursoErro(error.response?.data?.erro || 'Erro ao enviar recurso.');
    }
  };

  const gerarPDF = (multa) => {
    const isNIP = multa.fase_atual?.toLowerCase() === 'penalidade';
    const documentTitle = isNIP ? 'NOTIFICAÇÃO DA IMPOSIÇÃO DE PENALIDADE - NIP' : 'NOTIFICAÇÃO DA AUTUAÇÃO DE INFRAÇÃO DE TRÂNSITO - NAIT';
    const docNumberLabel = isNIP ? 'Nº da NIP' : 'Nº da NAIT';
    const docNumberValue = isNIP ? (multa.numero_nip || '7003190223') : (multa.numero_nait || '7003209824');
    const valorNominal = multa.valor_final || '0.00';
    const valorDesconto = (parseFloat(valorNominal) * 0.8).toFixed(2);

    const cod = multa.tipo_infracao?.codigo_infracao || multa.codigo_infracao || '';
    const infoLocal = getInfracaoInfoByCodigo(cod);
    const amparoLegalVal = multa.tipo_infracao?.amparo_legal || infoLocal?.amparo || 'Art. 181, XVII';
    const descricaoVal = multa.tipo_infracao?.descricao || infoLocal?.descricao || 'ESTACIONAR EM DESACORDO COM A REGULAMENTAÇÃO ESPECIFICADA PELA SINALIZAÇÃO';

    const elemento = document.createElement('div');
    elemento.innerHTML = `
      <div style="padding: 15px; font-family: Arial, sans-serif; color: #111; font-size: 11px; max-width: 800px; margin: auto; border: 1px solid #ccc; background-color: #fff;">
        
        <!-- CABEÇALHO -->
        <div style="display: flex; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 12px; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="/logo.png" alt="Logo SMTT" style="width: 40px;height: 40px;border-radius: 50%;object-fit: cover;"/>
            <div>
              <h2 style="margin: 0; color: #003399; font-size: 11px; font-weight: bold; text-transform: uppercase;">Superintendência Municipal de Trânsito e Transporte</h2>
              <p style="margin: 1px 0 0 0; color: #555; font-size: 9px; font-weight: bold;">SMTT PROPRIA - PROPRIÁ/SE</p>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-weight: bold; font-size: 10px; color: #333; display: block; text-transform: uppercase;">${documentTitle}</span>
            <span style="font-size: 8px; color: #666;">Documento Eletrônico Oficial</span>
          </div>
        </div>

        <!-- DADOS DA INFRAÇÃO -->
        <div style="border: 1px solid #333; margin-bottom: 12px; border-radius: 4px; overflow: hidden;">
          <div style="background-color: #333; color: white; padding: 4px 8px; font-weight: bold; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px;">Dados da Infração</div>
          <div style="padding: 6px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; border-bottom: 1px solid #eee;">
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Órgão Autuador:</strong>
              <span>SMTT PROPRIA</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Código Órgão Autuador:</strong>
              <span>0232130</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Placa/UF:</strong>
              <span style="font-weight: bold; text-transform: uppercase;">${multa.placa_veiculo || 'N/A'}/SE</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Nº do Auto (AIT):</strong>
              <span style="font-weight: bold; color: #d32f2f;">${multa.numero_ait}</span>
            </div>
          </div>

          <div style="padding: 6px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; border-bottom: 1px solid #eee; background-color: #fafafa;">
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Ano Fabricação:</strong>
              <span>${multa.veiculo?.ano_fabricacao || '2016'}</span>
            </div>
            <div style="grid-column: span 2;">
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Marca/Modelo/Espécie:</strong>
              <span style="text-transform: uppercase;">${multa.veiculo?.marca_modelo || 'RENAULT/OROCH 16 EXP42'}</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Cor do Veículo:</strong>
              <span style="text-transform: uppercase;">${multa.veiculo?.cor || 'CINZA'}</span>
            </div>
          </div>

          <div style="padding: 6px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 6px; border-bottom: 1px solid #eee;">
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Local do Cometimento:</strong>
              <span style="text-transform: uppercase;">${multa.local_cometimento}</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Data da Autuação:</strong>
              <span>${multa.data_hora_infracao.split(' ')[0]}</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Hora da Autuação:</strong>
              <span>${multa.data_hora_infracao.split(' ')[1] || '00:00'}</span>
            </div>
          </div>

          <div style="padding: 6px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; border-bottom: 1px solid #eee; background-color: #fafafa;">
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Enquadramento (CTB):</strong>
              <span>${amparoLegalVal}</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Cód. Infração / Desdobr.:</strong>
              <span>${cod} / ${multa.desdobramento || '1'}</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Pontuação/Gravidade:</strong>
              <span>${multa.tipo_infracao?.gravidade || 'Média'} (${multa.tipo_infracao?.pontos || '4'} Pts)</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Agente / Aparelho:</strong>
              <span>${multa.agente_aparelho || '1170'}</span>
            </div>
          </div>

          <div style="padding: 6px; border-bottom: 1px solid #eee;">
            <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Descrição da Infração:</strong>
            <span style="font-weight: bold; text-transform: uppercase; font-size: 9.5px;">${descricaoVal}</span>
          </div>

          <div style="padding: 6px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background-color: #fafafa;">
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Medição Aferida:</strong>
              <span>${multa.medicao_aferida || '0000.00 KM/H'}</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Medição Considerada:</strong>
              <span>${multa.medicao_considerada || '0000.00 KM/H'}</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Velocidade Regulamentada:</strong>
              <span>${multa.medicao_regulamentada || '0000.00 KM/H'}</span>
            </div>
            <div>
              <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">${docNumberLabel}:</strong>
              <span style="font-weight: bold;">${docNumberValue}</span>
            </div>
          </div>
        </div>

        <!-- DADOS DE CONTROLE DE EMISSÃO -->
        <div style="border: 1px solid #333; margin-bottom: 12px; border-radius: 4px; overflow: hidden; display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 6px; gap: 10px; background-color: #fcfcfc;">
          <div>
            <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Código RENAINF / INFRAEST:</strong>
            <span>${multa.codigo_renainf || '0000000000'}</span>
          </div>
          <div>
            <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Data de Expedição:</strong>
            <span>${multa.data_expedicao || multa.data_hora_infracao.split(' ')[0]}</span>
          </div>
          <div>
            <strong style="color: #666; font-size: 8px; display: block; text-transform: uppercase;">Limite p/ Defesa/Recurso:</strong>
            <span style="font-weight: bold; color: #d32f2f;">${multa.data_vencimento_defesa || 'A consultar'}</span>
          </div>
        </div>

        <!-- SEÇÃO CONDICIONAL: NAIT OU NIP -->
        ${isNIP ? `
          <!-- SEÇÃO BOLETO BANESE -->
          <div style="border: 2px dashed #003399; margin-top: 25px; border-radius: 4px; overflow: hidden; background-color: #fff;">
            <div style="background-color: #003399; color: white; padding: 6px 12px; font-weight: bold; font-size: 10px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; letter-spacing: 0.5px;">FICHA DE COMPENSAÇÃO DE MULTA - SMTT DIGITAL</span>
              <span style="font-weight: bold; letter-spacing: 1px;">BANESE 037-2</span>
            </div>

            <div style="padding: 6px; border-bottom: 1px solid #999; display: grid; grid-template-columns: 3fr 1fr; gap: 8px;">
              <div>
                <strong style="color: #666; font-size: 7.5px; display: block; text-transform: uppercase;">Local de Pagamento:</strong>
                <span style="font-size: 8.5px; font-weight: bold;">PAGÁVEL SOMENTE NAS AGÊNCIAS E CANAIS DE ARRECADAÇÃO DO BANESE</span>
              </div>
              <div>
                <strong style="color: #666; font-size: 7.5px; display: block; text-transform: uppercase;">Vencimento:</strong>
                <span style="font-size: 9.5px; font-weight: bold; color: #d32f2f;">${multa.data_vencimento_boleto ? new Date(multa.data_vencimento_boleto).toLocaleDateString('pt-BR') : multa.data_vencimento_defesa}</span>
              </div>
            </div>

            <div style="padding: 6px; border-bottom: 1px solid #999; display: grid; grid-template-columns: 3fr 1fr; gap: 8px;">
              <div>
                <strong style="color: #666; font-size: 7.5px; display: block; text-transform: uppercase;">Beneficiário:</strong>
                <span style="font-size: 8.5px; font-weight: bold;">SMTT PROPRIA - CNPJ: 13.001.002/0001-03</span>
              </div>
              <div>
                <strong style="color: #666; font-size: 7.5px; display: block; text-transform: uppercase;">Nosso Número (Nº Documento):</strong>
                <span style="font-size: 8.5px; font-weight: bold;">${multa.nosso_numero || '416162817'}</span>
              </div>
            </div>

            <div style="padding: 6px; border-bottom: 1px solid #999; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background-color: #fafafa;">
              <div>
                <strong style="color: #666; font-size: 7.5px; display: block; text-transform: uppercase;">Data do Documento:</strong>
                <span>${multa.data_expedicao || '26/05/2026'}</span>
              </div>
              <div>
                <strong style="color: #666; font-size: 7.5px; display: block; text-transform: uppercase;">Número do Auto (AIT):</strong>
                <span style="font-weight: bold;">${multa.numero_ait}</span>
              </div>
              <div>
                <strong style="color: #666; font-size: 7.5px; display: block; text-transform: uppercase;">Espécie Moeda:</strong>
                <span>REAL (R$)</span>
              </div>
              <div>
                <strong style="color: #666; font-size: 7.5px; display: block; text-transform: uppercase;">Valor Nominal do Doc:</strong>
                <span style="font-weight: bold; color: #d32f2f;">R$ ${valorNominal}</span>
              </div>
            </div>

            <div style="padding: 6px; border-bottom: 1px solid #999; display: grid; grid-template-columns: 3fr 1fr; gap: 8px;">
              <div style="font-size: 8px; line-height: 1.3; color: #555;">
                <strong>Instruções de Responsabilidade do Beneficiário:</strong><br/>
                - Não receber após o vencimento.<br/>
                - Pagamento com 20% de desconto garantido até a data de vencimento expressa (Art. 284 do CTB).<br/>
                - Após o vencimento, atualize a guia no órgão de trânsito.
              </div>
              <div style="background-color: #fafafa; border-left: 1px solid #eee; padding-left: 8px;">
                <strong style="color: #666; font-size: 7.5px; display: block; text-transform: uppercase;">(-) Desconto de 20% (Art. 284):</strong>
                <span style="font-weight: bold; color: #2e7d32; font-size: 9px;">R$ ${valorDesconto}</span>
              </div>
            </div>

            <div style="padding: 6px; border-bottom: 1px solid #999; background-color: #fdfdfd;">
              <strong style="color: #666; font-size: 7.5px; display: block; text-transform: uppercase;">Pagador / Proprietário:</strong>
              <span style="font-weight: bold; font-size: 9px;">${nomeUsuario || 'JOSE GUILHERME DOS S. FILHO'}</span><br/>
              <span style="font-size: 8px; color: #555;">Endereço: RUA PRESIDENTE GETÚLIO VARGAS, 285 - CENTRO, PROPRIÁ/SE - CEP: 49900-000</span>
            </div>

            <!-- LINHA DIGITÁVEL E CÓDIGO DE BARRAS GRÁFICO -->
            <div style="padding: 10px; display: flex; flex-direction: column; align-items: center; background-color: #fafafa; justify-content: center; gap: 4px;">
              <div style="font-family: monospace; font-size: 10px; font-weight: bold; letter-spacing: 0.5px; color: #333;">
                ${multa.linha_digitavel}
              </div>
              
              <!-- Simulação gráfica de código de barras de banco -->
              <div style="display: flex; height: 32px; width: 90%; background: repeating-linear-gradient(90deg, #111, #111 2px, #fff 2px, #fff 5px, #111 5px, #111 6px, #fff 6px, #fff 9px); margin-top: 4px;"></div>
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 6px; font-size: 7.5px; color: #777; text-align: center; font-style: italic;">
          Emitido via Sistema SMTT Digital - Portal do Cidadão. Código de verificação da autenticidade da notificação disponível nos registros eletrônicos do município.
        </div>
      </div>
    `;

    const opcoes = {
      margin: 8,
      filename: `${isNIP ? 'NIP' : 'NAIT'}_Notificacao_${multa.numero_ait}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opcoes).from(elemento).save();
  };

  function handleLogout(mensagemOpcional) {
    localStorage.removeItem('token');
    localStorage.removeItem('nomeUsuario');
    const msg = typeof mensagemOpcional === 'string' ? mensagemOpcional : null;
    navigate('/login', { state: { mensagem: msg } });
  };

  const totalVeiculos = veiculos.length;
  const totalMultas = multas.length;
  const totalRecursos = multas.filter(m => m.recurso).length;

  const pontosCNH = multas
    .filter(m => !m.fase_atual.includes('Cancelada') && !m.fase_atual.includes('Deferida'))
    .reduce((acc, m) => acc + (m.tipo_infracao?.pontos || 0), 0);

  const valorPendente = multas
    .filter(m => !m.fase_atual.includes('Cancelada') && !m.fase_atual.includes('Deferida'))
    .reduce((acc, m) => acc + parseFloat(m.valor_final || 0), 0)
    .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const multasFiltradas = multas.filter(m => {
    if (buscaInfracao.trim() !== '') {
      const query = buscaInfracao.toUpperCase().replace(/[- ]/g, '').trim();
      const placaM = m.placa_veiculo ? m.placa_veiculo.toUpperCase().replace(/[- ]/g, '').trim() : '';
      const aitM = m.numero_ait ? m.numero_ait.toUpperCase().replace(/[- ]/g, '').trim() : '';
      if (!placaM.includes(query) && !aitM.includes(query)) {
        return false;
      }
    }
    if (filtroStatus !== 'Todos') {
      if (filtroStatus === 'Ativas') {
        return !m.fase_atual.includes('Cancelada') && !m.fase_atual.includes('Deferida');
      }
      if (filtroStatus === 'Defesa/Recurso') {
        return m.fase_atual.includes('Análise') || m.fase_atual.includes('Recurso');
      }
      if (filtroStatus === 'Canceladas/Deferidas') {
        return m.fase_atual.includes('Cancelada') || m.fase_atual.includes('Deferida');
      }
      if (!m.fase_atual.toLowerCase().includes(filtroStatus.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const getFaseStep = (fase) => {
    const f = fase ? fase.toLowerCase() : '';
    if (f.includes('cancelada') || f.includes('deferida') || f.includes('indeferida') || f.includes('paga') || f.includes('finalizado')) return 4;
    if (f.includes('recurso') || f.includes('analise') || f.includes('análise')) return 3;
    if (f.includes('penalidade')) return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 selection:bg-primary-600 selection:text-white pb-20">

      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo-smtt.png" alt="Logo SMTT" className="h-10 w-auto object-contain" />
            <div className="border-l border-gray-300 pl-3 hidden sm:block">
              <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">Área do Cidadão</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-sm font-medium hidden md:block">Olá, <strong className="text-primary-600">{nomeUsuario}</strong></span>
            <button onClick={() => handleLogout()} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors font-semibold border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg bg-white">
              Sair <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* SEÇÃO DE RESUMO (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 flex items-center justify-between hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200">
            <div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Veículos Vinculados</span>
              <span className="text-2xl font-extrabold text-gray-900">{totalVeiculos}</span>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-primary-600 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 flex items-center justify-between hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200">
            <div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Infrações Registradas</span>
              <span className="text-2xl font-extrabold text-gray-900">{totalMultas}</span>
            </div>
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 flex items-center justify-between hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200">
            <div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Recursos em Andamento</span>
              <span className="text-2xl font-extrabold text-primary-600">{totalRecursos}</span>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* COLUNA ESQUERDA: GESTÃO DE VEÍCULOS */}
          <div className="lg:col-span-1 space-y-6">

            {/* Vincular Veículo */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <Car className="text-primary-600 w-5 h-5" />
                <h2 className="font-bold text-lg text-gray-900">Vincular Veículo</h2>
              </div>

              {mensagem && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 border border-green-100 flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" />{mensagem}</div>}
              {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center gap-2"><ShieldAlert className="w-4 h-4 shrink-0" />{erro}</div>}

              <form onSubmit={handleCadastrarVeiculo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Placa</label>
                  <input type="text" maxLength="7" placeholder="ABC1D23" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none uppercase font-bold text-gray-700 transition-all" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Renavam</label>
                  <div className="relative">
                    <FileDigit className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" maxLength="11" placeholder="Somente números" value={renavam} onChange={(e) => setRenavam(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Adicionar Veículo
                </button>
              </form>
            </div>

            {/* Lista de Veículos */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4">Meus Veículos</h3>
              {veiculos.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum veículo vinculado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {veiculos.map(v => (
                    <div key={v.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-50 border border-gray-150 rounded-2xl hover:border-primary-300 hover:bg-white hover:shadow-soft transition-all duration-200 gap-3">
                      <div className="flex flex-col items-center sm:items-start w-full sm:w-auto text-center sm:text-left">
                        {/* Placa Mercosul */}
                        <div className="w-full max-w-[140px] bg-white border-2 border-black rounded-md overflow-hidden shadow-sm relative mb-2 font-sans mx-auto sm:mx-0">
                          {/* Faixa Azul Superior */}
                          <div className="bg-[#003399] text-white py-0.5 px-1.5 flex justify-between items-center text-[7px] font-bold tracking-wider uppercase h-4.5">
                            <span className="opacity-75">Mercosul</span>
                            <span>Brasil</span>
                            <span className="w-2.5 h-1.5 bg-yellow-400 rounded-sm relative overflow-hidden flex items-center justify-center shrink-0">
                              <span className="absolute w-1.5 h-1.5 bg-green-600 rotate-45"></span>
                              <span className="absolute w-0.5 h-0.5 bg-blue-800 rounded-full"></span>
                            </span>
                          </div>
                          {/* Corpo da Placa */}
                          <div className="py-1.5 px-2 flex items-center justify-center bg-white">
                            <span className="font-extrabold text-sm text-black tracking-widest font-mono select-all">
                              {v.placa}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">RENAVAM: <span className="text-gray-600 font-mono">{v.renavam}</span></span>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 shadow-sm">
                        <Car className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SERVIÇOS DISPONÍVEIS */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <Compass className="text-primary-600 w-5 h-5" />
                <h2 className="font-bold text-lg text-gray-900">Serviços Disponíveis</h2>
              </div>

              <div className="space-y-4">
                {/* Serviço 1: Alvarás */}
                <div
                  onClick={() => navigate('/solicitacao-alvara')}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/30 border border-transparent hover:border-blue-100 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-gray-800 flex items-center gap-1 group-hover:text-primary-600 transition-colors">
                      Alvarás e Permissionários <ExternalLink className="w-3. h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="text-xs text-gray-500 leading-snug block mt-0.5">Renovação ou inclusão de auxiliar para táxi, mototáxi e escolar.</span>
                  </div>
                </div>

                {/* Serviço 2: Eventos */}
                <div
                  onClick={() => navigate('/solicitacao-evento')}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-red-50/30 border border-transparent hover:border-red-100 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-gray-800 flex items-center gap-1 group-hover:text-red-500 transition-colors">
                      Autorização de Eventos <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="text-xs text-gray-500 leading-snug block mt-0.5">Solicite interdição de via ou apoio de tráfego para a realização de eventos.</span>
                  </div>
                </div>

                {/* Serviço 3: Contestação de Multa */}
                <div
                  onClick={() => navigate('/contestacao-multa')}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-amber-50/30 border border-transparent hover:border-amber-100 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-gray-800 flex items-center gap-1 group-hover:text-amber-600 transition-colors">
                      Contestação Avulsa <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="text-xs text-gray-500 leading-snug block mt-0.5">Abra defesas prévias ou recursos de multas de forma avulsa.</span>
                  </div>
                </div>

                {/* Serviço 4: Consulta de Protocolos */}
                <div
                  onClick={() => navigate('/consultar')}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-green-50/30 border border-transparent hover:border-green-100 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <FileDigit className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-gray-800 flex items-center gap-1 group-hover:text-green-600 transition-colors">
                      Consultar Protocolo <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="text-xs text-gray-500 leading-snug block mt-0.5">Consulte o andamento e pareceres dos seus protocolos abertos.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: MULTAS E INFRAÇÕES */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-500 w-6 h-6" />
                  <h2 className="font-bold text-xl text-gray-900">Minhas Infrações</h2>
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                  {multas.length} registro(s)
                </span>
              </div>

              {/* BARRA DE FILTROS E BUSCA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Buscar Infração</label>
                  <input
                    type="text"
                    placeholder="Placa ou número do AIT..."
                    value={buscaInfracao}
                    onChange={(e) => setBuscaInfracao(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Fase / Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="Todos">Todos os Status</option>
                    <option value="Ativas">Ativas (A pagar / Em recurso)</option>
                    <option value="Autuação">Em Autuação</option>
                    <option value="Penalidade">Em Penalidade</option>
                    <option value="Defesa/Recurso">Em Análise / Recurso</option>
                    <option value="Canceladas/Deferidas">Canceladas / Deferidas</option>
                  </select>
                </div>
              </div>

              {multas.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p className="font-bold text-lg text-gray-600">Nada Consta</p>
                  <p className="text-sm mt-1">Nenhuma infração registrada para os seus veículos.</p>
                </div>
              ) : multasFiltradas.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-gray-500" />
                  <p className="font-bold">Nenhum resultado localizado</p>
                  <p className="text-xs mt-1">Nenhuma infração corresponde aos filtros de busca aplicados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {multasFiltradas.map(multa => (
                    <div key={multa.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">

                      {/* Cabeçalho do Card da Multa */}
                      <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="bg-primary-900 text-secondary-500 font-bold text-xs px-2 py-1 rounded uppercase tracking-wider">{multa.placa_veiculo}</span>
                          <span className="text-sm font-bold text-gray-700">{multa.numero_ait}</span>
                          {multa.recurso?.protocolo && (
                            <span className="text-xs font-mono font-bold bg-blue-50 text-primary-600 border border-blue-200 px-2 py-0.5 rounded">
                              Protocolo: {multa.recurso.protocolo}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${multa.fase_atual.includes('Cancelada') || multa.fase_atual.includes('Deferida')
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
                        {/* Banner Informativo de Fase */}
                        {multa.fase_atual?.toLowerCase() === 'autuação' ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-left flex items-start gap-2.5 animate-fadeIn shadow-sm">
                            <Info className="w-4.5 h-4.5 text-primary-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-[11px] text-primary-900 uppercase tracking-wide">Fase de Autuação (Defesa Prévia)</h4>
                              <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                                Esta autuação foi registrada e está aberta para apresentação de <strong>Defesa Prévia</strong> até: <strong className="text-primary-850 font-bold">{multa.data_vencimento_defesa || 'A consultar'}</strong>. Nenhum boleto é emitido nesta fase.
                              </p>
                            </div>
                          </div>
                        ) : multa.fase_atual?.toLowerCase() === 'penalidade' ? (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-left flex items-start gap-2.5 animate-fadeIn shadow-sm">
                            <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-[11px] text-amber-900 uppercase tracking-wide">Fase de Penalidade (Multa Imposta)</h4>
                              <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                                A multa foi imposta e está disponível para pagamento ou contestação via Recurso JARI. Efetue o pagamento até o vencimento para garantir <strong>20% de desconto</strong>.
                              </p>
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1 text-left">
                            <p className="text-sm text-gray-800"><strong className="text-gray-500">Data:</strong> {multa.data_hora_infracao}</p>
                            <p className="text-sm text-gray-800"><strong className="text-gray-500">Local:</strong> {multa.local_cometimento}</p>
                            {multa.fase_atual?.toLowerCase() !== 'autuação' && (
                              <p className="text-sm text-gray-800"><strong className="text-gray-500">Valor:</strong> <span className="font-bold text-red-600">R$ {multa.valor_final}</span></p>
                            )}

                             {(() => {
                              const codInfracao = multa.tipo_infracao?.codigo_infracao || multa.codigo_infracao || '';
                              const infoLocal = getInfracaoInfoByCodigo(codInfracao);
                              const amparoText = multa.tipo_infracao?.amparo_legal || infoLocal?.amparo || 'Art. 181, XVII';
                              const descText = multa.tipo_infracao?.descricao || infoLocal?.descricao || 'Descrição não informada';
                              return (
                                <div className="text-xs text-gray-600 bg-slate-50 border border-slate-150 px-2.5 py-2 rounded-xl mt-2 block">
                                  <strong className="text-slate-500 font-bold uppercase text-[9px] block">Enquadramento Legal (CTB)</strong>
                                  <span className="text-gray-800 font-medium block mt-0.5">
                                    Código <strong>{codInfracao}</strong> • <strong className="text-primary-750 font-bold">{amparoText}</strong>
                                  </span>
                                  <p className="text-xs text-gray-500 leading-relaxed mt-1 font-medium">{descText}</p>
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                      (multa.tipo_infracao?.gravidade || 'Média') === 'Leve' ? 'bg-green-100 text-green-700' :
                                      (multa.tipo_infracao?.gravidade || 'Média') === 'Média' ? 'bg-amber-100 text-amber-700' :
                                      (multa.tipo_infracao?.gravidade || 'Média') === 'Grave' ? 'bg-orange-100 text-orange-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {multa.tipo_infracao?.gravidade || 'Média'}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-bold">{multa.tipo_infracao?.pontos || '4'} Pontos</span>
                                  </div>
                                </div>
                              );
                            })()}

                            {multa.veiculo && (multa.veiculo.marca_modelo || multa.veiculo.cor) && (
                              <p className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-lg mt-1.5 inline-block">
                                <strong className="text-gray-500 font-bold uppercase text-[9px] block">Características do Carro</strong>
                                <span className="font-semibold text-gray-700">{multa.veiculo.marca_modelo || 'N/D'} • {multa.veiculo.cor || 'N/D'} • {multa.veiculo.ano_fabricacao || 'N/D'}</span>
                              </p>
                            )}

                            {multa.medicao_aferida && (
                              <p className="text-xs text-gray-600 bg-blue-50/30 border border-blue-100 px-2.5 py-1.5 rounded-lg mt-1.5 block">
                                <strong className="text-primary-800 font-bold uppercase text-[9px] block">Medição do Equipamento</strong>
                                <span className="text-gray-700">Regulamentada: <strong>{multa.medicao_regulamentada}</strong> | Aferida: <strong>{multa.medicao_aferida}</strong> | Considerada: <strong>{multa.medicao_considerada}</strong></span>
                              </p>
                            )}
                          </div>

                          {/* Ações */}
                          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 shrink-0">
                            {!multa.recurso && !multa.fase_atual.includes('Cancelada') && !multa.fase_atual.includes('Deferida') && (
                              <button
                                onClick={() => {
                                  setMultaSelecionada(multa);
                                  setModalAberto(true);
                                  setRecursoSucesso('');
                                  setRecursoErro('');
                                  setTipoRecurso('Defesa Prévia');
                                  setAbaAtiva('formulario');
                                  setArquivosAdicionais([]);
                                }}
                                className="w-full md:w-auto bg-secondary-500 hover:bg-secondary-600 text-primary-950 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <FileText className="w-4 h-4" /> Recorrer
                              </button>
                            )}

                            <button
                              onClick={() => gerarPDF(multa)}
                              className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Notificação ({multa.fase_atual?.toLowerCase() === 'penalidade' ? 'NIP' : 'NAIT'})
                            </button>
                          </div>
                        </div>

                        {/* Linha do Tempo do Processo */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-3 text-left">Acompanhamento do Processo</span>
                          <div className="relative flex justify-between items-center w-full max-w-lg mx-auto py-3">

                            {/* Linha horizontal de fundo */}
                            <div className="absolute left-0 right-0 top-[22px] h-0.5 bg-gray-200 z-0"></div>

                            {/* Linha horizontal ativa */}
                            <div
                              className="absolute left-0 top-[22px] h-0.5 bg-primary-600 transition-all duration-500 z-0"
                              style={{
                                width: `${((getFaseStep(multa.fase_atual) - 1) / 3) * 100}%`
                              }}
                            ></div>

                            {/* Passos */}
                            {[
                              { step: 1, label: 'Autuação', desc: 'AIT Registrado' },
                              { step: 2, label: 'Penalidade', desc: 'Multa Emitida' },
                              { step: 3, label: 'Julgamento', desc: 'Defesa / Recurso' },
                              { step: 4, label: 'Finalizado', desc: 'Concluído' }
                            ].map((item) => {
                              const currentStep = getFaseStep(multa.fase_atual);
                              const isCompleted = currentStep > item.step;
                              const isActive = currentStep === item.step;

                              return (
                                <div key={item.step} className="relative z-10 flex flex-col items-center select-none">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${isCompleted
                                      ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                                      : isActive
                                        ? 'bg-white border-primary-600 text-primary-600 scale-110 ring-4 ring-primary-100 font-extrabold shadow-sm'
                                        : 'bg-white border-gray-300 text-gray-400'
                                      }`}
                                  >
                                    {isCompleted ? (
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : item.step}
                                  </div>
                                  <span className={`text-[10px] font-bold mt-2 ${isActive ? 'text-primary-700 font-extrabold' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>{item.label}</span>
                                  <span className="text-[8px] text-gray-400 hidden sm:block mt-0.5 font-medium">{item.desc}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Boleto de Arrecadação BANESE caso disponível */}
                        {multa.linha_digitavel && multa.fase_atual?.toLowerCase() !== 'autuação' && (
                          <div className="mt-4 p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 text-left">
                            <div className="flex justify-between items-center flex-wrap gap-1">
                              <span className="text-xs font-bold text-primary-600 flex items-center gap-1.5 uppercase tracking-wide">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Boleto de Arrecadação BANESE
                              </span>
                              {multa.data_vencimento_boleto && (
                                <span className="text-xs font-bold text-gray-500">
                                  Vencimento: {multa.data_vencimento_boleto}
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-xs text-gray-700 bg-white p-3 rounded-lg border border-blue-200 select-all break-all leading-relaxed shadow-inner">
                              {multa.linha_digitavel}
                            </div>
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <span className="text-xs text-gray-500 font-medium">
                                Valor com 20% desc. (até vencimento): <strong className="text-green-700 font-bold text-sm">R$ {(parseFloat(multa.valor_final) * 0.8).toFixed(2)}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(multa.linha_digitavel);
                                  alert('Código de barras copiado com sucesso! Já pode pagar no app do seu banco.');
                                }}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                              >
                                Copiar Código de Barras
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Caixa de detalhes do recurso aberto e resposta da JARI */}
                        {multa.recurso && (
                          <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 relative overflow-hidden text-left">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600"></div>

                            <div className="flex flex-wrap justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">
                              <span>Protocolo: <span className="text-primary-600 font-mono font-bold">{multa.recurso.protocolo}</span></span>
                              <span>Tipo: <span className="text-gray-700">{multa.recurso.tipo_recurso}</span></span>
                            </div>

                            <div className="flex items-center gap-2 text-sm pl-2">
                              <span className="font-bold text-gray-600">Resultado:</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${multa.recurso.resultado_julgamento === 'Deferido' ? 'bg-green-50 text-green-700 border-green-200' :
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
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-primary-600 font-bold rounded-lg hover:bg-blue-100 transition-colors text-xs mt-3 shadow-sm"
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
        </div> {/* Fecha grid de 3 colunas */}
      </main>

      {/* JANELA MODAL DE RECURSO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-primary-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">

            <button onClick={() => setModalAberto(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-2xl text-gray-900 mb-2">Abertura de Recurso</h3>
            <p className="text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
              Auto de Infração: <strong className="text-primary-600">{multaSelecionada?.numero_ait}</strong>
            </p>

            {recursoErro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center gap-2"><ShieldAlert className="w-4 h-4 shrink-0" />{recursoErro}</div>}

            {/* Abas do Modal */}
            {!recursoSucesso && (
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  type="button"
                  onClick={() => setAbaAtiva('formulario')}
                  className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${abaAtiva === 'formulario'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                  1. Dados do Recurso
                </button>
                <button
                  type="button"
                  onClick={() => setAbaAtiva('anexos')}
                  className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${abaAtiva === 'anexos'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                  2. Documentos Adicionais
                  {arquivosAdicionais.length > 0 && (
                    <span className="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {arquivosAdicionais.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {recursoSucesso ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-lg text-gray-900 mb-2">Defesa Enviada!</h4>
                <p className="text-gray-600 text-sm mb-6">{recursoSucesso}</p>
                <button onClick={() => setModalAberto(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-xl transition-colors w-full">
                  Fechar Janela
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnviarRecurso} className="space-y-6">

                {abaAtiva === 'formulario' && (
                  <div className="space-y-6">
                    {/* Passo a Passo */}
                    <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-primary-900 mb-2 text-sm">Passo a Passo para o Recurso:</h4>
                      <ol className="text-sm text-gray-700 list-decimal ml-4 space-y-1 mb-4">
                        <li>Baixe o formulário oficial abaixo.</li>
                        <li>Preencha, assine e escaneie (ou tire uma foto nítida).</li>
                        <li>Anexe o documento preenchido e envie.</li>
                      </ol>

                      <a
                        href={formularioPDF}
                        download="Requerimento_JARI_SMTT.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-primary-600 font-bold hover:bg-gray-50 transition-colors text-sm shadow-sm"
                      >
                        <Download className="w-4 h-4" /> Baixar Formulário de Requerimento Único
                      </a>
                    </div>

                    {/* Campo para escolher o tipo de recurso */}
                    <div className="mb-5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Tipo de Recurso *</label>
                      <select
                        value={tipoRecurso}
                        onChange={(e) => setTipoRecurso(e.target.value)}
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all cursor-pointer"
                      >
                        <option value="Defesa Prévia">Defesa Prévia</option>
                        <option value="Recurso JARI">Recurso JARI</option>
                        <option value="Indicação de Real Infrator">Indicação de Real Infrator</option>
                      </select>
                    </div>

                    {/* Campo para anexar o arquivo principal */}
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Anexar Formulário Preenchido *</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setArquivoCidadao(e.target.files[0])}
                        required
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-pointer"
                      />
                      {arquivoCidadao && (
                        <p className="text-xs text-green-600 font-bold mt-1.5 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Arquivo selecionado: {arquivoCidadao.name}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!arquivoCidadao) {
                            setRecursoErro('Por favor, anexe o formulário principal antes de prosseguir.');
                            return;
                          }
                          setRecursoErro('');
                          setAbaAtiva('anexos');
                        }}
                        className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 transition-colors"
                      >
                        Continuar (Anexos)
                      </button>
                    </div>
                  </div>
                )}

                {abaAtiva === 'anexos' && (
                  <div className="space-y-6">
                    {/* Checklist Baseado no PDF */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2.5">📋 Documentação Recomendada (PDF)</h4>
                      <ul className="text-xs text-gray-600 space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span><strong>Identificação:</strong> Cópia da CNH ou RG com assinatura legível.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span><strong>Veículo:</strong> Cópia legível do CRLV do veículo.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span><strong>Infração:</strong> Cópia da Notificação de Autuação / Penalidade.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <span><strong>Provas adicionais:</strong> Fotos de placas de sinalização, radares, ou procuração (se for o caso).</span>
                        </li>
                      </ul>
                    </div>

                    {/* Campo para escolher múltiplos arquivos adicionais */}
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-gray-500" /> Selecionar Arquivos Adicionais
                      </label>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const novos = Array.from(e.target.files);
                          setArquivosAdicionais(prev => [...prev, ...novos]);
                        }}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-pointer"
                      />
                    </div>

                    {/* Lista de Arquivos Selecionados */}
                    {arquivosAdicionais.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Arquivos Selecionados ({arquivosAdicionais.length})</h5>
                        {arquivosAdicionais.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 hover:border-red-200 transition-colors">
                            <span className="flex items-center gap-2 text-xs font-semibold text-gray-700 truncate max-w-[280px]">
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              {file.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-bold text-gray-400">
                                {(file.size / 1024).toFixed(0)} KB
                              </span>
                              <button
                                type="button"
                                onClick={() => setArquivosAdicionais(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setAbaAtiva('formulario')}
                        className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 transition-colors"
                      >
                        Enviar Recurso
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default Painel;