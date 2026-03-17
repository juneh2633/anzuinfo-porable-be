import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Music, User } from 'lucide-react';
import clsx from 'clsx';

function Sidebar() {
  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Users', path: '/accounts', icon: User },
    { name: 'Song List', path: '/songs', icon: Music },
    { name: 'Song Upload', path: '/songs/upload', icon: Music },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-white/5 flex flex-col h-full z-10">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-indigo-400 bg-clip-text text-transparent">
          AnzuAdmin
        </h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary-500/10 text-primary-500 shadow-inner border border-primary-500/20 font-medium'
                    : 'text-textMuted hover:text-text hover:bg-white/5'
                )
              }
            >
              <Icon size={20} />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-white/5 text-sm text-textMuted text-center">
        &copy; 2026 Anzuinfo
      </div>
    </aside>
  );
}

export default Sidebar;
