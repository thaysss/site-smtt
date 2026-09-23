import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Eye, EyeOff, Pencil, Save, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../services/api';
import { CARGOS } from '../utils/adminPermissions';

const initialForm = { nome: '', matricula: '', cargo: 'analista', senha: '', confirmarSenha: '' };

function AdminUsuarios() {
  const [form, setForm] = useState(initialForm);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [servidores, setServidores] = useState([]);
  const [carregandoServidores, setCarregandoServidores] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [edicao, setEdicao] = useState({ nome: '', matricula: '', cargo: '' });

  const carregarServidores = useCallback(async () => {
    setCarregandoServidores(true);
    try {
      const { data } = await api.get('/auth/admin/servidores');
      setServidores(data);
    } catch (requestError) {
      setErro(requestError.response?.data?.erro || 'Não foi possível carregar os servidores.');
    } finally {
      setCarregandoServidores(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    api.get('/auth/admin/servidores')
      .then(({ data }) => {
        if (ativo) setServidores(data);
      })
      .catch((requestError) => {
        if (ativo) setErro(requestError.response?.data?.erro || 'Não foi possível carregar os servidores.');
      })
      .finally(() => {
        if (ativo) setCarregandoServidores(false);
      });
    return () => { ativo = false; };
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro('');
    setMensagem('');

    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas informadas não coincidem.');
      return;
    }

    setEnviando(true);
    try {
      const { data } = await api.post('/auth/admin/cadastro', {
        nome: form.nome,
        matricula: form.matricula,
        cargo: form.cargo,
        senha: form.senha,
      });
      setMensagem(data.mensagem || 'Servidor cadastrado com senha temporária.');
      setForm(initialForm);
      await carregarServidores();
    } catch (requestError) {
      setErro(requestError.response?.data?.erro || 'Não foi possível cadastrar o administrador.');
    } finally {
      setEnviando(false);
    }
  };

  const iniciarEdicao = (servidor) => {
    setEditandoId(servidor.id);
    setEdicao({ nome: servidor.nome, matricula: servidor.matricula, cargo: servidor.perfil });
    setErro('');
    setMensagem('');
  };

  const salvarEdicao = async (servidorId) => {
    setEnviando(true);
    setErro('');
    setMensagem('');
    try {
      const { data } = await api.put(`/auth/admin/servidores/${servidorId}`, edicao);
      setServidores((atuais) => atuais.map((servidor) => (
        servidor.id === servidorId ? data.servidor : servidor
      )));
      setEditandoId(null);
      setMensagem(data.mensagem || 'Dados do servidor atualizados com sucesso.');
    } catch (requestError) {
      setErro(requestError.response?.data?.erro || 'Não foi possível atualizar o servidor.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="admin-shell admin-users-shell">
      <AdminSidebar activeItem="usuarios" />
      <main className="admin-users-main">
        <header className="admin-users-header">
          <div className="admin-users-heading-icon"><UserPlus size={26} /></div>
          <div>
            <span>Controle de acesso</span>
            <h1>Novo servidor</h1>
            <p>Cadastre o servidor e escolha as funções que ele poderá exercer no painel.</p>
          </div>
        </header>

        <section className="admin-users-grid">
          <form className="admin-users-form" onSubmit={handleSubmit}>
            <div className="admin-users-card-title">
              <h2>Dados do servidor</h2>
              <p>Todos os campos marcados com * são obrigatórios.</p>
            </div>

            {mensagem && <div className="admin-users-message success" role="status"><CheckCircle size={18} />{mensagem}</div>}
            {erro && <div className="admin-users-message error" role="alert">{erro}</div>}

            <div className="admin-users-fields">
              <label>
                Nome completo *
                <input name="nome" value={form.nome} onChange={updateField} maxLength={150} required placeholder="Nome do servidor" autoComplete="name" />
              </label>
              <label>
                Matrícula *
                <input name="matricula" value={form.matricula} onChange={updateField} maxLength={20} required placeholder="Ex.: 12345" autoComplete="username" />
              </label>
              <label className="admin-users-full-field">
                Cargo *
                <select name="cargo" value={form.cargo} onChange={updateField} required>
                  {CARGOS.map((cargo) => <option key={cargo.value} value={cargo.value}>{cargo.label}</option>)}
                </select>
              </label>
              <label>
                Senha temporária *
                <span className="admin-users-password">
                  <input type={mostrarSenha ? 'text' : 'password'} name="senha" value={form.senha} onChange={updateField} minLength={8} required placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
                  <button type="button" onClick={() => setMostrarSenha((value) => !value)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>{mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
              </label>
              <label>
                Confirmar senha temporária *
                <input type={mostrarSenha ? 'text' : 'password'} name="confirmarSenha" value={form.confirmarSenha} onChange={updateField} minLength={8} required placeholder="Repita a senha" autoComplete="new-password" />
              </label>
            </div>

            <div className="admin-users-actions">
              <button type="submit" disabled={enviando}><UserPlus size={18} />{enviando ? 'Cadastrando...' : 'Cadastrar administrador'}</button>
            </div>
            <p>O servidor deverá criar uma nova senha ao entrar pela primeira vez.</p>
          </form>

          <aside className="admin-users-info">
            <ShieldCheck size={30} />
            <h2>Funções por cargo</h2>
            <p>O sistema limita o menu e também protege as operações no servidor.</p>
            <ul>
              {CARGOS.map((cargo) => <li key={cargo.value}><strong>{cargo.label}:</strong> {cargo.descricao}</li>)}
            </ul>
          </aside>
        </section>

        <section className="admin-users-list-card">
          <div className="admin-users-list-heading">
            <div>
              <span><Users size={18} /> Servidores cadastrados</span>
              <p>Edite o nome, a matrícula ou o cargo de um servidor.</p>
            </div>
            <strong>{servidores.length}</strong>
          </div>

          {carregandoServidores ? <p className="admin-users-empty">Carregando servidores...</p> : servidores.length === 0 ? (
            <p className="admin-users-empty">Nenhum servidor cadastrado.</p>
          ) : (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead><tr><th>Nome</th><th>Matrícula</th><th>Cargo</th><th>Senha</th><th aria-label="Ações" /></tr></thead>
                <tbody>
                  {servidores.map((servidor) => {
                    const editando = editandoId === servidor.id;
                    return <tr key={servidor.id}>
                      <td>{editando ? <input value={edicao.nome} maxLength={150} onChange={(event) => setEdicao((atual) => ({ ...atual, nome: event.target.value }))} aria-label="Nome do servidor" /> : servidor.nome}</td>
                      <td>{editando ? <input value={edicao.matricula} maxLength={20} onChange={(event) => setEdicao((atual) => ({ ...atual, matricula: event.target.value }))} aria-label="Matrícula do servidor" /> : servidor.matricula}</td>
                      <td>{editando ? <select value={edicao.cargo} onChange={(event) => setEdicao((atual) => ({ ...atual, cargo: event.target.value }))} aria-label="Cargo do servidor">{CARGOS.map((cargo) => <option key={cargo.value} value={cargo.value}>{cargo.label}</option>)}</select> : servidor.cargo}</td>
                      <td><span className={`admin-users-status ${servidor.senha_temporaria ? 'pending' : 'active'}`}>{servidor.senha_temporaria ? 'Troca pendente' : 'Definida'}</span></td>
                      <td className="admin-users-row-actions">{editando ? <>
                        <button type="button" className="save" onClick={() => salvarEdicao(servidor.id)} disabled={enviando} aria-label="Salvar alterações"><Save size={17} /></button>
                        <button type="button" onClick={() => setEditandoId(null)} disabled={enviando} aria-label="Cancelar edição"><X size={17} /></button>
                      </> : <button type="button" onClick={() => iniciarEdicao(servidor)} aria-label={`Editar ${servidor.nome}`}><Pencil size={17} /></button>}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminUsuarios;
