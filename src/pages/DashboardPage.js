import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  format,
  startOfDay
} from 'date-fns';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import AIDumpModal from '../components/AIDumpModal';
import CalendarModal from '../components/CalendarModal';
import SettingsModal from '../components/SettingsModal';
import AllTasksPanel from '../components/AllTasksPanel';

// ── Tiny donut chart ──────────────────────────────────────────────────────────
function DonutChart({ pct }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const stroke = circ * (pct / 100);
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink: 0 }}>
      <circle cx="45" cy="45" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="45" cy="45" r={r} fill="none"
        stroke="url(#donutGrad)" strokeWidth="8"
        strokeDasharray={`${stroke} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dasharray 0.6s var(--ease-premium)' }}
      />
      <defs>
        <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff00de" />
          <stop offset="100%" stopColor="#ffcf00" />
        </linearGradient>
      </defs>
      <text x="45" y="50" textAnchor="middle" fontSize="15" fontWeight="700"
        fill="var(--text-primary)" fontFamily="var(--font-sans)">
        {pct}%
      </text>
    </svg>
  );
}

// ── Category progress bar ─────────────────────────────────────────────────────
function CatBar({ label, done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{done}/{total}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'var(--gradient)',
          borderRadius: 99,
          transition: 'width 0.6s var(--ease-premium)',
        }} />
      </div>
    </div>
  );
}

export default function DashboardPage({ session, onLogout, theme, toggleTheme }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('urgency');
  const [categories, setCategories] = useState(session.categories || ['Work', 'Academics', 'Personal']);
  const [view, setView] = useState('dashboard');
  const [modal, setModal] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks').select('*')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false });
    if (!error && data) setTasks(data);
    setLoading(false);
  }, [session.userId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  useEffect(() => {
    supabase.from('users').select('categories').eq('id', session.userId).single()
      .then(({ data }) => { if (data?.categories) setCategories(data.categories); });
  }, [session.userId]);

  // ── Task helpers ──────────────────────────────────────────────────────────
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const today = startOfDay(new Date());

  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due) return false;
    return t.due < todayStr;
  });

  const todayTasks = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due) return true;
    return t.due === todayStr;
  });

  const upcomingTasks = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due) return false;
    return t.due > todayStr;
  });

  const completedTasks = tasks.filter(t => t.status === 'done');

  const allPending = tasks.filter(t => t.status !== 'done');
  const urgentCount = allPending.filter(t => t.status === 'fire').length;
  const doneCount = completedTasks.length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const applyCategory = (arr) =>
    activeCategory === 'All' ? arr : arr.filter(t => t.area === activeCategory);

  const statusOrder = { fire: 0, prog: 1, wait: 2 };
  const applySort = (arr) =>
    [...arr].sort((a, b) => {
      if (sortBy === 'urgency') return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      if (sortBy === 'date') return (a.due || '9999') < (b.due || '9999') ? -1 : 1;
      if (sortBy === 'category') return (a.area || '').localeCompare(b.area || '');
      return 0;
    });

  // Category progress
  const catProgress = categories.map(cat => ({
    label: cat,
    total: tasks.filter(t => t.area === cat).length,
    done: tasks.filter(t => t.area === cat && t.status === 'done').length,
  }));

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleTaskUpdate = async (id, changes) => {
    const { error } = await supabase.from('tasks').update(changes).eq('id', id);
    if (!error) setTasks(ts => ts.map(t => t.id === id ? { ...t, ...changes } : t));
  };
  const handleTaskDelete = async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(ts => ts.filter(t => t.id !== id));
  };
  const handleTaskAdd = async (taskData) => {
    const { data, error } = await supabase.from('tasks').insert({
      ...taskData, user_id: session.userId,
    }).select().single();
    if (!error && data) { setTasks(ts => [data, ...ts]); setModal(null); }
    return error;
  };
  const handleBulkAdd = async (tasksData) => {
    const rows = tasksData.map(t => ({ ...t, user_id: session.userId }));
    const { data, error } = await supabase.from('tasks').insert(rows).select();
    if (!error && data) setTasks(ts => [...data, ...ts]);
    return error;
  };
  const handleCategorySave = async (newCats) => {
    await supabase.from('users').update({ categories: newCats }).eq('id', session.userId);
    setCategories(newCats);
  };

  // ── Greeting ─────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayName = format(today, 'EEEE');
  const dateDisplay = format(today, 'MMMM d, yyyy').toUpperCase();

  const catTabs = ['All', ...categories];

  // ── Section renderer ──────────────────────────────────────────────────────
  const renderSection = (label, emoji, sublabel, taskList, accent, emptyMsg, showDate = false) => {
    const displayed = applySort(applyCategory(taskList));
    const isEmpty = displayed.length === 0;
    return (
      <div style={s.section} key={label}>
        <div style={s.sectionHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <h2 style={{ ...s.sectionTitle, color: accent }}>{label}</h2>
              <span style={{ ...s.sectionCount, background: accent + '18', color: accent }}>
                {applyCategory(taskList).length}
              </span>
            </div>
            <p style={s.sectionSub}>{sublabel}</p>
          </div>
        </div>
        {isEmpty ? (
          <div style={s.sectionEmpty}>{emptyMsg}</div>
        ) : (
          <div style={s.taskGrid}>
            {displayed.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
                showDate={showDate}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={s.layout}>
      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <span style={s.navLogo}>
            <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ⚡
            </span>
            {' '}God-Mode
          </span>
        </div>
        <div style={s.navCenter}>
          <button
            style={view === 'dashboard' ? s.navBtnActive : s.navBtn}
            onClick={() => setView('dashboard')}
          >Dashboard</button>
          <button
            style={view === 'all' ? s.navBtnActive : s.navBtn}
            onClick={() => setView('all')}
          >All Tasks</button>
        </div>
        <div style={s.navRight}>
          <button style={s.navIcon} onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button style={s.navIcon} onClick={() => setModal('settings')} title="Settings">⚙️</button>
          <button style={s.navIcon} onClick={onLogout} title="Sign out">↪</button>
        </div>
      </nav>

      <main style={s.main}>
        {view === 'all' ? (
          <AllTasksPanel
            tasks={tasks}
            categories={categories}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
          />
        ) : (
          <>
            {/* ── HERO ─────────────────────────────────────────────────── */}
            <div style={s.hero}>
              <div style={s.heroEyebrow}>
                <span style={s.heroDate}>{dateDisplay}</span>
                <span style={s.heroDot}>·</span>
                <span style={s.heroGreeting}>{greeting}</span>
              </div>
              <h1 style={s.heroTitle}>
                What are we<br />executing today?
              </h1>
              <div style={s.heroNameWrap}>
                <span style={s.heroName}
                  className="grad-text"
                >
                  {session.username}
                </span>
              </div>
              <p style={s.heroDayLine}>{dayName}</p>
            </div>

            {/* ── PROGRESS OVERVIEW ────────────────────────────────────── */}
            <div style={s.progressCard} className="card-lift">
              <div style={s.progressLeft}>
                <DonutChart pct={progress} />
                <div style={{ marginLeft: 20 }}>
                  <p style={s.progressLabel}>OVERALL PROGRESS</p>
                  <p style={s.progressValue}>{doneCount} of {tasks.length} tasks done</p>
                  <div style={s.progressPills}>
                    <span style={{ ...s.pill, color: 'var(--fire-text)', background: 'var(--fire-dim)' }}>
                      🔥 {urgentCount} urgent
                    </span>
                    <span style={{ ...s.pill, color: 'var(--done-text)', background: 'var(--done-dim)' }}>
                      ✓ {doneCount} done
                    </span>
                    <span style={{ ...s.pill, color: 'var(--prog-text)', background: 'var(--prog-dim)' }}>
                      ≡ {allPending.length} active
                    </span>
                  </div>
                </div>
              </div>
              {catProgress.filter(c => c.total > 0).length > 0 && (
                <div style={s.progressRight}>
                  {catProgress.filter(c => c.total > 0).map(c => (
                    <CatBar key={c.label} label={c.label} done={c.done} total={c.total} />
                  ))}
                </div>
              )}
            </div>

            {/* ── CONTROLS ─────────────────────────────────────────────── */}
            <div style={s.controlRow}>
              <div style={s.catScroll}>
                {catTabs.map(cat => (
                  <button
                    key={cat}
                    style={activeCategory === cat ? s.catActive : s.cat}
                    onClick={() => setActiveCategory(cat)}
                  >{cat}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={s.sortWrap}>
                  {['urgency', 'date', 'category'].map(srt => (
                    <button
                      key={srt}
                      style={sortBy === srt ? s.sortActive : s.sort}
                      onClick={() => setSortBy(srt)}
                    >{srt.charAt(0).toUpperCase() + srt.slice(1)}</button>
                  ))}
                </div>
                <button style={s.addBtn} onClick={() => setModal('add')}>+ Add Task</button>
                <button style={s.aiBtn} className="grad-btn" onClick={() => setModal('dump')}>
                  ⚡ AI Dump
                </button>
              </div>
            </div>

            {/* ── TASK SECTIONS ────────────────────────────────────────── */}
            {loading ? (
              <div style={s.loadingWrap}>
                <div style={s.loadingDot} />
                <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>Loading your missions…</span>
              </div>
            ) : (
              <div style={s.taskArea}>
                {overdueTasks.length > 0 && renderSection(
                  'Overdue', '🚨', 'These slipped through. Handle them now.',
                  overdueTasks, 'var(--fire-text)', '', true
                )}
                {renderSection(
                  "Today's Missions", '🎯', "What you're executing right now.",
                  todayTasks, 'var(--text-primary)',
                  "Ready for execution. Add your first mission above.",
                )}
                {upcomingTasks.length > 0 && renderSection(
                  'Upcoming', '📅', 'Scheduled and ready when you get there.',
                  upcomingTasks, 'var(--prog-text)', '', true
                )}
                {completedTasks.length > 0 && (
                  <div style={s.section}>
                    <div style={s.sectionHeader}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>✅</span>
                          <h2 style={{ ...s.sectionTitle, color: 'var(--done-text)' }}>Completed</h2>
                          <span style={{ ...s.sectionCount, background: 'var(--done-dim)', color: 'var(--done-text)' }}>
                            {applyCategory(completedTasks).length}
                          </span>
                        </div>
                        <p style={s.sectionSub}>Executed. You can restore any of these.</p>
                      </div>
                    </div>
                    <div style={s.taskGrid}>
                      {applyCategory(completedTasks).map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onUpdate={handleTaskUpdate}
                          onDelete={handleTaskDelete}
                          showDate={true}
                          isDimmed
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state when nothing at all */}
                {overdueTasks.length === 0 && todayTasks.length === 0 &&
                  upcomingTasks.length === 0 && completedTasks.length === 0 && (
                  <div style={s.grandEmpty}>
                    <div style={s.grandEmptyIcon}>🎯</div>
                    <h2 style={s.grandEmptyTitle}>No active missions.</h2>
                    <p style={s.grandEmptySub}>Capture your next objective and start executing.</p>
                    <button style={{ ...s.addBtn, ...s.grandEmptyBtn }} className="grad-btn"
                      onClick={() => setModal('add')}>
                      + Add your first task
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── FOOTER ───────────────────────────────────────────────── */}
            <footer style={s.footer}>
              <span style={s.footerText}>Created by </span>
              <span style={s.footerName}>EbunOluwa</span>
            </footer>
          </>
        )}
      </main>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {modal === 'add' && (
        <AddTaskModal categories={categories} defaultDate={todayStr}
          onAdd={handleTaskAdd} onClose={() => setModal(null)} />
      )}
      {modal === 'dump' && (
        <AIDumpModal onAdd={handleBulkAdd} onClose={() => setModal(null)} today={todayStr} />
      )}
      {modal === 'calendar' && (
        <CalendarModal activeDate={today}
          onSelect={(d) => { setModal(null); }} onClose={() => setModal(null)} />
      )}
      {modal === 'settings' && (
        <SettingsModal session={session} categories={categories}
          onSaveCategories={handleCategorySave} onLogout={onLogout} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const s = {
  layout: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    flexDirection: 'column',
  },

  // Nav
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: 62,
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    backdropFilter: 'blur(12px)',
  },
  navLeft: { flex: 1 },
  navLogo: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 17,
    color: 'var(--text-primary)',
    letterSpacing: '-0.4px',
  },
  navCenter: { display: 'flex', gap: 4 },
  navRight: { display: 'flex', gap: 6, flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  navBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 500,
    padding: '6px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'color var(--transition)',
  },
  navBtnActive: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 700,
    padding: '6px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  navIcon: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '6px 12px',
    fontSize: 14,
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'border-color var(--transition)',
  },

  // Main
  main: {
    flex: 1,
    padding: '48px 40px 100px',
    maxWidth: 1360,
    width: '100%',
    margin: '0 auto',
  },

  // Hero
  hero: {
    marginBottom: 40,
    paddingBottom: 40,
    borderBottom: '1px solid var(--border)',
  },
  heroEyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  heroDate: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
  },
  heroDot: {
    color: 'var(--text-muted)',
    fontSize: 16,
  },
  heroGreeting: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: 'clamp(34px, 4.5vw, 60px)',
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: '-1px',
    color: 'var(--text-primary)',
    marginBottom: 16,
  },
  heroNameWrap: {
    marginBottom: 8,
  },
  heroName: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'clamp(52px, 8vw, 88px)',
    fontWeight: 700,
    letterSpacing: '-3px',
    lineHeight: 0.95,
    display: 'inline-block',
  },
  heroDayLine: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
  },

  // Progress card
  progressCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '28px 32px',
    marginBottom: 32,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 40,
    flexWrap: 'wrap',
  },
  progressLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    minWidth: 280,
  },
  progressRight: {
    flex: 1,
    minWidth: 220,
    paddingTop: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    marginBottom: 4,
    marginLeft: 20,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 12,
    marginLeft: 20,
  },
  progressPills: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginLeft: 20,
  },
  pill: {
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 99,
  },

  // Controls
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 36,
    flexWrap: 'wrap',
  },
  catScroll: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  cat: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 99,
    padding: '8px 18px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
    transition: 'border-color var(--transition), color var(--transition)',
  },
  catActive: {
    background: 'var(--gradient)',
    border: '1px solid transparent',
    borderRadius: 99,
    padding: '8px 18px',
    fontSize: 13,
    fontWeight: 700,
    color: '#0a0a20',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
  },
  sortWrap: {
    display: 'flex',
    gap: 4,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 4,
  },
  sort: {
    background: 'transparent',
    border: 'none',
    borderRadius: 7,
    padding: '5px 12px',
    fontSize: 12,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
  },
  sortActive: {
    background: 'var(--bg-input)',
    border: 'none',
    borderRadius: 7,
    padding: '5px 12px',
    fontSize: 12,
    color: 'var(--text-primary)',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  addBtn: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '9px 20px',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
    transition: 'border-color var(--transition)',
  },
  aiBtn: {
    borderRadius: 10,
    padding: '9px 22px',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
  },

  // Task area
  taskArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 48,
  },
  section: {},
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.3px',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: 99,
  },
  sectionSub: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginTop: 3,
    marginLeft: 30,
  },
  sectionEmpty: {
    fontSize: 14,
    color: 'var(--text-muted)',
    padding: '20px 0 4px',
    fontStyle: 'italic',
  },
  taskGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 14,
  },

  // Loading
  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '60px 0',
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--gradient)',
    animation: 'pulse 1.2s ease-in-out infinite',
  },

  // Grand empty
  grandEmpty: {
    textAlign: 'center',
    padding: '80px 40px',
    border: '1px dashed var(--border)',
    borderRadius: 24,
  },
  grandEmptyIcon: { fontSize: 52, marginBottom: 18 },
  grandEmptyTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 8,
    fontFamily: 'var(--font-serif)',
  },
  grandEmptySub: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    marginBottom: 28,
  },
  grandEmptyBtn: {
    display: 'inline-block',
    borderRadius: 12,
    padding: '12px 28px',
    fontSize: 15,
  },

  // Footer
  footer: {
    textAlign: 'center',
    paddingTop: 56,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
  },
  footerName: {
    fontSize: 14,
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
    fontWeight: 700,
    background: 'var(--gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
};
