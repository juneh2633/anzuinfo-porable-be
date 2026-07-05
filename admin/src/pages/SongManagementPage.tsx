import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Edit3, Trash2, Filter, Music, Save, X } from 'lucide-react';

interface RadarValues {
  notes: number;
  peak: number;
  tsumami: number;
  tricky: number;
  handtrip: number;
  onehand: number;
}

interface SongChart {
  idx: number;
  type: string;
  level: number;
  effector: string | null;
  illustrator: string;
  radar: RadarValues[];
}

interface SongListSong {
  idx: number;
  title: string;
  artist: string;
  version: number;
  chart: SongChart[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function SongManagementPage() {
  const [songs, setSongs] = useState<SongListSong[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingChartIdx, setDeletingChartIdx] = useState<number | null>(null);
  const [editingSong, setEditingSong] = useState<SongListSong | null>(null);
  const [chartDrafts, setChartDrafts] = useState<Record<number, SongChart>>({});
  const [savingChartIdx, setSavingChartIdx] = useState<number | null>(null);
  const limit = 15;

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        keyword: search,
      });
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/song?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSongs(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch songs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSongs();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  const deleteChart = async (chartIdx: number, chartLabel: string) => {
    if (!window.confirm(`Delete chart ${chartLabel}?`)) return;

    setDeletingChartIdx(chartIdx);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/chart/${chartIdx}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Delete failed (${response.status})`);
      setEditingSong(current => current ? {
        ...current,
        chart: current.chart.filter(chart => chart.idx !== chartIdx),
      } : null);
      setSongs(current => current.map(song => ({
        ...song,
        chart: song.chart.filter(chart => chart.idx !== chartIdx),
      })));
    } catch (err) {
      console.error('Failed to delete chart:', err);
      window.alert('Failed to delete the chart. Please try again.');
    } finally {
      setDeletingChartIdx(null);
    }
  };

  const openChartEditor = (song: SongListSong) => {
    setEditingSong(song);
    setChartDrafts(Object.fromEntries(song.chart.map(chart => [chart.idx, {
      ...chart,
      radar: [{
        notes: chart.radar[0]?.notes ?? 0,
        peak: chart.radar[0]?.peak ?? 0,
        tsumami: chart.radar[0]?.tsumami ?? 0,
        tricky: chart.radar[0]?.tricky ?? 0,
        handtrip: chart.radar[0]?.handtrip ?? 0,
        onehand: chart.radar[0]?.onehand ?? 0,
      }],
    }])));
  };

  const updateChartDraft = (chartIdx: number, field: keyof SongChart, value: string | number) => {
    setChartDrafts(current => ({
      ...current,
      [chartIdx]: { ...current[chartIdx], [field]: value },
    }));
  };

  const updateRadarDraft = (chartIdx: number, field: keyof RadarValues, value: number) => {
    setChartDrafts(current => ({
      ...current,
      [chartIdx]: {
        ...current[chartIdx],
        radar: [{ ...current[chartIdx].radar[0], [field]: value }],
      },
    }));
  };

  const saveChart = async (chart: SongChart) => {
    if (!editingSong) return;
    setSavingChartIdx(chart.idx);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/chart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chartIdx: chart.idx,
          songIdx: editingSong.idx,
          level: chart.level,
          type: chart.type,
          effectorName: chart.effector ?? '',
          illustratorName: chart.illustrator ?? '',
          radar: chart.radar[0],
        }),
      });
      if (!response.ok) throw new Error(`Update failed (${response.status})`);

      setEditingSong(current => current ? {
        ...current,
        chart: current.chart.map(item => item.idx === chart.idx ? chart : item),
      } : null);
      setSongs(current => current.map(song => song.idx === editingSong.idx ? {
        ...song,
        chart: song.chart.map(item => item.idx === chart.idx ? chart : item),
      } : song));
    } catch (err) {
      console.error('Failed to update chart:', err);
      window.alert('Failed to update the chart. Please try again.');
    } finally {
      setSavingChartIdx(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Music className="text-primary-500" /> Song Management
          </h1>
          <p className="text-textMuted mt-1">Manage existing songs and charts in the database.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-primary-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by title or artist..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-surface/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-full md:w-80 transition-all shadow-inner"
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={18} /> Filter
          </button>
        </div>
      </header>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-sm font-bold text-textMuted uppercase tracking-wider">Idx</th>
                <th className="px-6 py-4 text-sm font-bold text-textMuted uppercase tracking-wider">Song Info</th>
                <th className="px-6 py-4 text-sm font-bold text-textMuted uppercase tracking-wider">Charts</th>
                <th className="px-6 py-4 text-sm font-bold text-textMuted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-8 text-center text-textMuted">
                      <div className="h-4 bg-white/5 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-4 bg-white/5 rounded w-1/2 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : songs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-textMuted italic">
                    No songs found matching your search.
                  </td>
                </tr>
              ) : (
                songs.map((song) => (
                  <tr key={song.idx} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-textMuted font-mono text-sm">{song.idx}</td>
                    <td className="px-6 py-4">
                      <div className="text-white font-bold group-hover:text-primary-400 transition-colors">{song.title}</div>
                      <div className="text-xs text-textMuted mt-0.5">{song.artist} • Ver.{song.version}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {song.chart.map((c) => (
                          <span
                            key={c.idx}
                            className="inline-flex items-center gap-1 bg-black/30 border border-white/10 pl-2 pr-1 py-0.5 rounded text-[10px] font-bold text-textMuted uppercase"
                            title={`${c.type} Level ${c.level}`}
                          >
                            {c.type.substring(0, 3)} {c.level}
                            <button
                              type="button"
                              onClick={() => deleteChart(c.idx, `${c.type.toUpperCase()} Lv.${c.level}`)}
                              disabled={deletingChartIdx === c.idx}
                              className="p-0.5 rounded text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                              title="Delete Chart"
                              aria-label={`Delete ${c.type} level ${c.level} chart`}
                            >
                              <Trash2 size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openChartEditor(song)} className="p-2 hover:bg-white/10 rounded-lg text-primary-400 transition-colors" title="Edit Charts">
                          <Edit3 size={18} />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors" title="Delete Song (Not Implemented)">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-black/20 flex items-center justify-between border-t border-white/5">
          <div className="text-sm text-textMuted">
            Showing <span className="text-white font-medium">{(page - 1) * limit + 1}</span> to <span className="text-white font-medium">{Math.min(page * limit, total)}</span> of <span className="text-white font-medium">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-surfaceHover hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-white/5"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <div className="px-4 text-sm font-medium text-white">
              Page {page} / {totalPages || 1}
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg bg-surfaceHover hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-white/5"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onMouseDown={() => setEditingSong(null)}>
          <div className="glass-panel w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl" onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Charts</h2>
                <p className="text-sm text-textMuted">{editingSong.title} · Song #{editingSong.idx}</p>
              </div>
              <button onClick={() => setEditingSong(null)} className="p-2 rounded-lg text-textMuted hover:bg-white/10 hover:text-white" aria-label="Close editor">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6 space-y-4">
              {editingSong.chart.length === 0 ? (
                <p className="py-12 text-center text-textMuted">No charts remain for this song.</p>
              ) : editingSong.chart.map(chart => {
                const draft = chartDrafts[chart.idx];
                if (!draft) return null;
                return (
                  <section key={chart.idx} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-white">Chart #{chart.idx}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => saveChart(draft)} disabled={savingChartIdx === chart.idx} className="btn-primary flex items-center gap-2 text-sm">
                          <Save size={15} /> {savingChartIdx === chart.idx ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => deleteChart(chart.idx, `${chart.type.toUpperCase()} Lv.${chart.level}`)} disabled={deletingChartIdx === chart.idx} className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-40">
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <label className="text-xs text-textMuted">Type
                        <select value={draft.type} onChange={event => updateChartDraft(chart.idx, 'type', event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white">
                          {['novice', 'advanced', 'exhaust', 'maximum', 'infinite', 'gravity', 'heavenly', 'vivid', 'ultimate'].map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </label>
                      <label className="text-xs text-textMuted">Level
                        <input type="number" step="0.1" value={draft.level} onChange={event => updateChartDraft(chart.idx, 'level', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white" />
                      </label>
                      <label className="text-xs text-textMuted">Effector
                        <input value={draft.effector ?? ''} onChange={event => updateChartDraft(chart.idx, 'effector', event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white" />
                      </label>
                      <label className="text-xs text-textMuted">Illustrator
                        <input value={draft.illustrator ?? ''} onChange={event => updateChartDraft(chart.idx, 'illustrator', event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white" />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                      {(Object.keys(draft.radar[0]) as (keyof RadarValues)[]).map(field => (
                        <label key={field} className="text-xs capitalize text-textMuted">{field}
                          <input type="number" step="0.1" value={draft.radar[0][field]} onChange={event => updateRadarDraft(chart.idx, field, Number(event.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white" />
                        </label>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
