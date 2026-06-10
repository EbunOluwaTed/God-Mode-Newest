import React, { useState } from 'react';
import TaskCard from './TaskCard';

export default function AllTasksPanel({ tasks, categories, onUpdate, onDelete }) {
  const [filter, setFilter] = useState('pending'); // pending | done | all
  const [sortBy, setSortBy] = useState('urgency');
  const [catFilter, setCatFilter] = useState('All');

  const statusOrder = { fire: 0, prog: 1, wait: 2, done: 3 };

  let filtered = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'done';
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  if (catFilter !== 'All') filtered = filtered.filter(t => t.area === catFilter);

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'urgency') return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    if (sortBy === 'date') return (a.due || '9999') < (b.due || '9999') ? -1 : 1;
    if (sortBy === 'category') return (a.area || '').localeCompare(b.area || '');
    return 0; // recent
  });

  const pending = tasks.filter(t => t.status !== 'done').length;
  const done = tasks.filter(t => t.status === 'done').length;

  return (
    <div>
      <div style={css.topBar}>
        <div>
          <h1 style={css.heading}>All Tasks</h1>
          <p style={css.sub}>{pending} pending · {done} done</p>
        </div>
      </div>

      {/* Filters */}
      <div style={css.controlRow}>
        <div style={css.pills}>
          {['pending', 'done', 'all'].map(f => (
            <button key={f} style={filter === f ? css.pillActive : css.pill} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={css.pills}>
          {['All', ...categories].map(cat => (
            <button key={cat} style={catFilter === cat ? css.pillActive : css.pill} onClick={() => setCatFilter(cat)}>
              {cat}
            </button>
          ))}
        </div>
        <div style={css.sortRow}>
          <span style={css.sortLabel}>Sort:</span>
          {['urgency','date','category','recent'].map(s => (
            <button key={s} style={sortBy === s ? css.pillActive : css.pill} onClick={() => setSortBy(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={css.empty}>No tasks here yet.</div>
      ) : (
        <div style={css.grid}>
          {filtered.map(t => (
            <TaskCard key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

const css = {
  topBar: { marginBottom: 28 },
  heading: { fontSize: 'clamp(30px, 3.5vw, 48px)', fontWeight: 700, letterSpacing: '-1px', color: 'var(--text-primary)' },
  sub: { fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 },
  controlRow: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 },
  pills: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pill: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 100, padding: '6px 14px', fontSize: 13,
    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  pillActive: {
    background: 'var(--accent)', border: '1px solid var(--accent)',
    borderRadius: 100, padding: '6px 14px', fontSize: 13,
    color: 'var(--text-on-accent)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  sortRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  sortLabel: { fontSize: 13, color: 'var(--text-muted)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 14,
  },
  empty: { color: 'var(--text-muted)', fontSize: 16, padding: '60px 0', textAlign: 'center' },
};
