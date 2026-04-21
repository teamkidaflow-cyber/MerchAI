import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Camera, History, User } from 'lucide-react';

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-ink/95 backdrop-blur-xl border-t border-white/[0.08] px-6 py-3 pb-7 sm:hidden">
      <div className="flex items-center justify-between">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-primary' : 'text-white/30'}`
          }
        >
          <Home size={22} />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Home</span>
        </NavLink>

        <NavLink
          to="/capture"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-primary' : 'text-white/30'}`
          }
        >
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center -translate-y-5 shadow-xl shadow-primary/30 border-4 border-ink">
            <Camera size={22} className="text-ink" />
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-wider -mt-4">Capture</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-primary' : 'text-white/30'}`
          }
        >
          <History size={22} />
          <span className="text-[9px] font-semibold uppercase tracking-wider">History</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-primary' : 'text-white/30'}`
          }
        >
          <User size={22} />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
