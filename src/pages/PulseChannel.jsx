import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Hash, Pin, Send, Smile,
  Paperclip, ThumbsUp, CheckCircle, AlertTriangle
} from 'lucide-react';
import { pulseChannels } from '../data/sampleData';
import styles from './PulseChannel.module.css';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

const EMOJI_REACTIONS = ['👍', '🎉', '🔥', '❤️', '👏', '💯'];

export default function PulseChannel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const channel = pulseChannels.find(c => c.id === id);
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState(channel?.messages || []);
  const [replyText, setReplyText] = useState('');
  const [reactions, setReactions] = useState(() => {
    const init = {};
    (channel?.messages || []).forEach(m => { init[m.id] = [...(m.reactions || [])]; });
    return init;
  });
  const [needsInputChoice, setNeedsInputChoice] = useState(null);
  const [needsInputSubmitted, setNeedsInputSubmitted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // msg id

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!channel) {
    return (
      <div>
        <button className="btn btn-ghost" onClick={() => navigate('/pulse')}>
          <ArrowLeft size={14} /> Back to Pulse
        </button>
        <p style={{ marginTop: 24, color: 'var(--text-muted)' }}>Channel not found.</p>
      </div>
    );
  }

  const sendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const newMsg = {
      id: `MSG-${Date.now()}`,
      author: 'Priya Sharma',
      avatar: 'PS',
      role: 'Senior Call Agent',
      timestamp: new Date().toISOString(),
      content: replyText.trim(),
      reactions: [],
    };
    setMessages(prev => [...prev, newMsg]);
    setReactions(prev => ({ ...prev, [newMsg.id]: [] }));
    setReplyText('');
  };

  const addReaction = (msgId, emoji) => {
    setReactions(prev => {
      const msgReactions = [...(prev[msgId] || [])];
      const existing = msgReactions.find(r => r.emoji === emoji);
      if (existing) {
        return {
          ...prev,
          [msgId]: msgReactions.map(r =>
            r.emoji === emoji ? { ...r, count: r.count + 1 } : r
          )
        };
      }
      return { ...prev, [msgId]: [...msgReactions, { emoji, count: 1 }] };
    });
    setShowEmojiPicker(null);
  };

  const handleNeedsInput = () => {
    if (!needsInputChoice) return;
    setNeedsInputSubmitted(true);
    const botMsg = {
      id: `MSG-NI-${Date.now()}`,
      author: 'Priya Sharma',
      avatar: 'PS',
      role: 'Senior Call Agent',
      timestamp: new Date().toISOString(),
      content: `📊 My vote: **${needsInputChoice}**`,
      reactions: [],
    };
    setMessages(prev => [...prev, botMsg]);
    setReactions(prev => ({ ...prev, [botMsg.id]: [] }));
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={`card ${styles.header}`}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/pulse')}
          aria-label="Back to Pulse"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className={styles.channelTitle}>
          <Hash size={16} />
          <div>
            <div className={styles.channelName}>{channel.name}</div>
            <div className={styles.channelMeta}>{channel.members} members · {channel.description}</div>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Pinned card */}
        {channel.pinnedCard && (
          <div className={`card ${styles.pinnedCard}`}>
            <div className={styles.pinnedHeader}>
              <Pin size={13} />
              Pinned
            </div>
            <div className={styles.pinnedContent}>
              <div className={styles.pinnedTitle}>{channel.pinnedCard.title}</div>
              <div className={styles.pinnedSub}>{channel.pinnedCard.subtitle}</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                {channel.pinnedCard.action}
              </button>
            </div>
          </div>
        )}

        {/* Needs your input */}
        {channel.needsInput && (
          <div className={`card ${styles.needsInputCard}`}>
            <div className={styles.needsHeader}>
              <AlertTriangle size={14} />
              Needs Your Input
            </div>
            <div className={styles.needsQuestion}>{channel.needsInput.question}</div>
            {!needsInputSubmitted ? (
              <>
                <div className={styles.needsOptions}>
                  {channel.needsInput.options.map(opt => (
                    <button
                      key={opt}
                      className={`${styles.needsOption} ${needsInputChoice === opt ? styles.needsSelected : ''}`}
                      onClick={() => setNeedsInputChoice(opt)}
                      aria-pressed={needsInputChoice === opt}
                    >
                      {needsInputChoice === opt && <CheckCircle size={12} />}
                      {opt}
                    </button>
                  ))}
                </div>
                <div className={styles.needsActions}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!needsInputChoice}
                    onClick={handleNeedsInput}
                  >
                    Submit Vote
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setNeedsInputSubmitted(true)}>
                    Skip
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.needsSubmitted}>
                <CheckCircle size={14} color="var(--green-accent)" />
                {needsInputChoice ? `Voted: ${needsInputChoice}` : 'Skipped'}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className={`card ${styles.messagesCard}`}>
          <div className={styles.messagesList}>
            {messages.length === 0 ? (
              <div className="empty-state">
                <Hash size={28} />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={styles.messageRow}
                  onMouseLeave={() => setShowEmojiPicker(null)}>
                  <div className={`avatar avatar-md avatar-green ${styles.msgAvatar}`}>
                    {msg.avatar}
                  </div>
                  <div className={styles.msgContent}>
                    <div className={styles.msgMeta}>
                      <span className={styles.msgAuthor}>{msg.author}</span>
                      <span className={styles.msgRole}>{msg.role}</span>
                      <span className={styles.msgTime}>{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className={styles.msgText}
                      dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                    />
                    {/* Reactions */}
                    <div className={styles.reactionRow}>
                      {(reactions[msg.id] || []).map(r => (
                        <button
                          key={r.emoji}
                          className={styles.reactionChip}
                          onClick={() => addReaction(msg.id, r.emoji)}
                          aria-label={`React with ${r.emoji}`}
                        >
                          {r.emoji} <span>{r.count}</span>
                        </button>
                      ))}
                      <button
                        className={styles.addReaction}
                        onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                        aria-label="Add reaction"
                        title="Add reaction"
                      >
                        <Smile size={13} />
                      </button>
                      {showEmojiPicker === msg.id && (
                        <div className={styles.emojiPicker} role="listbox" aria-label="Pick emoji">
                          {EMOJI_REACTIONS.map(em => (
                            <button key={em} className={styles.emojiBtn}
                              onClick={() => addReaction(msg.id, em)}
                              role="option" aria-label={em}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          <form className={styles.replyBox} onSubmit={sendReply}>
            <button type="button" className="btn btn-ghost btn-icon" aria-label="Attach file" title="Attach">
              <Paperclip size={15} />
            </button>
            <input
              className="input"
              placeholder={`Message #${channel.name}…`}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              aria-label="Type a message"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!replyText.trim()}
              aria-label="Send message"
            >
              <Send size={14} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
