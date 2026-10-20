import { useState } from 'react';
import { Phone, Filter, Search, PhoneCall, RotateCcw } from 'lucide-react';
import { callsToMake, leads } from '../data/sampleData';
import styles from './PlanPage.module.css';

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function PlanCalls({ startCall }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [completedIds, setCompletedIds] = useState(
    () => new Set(callsToMake.filter(c => c.status === 'completed').map(c => c.id))
  );

  const toggle = (id) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = callsToMake
    .filter(c => {
      if (filter === 'pending') return !completedIds.has(c.id);
      if (filter === 'completed') return completedIds.has(c.id);
      return true;
    })
    .filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

  const getLead = (id) => leads.find(l => l.id === id);

  return (
    <div>
      <div className="page-header">
        <h1>Calls to Make</h1>
        <p>Your prioritised outbound call queue for today</p>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className="input-wrap" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={14} className="input-icon" />
          <input
            className="input"
            placeholder="Search calls…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search calls"
          />
        </div>
        <div className="tab-bar">
          {['all','pending','completed'].map(f => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{callsToMake.filter(c => !completedIds.has(c.id)).length}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{completedIds.size}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{callsToMake.filter(c => c.priority === 'Critical').length}</span>
          <span className={styles.statLabel}>Critical</span>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <PhoneCall size={32} />
            <p>No calls match your filter</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table" aria-label="Calls to make">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Priority</th>
                  <th>Reason</th>
                  <th>Scheduled</th>
                  <th>Segment</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(call => {
                  const done = completedIds.has(call.id);
                  const lead = getLead(call.leadId);
                  return (
                    <tr key={call.id} className={done ? styles.rowDone : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggle(call.id)}
                          aria-label={`Mark ${call.name} as completed`}
                          style={{ accentColor: 'var(--green-mid)', cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm avatar-green">
                            {call.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{call.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{call.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{call.company}</td>
                      <td>
                        <span className={`badge badge-${call.priority.toLowerCase()}`}>{call.priority}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200 }}>
                        {call.reason}
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 600 }}>{call.scheduledTime}</td>
                      <td>
                        <span className="badge badge-gray">{call.segment}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={done}
                            onClick={() => startCall(lead || call)}
                            aria-label={`Call ${call.name}`}
                          >
                            <Phone size={11} /> Call
                          </button>
                          {done && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => toggle(call.id)}
                              aria-label="Mark as pending again"
                              title="Undo"
                            >
                              <RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
