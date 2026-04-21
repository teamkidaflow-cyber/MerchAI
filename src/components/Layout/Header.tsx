import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../UI/NotificationBell';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-black/[0.07] px-5 py-3 flex items-center justify-between">
      <button onClick={() => navigate('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center">
          <span className="text-xs font-bold text-primary tracking-tight">AI</span>
        </div>
        <span className="text-[17px] font-bold tracking-tight text-ink">
          merch<span className="text-primary">AI</span>
        </span>
      </button>

      <div className="flex items-center gap-3">
        <NotificationBell userId={user?.id} />
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-ink">{user?.name}</span>
          <span className="text-[11px] text-gray-400 capitalize font-medium">{user?.role}</span>
        </div>
        <button
          onClick={signOut}
          className="p-2 text-gray-400 hover:text-ink hover:bg-black/5 rounded-lg transition-all duration-150"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
