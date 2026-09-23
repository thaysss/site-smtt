export const CARGOS = [
  { value: 'administrador', label: 'Administrador', descricao: 'Acesso total, inclusive cadastro de servidores.' },
  { value: 'supervisor', label: 'Supervisor', descricao: 'Supervisiona todas as operações, sem cadastrar administradores.' },
  { value: 'analista', label: 'Analista', descricao: 'Analisa recursos, eventos e alvarás e gerencia notícias.' },
  { value: 'agente_transito', label: 'Agente de Trânsito', descricao: 'Consulta veículos, lança infrações, altera a fase da multa e gerencia avisos de interdição.' },
];

const PERMISSOES = {
  administrador: ['*'],
  supervisor: ['dashboard', 'registros', 'recursos', 'eventos', 'alvaras', 'ouvidoria', 'infracoes', 'noticias', 'lancar-infracao', 'alertas', 'veiculos'],
  analista: ['dashboard', 'registros', 'recursos', 'eventos', 'alvaras', 'ouvidoria', 'noticias'],
  agente_transito: ['dashboard', 'registros', 'infracoes', 'lancar-infracao', 'alertas', 'veiculos'],
};

export const getAdminPerfil = () => localStorage.getItem('adminPerfil')
  || (localStorage.getItem('adminToken') ? 'administrador' : '');

export const canAccessAdmin = (feature, perfil = getAdminPerfil()) => {
  const permissoes = PERMISSOES[perfil] || [];
  return permissoes.includes('*') || permissoes.includes(feature);
};

export const firstAllowedPanelTab = (perfil = getAdminPerfil()) =>
  ['recursos', 'eventos', 'alvaras', 'ouvidoria', 'infracoes', 'noticias'].find((item) => canAccessAdmin(item, perfil)) || 'registros';
