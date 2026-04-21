import React, { useState } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../types';

interface NotificationBellProps {
  userId?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <CheckCircle2 size={16} className="text-blue-500" />;
      case 'warning':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'urgent':
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <Bell size={16} />;
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#e5e5e5] z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-[#e5e5e5] flex justify-between items-center">
            <h3 className="font-bold text-black">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e5e5]">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
