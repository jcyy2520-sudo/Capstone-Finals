import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';

export default function GenericLayout({ Sidebar }) {
  const { user } = useAuth();

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Dynamic Role Sidebar */}
      {Sidebar && (
        <div className="sticky top-0 self-start h-screen flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-12 bg-white border-b border-gray-200/80 flex items-center justify-between px-5 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              {user?.role?.display_name || 'Dashboard'}
            </h2>
            {user?.department && (
              <p className="text-[11px] text-gray-400">{user.department.name}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-[11px] text-gray-400">
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
