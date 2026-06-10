import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format, addDays, subDays, isToday, isTomorrow, isYesterday, startOfDay } from 'date-fns';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import AIDumpModal from '../components/AIDumpModal';
import CalendarModal from '../components/CalendarModal';
import SettingsModal from '../components/SettingsModal';
import AllTasksPanel from '../components/AllTasksPanel';

export default function DashboardPage({ session, onLogout, theme, toggleTheme }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState(startOfDay(new Date()));
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('urgency'); // urgency | date | category | recent
  const [categories, setCategories] = useState(session.categories || ['Work', 'Academics', 'Personal']);
  const [view, setView] = useState('dashboard'); // dashboard | all
  const [modal, setModal] = useState(null); // null | 'add' | 'dump' | 'calendar' | 'settings'

  // Load tasks from Supabase
  const loadTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false });
    if (!error && data) setTasks(data);
    setLoading(false);
  }, [session.userId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Refresh categories from DB
  useEffect(() => {
    supabase.from('users').select('categories').eq('id', session.userId).single()
      .then(({ data }) => { if (data?.categories) setCategories(data.categories); });
  }, [session.userId]);

  // Date helpers
  const goToday = () => setActiveDate(startOfDay(new Date()));
  const goPrev = () => setActiveDate(d => subDays(d, 1));
  const goNext = () => setActiveDate(d => addDays(d, 1));
  const goToDate = (d) => { setActiveDate(startOfDay(d)); setModal(null); };

  const dayLabel = (d) => {
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'EEEE');
  };

  const dateDisplay = format(activeDate, 'EEE, MMM d, yyyy').toUpperCase();
  const activeDateStr = format(activeDate, 'yyyy-MM-dd');

  // Filter tasks for active date
  const dayTasks = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due) return isToday(activeDate);
    return t.due === activeDateStr;
  });

  // Stats from ALL pending tasks
  const allPending = tasks.filter(t => t.status !== 'done');
  const urgentCount = allPending.filter(t => t.status === 'fire').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  // Filter by category
  const filtered = dayTasks.filter(t =>
    activeCategory === 'All' ? true : t.area === activeCategory
  );

  // Sort
  const statusOrder = { fire: 0, prog: 1, wait: 2 };
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'urgency') return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    if (sortBy === 'date') return (a.due || '9999') < (b.due || '9999') ? -1 : 1;
    if (sortBy === 'category') return (a.area || '').localeCompare(b.area || '');
    return 0; // recent = DB order (already newest first)
  });

  // Group by status
  const groups = [
    { key: 'fire', label: 'On Fire', sublabel: 'Move on these now.' },
    { key: 'prog', label: 'In Progress', sublabel: 'Keep pushing.' },
    { key: 'wait', label: 'Waiting', sublabel: 'Blocked or later.' },
  ];

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
      ...taskData,
      user_id: session.userId,
    }).select().single();
    if (!error && data) {
      setTasks(ts => [data, ...ts]);
      setModal(null);
    }
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

  const label = dayLabel(activeDate);
  const labelIsWord = ['Today', 'Tomorrow', 'Yesterday'].includes(label);

  const catTabs = ['All', ...categories];

  return (
    <div style={css.layout}>
      {/* NAVBAR */}
      <nav style={css.nav}>
        <div style={css.navLeft}>
          <span style={css.navLogo}>⚡ God-Mode</span>
        </div>
        <div style={css.navCenter}>
          <button style={view === 'dashboard' ? css.navBtnActive : css.navBtn} onClick={() => setView('dashboard')}>
            Dashboard
          </button>
          <button style={view === 'all' ? css.navBtnActive : css.navBtn} onClick={() => setView('all')}>
            All Tasks
          </button>
        </div>
        <div style={css.navRight}>
          <button style={css.navIcon} onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button style={css.navIcon} onClick={() => setModal('settings')} title="Settings">⚙️</button>
          <button style={css.navIcon} onClick={onLogout} title="Sign out">↪</button>
        </div>
      </nav>

      <main style={css.main}>
        {view === 'all' ? (
          <AllTasksPanel
            tasks={tasks}
            categories={categories}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
          />
        ) : (
          <>
            {/* DATE HEADER */}
            <div style={css.dateHeader}>
              <div style={css.dateRow}>
                <span style={css.dateSmall}>{dateDisplay}</span>
                {/* Compact nav cluster */}
                <div style={css.dateBtns}>
                  <button style={css.dateNavBtn} onClick={goPrev} aria-label="Previous day">‹</button>
                  <button style={css.dateNavBtn} onClick={goNext} aria-label="Next day">›</button>
                  {!isToday(activeDate) && (
                    <button style={css.todayBtn} onClick={goToday}>Today</button>
                  )}
                  <button style={css.dateNavBtn} onClick={() => setModal('calendar')} aria-label="Calendar">📅</button>
                </div>
              </div>

              <h1 style={css.heroHeading}>
                {labelIsWord
                  ? <><span style={css.dayHighlight}>{label}</span>{' — what are we executing?'}</>
                  : <>{label}{', '}<span style={css.dayHighlight}>{format(activeDate, 'MMMM d')}</span></>
                }
              </h1>
              <p style={css.heroSub}>
                {session.username}
              </p>
            </div>

            {/* STAT CARDS */}
            <div style={css.statsRow}>
              {[
                { label: 'TOTAL', value: allPending.length, icon: '≡' },
                { label: 'URGENT', value: urgentCount, icon: '🔥', color: 'var(--fire-text)' },
                { label: 'DONE', value: doneCount, icon: '✓', color: 'var(--done-text)' },
                { label: 'PROGRESS', value: `${progress}%`, icon: '↗', color: 'var(--accent)' },
              ].map(stat => (
                <div key={stat.label} style={css.statCard}>
                  <div style={css.statLabel}>{stat.label}</div>
                  <div style={{ ...css.statValue, color: stat.color || 'var(--text-primary)' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* CATEGORY TABS + ADD BUTTON */}
            <div style={css.controlRow}>
              <div style={css.categoryScroll}>
                {catTabs.map(cat => (
                  <button
                    key={cat}
                    style={activeCategory === cat ? css.catTabActive : css.catTab}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button style={css.addTaskBtn} onClick={() => setModal('add')}>
                + Add task
              </button>
            </div>

            {/* SORT + AI DUMP ROW */}
            <div style={css.toolRow}>
              <div style={css.sortWrap}>
                <span style={css.sortLabel}>Sort:</span>
                {['urgency', 'date', 'category', 'recent'].map(s => (
                  <button
                    key={s}
                    style={sortBy === s ? css.sortBtnActive : css.sortBtn}
                    onClick={() => setSortBy(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <button style={css.aiDumpBtn} onClick={() => setModal('dump')}>
                ⚡ AI Dump
              </button>
            </div>

            {/* TASK GROUPS */}
            <div style={css.taskArea}>
              {loading ? (
                <div style={css.empty}>Loading tasks…</div>
              ) : sorted.length === 0 ? (
                <div style={css.emptyBlock}>
                  <div style={css.emptyIcon}>🎯</div>
                  <p style={css.emptyTitle}>
                    {isToday(activeDate) ? "Nothing scheduled for today." : `Nothing planned for ${label}.`}
                  </p>
                  <p style={css.emptySub}>Add a task or use AI Dump to fill this day.</p>
                  <button style={css.emptyAddBtn} onClick={() => setModal('add')}>+ Add your first task</button>
                </div>
              ) : (
                groups.map(group => {
                  const groupTasks = sorted.filter(t => t.status === group.key);
                  if (groupTasks.length === 0) return null;
                  return (
                    <div key={group.key} style={css.group}>
                      <div style={css.groupHeader}>
                        <div>
                          <h2 style={{ ...css.groupTitle, color: `var(--${group.key}-text)` }}>
                            {group.label}
                          </h2>
                          <p style={css.groupSub}>{group.sublabel}</p>
                        </div>
                        <span style={css.groupCount}>{groupTasks.length}</span>
                      </div>
                      <div style={css.taskGrid}>
                        {groupTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onUpdate={handleTaskUpdate}
                            onDelete={handleTaskDelete}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {/* MODALS */}
      {modal === 'add' && (
        <AddTaskModal
          categories={categories}
          defaultDate={activeDateStr}
          onAdd={handleTaskAdd}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'dump' && (
        <AIDumpModal
          onAdd={handleBulkAdd}
          onClose={() => setModal(null)}
          today={activeDateStr}
        />
      )}
      {modal === 'calendar' && (
        <CalendarModal
          activeDate={activeDate}
          onSelect={goToDate}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'settings' && (
        <SettingsModal
          session={session}
          categories={categories}
          onSaveCategories={handleCategorySave}
          onLogout={onLogout}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

const css = {
  layout: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: 60,
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navLeft: { flex: 1 },
  navLogo: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: 18,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  navCenter: { display: 'flex', gap: 4 },
  navRight: { display: 'flex', gap: 4, flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  navBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 500,
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  navBtnActive: {
    background: 'var(--accent)',
    border: 'none',
    color: 'var(--text-on-accent)',
    fontSize: 14,
    fontWeight: 700,
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  navIcon: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '5px 10px',
    fontSize: 15,
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  main: {
    flex: 1,
    padding: '40px 40px 80px',
    maxWidth: 1400,
    width: '100%',
    margin: '0 auto',
  },

  // Date header
  dateHeader: { marginBottom: 32 },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dateSmall: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
  },
  dateBtns: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  dateNavBtn: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 16,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    lineHeight: 1,
    fontFamily: 'var(--font-sans)',
  },
  todayBtn: {
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent)',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--accent)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  heroHeading: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'clamp(36px, 4.5vw, 64px)',
    fontWeight: 700,
    letterSpacing: '-2px',
    lineHeight: 1.05,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  dayHighlight: {
    color: 'var(--accent)',
    fontStyle: 'normal',
  },
  heroSub: {
    fontSize: 17,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
  },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '22px 24px',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 'clamp(28px, 3.5vw, 40px)',
    fontWeight: 700,
    letterSpacing: '-1px',
    lineHeight: 1,
  },

  // Control row
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryScroll: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  catTab: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 100,
    padding: '7px 16px',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
  },
  catTabActive: {
    background: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: 100,
    padding: '7px 16px',
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-on-accent)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
  },
  addTaskBtn: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
  },

  // Sort + AI Dump
  toolRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  sortWrap: { display: 'flex', alignItems: 'center', gap: 6 },
  sortLabel: { fontSize: 13, color: 'var(--text-muted)', marginRight: 4 },
  sortBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 100,
    padding: '5px 14px',
    fontSize: 13,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  sortBtnActive: {
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent)',
    borderRadius: 100,
    padding: '5px 14px',
    fontSize: 13,
    color: 'var(--accent)',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  aiDumpBtn: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    borderRadius: 10,
    padding: '9px 22px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },

  // Task area
  taskArea: { display: 'flex', flexDirection: 'column', gap: 40 },
  empty: { color: 'var(--text-muted)', fontSize: 15, padding: '40px 0' },
  emptyBlock: {
    textAlign: 'center',
    padding: '80px 40px',
    border: '1px dashed var(--border)',
    borderRadius: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 },
  emptySub: { fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 },
  emptyAddBtn: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    borderRadius: 10,
    padding: '11px 24px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  group: {},
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.5px',
    marginBottom: 2,
  },
  groupSub: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  groupCount: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 100,
    padding: '2px 12px',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  taskGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 14,
  },
};
