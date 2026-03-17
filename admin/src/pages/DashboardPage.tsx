import { useState, useEffect } from 'react';
import { Activity, Music, Users, Server, Database, CheckCircle2, XCircle } from 'lucide-react';

interface HealthStatus {
  status: 'ok' | 'error';
  info: {
    database: { status: 'up' | 'down' };
    redis: { status: 'up' | 'down' };
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function DashboardPage() {
  const [statsData, setStatsData] = useState({ songs: 0, charts: 0, accounts: 0 });
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    
    // Stats Fetch
    fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setStatsData(data))
      .catch(console.error);

    // Health Fetch
    fetch(`${API_BASE_URL}/api/healthcheck`)
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { name: 'Total Songs', value: loading ? '...' : (statsData?.songs ?? 0).toLocaleString(), icon: Music, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Total Charts', value: loading ? '...' : (statsData?.charts ?? 0).toLocaleString(), icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Total Users', value: loading ? '...' : (statsData?.accounts ?? 0).toLocaleString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">System Dashboard</h1>
          <p className="text-textMuted font-medium">Monitoring application health and database statistics.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="glass-panel px-4 py-3 flex items-center gap-3 border border-white/5">
            <Database size={18} className={healthData?.info.database.status === 'up' ? 'text-green-400' : 'text-red-400'} />
            <div>
              <p className="text-[10px] font-black text-textMuted uppercase tracking-widest leading-none mb-1">Database</p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white capitalize">{healthData?.info.database.status || '...'}</span>
              </div>
            </div>
          </div>
          <div className="glass-panel px-4 py-3 flex items-center gap-3 border border-white/5">
            <Server size={18} className={healthData?.info.redis.status === 'up' ? 'text-blue-400' : 'text-red-400'} />
            <div>
              <p className="text-[10px] font-black text-textMuted uppercase tracking-widest leading-none mb-1">Cache</p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white capitalize">{healthData?.info.redis.status || '...'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="glass-panel p-8 rounded-3xl flex items-center gap-6 group hover:bg-white/[0.03] transition-all duration-300">
              <div className={`p-5 rounded-2xl ${stat.bg} ${stat.color} transition-transform duration-500 group-hover:scale-110`}>
                <Icon size={32} />
              </div>
              <div>
                <p className="text-xs font-black text-textMuted uppercase tracking-widest mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-white tabular-nums">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-10 rounded-[32px] overflow-hidden relative">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
             <div className="w-2 h-6 bg-primary-500 rounded-full" />
             System Status
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                   <Activity className="text-green-500" size={20} />
                </div>
                <div>
                   <p className="text-sm font-bold text-white">Main API Cluster</p>
                   <p className="text-[10px] text-textMuted uppercase tracking-wider">Online & Responsive</p>
                </div>
              </div>
              <CheckCircle2 className="text-green-500" size={20} />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                   <Server className="text-indigo-500" size={20} />
                </div>
                <div>
                   <p className="text-sm font-bold text-white">Redis Infrastructure</p>
                   <p className="text-[10px] text-textMuted uppercase tracking-wider">Memory usage stable</p>
                </div>
              </div>
              {healthData?.info.redis.status === 'up' ? <CheckCircle2 className="text-green-500" size={20} /> : <XCircle className="text-red-500" size={20} />}
            </div>
          </div>
        </div>

        <div className="glass-panel p-10 rounded-[32px] min-h-[300px]">
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center h-48 text-textMuted border border-dashed border-white/5 rounded-3xl bg-black/20">
            <Music size={32} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">All systems operational.</p>
            <p className="text-[10px] uppercase tracking-widest mt-1 opacity-50">No logs for last 24h</p>
          </div>
        </div>
      </div>
    </div>
  );
}
