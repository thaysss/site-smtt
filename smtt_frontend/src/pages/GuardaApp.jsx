import { useEffect, useState } from 'react';
import api from '../services/api';
import GuardaEventos from '../components/GuardaEventos';
import './GuardaApp.css';

export default function GuardaApp() {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [instalacao, setInstalacao] = useState(null);
  const [instalado, setInstalado] = useState(() => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        const { data } = await api.get('/admin/eventos');
        if (ativo) { setEventos(data); setErro(''); }
      } catch {
        if (ativo) setErro('Não foi possível atualizar os eventos. Verifique sua conexão e tente novamente.');
      } finally {
        if (ativo) setCarregando(false);
      }
    };
    carregar();
    const visibilidade = () => { if (document.visibilityState === 'visible') carregar(); };
    window.addEventListener('online', carregar);
    document.addEventListener('visibilitychange', visibilidade);
    return () => { ativo = false; window.removeEventListener('online', carregar); document.removeEventListener('visibilitychange', visibilidade); };
  }, [atualizacao]);

  useEffect(() => {
    const preparar = (event) => { event.preventDefault(); setInstalacao(event); };
    const concluir = () => { setInstalacao(null); setInstalado(true); };
    window.addEventListener('beforeinstallprompt', preparar);
    window.addEventListener('appinstalled', concluir);
    return () => { window.removeEventListener('beforeinstallprompt', preparar); window.removeEventListener('appinstalled', concluir); };
  }, []);

  const sair = () => {
    ['adminToken', 'adminNome', 'adminPerfil', 'adminCargo', 'adminMenuAtivo'].forEach((chave) => localStorage.removeItem(chave));
    window.location.replace('/admin/login?app=guarda');
  };
  const instalar = async () => {
    await instalacao.prompt();
    await instalacao.userChoice;
    setInstalacao(null);
  };

  return <main className="guarda-app">
    <header className="guarda-app-bar"><img src="/SMTT.png" alt="SMTT Propriá" /><div><strong>Agenda de Eventos</strong><small>{localStorage.getItem('adminNome')}</small></div><button type="button" onClick={sair}>Sair</button></header>
    <div className="guarda-app-content">
      {!instalado && <aside className="guarda-install">{instalacao ? <button type="button" onClick={instalar}>Instalar aplicativo</button> : <p>Para instalar, use “Instalar aplicativo” no menu do navegador. No iPhone/iPad, use Compartilhar → Adicionar à Tela de Início.</p>}</aside>}
      <button type="button" onClick={() => setAtualizacao((valor) => valor + 1)}>Atualizar eventos</button>
      {erro && <p role="alert">{erro}</p>}
      {carregando ? <p role="status">Carregando eventos…</p> : <GuardaEventos eventos={eventos} />}
    </div>
  </main>;
}
