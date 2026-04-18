import { ShieldCheck, Calendar } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ThreeDotMenu from './ThreeDotMenu';

export default function TransparencyHeader() {
  const location = useLocation();
  const isCalendar = location.pathname.includes('/calendar');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <a href="/transparency" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <ShieldCheck size={16} className="text-white" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                ProcureSeal
              </span>
            </a>
            <nav className="hidden sm:flex items-center gap-1">
              <a
                href="/transparency"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  !isCalendar ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Procurements
              </a>
              <a
                href="/transparency/calendar"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                  isCalendar ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Calendar size={12} />
                Calendar
              </a>
            </nav>
          </div>
          <ThreeDotMenu />
        </div>
      </div>
    </header>
  );
}
