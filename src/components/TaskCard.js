import React, { useState } from 'react';

const STATUS_CONFIG = {
  fire: { label: 'URGENT', color: 'var(--fire-text)', bg: 'var(--fire-dim)', border: 'var(--fire-border)' },
  prog: { label: 'IN PROGRESS', color: 'var(--prog-text)', bg: 'var(--prog-dim)', border: 'var(--prog-border)' },
  wait: { label: 'WAITING', color: 'var(--wait-text)', bg: 'var(--wait-dim)', border: 'var(--wait-border)' },
  done: { label: 'DONE', color: 'var(--done-text)', bg: 'var(--done-dim)', border: 'var(--done-border)' },
};

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: task.title, sub: task.sub || '', status: task.status, due: task.due || '' });
  const [hover, setHover] = useState(false);

  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.wait;
  const isDone = task.status === 'done';

  const handleDone = () => onUpdate(task.id, { status: isDone ? 'wait' : 'done' });

  const handleSave = async () => {
    await onUpdate(task.id, editData);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ ...css.card, border: '1px solid var(--accent)' }}>
        <input
          style={css.editInput}
          value={editData.title}
          onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
          placeholder="Task title"
          autoFocus
        />
        <input
          style={{ ...css.editInput, fontSize: 13, color: 'var(--text-secondary)' }}
          value={editData.sub}
          onChange={e => setEditData(d => ({ ...d, sub: e.target.value }))}
          placeholder="Note (optional)"
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select style={css.editSelect} value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
            <option value="fire">🔥 Urgent</option>
            <option value="prog">🔵 In Progress</option>
            <option value="wait">⏸ Waiting</option>
          </select>
          <input
            type="date"
            style={css.editSelect}
            value={editData.due}
            onChange={e => setEditData(d => ({ ...d, due: e.target.value }))}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button style={css.saveBtn} onClick={handleSave}>Save</button>
          <button style={css.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...css.card,
        borderLeftColor: sc.border,
        borderLeftWidth: 3,
        opacity: isDone ? 0.55 : 1,
        background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={css.cardTop}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...css.badge, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
            {sc.label}
          </span>
          {task.area && (
            <span style={{ ...css.badge, color: 'var(--text-secondary)', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              {task.area}
            </span>
          )}
        </div>
        <div style={css.cardActions}>
          <button style={css.actionBtn} onClick={() => setEditing(true)} title="Edit">✎</button>
          <button style={{ ...css.actionBtn, color: 'var(--fire-text)' }} onClick={() => onDelete(task.id)} title="Delete">✕</button>
        </div>
      </div>

      <h3 style={{ ...css.taskTitle, textDecoration: isDone ? 'line-through' : 'none' }}>
        {task.title}
      </h3>
      {task.sub && <p style={css.taskSub}>{task.sub}</p>}

      <div style={css.cardBottom}>
        {task.due && <span style={css.dueDate}>{task.due}</span>}
        <button
          style={{ ...css.doneBtn, background: isDone ? 'var(--done-dim)' : 'var(--bg-input)', color: isDone ? 'var(--done-text)' : 'var(--text-muted)', border: `1px solid ${isDone ? 'var(--done-border)' : 'var(--border)'}` }}
          onClick={handleDone}
        >
          {isDone ? '✓ Done' : 'Mark done'}
        </button>
      </div>
    </div>
  );
}

const css = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    transition: 'background 0.15s',
    position: 'relative',
    borderLeft: '3px solid transparent',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 100,
    letterSpacing: '0.04em',
  },
  cardActions: {
    display: 'flex',
    gap: 4,
    opacity: 0.7,
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 15,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 6,
    fontFamily: 'var(--font-sans)',
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
    letterSpacing: '-0.2px',
  },
  taskSub: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dueDate: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-sans)',
  },
  doneBtn: {
    borderRadius: 8,
    padding: '5px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    marginLeft: 'auto',
  },

  // Edit mode
  editInput: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 15,
    color: 'var(--text-primary)',
    width: '100%',
    fontFamily: 'var(--font-sans)',
  },
  editSelect: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  saveBtn: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    borderRadius: 8,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  cancelBtn: {
    background: 'var(--bg-input)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
};
