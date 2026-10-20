import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Hash, Trophy, ChevronRight,
  Bot, Zap, Send, Star
} from 'lucide-react';
import {
  pulseChannels, teamMembers, kudos,
  roleAgents, avaniMessages, currentAgent
} from '../data/sampleData';
import styles from './PulsePage.module.css';

export default function PulsePage() {
  const navigate = useNavigate();
  const [avaniInput, setAvaniInput] = useState('');
  const [messages, setMessages] = useState(avaniMessages);

  const sendAvani = (e) => {
    e.preventDefault();
    if (!avaniInput.trim()) return;
    const userMsg = {
      id: `USR-${Date.now()}`,
      role: 'user',
      content: avaniInput.trim(),
      timestamp: new Date().toISOString(),
    };
    const botReply = {
      id: `BOT-${Date.now()}`,
      role: 'bot',
      content: getBotReply(avaniInput.trim()),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg, botReply]);
    setAvaniInput('');
  };

  const getBotReply = (q) => {
    const lower = q.toLowerCase();
    if (lower.includes('contract') || lower.includes('amit')) {
      return '📋 I\'ve drafted a contract email for Amit Singhania. Subject: "HomeDecor Plus – Contract for Retail Analytics Suite". Want me to add a 10% discount clause as discussed?';
    }
    if (lower.includes('lead') || lower.includes('hot')) {
      return '🔥 Your hottest leads today: Amit Singhania (ICP 91, verbal close), Vikram Nair (ICP 65, demo scheduled). Should I prepare talking points?';
    }
    if (lower.includes('call') || lower.includes('schedule')) {
      return '📞 You have 4 calls scheduled today. Next up: Arjun Mehta at 10:30 AM for a pricing follow-up. Want me to pull his call history?';
    }
    return '✅ Got it! I\'ll help you with that. Is there anything specific you\'d like me to prepare or look up?';
  };

  const totalUnread = pulseChannels.reduce((s, c) => s + c.unread, 0);

  return (
    <div className={styles.page}>
      {/* Left: Avani + Agents */}
      <div className={styles.leftCol}>
        {/* AvaniBot */}
        <div className={`card ${styles.avaniCard}`}>
          <div className={styles.avaniHeader}>
            <div className={styles.avaniIcon}>
              <Bot size={16} />
            </div>
            <div>
              <div className={styles.avaniTitle}>AvaniBot</div>
              <div className={styles.avaniSub}>AI Sales Assistant · Always on</div>
            </div>
            <span className="badge badge-new" style={{ fontSize: 10 }}>AI</span>
          </div>

          <div className={styles.chatMessages} id="avani-chat">
            {messages.map(msg => (
              <div key={msg.id}
                className={`${styles.chatBubble} ${msg.role === 'user' ? styles.userBubble : styles.botBubble}`}>
                {msg.role === 'bot' && (
                  <div className={`avatar avatar-sm avatar-green ${styles.botAvatar}`}>A</div>
                )}
                <div className={styles.bubbleBody}>
                  <div className={styles.bubbleText}
                    dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                  />
                  <div className={styles.bubbleTime}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className={`avatar avatar-sm avatar-gold ${styles.userAvatar}`}>PS</div>
                )}
              </div>
            ))}
          </div>

          <form className={styles.chatInput} onSubmit={sendAvani}>
            <input
              className="input"
              placeholder="Ask AvaniBot anything…"
              value={avaniInput}
              onChange={e => setAvaniInput(e.target.value)}
              aria-label="Message AvaniBot"
            />
            <button type="submit" className="btn btn-primary" aria-label="Send">
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Role Agents */}
        <div className={`card ${styles.agentsCard}`}>
          <div className={styles.sectionHeader}>
            <Zap size={15} />
            AI Role Agents
          </div>
          <div className={styles.agentsList}>
            {roleAgents.map(agent => (
              <div key={agent.id} className={styles.agentItem}>
                <div className={styles.agentEmoji}>{agent.icon}</div>
                <div className={styles.agentInfo}>
                  <div className={styles.agentName}>{agent.name}</div>
                  <div className={styles.agentDesc}>{agent.description}</div>
                </div>
                <span className={`badge ${agent.status === 'active' ? 'badge-new' : 'badge-gray'}`}>
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Channels + Team + Kudos */}
      <div className={styles.rightCol}>
        {/* Channels */}
        <div className={`card ${styles.channelsCard}`}>
          <div className={styles.sectionHeader}>
            <Hash size={15} />
            Channels
            {totalUnread > 0 && (
              <span className={styles.unreadBadge}>{totalUnread}</span>
            )}
          </div>
          {pulseChannels.map(ch => (
            <button
              key={ch.id}
              className={styles.channelItem}
              onClick={() => navigate(`/pulse/channel/${ch.id}`)}
              aria-label={`Open channel ${ch.name}`}
            >
              <div className={styles.channelLeft}>
                <span className={styles.channelHash}>#</span>
                <div>
                  <div className={styles.channelName}>
                    {ch.name}
                    {ch.pinned && <Star size={10} fill="currentColor" className={styles.pinIcon} />}
                  </div>
                  <div className={styles.channelDesc}>{ch.description}</div>
                </div>
              </div>
              <div className={styles.channelRight}>
                {ch.unread > 0 && (
                  <span className={styles.channelUnread}>{ch.unread}</span>
                )}
                <ChevronRight size={14} className={styles.channelChevron} />
              </div>
            </button>
          ))}
        </div>

        {/* Team status */}
        <div className={`card ${styles.teamCard}`}>
          <div className={styles.sectionHeader}>
            <MessageSquare size={15} />
            Team Online
          </div>
          {teamMembers.map(m => (
            <div key={m.id} className={styles.teamMember}>
              <div style={{ position: 'relative' }}>
                <div className="avatar avatar-sm avatar-green">{m.avatar}</div>
                <div className={`status-dot ${m.status}`} style={{
                  position: 'absolute', bottom: 0, right: 0,
                  border: '1.5px solid var(--bg-card)'
                }} />
              </div>
              <div className={styles.memberInfo}>
                <div className={styles.memberName}>{m.name}</div>
                <div className={styles.memberRole}>{m.role}</div>
              </div>
              <div className={styles.memberStats}>
                <span className={styles.memberCallStat}>{m.calls} calls</span>
                <span className={styles.memberConvStat}>{m.conversions} closed</span>
              </div>
            </div>
          ))}
        </div>

        {/* Kudos */}
        <div className={`card ${styles.kudosCard}`}>
          <div className={styles.sectionHeader}>
            <Trophy size={15} />
            Recent Kudos
          </div>
          {kudos.map((k, i) => (
            <div key={i} className={styles.kudoItem}>
              <div className={styles.kudoEmoji}>{k.emoji}</div>
              <div className={styles.kudoBody}>
                <div className={styles.kudoText}>
                  <strong>{k.from}</strong> → <strong>{k.to}</strong>
                </div>
                <div className={styles.kudoMsg}>{k.message}</div>
                <div className={styles.kudoDate}>{new Date(k.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
