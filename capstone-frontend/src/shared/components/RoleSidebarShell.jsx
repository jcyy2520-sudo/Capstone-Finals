import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from './Icon';

export default function RoleSidebarShell({ roleLabel, menuItems }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderItemIcon = (item) => {
    if (item.iconComponent) {
      const IconComponent = item.iconComponent;
      return <IconComponent className="w-4 h-4 flex-shrink-0" />;
    }
    return <Icon name={item.icon} className="w-4 h-4 flex-shrink-0" />;
  };

  return (
    <>
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-slate-900 text-white h-screen flex flex-col transition-all duration-200 flex-shrink-0 overflow-hidden`}>
        <div className="px-3 py-3 border-b border-white/10">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <h1 className="text-sm font-bold leading-tight">ProcureSeal</h1>
                  <p className="text-[10px] text-blue-300/50 truncate">RA 12009 Procurement</p>
                  <p className="text-[9px] uppercase mt-0.5 text-blue-400 font-semibold">{roleLabel}</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white transition p-1 rounded-md hover:bg-white/10"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <svg className={`w-4 h-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 min-h-0 px-2 py-2 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {renderItemIcon(item)}
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-2 border-t border-white/10">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-red-400 hover:bg-red-500/10 transition"
          >
            <Icon name="logout" className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[80] bg-black/50 p-4 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-xs overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Confirm Sign Out</h3>
              <p className="text-[13px] text-gray-500 mt-0.5">Are you sure you want to sign out?</p>
            </div>
            <div className="px-3 py-2.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-3 py-1.5 text-[13px] border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-[13px] bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}