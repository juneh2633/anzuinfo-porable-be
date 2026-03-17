import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Edit3, Trash2, Filter, Music } from 'lucide-react';

interface SongListSong {
  idx: number;
  title: string;
  artist: string;
  version: number;
  chart: {
    type: string;
    level: number;
  }[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function SongManagementPage() {
  const [songs, setSongs] = useState<SongListSong[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
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
                        {song.chart.map((c, i) => (
                          <span 
                            key={i} 
                            className="bg-black/30 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-textMuted uppercase"
                            title={`${c.type} Level ${c.level}`}
                          >
                            {c.type.substring(0, 3)} {c.level}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white/10 rounded-lg text-primary-400 transition-colors" title="Edit Song">
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
    </div>
  );
}
