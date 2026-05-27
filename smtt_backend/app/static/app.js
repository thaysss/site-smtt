const state = {
  citizenToken: localStorage.getItem('citizenToken') || '',
  citizenName: localStorage.getItem('citizenName') || '',
  adminToken: localStorage.getItem('adminToken') || '',
  adminName: localStorage.getItem('adminName') || '',
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function showToast(message, type = 'info') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.style.background = type === 'error' ? '#b42318' : type === 'success' ? '#1f7a4d' : '#202a36';
  toast.classList.remove('hidden');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.add('hidden'), 4200);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(path, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.erro || data.mensagem || 'Não foi possível concluir a operação.');
  }

  return data;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char]);
}

function normalizePlate(value) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function formatDateTimeLocal(value) {
  return value ? value.replace('T', ' ') + ':00' : '';
}

function renderList(target, items, renderer, emptyText) {
  const element = $(target);
  if (!items.length) {
    element.className = 'list empty';
    element.textContent = emptyText;
    return;
  }

  element.className = 'list';
  element.innerHTML = items.map(renderer).join('');
}

function updateSession() {
  $('#citizenName').textContent = state.citizenName || 'Não autenticado';
  $('#adminName').textContent = state.adminName || 'Não autenticado';

  const session = state.citizenName || state.adminName;
  $('#sessionStatus').textContent = session ? `Sessão: ${session}` : 'Visitante';
  $('#logoutButton').classList.toggle('hidden', !session);
}

async function loadPublicAlerts() {
  try {
    const alerts = await api('/api/public/alertas');
    $('#alertsCount').textContent = `${alerts.length} ativos`;
    renderList(
      '#publicAlerts',
      alerts,
      (alert) => `
        <article class="item">
          <strong>${escapeHtml(alert.rua_bairro)}</strong>
          <span>${escapeHtml(alert.descricao)}</span>
          <span class="status">${escapeHtml(alert.status)}</span>
        </article>
      `,
      'Nenhum alerta ativo no momento.'
    );
  } catch (error) {
    $('#publicAlerts').textContent = error.message;
    showToast(error.message, 'error');
  }
}

async function loadFines() {
  if (!state.citizenToken) {
    showToast('Entre como cidadão para consultar multas.', 'error');
    return;
  }

  try {
    const data = await api('/api/cidadao/multas', { headers: authHeaders(state.citizenToken) });
    renderList(
      '#finesList',
      data.multas || [],
      (fine) => `
        <article class="item">
          <strong>${escapeHtml(fine.numero_ait)}</strong>
          <span>${escapeHtml(fine.local_cometimento)}</span>
          <span class="meta">${escapeHtml(fine.data_hora_infracao)} · R$ ${Number(fine.valor_final || 0).toFixed(2)}</span>
          <span class="status">${escapeHtml(fine.fase_atual)}</span>
        </article>
      `,
      data.mensagem || 'Nenhuma multa encontrada.'
    );
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadResources() {
  try {
    const resources = await api('/api/admin/recursos/pendentes');
    renderList(
      '#resourcesList',
      resources,
      (resource) => `
        <article class="item">
          <strong>#${escapeHtml(resource.id)} · ${escapeHtml(resource.numero_protocolo)}</strong>
          <span>AIT ${escapeHtml(resource.numero_ait)}</span>
          <span class="meta">${escapeHtml(resource.tipo_recurso)} · ${escapeHtml(resource.data_solicitacao)}</span>
        </article>
      `,
      'Nenhum recurso pendente.'
    );
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadAdminAlerts() {
  try {
    const alerts = await api('/api/admin/alertas');
    renderList(
      '#adminAlerts',
      alerts,
      (alert) => `
        <article class="item">
          <strong>${escapeHtml(alert.rua_bairro)}</strong>
          <span>${escapeHtml(alert.descricao)}</span>
          <span class="status ${alert.status === 'Resolvido' ? 'success' : ''}">${escapeHtml(alert.status)}</span>
          ${alert.status === 'Ativo' ? `<button class="secondary resolve-alert" data-id="${escapeHtml(alert.id)}" type="button">Resolver</button>` : ''}
        </article>
      `,
      'Nenhum alerta cadastrado.'
    );
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function wireTabs() {
  $$('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.tab').forEach((tab) => tab.classList.remove('active'));
      $$('.view').forEach((view) => view.classList.remove('active'));
      button.classList.add('active');
      $(`#${button.dataset.tab}`).classList.add('active');
    });
  });
}

function wireForms() {
  $('#plateForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    try {
      const result = await api('/api/public/consulta-placa', {
        method: 'POST',
        body: JSON.stringify({ placa: normalizePlate(data.placa) }),
      });
      $('#plateResult').className = `result status ${result.tem_multas ? 'danger' : 'success'}`;
      $('#plateResult').textContent = result.mensagem;
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  $('#protocolForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    try {
      const result = await api(`/api/public/protocolos/${encodeURIComponent(data.numero)}`);
      $('#protocolResult').className = 'result';
      $('#protocolResult').innerHTML = `
        <strong>${escapeHtml(result.numero_protocolo)}</strong><br>
        Status: ${escapeHtml(result.status_julgamento)}<br>
        Parecer: ${escapeHtml(result.parecer_jari || 'Aguardando análise')}<br>
        Abertura: ${escapeHtml(result.data_abertura)}
      `;
    } catch (error) {
      $('#protocolResult').className = 'result status danger';
      $('#protocolResult').textContent = error.message;
    }
  });

  $('#citizenLoginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(formData(event.currentTarget)) });
      state.citizenToken = result.token;
      state.citizenName = result.nome;
      localStorage.setItem('citizenToken', result.token);
      localStorage.setItem('citizenName', result.nome);
      updateSession();
      showToast('Login realizado com sucesso.', 'success');
      loadFines();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  $('#citizenSignupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await api('/api/auth/cadastro', { method: 'POST', body: JSON.stringify(formData(event.currentTarget)) });
      showToast(result.mensagem, 'success');
      event.currentTarget.reset();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  $('#vehicleForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    data.placa = normalizePlate(data.placa);
    try {
      const result = await api('/api/cidadao/veiculos', {
        method: 'POST',
        headers: authHeaders(state.citizenToken),
        body: JSON.stringify(data),
      });
      showToast(result.mensagem, 'success');
      event.currentTarget.reset();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  $('#resourceForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await api('/api/cidadao/recursos', {
        method: 'POST',
        headers: authHeaders(state.citizenToken),
        body: JSON.stringify(formData(event.currentTarget)),
      });
      showToast(`${result.mensagem} Protocolo: ${result.numero_protocolo}`, 'success');
      event.currentTarget.reset();
      loadFines();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  $('#generalProtocolForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await api('/api/cidadao/protocolos', {
        method: 'POST',
        headers: authHeaders(state.citizenToken),
        body: JSON.stringify(formData(event.currentTarget)),
      });
      showToast(`${result.mensagem} Protocolo: ${result.numero_protocolo}`, 'success');
      event.currentTarget.reset();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  $('#adminLoginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await api('/api/auth/admin/login', { method: 'POST', body: JSON.stringify(formData(event.currentTarget)) });
      state.adminToken = result.token;
      state.adminName = `${result.nome} · ${result.cargo}`;
      localStorage.setItem('adminToken', result.token);
      localStorage.setItem('adminName', state.adminName);
      updateSession();
      showToast('Servidor autenticado.', 'success');
      loadResources();
      loadAdminAlerts();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  $('#adminSignupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await api('/api/auth/admin/cadastro', { method: 'POST', body: JSON.stringify(formData(event.currentTarget)) });
      showToast(result.mensagem, 'success');
      event.currentTarget.reset();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  $('#infractionForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    data.placa = normalizePlate(data.placa);
    data.data_hora_infracao = formatDateTimeLocal(data.data_hora_infracao);
    data.valor_final = Number(data.valor_final || 0);
    try {
      const result = await api('/api/admin/infracoes', { method: 'POST', body: JSON.stringify(data) });
      showToast(`${result.mensagem} AIT: ${result.numero_ait}`, 'success');
      event.currentTarget.reset();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  $('#alertForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await api('/api/admin/alertas', { method: 'POST', body: JSON.stringify(formData(event.currentTarget)) });
      showToast(result.mensagem, 'success');
      event.currentTarget.reset();
      loadPublicAlerts();
      loadAdminAlerts();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  $('#judgeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const id = data.recurso_id;
    delete data.recurso_id;
    try {
      const result = await api(`/api/admin/recursos/${id}/julgar`, { method: 'PATCH', body: JSON.stringify(data) });
      showToast(result.mensagem, 'success');
      event.currentTarget.reset();
      loadResources();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

function wireActions() {
  $('#refreshAlerts').addEventListener('click', loadPublicAlerts);
  $('#loadFines').addEventListener('click', loadFines);
  $('#loadResources').addEventListener('click', loadResources);
  $('#loadAdminAlerts').addEventListener('click', loadAdminAlerts);
  $('#logoutButton').addEventListener('click', () => {
    Object.assign(state, { citizenToken: '', citizenName: '', adminToken: '', adminName: '' });
    localStorage.removeItem('citizenToken');
    localStorage.removeItem('citizenName');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    updateSession();
    $('#finesList').className = 'list empty';
    $('#finesList').textContent = 'Entre para consultar suas multas.';
    showToast('Sessão encerrada.');
  });

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('.resolve-alert');
    if (!button) return;

    try {
      const result = await api(`/api/admin/alertas/${button.dataset.id}/resolver`, { method: 'PATCH' });
      showToast(result.mensagem, 'success');
      loadPublicAlerts();
      loadAdminAlerts();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

wireTabs();
wireForms();
wireActions();
updateSession();
loadPublicAlerts();
