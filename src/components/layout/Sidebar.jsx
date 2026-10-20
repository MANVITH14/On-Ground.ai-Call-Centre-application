import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Phone, PhoneIncoming, Clock,
  Calendar, MessageSquare, ChevronDown, ChevronRight,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import styles from './Sidebar.module.css';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  {
    label: 'Plan',
    icon: Phone,
    children: [
      { label: 'Calls to Make', icon: Phone,           to: '/plan/calls' },
      { label: 'Incoming',      icon: PhoneIncoming,   to: '/plan/incoming' },
      { label: 'Recent',        icon: Clock,           to: '/plan/recent' },
    ],
  },
  { label: 'Calendar', icon: Calendar, to: '/calendar' },
  { label: 'Pulse',    icon: MessageSquare, to: '/pulse' },
];

export default function Sidebar() {
  const location = useLocation();
  const planOpen = location.pathname.startsWith('/plan');
  const [planExpanded, setPlanExpanded] = useState(planOpen);

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Zap size={16} fill="currentColor" />
        </div>
        <div>
          <div className={styles.logoName}>On-Ground.ai</div>
          <div className={styles.logoSub}>Call Centre</div>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav} aria-label="Main navigation">
        {NAV.map((item) => {
          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  className={`${styles.navItem} ${planExpanded ? styles.active : ''}`}
                  onClick={() => setPlanExpanded(v => !v)}
                  aria-expanded={planExpanded}
                >
                  <item.icon size={16} />
                  <span className={styles.navLabel}>{item.label}</span>
                  {planExpanded
                    ? <ChevronDown size={14} className={styles.chevron} />
                    : <ChevronRight size={14} className={styles.chevron} />}
                </button>
                {planExpanded && (
                  <div className={styles.subNav}>
                    {item.children.map(child => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `${styles.navItem} ${styles.subItem} ${isActive ? styles.active : ''}`
                        }
                      >
                        <child.icon size={14} />
                        <span className={styles.navLabel}>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <item.icon size={16} />
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Agent card */}
      <div className={styles.agentCard}>
        <div className={`avatar avatar-sm avatar-green ${styles.agentAvatar}`}>PS</div>
        <div className={styles.agentInfo}>
          <div className={styles.agentName}>Priya Sharma</div>
          <div className={styles.agentRole}>Senior Call Agent</div>
        </div>
        <div className="status-dot online" />
      </div>
    </aside>
  );
}
