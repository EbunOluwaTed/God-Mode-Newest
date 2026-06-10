import React, { useState } from 'react';

export default function AIDumpModal({ onAdd, onClose, today }) {
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('input');

  const STATUS_LABELS = { fire: '🔥 Urgent', prog: '🔵 In Progress', wait: '⏸ Waiting' };

  const handleExtract = async () => {
    if (!text.trim()) return setError('Paste your thoughts first.');
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, today }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || `HTTP ${res.status}`;
        const detail = json.detail ? `\n\nDetail: ${json.detail}` : '';
        const fix = json.fix ? `\n\n💡 Fix: ${json.fix}` : '';
        setError(`${msg}${detail}${fix}`);
        setLoading(false);
        return;
      }
      if (!json.tasks || json.tasks.length === 0) {
        setError('No tasks found. Try being more specific about what you need to do.');
        setLoading(false);
        return;
      }
      setTasks(json.tasks);
      setSelected(new Set(json.tasks.map((_, i) => i)));
      setStep('review');
    } catch (e) {
      setError(`Network error: ${e.message}`);
    }
    setLoading(false);
  };

  const toggleSelect = (i) => {
    setSelected(s => { const ns = new Set(s); ns.has(i) ? ns.delete(i) : ns.add(i); return ns; });
  };

  const handleConfirm = async () => {
    const toAdd = tasks.filter((_, i) => selected.has(i));
    if (toAdd.length === 0) return;
    setLoading(true);
    const err = await onAdd(toAdd);
    if (err) { setError(err.message || 'Failed to save tasks.'); setLoading(false); }
    else { setStep('done'); setLoading(false); }
  };

  return (
    <div style={d.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={d.modal}>
        <div style={d.header}>
          <div>
            <h2 style={d.title}>
              <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ⚡ AI Dump
              </span>
            </h2>
            <p style={d.subtitle}>Dump your thoughts. AI extracts the tasks.</p>
          </div>
          <button style={d.closeBtn} onClick={onClose}>✕</button>
        </div>

        {step === 'input' && (
          <>
            <textarea
              style={d.textarea}
              placeholder={`Write freely. For example:\n\nCall Pastor David about Sunday schedule.\nFinish structural analysis assignment before Friday.\nBuy cement tomorrow morning.\nReply to the NRM client email.`}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={9}
              autoFocus
            />
            {error && (
              <div style={d.errorBox}>
                <strong style={{ display: 'block', marginBottom: 6 }}>❌ Error</strong>
                <pre style={d.errorPre}>{error}</pre>
              </div>
            )}
            <div style={d.footer}>
              <button style={d.cancelBtn} onClick={onClose}>Cancel</button>
              <button style={d.primaryBtn} className="grad-btn"
                onClick={handleExtract} disabled={loading || !text.trim()}>
                {loading ? 'Extracting…' : 'Extract Tasks →'}
              </button>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <p style={d.reviewNote}>
              Found <strong style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {tasks.length} tasks
              </strong>. Select the ones to add:
            </p>
            <div style={d.taskList}>
              {tasks.map((t, i) => (
                <div key={i}
                  style={{
                    ...d.reviewTask,
                    background: selected.has(i) ? 'var(--accent-dim)' : 'var(--bg-input)',
                    border: `1px solid ${selected.has(i) ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                  onClick={() => toggleSelect(i)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      ...d.checkbox,
                      background: selected.has(i) ? 'var(--gradient)' : 'transparent',
                      border: `2px solid ${selected.has(i) ? 'transparent' : 'var(--border-hover)'}`,
                    }}>
                      {selected.has(i) && <span style={{ color: '#0a0a20', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={d.reviewTitle}>{t.title}</p>
                      {t.sub && <p style={d.reviewSub}>{t.sub}</p>}
                    </div>
                  </div>
                  <div style={d.reviewMeta}>
                    {t.area && <span style={d.reviewBadge}>{t.area}</span>}
                    <span style={d.reviewBadge}>{STATUS_LABELS[t.status] || t.status}</span>
                    {t.due && <span style={d.reviewBadge}>{t.due}</span>}
                  </div>
                </div>
              ))}
            </div>
            {error && <div style={d.errorBox}><pre style={d.errorPre}>{error}</pre></div>}
            <div style={d.footer}>
              <button style={d.cancelBtn} onClick={() => { setStep('input'); setError(null); }}>← Back</button>
              <button style={d.primaryBtn} className="grad-btn"
                onClick={handleConfirm} disabled={loading || selected.size === 0}>
                {loading ? 'Adding…' : `Add ${selected.size} mission${selected.size !== 1 ? 's' : ''} →`}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div style={d.doneBlock}>
            <div style={d.doneIcon}>🎯</div>
            <p style={d.doneTitle}>Missions locked in.</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              Your tasks are on the dashboard. Time to execute.
            </p>
            <button style={d.primaryBtn} className="grad-btn" onClick={onClose}>Let's go →</button>
          </div>
        )}
      </div>
    </div>
  );
}

const d = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--bg-overlay)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, backdropFilter: 'blur(6px)',
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 22, padding: 32, width: '100%', maxWidth: 560,
    display: 'flex', flexDirection: 'column', gap: 18,
    maxHeight: '90vh', overflowY: 'auto',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)' },
  closeBtn: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 9, padding: '4px 11px', fontSize: 15,
    color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
  },
  textarea: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 13, padding: 16, fontSize: 15, color: 'var(--text-primary)',
    width: '100%', resize: 'vertical', lineHeight: 1.65, fontFamily: 'var(--font-sans)',
  },
  errorBox: {
    background: 'var(--fire-dim)', border: '1px solid var(--fire-border)',
    borderRadius: 10, padding: '14px 16px', color: 'var(--fire-text)', fontSize: 13,
  },
  errorPre: {
    fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    fontSize: 13, lineHeight: 1.6,
  },
  footer: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    background: 'transparent', border: '1px solid var(--border)', borderRadius: 11,
    padding: '11px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  primaryBtn: {
    borderRadius: 11, padding: '11px 24px', fontSize: 14, fontFamily: 'var(--font-sans)',
  },
  reviewNote: { fontSize: 15, color: 'var(--text-secondary)' },
  taskList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' },
  reviewTask: {
    borderRadius: 13, padding: '12px 14px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'border-color 0.15s, background 0.15s',
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.15s',
  },
  reviewTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' },
  reviewSub: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  reviewMeta: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  reviewBadge: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 99, padding: '2px 9px', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500,
  },
  doneBlock: { textAlign: 'center', padding: '20px 0' },
  doneIcon: { fontSize: 52, marginBottom: 14 },
  doneTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-serif)' },
};
