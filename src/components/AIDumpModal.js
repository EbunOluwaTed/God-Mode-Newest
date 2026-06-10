import React, { useState } from 'react';

export default function AIDumpModal({ onAdd, onClose, today }) {
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('input'); // input | review | done

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
        // Show the actual error from the API — what users asked for
        const msg = json.error || `HTTP ${res.status}`;
        const detail = json.detail ? `\n\nDetail: ${json.detail}` : '';
        const fix = json.fix ? `\n\n💡 Fix: ${json.fix}` : '';
        setError(`${msg}${detail}${fix}`);
        setLoading(false);
        return;
      }

      if (!json.tasks || json.tasks.length === 0) {
        setError('Gemini ran but found no tasks. Try being more specific about what you need to do.');
        setLoading(false);
        return;
      }

      setTasks(json.tasks);
      setSelected(new Set(json.tasks.map((_, i) => i)));
      setStep('review');
    } catch (e) {
      setError(`Network error: ${e.message}\n\nMake sure you're connected and the API route is deployed on Vercel.`);
    }

    setLoading(false);
  };

  const toggleSelect = (i) => {
    setSelected(s => {
      const ns = new Set(s);
      ns.has(i) ? ns.delete(i) : ns.add(i);
      return ns;
    });
  };

  const handleConfirm = async () => {
    const toAdd = tasks.filter((_, i) => selected.has(i));
    if (toAdd.length === 0) return;
    setLoading(true);
    const err = await onAdd(toAdd);
    if (err) {
      setError(err.message || 'Failed to save tasks.');
      setLoading(false);
    } else {
      setStep('done');
      setLoading(false);
    }
  };

  return (
    <div style={css.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={css.modal}>
        <div style={css.header}>
          <div>
            <h2 style={css.title}>⚡ AI Dump</h2>
            <p style={css.subtitle}>Dump your thoughts. AI extracts the tasks.</p>
          </div>
          <button style={css.closeBtn} onClick={onClose}>✕</button>
        </div>

        {step === 'input' && (
          <>
            <textarea
              style={css.textarea}
              placeholder={`Just write freely. For example:\n\nCall Pastor David about Sunday schedule.\nFinish structural analysis assignment before Friday.\nBuy cement tomorrow morning.\nReply to the NRM client email.`}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={9}
              autoFocus
            />
            {error && (
              <div style={css.errorBox}>
                <strong style={{ display: 'block', marginBottom: 6 }}>❌ Error from API</strong>
                <pre style={css.errorPre}>{error}</pre>
              </div>
            )}
            <div style={css.footer}>
              <button style={css.cancelBtn} onClick={onClose}>Cancel</button>
              <button style={css.primaryBtn} onClick={handleExtract} disabled={loading || !text.trim()}>
                {loading ? 'Extracting…' : 'Extract Tasks →'}
              </button>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <p style={css.reviewNote}>
              Found <strong style={{ color: 'var(--accent)' }}>{tasks.length} tasks</strong>. Select the ones to add:
            </p>
            <div style={css.taskList}>
              {tasks.map((t, i) => (
                <div
                  key={i}
                  style={{
                    ...css.reviewTask,
                    background: selected.has(i) ? 'var(--accent-dim)' : 'var(--bg-input)',
                    border: `1px solid ${selected.has(i) ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                  onClick={() => toggleSelect(i)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ ...css.checkbox, background: selected.has(i) ? 'var(--accent)' : 'transparent', border: `2px solid ${selected.has(i) ? 'var(--accent)' : 'var(--border-hover)'}` }}>
                      {selected.has(i) && <span style={{ color: 'var(--text-on-accent)', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={css.reviewTitle}>{t.title}</p>
                      {t.sub && <p style={css.reviewSub}>{t.sub}</p>}
                    </div>
                  </div>
                  <div style={css.reviewMeta}>
                    <span style={css.reviewBadge}>{t.area}</span>
                    <span style={css.reviewBadge}>{STATUS_LABELS[t.status] || t.status}</span>
                    {t.due && <span style={css.reviewBadge}>{t.due}</span>}
                  </div>
                </div>
              ))}
            </div>
            {error && <div style={css.errorBox}><pre style={css.errorPre}>{error}</pre></div>}
            <div style={css.footer}>
              <button style={css.cancelBtn} onClick={() => { setStep('input'); setError(null); }}>← Back</button>
              <button style={css.primaryBtn} onClick={handleConfirm} disabled={loading || selected.size === 0}>
                {loading ? 'Adding…' : `Add ${selected.size} task${selected.size !== 1 ? 's' : ''} →`}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div style={css.doneBlock}>
            <div style={css.doneIcon}>✅</div>
            <p style={css.doneTitle}>Tasks added to your dashboard!</p>
            <button style={css.primaryBtn} onClick={onClose}>Close</button>
          </div>
        )}
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
    padding: 32,
    width: '100%',
    maxWidth: 560,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)' },
  closeBtn: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '4px 10px', fontSize: 16,
    color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
  },
  textarea: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px',
    fontSize: 15,
    color: 'var(--text-primary)',
    width: '100%',
    resize: 'vertical',
    lineHeight: 1.6,
    fontFamily: 'var(--font-sans)',
  },
  errorBox: {
    background: 'var(--fire-dim)',
    border: '1px solid var(--fire-border)',
    borderRadius: 10,
    padding: '14px 16px',
    color: 'var(--fire-text)',
    fontSize: 13,
  },
  errorPre: {
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 13,
    lineHeight: 1.6,
  },
  footer: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
    padding: '11px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  primaryBtn: {
    background: 'var(--accent)', border: 'none', borderRadius: 10,
    padding: '11px 24px', fontSize: 14, fontWeight: 700,
    color: 'var(--text-on-accent)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },

  // Review step
  reviewNote: { fontSize: 15, color: 'var(--text-secondary)' },
  taskList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' },
  reviewTask: {
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'border-color 0.15s, background 0.15s',
  },
  checkbox: {
    width: 20, height: 20,
    borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.15s',
  },
  reviewTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' },
  reviewSub: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  reviewMeta: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  reviewBadge: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 100,
    padding: '2px 8px',
    fontSize: 11,
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },

  // Done
  doneBlock: { textAlign: 'center', padding: '20px 0' },
  doneIcon: { fontSize: 48, marginBottom: 12 },
  doneTitle: { fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 },
};
