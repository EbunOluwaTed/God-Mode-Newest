import React, { useState, useRef } from 'react';

// Lazy-load canvas-confetti
let confettiModule = null;
const fireConfetti = async (x, y) => {
  if (!confettiModule) {
    confettiModule = (await import('canvas-confetti')).default;
  }
  confettiModule({
    particleCount: 60,
    spread: 70,
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    colors: ['#ff00de', '#ffcf00', '#ffffff', '#ff66ee', '#ffe066'],
    zIndex: 9999,
    startVelocity: 30,
    gravity: 1.2,
    scalar: 0.9,
    ticks: 80,
  });
};

const STATUS_CONFIG = {
  fire: { label: 'URGENT',      color: 'var(--fire-text)', bg: 'var(--fire-dim)', border: 'var(--fire-border)' },
  prog: { label: 'IN PROGRESS', color: 'var(--prog-text)', bg: 'var(--prog-dim)', border: 'var(--prog-border)' },
  wait: { label: 'WAITING',     color: 'var(--wait-text)', bg: 'var(--wait-dim)', border: 'var(--wait-border)' },
  done: { label: 'DONE',        color: 'var(--done-text)', bg: 'var(--done-dim)', border: 'var(--done-border)' },
};

export default function TaskCard({ task, onUpdate, onDelete, showDate = false, isDimmed = false }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    sub: task.sub || '',
    status: task.status,
    due: task.due || '',
  });
  const [hover, setHover] = useState(false);
  const [completing, setCompleting] = useState(false);
  const cardRef = useRef(null);

  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.wait;
  const isDone = task.status === 'done';

  const handleDone = async (e) => {
    if (!isDone) {
      setCompleting(true);
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        await fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
      setTimeout(() => setCompleting(false), 600);
    }
    onUpdate(task.id, { status: isDone ? 'wait' : 'done' });
  };

  const handleSave = async () => {
    await onUpdate(task.id, editData);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ ...cs.card, border: '1px solid var(--accent)', background: 'var(--bg-card)' }}>
        <input
          style={cs.editInput}
          value={editData.title}
          onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
          placeholder="Task title"
          autoFocus
        />
        <input
          style={{ ...cs.editInput, fontSize: 13, color: 'var(--text-secondary)' }}
          value={editData.sub}
          onChange={e => setEditData(d => ({ ...d, sub: e.target.value }))}
          placeholder="Note (optional)"
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select style={cs.editSelect} value={editData.status}
            onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
            <option value="fire">🔥 Urgent</option>
            <option value="prog">🔵 In Progress</option>
            <option value="wait">⏸ Waiting</option>
          </select>
          <input type="date" style={cs.editSelect} value={editData.due}
            onChange={e => setEditData(d => ({ ...d, due: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button style={cs.saveBtn} onClick={handleSave}>Save</button>
          <button style={cs.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="card-lift"
      style={{
        ...cs.card,
        borderLeft: `3px solid ${sc.border}`,
        opacity: isDone ? 0.5 : 1,
        background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        transform: completing ? 'scale(1.02)' : undefined,
        transition: completing
          ? 'transform 0.3s var(--ease-premium)'
          : 'transform var(--transition), box-shadow var(--transition), border-color var(--transition), background var(--transition)',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={cs.cardTop}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...cs.badge, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
            {sc.label}
          </span>
          {task.area && (
            <span style={{ ...cs.badge, color: 'var(--text-secondary)', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              {task.area}
            </span>
          )}
        </div>
        <div style={{ ...cs.cardActions, opacity: hover ? 1 : 0.4 }}>
          <button style={cs.actionBtn} onClick={() => setEditing(true)} title="Edit">✎</button>
          <button style={{ ...cs.actionBtn, color: 'var(--fire-text)' }}
            onClick={() => onDelete(task.id)} title="Delete">✕</button>
        </div>
      </div>

      <h3 style={{
        ...cs.taskTitle,
        textDecoration: isDone ? 'line-through' : 'none',
        color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
      }}>
        {task.title}
      </h3>
      {task.sub && <p style={cs.taskSub}>{task.sub}</p>}

      <div style={cs.cardBottom}>
        {(showDate && task.due) && (
          <span style={cs.dueDate}>{task.due}</span>
        )}
        <button
          style={{
            ...cs.doneBtn,
            background: isDone ? 'var(--gradient)' : 'var(--bg-input)',
            color: isDone ? '#0a0a20' : 'var(--text-muted)',
            border: isDone ? '1px solid transparent' : '1px solid var(--border)',
            marginLeft: 'auto',
          }}
          onClick={handleDone}
        >
          {isDone ? '✓ Done' : 'Mark done'}
        </button>
      </div>
    </div>
  );
}

const cs = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 11,
    position: 'relative',
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
    padding: '3px 9px',
    borderRadius: 99,
    letterSpacing: '0.04em',
  },
  cardActions: {
    display: 'flex',
    gap: 4,
    transition: 'opacity 0.15s',
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 15,
    cursor: 'pointer',
    padding: '3px 7px',
    borderRadius: 6,
    fontFamily: 'var(--font-sans)',
    transition: 'color var(--transition)',
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '-0.2px',
    transition: 'color var(--transition)',
  },
  taskSub: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
  },
  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  dueDate: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-sans)',
  },
  doneBtn: {
    borderRadius: 9,
    padding: '6px 16px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'transform 0.15s, opacity 0.15s',
  },

  // Edit mode
  editInput: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 13px',
    fontSize: 15,
    color: 'var(--text-primary)',
    width: '100%',
    fontFamily: 'var(--font-sans)',
  },
  editSelect: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '8px 11px',
    fontSize: 13,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  saveBtn: {
    background: 'var(--gradient)',
    color: '#0a0a20',
    border: 'none',
    borderRadius: 9,
    padding: '9px 20px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  cancelBtn: {
    background: 'var(--bg-input)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 9,
    padding: '9px 16px',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
};
