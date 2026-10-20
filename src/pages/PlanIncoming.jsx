import { useState } from 'react';
import { PhoneIncoming, Search, Phone, User } from 'lucide-react';
import { incomingCalls } from '../data/sampleData';
import styles from './PlanPage.module.css';

const OUTCOME_BADGE = {
  Qualified:          'badge-new',
  Missed:             'badge-high',
  'Callback scheduled': 'badge-medium',
};

export default function PlanIncoming() {
  const [search, setSearch] = useState('');

  const filtered = incomingCalls.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>Incoming Calls</h1>
        <p>Calls received today and recently</p>
      </div>

      <div className={styles.controls}>
        <div className="input-wrap" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={14} className="input-icon" />
          <input
            className="input"
            placeholder="Search incoming…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search incoming calls"
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <PhoneIncoming size={32} />
            <p>No incoming calls found</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table" aria-label="Incoming calls">
              <thead>
                <tr>
                  <th>Caller</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Outcome</th>
                  <th>Notes</th>
                  <th style={{ width: 80 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(call => (
                  <tr key={call.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={`avatar avatar-sm ${call.name === 'Unknown' ? 'avatar-gold' : 'avatar-blue'}`}>
                          {call.name === 'Unknown' ? <User size={12} /> : call.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{call.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{call.company || '—'}</td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{call.phone}</td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{call.time}</td>
                    <td style={{ fontSize: 12 }}>{call.duration}</td>
                    <td>
                      <span className={`badge ${OUTCOME_BADGE[call.outcome] || 'badge-gray'}`}>
                        {call.outcome}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200 }}>
                      {call.notes || '—'}
                    </td>
                    <td>
                      {call.outcome === 'Missed' && (
                        <button className="btn btn-primary btn-sm">
                          <Phone size={11} /> Call back
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
