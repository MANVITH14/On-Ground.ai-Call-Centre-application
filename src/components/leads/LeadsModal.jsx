import { useState } from 'react';
import {
  X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Phone, Mail, MapPin, Building2, Users, DollarSign,
  TrendingUp, Activity, Clock, AlertCircle, ExternalLink
} from 'lucide-react';
import { leads } from '../../data/sampleData';
import styles from './LeadsModal.module.css';

const STATUS_COLOR = {
  Hot:  { bg: '#FFF0F0', color: '#DC3545' },
  Warm: { bg: '#FFF4EC', color: '#E07B39' },
  Cold: { bg: '#EFF6FF', color: '#2563EB' },
};

const SIGNAL_STRENGTH_COLOR = {
  Strong: '#1A3C34',
  Medium: '#B5873A',
  Weak:   '#9B9BAD',
};

function ScoreGauge({ label, value, color }) {
  const clamp = Math.min(100, Math.max(0, value));
  return (
    <div className={styles.gauge}>
      <div className={styles.gaugeTop}>
        <span className={styles.gaugeLabel}>{label}</span>
        <span className={styles.gaugeVal} style={{ color }}>{value}</span>
      </div>
      <div className={styles.gaugeTrack}>
        <div className={styles.gaugeFill} style={{ width: `${clamp}%`, background: color }} />
      </div>
    </div>
  );
}

export default function LeadsModal({ initialLeadId, onClose, startCall }) {
  const initialIdx = initialLeadId
    ? Math.max(0, leads.findIndex(l => l.id === initialLeadId))
    : 0;
  const [idx, setIdx] = useState(initialIdx);
  const [signalsOpen, setSignalsOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const lead = leads[idx];
  const status = STATUS_COLOR[lead.status] || {};
  const canPrev = idx > 0;
  const canNext = idx < leads.length - 1;

  const icpColor = lead.icpScore >= 80 ? '#1A3C34' : lead.icpScore >= 60 ? '#B5873A' : '#DC3545';
  const intentColor = lead.intentScore >= 80 ? '#1A3C34' : lead.intentScore >= 60 ? '#B5873A' : '#DC3545';

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label={`Lead: ${lead.name}`}>
      <div className={`modal-panel ${styles.panel}`}>
        {/* Modal header */}
        <div className={styles.modalHeader}>
          <div className={styles.leadIdentity}>
            <div className="avatar avatar-lg avatar-green">{lead.name.split(' ').map(n=>n[0]).join('')}</div>
            <div>
              <h2 className={styles.leadName}>{lead.name}</h2>
              <div className={styles.leadTitle}>{lead.designation} · {lead.company}</div>
            </div>
            <span className="badge" style={{ background: status.bg, color: status.color, marginLeft: 8 }}>
              {lead.status}
            </span>
          </div>
          <div className={styles.headerActions}>
            <button className="btn btn-primary btn-sm" onClick={() => startCall(lead)} aria-label={`Call ${lead.name}`}>
              <Phone size={13} /> Call
            </button>
            <a href={`mailto:${lead.email}`} className="btn btn-secondary btn-sm" aria-label={`Email ${lead.name}`}>
              <Mail size={13} /> Email
            </a>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close modal">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={!canPrev}
            onClick={() => { setIdx(idx - 1); setSignalsOpen(true); setHistoryOpen(true); }}
            aria-label="Previous lead"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className={styles.paginationInfo}>{idx + 1} / {leads.length}</span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={!canNext}
            onClick={() => { setIdx(idx + 1); setSignalsOpen(true); setHistoryOpen(true); }}
            aria-label="Next lead"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {['overview', 'activity', 'notes'].map(t => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              {/* Left: details */}
              <div className={styles.detailsCol}>
                {/* ICP & Intent scores */}
                <div className={`card ${styles.scoresCard}`}>
                  <div className={styles.scoresHeader}>
                    <Activity size={14} /> Scores
                  </div>
                  <div className={styles.scoresGrid}>
                    <ScoreGauge label="ICP Score"    value={lead.icpScore}    color={icpColor} />
                    <ScoreGauge label="Intent Score" value={lead.intentScore} color={intentColor} />
                  </div>
                </div>

                {/* Contact & company info */}
                <div className={`card ${styles.infoCard}`}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <Phone size={13} className={styles.infoIcon} />
                      <div>
                        <div className={styles.infoLabel}>Phone</div>
                        <div className={styles.infoVal}>{lead.phone}</div>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <Mail size={13} className={styles.infoIcon} />
                      <div>
                        <div className={styles.infoLabel}>Email</div>
                        <a href={`mailto:${lead.email}`} className={styles.infoLink}>{lead.email}</a>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <MapPin size={13} className={styles.infoIcon} />
                      <div>
                        <div className={styles.infoLabel}>Location</div>
                        <div className={styles.infoVal}>{lead.location}</div>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <Building2 size={13} className={styles.infoIcon} />
                      <div>
                        <div className={styles.infoLabel}>Revenue</div>
                        <div className={styles.infoVal}>{lead.revenue}</div>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <Users size={13} className={styles.infoIcon} />
                      <div>
                        <div className={styles.infoLabel}>Employees</div>
                        <div className={styles.infoVal}>{lead.employees}</div>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <DollarSign size={13} className={styles.infoIcon} />
                      <div>
                        <div className={styles.infoLabel}>Deal Size</div>
                        <div className={styles.infoVal} style={{ fontWeight: 700, color: 'var(--gold)' }}>{lead.dealSize}</div>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <TrendingUp size={13} className={styles.infoIcon} />
                      <div>
                        <div className={styles.infoLabel}>Product</div>
                        <div className={styles.infoVal}>{lead.product}</div>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <AlertCircle size={13} className={styles.infoIcon} />
                      <div>
                        <div className={styles.infoLabel}>Next Action</div>
                        <div className={styles.infoVal}>{lead.nextAction}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: signals + history */}
              <div className={styles.signalsCol}>
                {/* Buying signals */}
                <div className={`card ${styles.signalsCard}`}>
                  <button
                    className={styles.collapsibleHeader}
                    onClick={() => setSignalsOpen(v => !v)}
                    aria-expanded={signalsOpen}
                  >
                    <div className={styles.collapsibleTitle}>
                      <Activity size={14} /> Buying Signals ({lead.buyingSignals.length})
                    </div>
                    {signalsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {signalsOpen && (
                    <div className={styles.signalsList}>
                      {lead.buyingSignals.map((s, i) => (
                        <div key={i} className={styles.signalItem}>
                          <div
                            className={styles.signalStrengthDot}
                            style={{ background: SIGNAL_STRENGTH_COLOR[s.strength] }}
                            title={s.strength}
                          />
                          <div className={styles.signalContent}>
                            <div className={styles.signalText}>{s.signal}</div>
                            <div className={styles.signalMeta}>
                              <span className={styles.signalDate}>{new Date(s.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>
                              <span className={styles.signalStrength} style={{ color: SIGNAL_STRENGTH_COLOR[s.strength] }}>
                                {s.strength}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Call history */}
                <div className={`card ${styles.historyCard}`}>
                  <button
                    className={styles.collapsibleHeader}
                    onClick={() => setHistoryOpen(v => !v)}
                    aria-expanded={historyOpen}
                  >
                    <div className={styles.collapsibleTitle}>
                      <Clock size={14} /> Call History ({lead.callHistory.length})
                    </div>
                    {historyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {historyOpen && (
                    <div className={styles.historyList}>
                      {lead.callHistory.map((h, i) => (
                        <div key={i} className={styles.historyItem}>
                          <div className={styles.historyDate}>
                            {new Date(h.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                          </div>
                          <div className={styles.historyContent}>
                            <div className={styles.historyDuration}>
                              <Phone size={11} /> {h.duration}
                            </div>
                            <span className="badge badge-new" style={{ fontSize: 10 }}>{h.outcome}</span>
                            <div className={styles.historyNotes}>{h.notes}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className={styles.activityTab}>
              <div className={`card ${styles.notesCard}`}>
                <div className={styles.notesHeader}><ExternalLink size={13} /> CRM Notes</div>
                <p className={styles.notesText}>{lead.notes}</p>
              </div>
              <div className={`card ${styles.segCard}`}>
                <div className={styles.notesHeader}><Users size={13} /> Segment Info</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-gray">{lead.segment}</span>
                  <span className="badge badge-gray">Assigned: {lead.assignedTo}</span>
                  <span className="badge badge-gray">Last Contact: {lead.lastContact}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className={styles.notesTabArea}>
              <textarea
                className="input"
                style={{ minHeight: 200, resize: 'vertical' }}
                defaultValue={lead.notes}
                placeholder="Add notes…"
                aria-label="Lead notes"
              />
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8, alignSelf: 'flex-end' }}>
                Save Notes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
