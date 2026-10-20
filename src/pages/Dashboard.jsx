import { useState } from 'react';
import {
  Phone, TrendingUp, Clock, Target, DollarSign,
  Users, CheckSquare, ChevronRight, PhoneCall,
  AlertCircle, BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend
} from 'recharts';
import {
  kpiData, weeklyChartData, leads, tasks,
  waitingUsers, callsToMake
} from '../data/sampleData';
import styles from './Dashboard.module.css';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function pct(v, t) { return Math.round((v / t) * 100); }

function KpiCard({ icon: Icon, iconColor, label, value, sub, progress }) {
  return (
    <div className={`card ${styles.kpiCard}`}>
      <div className={styles.kpiHeader}>
        <div className={styles.kpiIcon} style={{ background: iconColor + '20', color: iconColor }}>
          <Icon size={16} />
        </div>
        <span className={styles.kpiLabel}>{label}</span>
      </div>
      <div className={styles.kpiValue}>{value}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
      {progress != null && (
        <div className={styles.kpiProgress}>
          <div className={styles.kpiProgressTrack}>
            <div
              className={styles.kpiProgressFill}
              style={{ width: `${Math.min(progress, 100)}%`, background: iconColor }}
            />
          </div>
          <span className={styles.kpiProgressPct}>{progress}%</span>
        </div>
      )}
    </div>
  );
}

const STATUS_COLOR = { Hot: '#DC3545', Warm: '#E07B39', Cold: '#2563EB' };

export default function Dashboard({ openLeads, startCall }) {
  const [tasksDone, setTasksDone] = useState(
    () => tasks.reduce((acc, t) => { acc[t.id] = t.done; return acc; }, {})
  );
  const [chartTab, setChartTab] = useState('calls');

  const callPct = pct(kpiData.callsToday, kpiData.callsTarget);

  const pendingCalls = callsToMake.filter(c => c.status === 'pending');

  return (
    <div className={styles.page}>
      {/* KPI Row */}
      <section className={styles.kpiGrid} aria-label="Key performance indicators">
        <KpiCard
          icon={Phone}
          iconColor="#1A3C34"
          label="Calls Today"
          value={kpiData.callsToday}
          sub={`Target: ${kpiData.callsTarget}`}
          progress={callPct}
        />
        <KpiCard
          icon={TrendingUp}
          iconColor="#3AA878"
          label="Conversion Rate"
          value={`${kpiData.conversionRate}%`}
          sub="This week"
        />
        <KpiCard
          icon={Clock}
          iconColor="#B5873A"
          label="Avg Call Duration"
          value={kpiData.avgCallDuration}
          sub="Per call"
        />
        <KpiCard
          icon={Target}
          iconColor="#2563EB"
          label="Leads Contacted"
          value={kpiData.leadsContacted}
          sub={`${kpiData.appointmentsSet} appointments`}
        />
        <KpiCard
          icon={DollarSign}
          iconColor="#B5873A"
          label="Earnings Today"
          value={`₹${kpiData.earningsToday.toLocaleString()}`}
          sub={`Month: ₹${kpiData.earningsMonth.toLocaleString()}`}
        />
      </section>

      {/* Main content grid */}
      <div className={styles.mainGrid}>
        {/* Left column */}
        <div className={styles.leftCol}>
          {/* Chart */}
          <div className={`card ${styles.chartCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <BarChart2 size={16} />
                7-Day Performance
              </div>
              <div className="tab-bar">
                {['calls', 'conversions', 'earnings'].map(tab => (
                  <button
                    key={tab}
                    className={`tab-btn ${chartTab === tab ? 'active' : ''}`}
                    onClick={() => setChartTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              {chartTab === 'earnings' ? (
                <AreaChart data={weeklyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B5873A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#B5873A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9B9BAD' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9B9BAD' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E3DD' }} />
                  <Area type="monotone" dataKey="earnings" stroke="#B5873A" fill="url(#earnGrad)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <BarChart data={weeklyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9B9BAD' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9B9BAD' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E3DD' }} />
                  {chartTab === 'calls' && (
                    <>
                      <Bar dataKey="calls" fill="#1A3C34" radius={[3, 3, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="conversions" fill="#3AA878" radius={[3, 3, 0, 0]} maxBarSize={28} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </>
                  )}
                  {chartTab === 'conversions' && (
                    <Bar dataKey="conversions" fill="#3AA878" radius={[3, 3, 0, 0]} maxBarSize={36} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Pending calls queue */}
          <div className={`card ${styles.callsCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <PhoneCall size={16} />
                Calls Queue
              </div>
              <a href="/plan/calls" className={`btn btn-ghost btn-sm`} style={{ fontSize: 12 }}>
                View all <ChevronRight size={12} />
              </a>
            </div>
            <div className={styles.callsList}>
              {pendingCalls.map(call => (
                <div key={call.id} className={styles.callItem}>
                  <div className={styles.callItemLeft}>
                    <div className={`avatar avatar-sm avatar-green`}>
                      {call.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className={styles.callName}>{call.name}</div>
                      <div className={styles.callSub}>{call.company} · {call.scheduledTime}</div>
                    </div>
                  </div>
                  <div className={styles.callItemRight}>
                    <span className={`badge badge-${call.priority.toLowerCase()}`}>{call.priority}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => startCall({ ...call, id: call.leadId })}
                      aria-label={`Call ${call.name}`}
                    >
                      <Phone size={12} /> Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          {/* Waiting users */}
          <div className={`card ${styles.waitCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Users size={16} />
                Waiting ({waitingUsers.length})
              </div>
            </div>
            {waitingUsers.map(u => (
              <div key={u.id} className={styles.waitItem}>
                <div className={`avatar avatar-sm avatar-blue`}>
                  {u.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={styles.waitInfo}>
                  <div className={styles.waitName}>{u.name}</div>
                  <div className={styles.waitSub}>{u.company} · {u.query}</div>
                </div>
                <div className={styles.waitMeta}>
                  <span className={styles.waitTime}>{u.waitTime}</span>
                  <span className={`badge badge-${u.priority.toLowerCase()}`}>{u.priority}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Hot leads */}
          <div className={`card ${styles.leadsCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <AlertCircle size={16} />
                Hot Leads
              </div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => openLeads()}>
                All leads <ChevronRight size={12} />
              </button>
            </div>
            {leads.filter(l => l.status === 'Hot').map(lead => (
              <div key={lead.id} className={styles.leadItem} onClick={() => openLeads(lead.id)} role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && openLeads(lead.id)}>
                <div className={styles.leadLeft}>
                  <div className="avatar avatar-sm avatar-green">
                    {lead.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className={styles.leadName}>{lead.name}</div>
                    <div className={styles.leadSub}>{lead.company}</div>
                  </div>
                </div>
                <div className={styles.leadRight}>
                  <div className={styles.leadScore}>
                    <span className={styles.scoreLabel}>ICP</span>
                    <div className="score-bar-track" style={{ width: 48 }}>
                      <div
                        className="score-bar-fill high"
                        style={{ width: `${lead.icpScore}%` }}
                      />
                    </div>
                    <span className={styles.scoreVal}>{lead.icpScore}</span>
                  </div>
                  <span className={styles.dealSize}>{lead.dealSize}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tasks */}
          <div className={`card ${styles.tasksCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <CheckSquare size={16} />
                Today's Tasks
              </div>
              <span className={styles.taskCount}>
                {Object.values(tasksDone).filter(Boolean).length}/{tasks.length}
              </span>
            </div>
            <div className={styles.tasksList}>
              {tasks.map(task => (
                <div key={task.id} className={`${styles.taskItem} ${tasksDone[task.id] ? styles.taskDone : ''}`}>
                  <input
                    type="checkbox"
                    id={`task-${task.id}`}
                    checked={!!tasksDone[task.id]}
                    onChange={() => setTasksDone(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                    className={styles.taskCheck}
                    aria-label={task.title}
                  />
                  <label htmlFor={`task-${task.id}`} className={styles.taskBody}>
                    <span className={styles.taskTitle}>{task.title}</span>
                    <span className={styles.taskMeta}>
                      <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                      <span className={styles.taskDue}>{task.due}</span>
                    </span>
                  </label>
                  {task.leadId && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openLeads(task.leadId)}
                      title="Open lead"
                      aria-label="Open lead"
                    >
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
