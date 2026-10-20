import { useState } from 'react';
import { Clock, Search, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { recentCalls } from '../data/sampleData';
import styles from './PlanPage.module.css';

const OUTCOME_BADGE = {
  Interested:         'badge-new',
  'Demo scheduled':   'badge-new',
  'Verbal close':     'badge-new',
  Qualified:          'badge-new',
  'Proposal requested':'badge-medium',
  'Call back':        'badge-medium',
  'Callback scheduled':'badge-medium',
  'Not interested now':'badge-cold',
};

export default function PlanRecent({ openLeads }) {
  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState('all');

  const filtered = recentCalls
    .filter(c => {
      if (typeFilter === 'inbound')  return c.type === 'Inbound';
      if (typeFilter === 'outbound') return c.type === 'Outbound';
      return true;
    })
    .filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      <div className="page-header">
        <h1>Recent Calls</h1>
        <p>Your complete call history</p>
      </div>

      <div className={styles.controls}>
        <div className="input-wrap" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={14} className="input-icon" />
          <input
            className="input"
            placeholder="Search recent calls…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search recent calls"
          />
        </div>
        <div className="tab-bar">
          {['all','inbound','outbound'].map(f => (
            <button key={f} className={`tab-btn ${typeFilter === f ? 'active' : ''}`}
              onClick={() => setType(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Clock size={32} />
            <p>No recent calls found</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table" aria-label="Recent calls">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Outcome</th>
                  <th>Notes</th>
                  <th style={{ width: 80 }}>Lead</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(call => (
                  <tr key={call.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={`avatar avatar-sm ${call.type === 'Inbound' ? 'avatar-blue' : 'avatar-green'}`}>
                          {call.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{call.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{call.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{call.company}</td>
                    <td style={{ fontSize: 12 }}>{new Date(call.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{call.duration}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        {call.type === 'Inbound'
                          ? <ArrowDownLeft size={12} color="var(--blue)" />
                          : <ArrowUpRight  size={12} color="var(--green-accent)" />}
                        {call.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${OUTCOME_BADGE[call.outcome] || 'badge-gray'}`}>
                        {call.outcome}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200 }}>
                      {call.notes}
                    </td>
                    <td>
                      {call.leadId && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openLeads(call.leadId)}
                          aria-label="View lead"
                        >
                          <ChevronRight size={13} />
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
