import { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, update } from 'firebase/database';
import { BookOpen, CheckCircle, Clock, Search } from 'lucide-react';
import './index.css';

function App() {
  const [manuals, setManuals] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Advanced Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCapitulo, setFilterCapitulo] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'OK', 'Pendente', 'Em Revisão'
  const [hideCompleted, setHideCompleted] = useState(false);

  useEffect(() => {
    const manualsRef = ref(database, 'site_manuais_v1/manuals');
    const unsubscribe = onValue(manualsRef, (snapshot) => {
      const data = snapshot.val();
      setManuals(data || {});
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFieldChange = async (id, field, newValue) => {
    const manualRef = ref(database, `site_manuais_v1/manuals/${id}`);
    try {
      await update(manualRef, { [field]: newValue });
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
    
    return { total, ok, pending };
  };

  const stats = getStats();

  const capitulos = [...new Set(Object.values(manuals).map(m => m.capitulo))].sort();

  const isManualCompleted = (m) => m.status === 'OK';

  const filteredManuals = Object.entries(manuals).filter(([id, m]) => {
    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const searchLower = searchQuery.toLowerCase();
      if (!m.manual.toLowerCase().includes(searchLower) && !m.capitulo.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // 2. Hide Completed
    if (hideCompleted && isManualCompleted(m)) {
      return false;
    }

    // 3. Filter Capitulo
    if (filterCapitulo !== 'All' && m.capitulo !== filterCapitulo) {
      return false;
    }

    // 4. Filter Status
    if (filterStatus !== 'All' && m.status !== filterStatus) {
      return false;
    }

    return true;
  });

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando dados...</div>;
  }

  // Custom inline select component to match badge style
  const InlineSelect = ({ value, options, onChange, type }) => {
    let badgeClass = 'pending';
    if (value === 'OK' || value === 'SIM') badgeClass = 'ok';
    if (value === 'NÃO') badgeClass = 'error';

    return (
      <div className={`badge ${badgeClass}`} style={{ padding: 0, overflow: 'hidden', display: 'inline-block', minWidth: '140px' }}>
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            fontWeight: '600',
            fontSize: '0.85rem',
            padding: '4px 12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            appearance: 'none',
            outline: 'none',
            width: '100%',
            textAlign: 'center'
          }}
        >
          {options.map(opt => (
            <option key={opt} value={opt} style={{ textTransform: 'none' }}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  };

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

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group" style={{ flex: 2 }}>
          <label><Search size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Buscar Manual</label>
          <input 
            type="text" 
            placeholder="Digite o nome do manual..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Status Geral</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">Todos os Status</option>
            <option value="Pendente">Apenas Pendentes</option>
            <option value="OK">Apenas OK</option>
            <option value="Em Revisão">Em Revisão</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Capítulo</label>
          <select value={filterCapitulo} onChange={(e) => setFilterCapitulo(e.target.value)}>
            <option value="All">Todos os Capítulos</option>
            {capitulos.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="filter-group" style={{ flex: 'none', alignSelf: 'flex-end', paddingBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textTransform: 'none', color: 'var(--text-main)', fontSize: '0.95rem' }}>
            <span className="switch">
              <input 
                type="checkbox" 
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
              />
              <span className="slider"></span>
            </span>
            Ocultar Finalizados
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Mostrando <strong>{filteredManuals.length}</strong> de {stats.total} manuais
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
              </tr>
            </thead>
            <tbody>
              {filteredManuals.map(([id, manual]) => {
                const isCompleted = isManualCompleted(manual);
                return (
                <tr key={id} className={isCompleted ? 'completed-row' : ''}>
                  <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{manual.capitulo}</td>
                  <td style={{ fontWeight: 500 }}>{manual.manual}</td>
                  <td style={{ textDecoration: 'none' }}>
                    <InlineSelect 
                      value={manual.status} 
                      options={['OK', 'Pendente', 'Em Revisão']}
                      onChange={(val) => handleFieldChange(id, 'status', val)}
                    />
                  </td>
                  <td style={{ textDecoration: 'none' }}>
                    <InlineSelect 
                      value={manual.print_atualizado} 
                      options={['SIM', 'NÃO', 'PARCIAL']}
                      onChange={(val) => handleFieldChange(id, 'print_atualizado', val)}
                    />
                  </td>
                  <td style={{ textDecoration: 'none' }}>
                    <InlineSelect 
                      value={manual.revisao} 
                      options={['SIM', 'NÃO', 'EM ANDAMENTO']}
                      onChange={(val) => handleFieldChange(id, 'revisao', val)}
                    />
                  </td>
                </tr>
              )})}
              {filteredManuals.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    Nenhum manual encontrado para estes filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
