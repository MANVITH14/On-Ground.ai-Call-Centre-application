import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import styles from './TopBar.module.css';

const PAGE_TITLES = {
  '/dashboard':      { title: 'Dashboard', sub: 'Good morning, Priya 👋' },
  '/plan/calls':     { title: 'Calls to Make', sub: 'Prioritised outbound queue' },
  '/plan/incoming':  { title: 'Incoming Calls', sub: 'Today\'s received calls' },
  '/plan/recent':    { title: 'Recent Calls', sub: 'Your call history' },
  '/calendar':       { title: 'Calendar', sub: 'Your schedule and events' },
  '/pulse':          { title: 'Pulse', sub: 'Team communication hub' },
};

export default function TopBar({ openLeads }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const pageKey = Object.keys(PAGE_TITLES).find(k =>
    location.pathname === k || location.pathname.startsWith(k + '/')
  );
  const pageInfo = PAGE_TITLES[pageKey] || { title: 'On-Ground.ai', sub: '' };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) openLeads(null);
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div>
          <h1 className={styles.pageTitle}>{pageInfo.title}</h1>
          <p className={styles.pageSub}>{pageInfo.sub}</p>
        </div>
      </div>

      <div className={styles.right}>
        <form className={styles.searchForm} onSubmit={handleSearch} role="search">
          <div className="input-wrap">
            <Search size={14} className="input-icon" />
            <input
              className="input"
              style={{ width: '220px', height: '34px', fontSize: '12px' }}
              placeholder="Search leads, contacts…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search"
            />
          </div>
        </form>

        <button
          className={`btn btn-ghost btn-icon ${styles.iconBtn}`}
          aria-label="Help"
          title="Help"
        >
          <HelpCircle size={18} />
        </button>

        <button
          className={`btn btn-ghost btn-icon ${styles.iconBtn}`}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          <span className={styles.notifBadge} aria-label="3 unread">3</span>
        </button>

        <button className={styles.agentMenu} aria-label="Agent menu">
          <div className="avatar avatar-sm avatar-green">PS</div>
          <span className={styles.agentName}>Priya</span>
          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
