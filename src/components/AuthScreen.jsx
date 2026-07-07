import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Lock, Mail, Key, LogOut, Clock, ShieldAlert, RefreshCw, ArrowRight, CheckCircle } from 'lucide-react';

export default function AuthScreen({ user, status, onRefresh }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        // Criar registro no Firestore na coleção usuarios_aprovados
        await setDoc(doc(db, "usuarios_aprovados", res.user.uid), {
          email: email,
          status: 'pendente',
          criadoEm: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Erro na autenticação:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Tente fazer login.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Ocorreu um erro ao autenticar. Verifique seus dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  // Se estiver logado, mas não aprovado (pendente, rejeitado ou não encontrado)
  if (user && status !== 'aprovado') {
    return (
      <div className="auth-container">
        <div className="glass-card auth-card text-center" style={{ maxWidth: '450px', margin: '0 auto', padding: '40px 32px' }}>
          <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock size={36} color="#fde047" />
          </div>
          
          <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Aguardando Aprovação</h2>
          
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
            Sua conta (<strong style={{ color: 'var(--text-main)' }}>{user.email}</strong>) foi registrada e está em análise.
            Para garantir a segurança do sistema de manuais, um administrador precisa aprovar o seu acesso no banco de dados.
          </p>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status no Firestore:</span>
              <span className={`badge ${status === 'pendente' ? 'pending' : 'error'}`} style={{ fontSize: '0.75rem' }}>
                {status || 'Pendente'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Coleção: <code style={{ color: 'var(--accent-color)' }}>/usuarios_aprovados</code>
            </p>
          </div>

          <div className="flex gap-4" style={{ flexDirection: 'column' }}>
            <button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Verificando...' : 'Verificar se já fui aprovado'}
            </button>

            <button 
              onClick={() => signOut(auth)} 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <LogOut size={18} />
              Sair / Usar outra conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se estiver deslogado -> Tela de Login / Cadastro
  return (
    <div className="auth-container">
      <div className="glass-card auth-card" style={{ maxWidth: '420px', margin: '0 auto', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <Lock size={28} color="var(--accent-color)" />
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            {isLogin ? 'Acesso ao Sistema' : 'Criar Nova Conta'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isLogin ? 'Entre com suas credenciais para gerenciar os manuais' : 'Cadastre-se para solicitar acesso de validação'}
          </p>
        </div>

        {/* Abas de alternância */}
        <div className="flex" style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: isLogin ? 'var(--accent-color)' : 'transparent', color: isLogin ? '#fff' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Entrar
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: !isLogin ? 'var(--accent-color)' : 'transparent', color: !isLogin ? '#fff' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Cadastrar
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              <Mail size={14} /> E-mail
            </label>
            <input 
              type="email" 
              required
              placeholder="seu@email.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '1rem', outline: 'none' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              <Key size={14} /> Senha
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '1rem', outline: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '600', justifyContent: 'center', borderRadius: '10px' }}
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar no Sistema' : 'Cadastrar e Solicitar Acesso')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Protegido pelo ecossistema Firebase &bull; Regra V2
          </p>
        </div>
      </div>
    </div>
  );
}
