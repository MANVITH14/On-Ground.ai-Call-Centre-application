import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Video, Phone, Users } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths
} from 'date-fns';
import { calendarEvents } from '../data/sampleData';
import styles from './CalendarPage.module.css';

const EVENT_ICONS = { call: Phone, demo: Video, meeting: Users };
const EVENT_COLORS = {
  call:    { bg: '#E8F3EF', color: '#1A3C34', border: '#3AA878' },
  demo:    { bg: '#EFF6FF', color: '#1D4ED8', border: '#2563EB' },
  meeting: { bg: '#FEF9F0', color: '#92400E', border: '#B5873A' },
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate]   = useState(new Date(2026, 9, 1)); // Oct 2026
  const [selectedDay, setSelectedDay]   = useState(new Date(2026, 9, 20));

  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(currentDate);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });

  const eventsOnDay = (date) =>
    calendarEvents.filter(e => isSameDay(new Date(e.date), date));

  const selectedEvents = eventsOnDay(selectedDay);

  const goToday = () => {
    const today = new Date(2026, 9, 20);
    setCurrentDate(startOfMonth(today));
    setSelectedDay(today);
  };

  return (
    <div className={styles.page}>
      <div className={styles.calendarWrap}>
        {/* Calendar header */}
        <div className={`card ${styles.calCard}`}>
          <div className={styles.calHeader}>
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <h2 className={styles.monthTitle}>{format(currentDate, 'MMMM yyyy')}</h2>
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={goToday} style={{ marginLeft: 8 }}>
              Today
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className={styles.calGrid}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className={styles.dayHeader}>{d}</div>
            ))}

            {/* Day cells */}
            {days.map(day => {
              const events    = eventsOnDay(day);
              const inMonth   = isSameMonth(day, currentDate);
              const today     = isToday(day);
              const selected  = isSameDay(day, selectedDay);
              return (
                <button
                  key={day.toISOString()}
                  className={`${styles.dayCell}
                    ${!inMonth ? styles.otherMonth : ''}
                    ${today     ? styles.today     : ''}
                    ${selected  ? styles.selected  : ''}
                  `}
                  onClick={() => setSelectedDay(day)}
                  aria-label={format(day, 'EEEE, d MMMM yyyy')}
                  aria-pressed={selected}
                >
                  <span className={styles.dayNum}>{format(day, 'd')}</span>
                  <div className={styles.eventDots}>
                    {events.slice(0, 3).map((e, i) => (
                      <span
                        key={i}
                        className={styles.eventDot}
                        style={{ background: EVENT_COLORS[e.type]?.border || '#ccc' }}
                        aria-hidden="true"
                      />
                    ))}
                    {events.length > 3 && (
                      <span className={styles.moreLabel}>+{events.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            {Object.entries(EVENT_COLORS).map(([type, c]) => (
              <div key={type} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: c.border }} />
                <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events panel */}
        <div className={styles.eventsPanel}>
          <div className={`card ${styles.eventsCard}`}>
            <div className={styles.eventsPanelHeader}>
              <Calendar size={15} />
              <span>{format(selectedDay, 'EEEE, d MMMM')}</span>
            </div>
            {selectedEvents.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <Calendar size={28} />
                <p>No events on this day</p>
              </div>
            ) : (
              <div className={styles.eventsList}>
                {selectedEvents.map((ev, i) => {
                  const Icon = EVENT_ICONS[ev.type] || Calendar;
                  const colors = EVENT_COLORS[ev.type] || {};
                  return (
                    <div key={i} className={styles.eventItem}
                      style={{ borderLeftColor: colors.border }}>
                      <div className={styles.eventTime}>{ev.time}</div>
                      <div className={styles.eventBody}>
                        <div className={styles.eventIcon}
                          style={{ background: colors.bg, color: colors.color }}>
                          <Icon size={13} />
                        </div>
                        <div>
                          <div className={styles.eventTitle}>{ev.title}</div>
                          <span className="badge" style={{
                            background: colors.bg,
                            color: colors.color,
                            fontSize: 10
                          }}>
                            {ev.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming month summary */}
          <div className={`card ${styles.summaryCard}`}>
            <div className={styles.summaryHeader}>
              <span>This Month</span>
            </div>
            <div className={styles.summaryStats}>
              {['call','demo','meeting'].map(type => (
                <div key={type} className={styles.summaryStat}>
                  <span className={styles.summaryNum}>
                    {calendarEvents.filter(e => e.type === type && e.date.startsWith('2026-10')).length}
                  </span>
                  <span className={styles.summaryLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
