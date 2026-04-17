import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { HiOutlineMoon, HiOutlineSun, HiOutlineBell, HiOutlineStatusOnline } from 'react-icons/hi';

export default function TopBar() {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { connected } = useSocket();

  return (
    <header className="sticky top-0 z-30 bg-navy-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: spacer for mobile menu */}
        <div className="w-10 lg:w-0" />

        {/* Right side actions */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-xs">
            <HiOutlineStatusOnline
              className={`text-lg ${connected ? 'text-emerald-400' : 'text-red-400'}`}
            />
            <span className={`hidden sm:inline ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            id="dark-mode-toggle"
          >
            {darkMode ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
          </button>

          {/* Notification bell */}
          <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all relative" id="notification-bell">
            <HiOutlineBell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-purple-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
