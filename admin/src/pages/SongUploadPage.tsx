import { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, ArrowRight, Save, Music, ChevronLeft, ChevronRight } from 'lucide-react';

interface ChartDiff {
  type: string;
  level: number;
  status: 'new' | 'update' | 'nochange';
  changes?: Record<string, { before: unknown; after: unknown }>;
}

interface SongPreview {
  status: 'new' | 'update' | 'nochange';
  conflictType: 'NONE' | 'ID_MATCH' | 'TITLE_MATCH' | 'PERFECT_MATCH' | 'MULTI_CONFLICT';
  title: string;
  existingIdx?: number;
  officialIdx: number;
  resolvedIdx?: number;
  idxConflict?: boolean;
  conflictWith?: string | null;
  charts: ChartDiff[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function SongUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<SongPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSong, setCurrentSong] = useState('');
  const [totalSongs, setTotalSongs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination State
  const [previewPage, setPreviewPage] = useState(1);
  const itemsPerPage = 10;

  // Conflict Resolution State
  const [resolutions, setResolutions] = useState<Record<number, 'OVERWRITE' | 'CREATE_NEW' | 'IGNORE'>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setPreviews([]);
      setError(null);
      setSuccess(null);
      setProgress(0);
      setPreviewPage(1);
      setResolutions({});
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/song/preview`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(json)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setPreviews(data);
      setPreviewPage(1);
      
      // Initialize resolutions based on conflict type
      const initialResolutions: Record<number, 'OVERWRITE' | 'CREATE_NEW' | 'IGNORE'> = {};
      data.forEach((p: SongPreview) => {
        if (p.conflictType === 'NONE' || p.conflictType === 'PERFECT_MATCH') {
          initialResolutions[p.officialIdx] = 'OVERWRITE';
        }
      });
      setResolutions(initialResolutions);
    } catch (err: any) {
      setError(err.message || 'Failed to parse or fetch preview');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!confirm('Are you sure you want to save these changes to the database?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json)) throw new Error('Invalid JSON: Expected an array of songs');

      const total = json.length;
      setTotalSongs(total);
      const token = localStorage.getItem('admin_token');

      for (let i = 0; i < total; i++) {
        const song = json[i];
        const preview = previews.find(p => p.officialIdx === parseInt(song.songid, 10)); // Use officialIdx for matching
        const resolution = resolutions[parseInt(song.songid, 10)];

        // 변경사항이 없는 곡이거나 IGNORE 선택 시 건너뜀
        if (resolution === 'IGNORE' || (!preview || (preview.status === 'nochange' && !resolution))) {
          setProgress(Math.round(((i + 1) / total) * 100));
          continue;
        }

        setCurrentSong(song.title);
        
        const response = await fetch(`${API_BASE_URL}/admin/song`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify([{ ...song, resolution }]) // Pass resolution
        });

        if (!response.ok) {
          throw new Error(`Failed to upload "${song.title}": ${await response.text()}`);
        }

        setProgress(Math.round(((i + 1) / total) * 100));
      }

      setSuccess(`Successfully synchronized ${total} songs!`);
      setPreviews([]);
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
      setProgress(0);
      setCurrentSong('');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Music className="text-primary-500" /> Song Data Synchronizer
        </h1>
        <p className="text-textMuted">Upload JSON data to preview and sync charts.</p>
      </header>

      {/* Upload Box */}
      <div className="glass-panel p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 w-full relative">
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${file ? 'border-primary-500 bg-primary-500/5' : 'border-white/20 bg-white/5 hover:border-primary-400'}`}>
            <UploadCloud size={40} className={file ? 'text-primary-500 mb-3' : 'text-textMuted mb-3'} />
            <p className="text-white font-medium">{file ? file.name : 'Click or drag JSON file here'}</p>
            <p className="text-sm text-textMuted mt-1">Accepts only valid Anzuinfo array formats</p>
          </div>
        </div>
        
        <div className="shrink-0 flex flex-col gap-3">
          <button 
            onClick={handlePreview} 
            disabled={!file || loading}
            className="btn-primary flex items-center justify-center gap-2 py-3 px-6 h-14 w-full md:w-auto"
          >
            {loading && progress === 0 ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Preview Changes <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading && progress > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-primary-500/30 animate-fade-in shadow-lg shadow-primary-500/5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              <span className="text-white font-bold">Synchronizing Data...</span>
              <span className="text-textMuted text-sm font-medium">({progress}%)</span>
            </div>
            <span className="text-textMuted text-sm">{totalSongs} songs total</span>
          </div>
          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/10">
            <div 
              className="bg-gradient-to-r from-primary-600 to-indigo-500 h-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-textMuted mt-3 flex items-center gap-2">
            <ArrowRight size={12} className="text-primary-500" /> Currently processing: <span className="text-primary-400 font-mono font-bold">{currentSong}</span>
          </p>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl flex items-start gap-3 animate-slide-up">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold">Error Occurred</h4>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-4 rounded-xl flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={20} />
          <p className="font-bold">{success}</p>
        </div>
      )}

      {/* Preview Section */}
      {previews.length > 0 && (
        <div className="mt-8 animate-fade-in space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl sticky top-4 z-20 border border-white/10 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white">Preview Results</h2>
              <p className="text-sm text-textMuted mt-1">Found {previews.length} variations to apply</p>
            </div>
            <button 
              onClick={handleUpload}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black transition-all shadow-lg shadow-green-600/20 active:scale-95"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save size={20} /> Synchronize & Save to DB</>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between glass-panel px-6 py-3 rounded-xl border border-white/5 bg-black/20">
            <span className="text-sm text-textMuted">
              Page <span className="text-white font-bold">{previewPage}</span> of <span className="text-white font-bold">{Math.ceil(previews.length / itemsPerPage)}</span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                disabled={previewPage === 1}
                className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-20 transition-colors"
              >
                <ChevronLeft size={20} className="text-white" />
              </button>
              <button 
                onClick={() => setPreviewPage(p => Math.min(Math.ceil(previews.length / itemsPerPage), p + 1))}
                disabled={previewPage === Math.ceil(previews.length / itemsPerPage)}
                className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-20 transition-colors"
              >
                <ChevronRight size={20} className="text-white" />
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            {previews.slice((previewPage - 1) * itemsPerPage, previewPage * itemsPerPage).map((preview, idx) => (
              <div key={idx} className="glass-panel overflow-hidden rounded-2xl border border-white/10 flex flex-col shadow-lg">
                {/* Card Header */}
                <div className={`px-6 py-4 border-b border-white/5 flex flex-wrap items-center gap-4 ${preview.status === 'new' ? 'bg-green-500/5' : 'bg-blue-500/5'}`}>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${preview.status === 'new' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                    {preview.status === 'new' ? 'NEW SONG' : 'UPDATE'}
                  </span>
                  <h3 className="text-lg font-bold text-white m-0 flex-1">{preview.title}</h3>
                  
                  <div className="flex items-center gap-3 text-sm">
                    {preview.conflictType !== 'NONE' && preview.conflictType !== 'PERFECT_MATCH' ? (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg flex items-center gap-2 font-black animate-pulse">
                        <AlertCircle size={14} /> ID/TITLE CONFLICT ({preview.conflictType})
                      </span>
                    ) : (
                      <span className="text-textMuted bg-black/40 px-3 py-1 rounded-lg font-mono text-xs border border-white/5">
                         STABLE_ID: {preview.status === 'new' ? preview.officialIdx : (preview.existingIdx ?? preview.officialIdx)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Conflict Resolution Controls */}
                {preview.conflictType !== 'NONE' && preview.conflictType !== 'PERFECT_MATCH' && (
                  <div className="px-6 py-4 bg-amber-500/5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-sm text-amber-200/80">
                      <strong>Conflict:</strong> {
                        preview.conflictType === 'ID_MATCH' ? `ID ${preview.officialIdx} is used by "${preview.conflictWith}".` :
                        preview.conflictType === 'TITLE_MATCH' ? `A song named "${preview.title}" exists with ID ${preview.existingIdx}.` :
                        `Multiple conflicts detected (ID and Title both match different songs).`
                      }
                    </p>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => setResolutions(prev => ({ ...prev, [preview.officialIdx]: 'OVERWRITE' }))}
                         className={clsx("px-4 py-2 rounded-lg text-xs font-bold border transition-all", resolutions[preview.officialIdx] === 'OVERWRITE' ? "bg-amber-500 text-black border-amber-500" : "bg-white/5 text-white border-white/10 hover:bg-white/10")}
                       >
                         Overwrite Existing
                       </button>
                       <button 
                         onClick={() => setResolutions(prev => ({ ...prev, [preview.officialIdx]: 'CREATE_NEW' }))}
                         className={clsx("px-4 py-2 rounded-lg text-xs font-bold border transition-all", resolutions[preview.officialIdx] === 'CREATE_NEW' ? "bg-green-500 text-black border-green-500" : "bg-white/5 text-white border-white/10 hover:bg-white/10")}
                       >
                         Create as New
                       </button>
                       <button 
                         onClick={() => setResolutions(prev => ({ ...prev, [preview.officialIdx]: 'IGNORE' }))}
                         className={clsx("px-4 py-2 rounded-lg text-xs font-bold border transition-all", resolutions[preview.officialIdx] === 'IGNORE' ? "bg-red-500 text-black border-red-500" : "bg-white/5 text-white border-white/10 hover:bg-white/10")}
                       >
                         Ignore
                       </button>
                    </div>
                  </div>
                )}

                {/* Card Body (Charts) */}
                <div className="p-6 bg-surface/30">
                  <h4 className="text-[10px] font-black text-textMuted uppercase tracking-[0.2em] mb-4">Chart Manifest</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {preview.charts.map((chart, cIdx) => (
                      <div key={cIdx} className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col h-full hover:border-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                          <span className="font-bold text-white flex items-center gap-2">
                            <span className={clsx("w-2 h-2 rounded-full shadow-lg", {
                              'bg-primary-500 shadow-primary-500/50': chart.type === 'MAXIMUM' || chart.type === 'XCD',
                              'bg-amber-500 shadow-amber-500/50': chart.type === 'EXHAUST',
                              'bg-green-500 shadow-green-500/50': chart.type === 'ADVANCED',
                              'bg-blue-500 shadow-blue-500/50': chart.type === 'NOVICE',
                            })} />
                            {chart.type} <span className="text-textMuted/50 font-normal ml-1">Lv.{chart.level}</span>
                          </span>
                          
                          {chart.status === 'new' ? (
                            <span className="text-green-400 text-[10px] font-black uppercase px-2 py-1 bg-green-400/10 rounded-md border border-green-400/20">New</span>
                          ) : chart.status === 'nochange' ? (
                            <span className="text-textMuted/40 text-[10px] uppercase px-2 py-1 bg-white/5 rounded-md border border-white/5">Synced</span>
                          ) : (
                            <span className="text-amber-400 text-[10px] font-black uppercase px-2 py-1 bg-amber-400/10 rounded-md border border-amber-400/20">Diff</span>
                          )}
                        </div>
                        
                        <div className="flex-1 text-sm">
                          {chart.status === 'update' && chart.changes && (
                            <ul className="space-y-1.5">
                              {Object.entries(chart.changes).map(([field, vals]) => (
                                <li key={field} className="flex gap-2 items-center bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                  <code className="text-primary-300 text-[10px] font-mono w-20 shrink-0 opacity-80">{field}</code>
                                  <div className="flex items-center gap-2 text-[11px] flex-1 min-w-0">
                                    <span className="text-red-400/60 truncate w-1/3 text-right decoration-red-400/30 line-through">{String(vals.before)}</span>
                                    <ArrowRight size={10} className="text-textMuted/30 shrink-0" />
                                    <strong className="text-green-400 truncate w-1/2 font-bold">{String(vals.after)}</strong>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                          {chart.status === 'new' && (
                            <div className="h-full flex items-center justify-center text-green-400/30 text-[10px] font-bold uppercase tracking-widest bg-green-400/5 rounded-lg py-4 border border-dashed border-green-400/10">
                              Initialized
                            </div>
                          )}
                          {chart.status === 'nochange' && (
                            <div className="h-full flex items-center justify-center text-textMuted/20 text-[10px] font-bold uppercase tracking-widest py-4">
                              Unmodified
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Pagination */}
          {previews.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-4 py-4">
              <button 
                onClick={() => { setPreviewPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={previewPage === 1}
                className="btn-secondary px-4 py-2 flex items-center gap-2"
              >
                <ChevronLeft size={18} /> Previous
              </button>
              <span className="text-white font-medium">Page {previewPage} / {Math.ceil(previews.length / itemsPerPage)}</span>
              <button 
                onClick={() => { setPreviewPage(p => Math.min(Math.ceil(previews.length / itemsPerPage), p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={previewPage === Math.ceil(previews.length / itemsPerPage)}
                className="btn-secondary px-4 py-2 flex items-center gap-2"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper for dynamic classes
function clsx(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
