import { useState } from 'react';
import { CheckCircle, Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../services/api';

const initialForm = { nome: '', matricula: '', cargo: '', senha: '', confirmarSenha: '' };

function AdminUsuarios() {
  const [form, setForm] = useState(initialForm);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

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
      setMensagem(data.mensagem || 'Administrador cadastrado com sucesso.');
      setForm(initialForm);
    } catch (requestError) {
      setErro(requestError.response?.data?.erro || 'Não foi possível cadastrar o administrador.');
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
            <h1>Novo administrador</h1>
            <p>Cadastre outro servidor para acessar e gerenciar o painel administrativo.</p>
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
                Cargo
                <input name="cargo" value={form.cargo} onChange={updateField} maxLength={50} placeholder="Analista (padrão)" />
              </label>
              <label>
                Senha *
                <span className="admin-users-password">
                  <input type={mostrarSenha ? 'text' : 'password'} name="senha" value={form.senha} onChange={updateField} minLength={8} required placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
                  <button type="button" onClick={() => setMostrarSenha((value) => !value)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>{mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
              </label>
              <label>
                Confirmar senha *
                <input type={mostrarSenha ? 'text' : 'password'} name="confirmarSenha" value={form.confirmarSenha} onChange={updateField} minLength={8} required placeholder="Repita a senha" autoComplete="new-password" />
              </label>
            </div>

            <div className="admin-users-actions">
              <button type="submit" disabled={enviando}><UserPlus size={18} />{enviando ? 'Cadastrando...' : 'Cadastrar administrador'}</button>
            </div>
          </form>

          <aside className="admin-users-info">
            <ShieldCheck size={30} />
            <h2>Acesso protegido</h2>
            <p>O novo servidor terá acesso administrativo completo. Compartilhe as credenciais de forma segura.</p>
            <ul>
              <li>A matrícula deve ser única.</li>
              <li>A senha precisa ter no mínimo 8 caracteres.</li>
              <li>A senha é armazenada de forma protegida.</li>
            </ul>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default AdminUsuarios;
