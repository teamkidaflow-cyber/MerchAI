import React, { useEffect, useState } from 'react';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { Bell, CheckCircle2, AlertCircle, AlertTriangle, Trash2, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Notification } from '../../types';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Managers view all notifications (service role needed for cross-user — using join workaround)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setNotifications(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read).map(n => n.id);
    if (!unread.length) return;
    await supabase.from('notifications').update({ read: true }).in('id', unread);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All marked as read');
  };

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return <CheckCircle2 size={20} className="text-blue-500" />;
      case 'warning': return <AlertCircle size={20} className="text-yellow-500" />;
      case 'urgent': return <AlertTriangle size={20} className="text-red-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black">Notifications</h1>
          <p className="text-gray-500 font-medium">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e5e5] rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <CheckCheck size={18} />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        [1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-white animate-pulse rounded-[24px] border border-[#e5e5e5]" />
        ))
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
          <Bell size={48} className="text-gray-200 mb-4" />
          <p className="font-bold text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-[#e5e5e5] divide-y divide-[#e5e5e5] overflow-hidden shadow-sm">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-5 transition-colors ${!notif.read ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
            >
              <div className="mt-0.5">{getIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-black ${!notif.read ? 'font-bold' : ''}`}>{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
              )}
              <button
                onClick={() => deleteNotif(notif.id)}
                className="p-1.5 text-gray-300 hover:text-urgent rounded-lg transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
