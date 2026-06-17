import { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, update } from 'firebase/database';
import { BookOpen, CheckCircle, Clock, AlertCircle, Edit2, X } from 'lucide-react';
import './index.css';

function App() {
  const [manuals, setManuals] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingManual, setEditingManual] = useState(null);
  const [filterCapitulo, setFilterCapitulo] = useState('All');

  useEffect(() => {
    const manualsRef = ref(database, 'site_manuais_v1/manuals');
    const unsubscribe = onValue(manualsRef, (snapshot) => {
      const data = snapshot.val();
      setManuals(data || {});
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingManual) return;
    
    const { id, ...data } = editingManual;
    const manualRef = ref(database, `site_manuais_v1/manuals/${id}`);
    
    try {
      await update(manualRef, data);
      setEditingManual(null);
    } catch (error) {
      console.error("Error updating manual:", error);
      alert("Erro ao atualizar o manual.");
    }
  };

  const getStats = () => {
    const values = Object.values(manuals);
    const total = values.length;
    const ok = values.filter(m => m.status === 'OK').length;
    const pending = total - ok;
    
    // Count how many have 'SIM' for both print and revisao
    const fullyUpdated = values.filter(m => m.print_atualizado === 'SIM' && m.revisao === 'SIM').length;

    return { total, ok, pending, fullyUpdated };
  };

  const stats = getStats();

  const capitulos = [...new Set(Object.values(manuals).map(m => m.capitulo))].sort();

  const filteredManuals = Object.entries(manuals).filter(([id, m]) => {
    if (filterCapitulo === 'All') return true;
    return m.capitulo === filterCapitulo;
  });

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando dados...</div>;
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '48px' }}>
        <h1>Validação de Manuais</h1>
        <p className="subtitle">Gestão e acompanhamento das atualizações de manuais</p>
      </header>

      {/* Stats Dashboard */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card flex items-center gap-4">
          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
            <BookOpen size={32} color="var(--text-main)" />
          </div>
          <div>
            <h3>Total de Manuais</h3>
            <p className="value">{stats.total}</p>
          </div>
        </div>
        
        <div className="glass-card stat-card flex items-center gap-4">
          <div style={{ backgroundColor: 'var(--status-ok-bg)', padding: '16px', borderRadius: '12px' }}>
            <CheckCircle size={32} color="var(--status-ok-text)" />
          </div>
          <div>
            <h3>Status OK</h3>
            <p className="value">{stats.ok}</p>
          </div>
        </div>

        <div className="glass-card stat-card flex items-center gap-4">
          <div style={{ backgroundColor: 'var(--status-pending-bg)', padding: '16px', borderRadius: '12px' }}>
            <Clock size={32} color="var(--status-pending-text)" />
          </div>
          <div>
            <h3>Pendentes</h3>
            <p className="value">{stats.pending}</p>
          </div>
        </div>
      </div>

      <div className="filters">
        <label style={{ fontWeight: 500 }}>Filtrar por Capítulo:</label>
        <select value={filterCapitulo} onChange={(e) => setFilterCapitulo(e.target.value)}>
          <option value="All">Todos os Capítulos</option>
          {capitulos.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Capítulo</th>
                <th>Manual</th>
                <th>Status Geral</th>
                <th>Print Atualizado?</th>
                <th>Revisão?</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredManuals.map(([id, manual]) => (
                <tr key={id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{manual.capitulo}</td>
                  <td style={{ fontWeight: 500 }}>{manual.manual}</td>
                  <td>
                    <span className={`badge ${manual.status === 'OK' ? 'ok' : 'pending'}`}>
                      {manual.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${manual.print_atualizado === 'SIM' ? 'ok' : (manual.print_atualizado === 'NÃO' ? 'error' : 'pending')}`}>
                      {manual.print_atualizado}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${manual.revisao === 'SIM' ? 'ok' : (manual.revisao === 'NÃO' ? 'error' : 'pending')}`}>
                      {manual.revisao}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setEditingManual({ id, ...manual })}
                      title="Editar"
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredManuals.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Nenhum manual encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingManual && (
        <div className="modal-overlay" onClick={() => setEditingManual(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Editar Manual</h2>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setEditingManual(null)}>
                <X size={24} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              <strong>{editingManual.manual}</strong> ({editingManual.capitulo})
            </p>

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={editingManual.status} 
                  onChange={e => setEditingManual({...editingManual, status: e.target.value})}
                >
                  <option value="OK">OK</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Em Revisão">Em Revisão</option>
                </select>
              </div>

              <div className="form-group">
                <label>Print Atualizado?</label>
                <select 
                  value={editingManual.print_atualizado} 
                  onChange={e => setEditingManual({...editingManual, print_atualizado: e.target.value})}
                >
                  <option value="SIM">SIM</option>
                  <option value="NÃO">NÃO</option>
                  <option value="PARCIAL">PARCIAL</option>
                </select>
              </div>

              <div className="form-group">
                <label>Revisão?</label>
                <select 
                  value={editingManual.revisao} 
                  onChange={e => setEditingManual({...editingManual, revisao: e.target.value})}
                >
                  <option value="SIM">SIM</option>
                  <option value="NÃO">NÃO</option>
                  <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingManual(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
