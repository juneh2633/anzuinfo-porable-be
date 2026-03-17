import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, LogIn } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, pw: password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials or server error');
      }

      const data = await response.json();
      localStorage.setItem('admin_token', data.accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative background blooms */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[128px] pointer-events-none -translate-x-1/4 -translate-y-1/4" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none translate-x-1/4 translate-y-1/4" />

      <div className="w-full max-w-md px-6 z-10 animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary-500/10 border border-primary-500/20 mb-4 shadow-lg shadow-primary-500/10">
            <Lock className="text-primary-500" size={32} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Anzu Admin</h1>
          <p className="text-textMuted mt-2">Sign in to manage your portable music database</p>
        </div>

        <div className="glass-panel p-8 rounded-[2rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-textMuted ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted group-focus-within:text-primary-400 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all"
                  placeholder="Enter your admin ID"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-textMuted ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted group-focus-within:text-primary-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
                <AlertCircle size={18} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-textMuted text-sm mt-8">
          Authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
}
