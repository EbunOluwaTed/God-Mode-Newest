import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay, addMonths, subMonths } from 'date-fns';

export default function CalendarModal({ activeDate, onSelect, onClose }) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(activeDate));

  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const startPad = getDay(days[0]); // 0=Sun
  const padded = [...Array(startPad).fill(null), ...days];

  return (
    <div style={css.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={css.modal}>
        <div style={css.header}>
          <button style={css.navBtn} onClick={() => setViewMonth(m => subMonths(m, 1))}>‹</button>
          <h2 style={css.monthLabel}>{format(viewMonth, 'MMMM yyyy')}</h2>
          <button style={css.navBtn} onClick={() => setViewMonth(m => addMonths(m, 1))}>›</button>
        </div>

        <div style={css.grid7}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={css.dayName}>{d}</div>
          ))}
          {padded.map((day, i) => (
            <div key={i}>
              {day ? (
                <button
                  style={{
                    ...css.dayBtn,
                    background: isSameDay(day, activeDate)
                      ? 'var(--accent)'
                      : isToday(day)
                      ? 'var(--accent-dim)'
                      : 'transparent',
                    color: isSameDay(day, activeDate)
                      ? 'var(--text-on-accent)'
                      : isToday(day)
                      ? 'var(--accent)'
                      : isSameMonth(day, viewMonth)
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                    fontWeight: isSameDay(day, activeDate) || isToday(day) ? 700 : 400,
                    border: isToday(day) && !isSameDay(day, activeDate) ? '1px solid var(--accent)' : '1px solid transparent',
                  }}
                  onClick={() => onSelect(day)}
                >
                  {format(day, 'd')}
                </button>
              ) : <div />}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 8 }}>
          <button style={css.todayJumpBtn} onClick={() => onSelect(new Date())}>Jump to Today</button>
          <button style={css.closeModalBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const css = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--bg-overlay)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '28px 28px 24px',
    width: '100%',
    maxWidth: 380,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' },
  navBtn: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 8, width: 32, height: 32,
    fontSize: 18, color: 'var(--text-secondary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
  },
  grid7: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
  },
  dayName: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textAlign: 'center', padding: '4px 0', letterSpacing: '0.04em',
  },
  dayBtn: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'background 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayJumpBtn: {
    background: 'var(--accent)', color: 'var(--text-on-accent)',
    border: 'none', borderRadius: 10,
    padding: '9px 20px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  closeModalBtn: {
    background: 'transparent', color: 'var(--text-secondary)',
    border: '1px solid var(--border)', borderRadius: 10,
    padding: '9px 18px', fontSize: 14,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
};
