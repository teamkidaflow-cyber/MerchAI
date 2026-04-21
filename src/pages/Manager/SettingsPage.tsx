import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { User, Mail, Phone, Shield, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name, phone })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-black">Settings</h1>
        <p className="text-gray-500 font-medium">Manage your account preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-[32px] border border-[#e5e5e5] p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
          <User size={20} className="text-primary" />
          <h2 className="text-xl font-bold">Profile Information</h2>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl py-3 px-4 outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+254 700 000 000"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl py-3 pl-12 pr-4 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email (read only)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full bg-gray-100 rounded-2xl py-3 pl-12 pr-4 font-medium text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary py-3 px-8 rounded-2xl shadow-lg disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          <span className="font-bold">{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-[32px] border border-[#e5e5e5] p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
          <Shield size={20} className="text-primary" />
          <h2 className="text-xl font-bold">Account</h2>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-500 font-medium">Role</span>
          <span className="font-bold capitalize text-black">{user?.role}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-500 font-medium">Member since</span>
          <span className="font-bold text-black">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-500 font-medium">App version</span>
          <span className="font-bold text-black">merchAI v1.0.4</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
