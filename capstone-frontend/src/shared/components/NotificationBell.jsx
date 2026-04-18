import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../../services/api';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.unread_count);
    } catch {
      // silent — bell degrades gracefully
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications', { params: { per_page: 10 } });
      setNotifications(data.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    if (!open) fetchNotifications();
    setOpen(!open);
  };

  const handleClick = async (notif) => {
    if (!notif.read_at) {
      try {
        await api.post(`/notifications/${notif.id}/read`);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
        );
      } catch { /* ignore */ }
    }
    if (notif.action_url) {
      navigate(notif.action_url);
      setOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
    } catch { /* ignore */ }
  };

  const priorityColor = {
    critical: 'bg-red-100 border-l-4 border-red-500',
    high: 'bg-amber-50 border-l-4 border-amber-500',
    normal: '',
    low: 'text-gray-500',
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[400px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <h3 className="font-semibold text-[13px] text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-3 text-center text-gray-400 text-[13px]">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-[13px]">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition border-b border-gray-50 ${
                    !notif.read_at ? 'bg-blue-50/50' : ''
                  } ${priorityColor[notif.priority] || ''}`}
                >
                  <div className="flex items-start gap-1.5">
                    {!notif.read_at && (
                      <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 truncate">{notif.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(notif.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
