import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Image as ImageIcon, FileSpreadsheet, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItem = (isActive: boolean) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'bg-ink text-white shadow-sm'
      : 'text-gray-500 hover:bg-black/5 hover:text-ink'
  }`;

const Sidebar: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-60 h-[calc(100vh-57px)] sticky top-[57px] border-r border-black/[0.07] bg-white/60 backdrop-blur-sm p-4">
      <div className="flex-1 space-y-0.5">
        <NavLink to="/"            className={({ isActive }) => navItem(isActive)}><LayoutDashboard size={18} /><span>Dashboard</span></NavLink>
        <NavLink to="/photos"      className={({ isActive }) => navItem(isActive)}><ImageIcon size={18} /><span>Shelf Photos</span></NavLink>
        <NavLink to="/export"      className={({ isActive }) => navItem(isActive)}><FileSpreadsheet size={18} /><span>Bulk Export</span></NavLink>
        <NavLink to="/notifications" className={({ isActive }) => navItem(isActive)}><Bell size={18} /><span>Notifications</span></NavLink>
      </div>

      <div className="pt-3 border-t border-black/[0.07] space-y-0.5">
        <NavLink to="/settings" className={({ isActive }) => navItem(isActive)}>
          <Settings size={18} /><span>Settings</span>
        </NavLink>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-urgent hover:bg-red-50 transition-all duration-150"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
