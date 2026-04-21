import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { User, Mail, Phone, Shield, LogOut, ChevronRight, MapPin } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({ audits: 0, accuracy: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data: photos } = await supabase
        .from('photos')
        .select('analysis_status, analysis_result, visit:visits!inner(user_id)')
        .eq('visit.user_id', user.id);

      const total = photos?.length ?? 0;
      const complete = photos?.filter(p => p.analysis_status === 'complete').length ?? 0;
      const accuracy = total > 0 ? Math.round((complete / total) * 100) : 0;
      setStats({ audits: total, accuracy });
    };
    fetchStats();
  }, [user]);

  return (
    <div className="max-w-md mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 bg-primary rounded-[40px] flex items-center justify-center shadow-xl border-4 border-white">
            <User size={64} className="text-black" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-success text-white p-2 rounded-2xl shadow-lg border-2 border-white">
            <Shield size={20} />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-black">{user?.name}</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">{user?.role}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-[#e5e5e5] text-center">
          <p className="text-xl font-black text-black">{stats.audits}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Audits</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-[#e5e5e5] text-center">
          <p className="text-xl font-black text-primary">{stats.accuracy}%</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Completion</p>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold px-1">Personal Information</h3>
        <div className="bg-white rounded-[32px] border border-[#e5e5e5] divide-y divide-[#e5e5e5] overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <Mail className="text-gray-300" size={20} />
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</p>
              <p className="font-bold text-black">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5">
            <Phone className="text-gray-300" size={20} />
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</p>
              <p className="font-bold text-black">{user?.phone || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5">
            <MapPin className="text-gray-300" size={20} />
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Region</p>
              <p className="font-bold text-black">Nairobi Central</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold px-1">Account</h3>
        <div className="bg-white rounded-[32px] border border-[#e5e5e5] divide-y divide-[#e5e5e5] overflow-hidden shadow-sm">
          <button onClick={signOut} className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors group">
            <div className="flex items-center gap-4">
              <LogOut className="text-urgent" size={20} />
              <span className="font-bold text-urgent">Sign Out</span>
            </div>
            <ChevronRight className="text-red-200 group-hover:translate-x-1 transition-transform" size={20} />
          </button>
        </div>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs font-bold text-gray-300 italic">merchAI v1.0.4</p>
      </div>
    </div>
  );
};

export default ProfilePage;
