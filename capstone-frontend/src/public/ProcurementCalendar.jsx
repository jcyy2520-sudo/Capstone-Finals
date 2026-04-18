import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Clock, FileText } from 'lucide-react';
import publicApi from '../services/publicApi';

const modeColors = {
  competitive_bidding: 'bg-blue-100 text-blue-700 border-blue-200',
  limited_source_bidding: 'bg-violet-100 text-violet-700 border-violet-200',
  direct_contracting: 'bg-amber-100 text-amber-700 border-amber-200',
  shopping: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  shopping_52_1a: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  shopping_52_1b: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  small_value_procurement: 'bg-teal-100 text-teal-700 border-teal-200',
  negotiated_procurement: 'bg-orange-100 text-orange-700 border-orange-200',
  repeat_order: 'bg-slate-100 text-slate-700 border-slate-200',
};

const modeLabels = {
  competitive_bidding: 'Competitive Bidding',
  limited_source_bidding: 'Limited Source',
  direct_contracting: 'Direct Contracting',
  shopping: 'Shopping',
  shopping_52_1a: 'Shopping (52.1a)',
  shopping_52_1b: 'Shopping (52.1b)',
  small_value_procurement: 'Small Value',
  negotiated_procurement: 'Negotiated',
  repeat_order: 'Repeat Order',
};

const eventTypeColors = {
  submission_deadline: 'text-red-600',
  opening_date: 'text-blue-600',
  pre_bid_conference: 'text-amber-600',
  eligibility_check: 'text-violet-600',
};

export default function ProcurementCalendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await publicApi.get('/calendar');
      setEvents(res.data.data || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // Filter events for current month
  const monthEvents = events.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
  });

  // Group events by date
  const grouped = {};
  for (const e of monthEvents) {
    const dateKey = new Date(e.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(e);
  }

  const monthLabel = currentMonth.toLocaleDateString('en-PH', { year: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pt-2 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-3">
          <Calendar size={14} />
          Upcoming Procurement Dates
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Procurement Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">Upcoming bid deadlines and procurement events</p>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors">
            <ChevronLeft size={16} /> Previous
          </button>
          <h2 className="text-base font-semibold text-slate-900">{monthLabel}</h2>
          <button onClick={nextMonth} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors">
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading calendar...</span>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <FileText size={24} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No upcoming events for {monthLabel}.</p>
          <p className="text-xs text-slate-300 mt-1">Try navigating to another month.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateKey, dateEvents]) => (
            <div key={dateKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Clock size={12} />
                  {dateKey}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">({dateEvents.length} event{dateEvents.length > 1 ? 's' : ''})</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {dateEvents.map((evt, idx) => (
                  <div
                    key={`${evt.reference_number}-${evt.event_type}-${idx}`}
                    onClick={() => navigate(`/transparency/${evt.reference_number}`)}
                    className="px-4 py-3 hover:bg-slate-50/50 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[11px] font-semibold ${eventTypeColors[evt.event_type] || 'text-slate-600'}`}>
                          {evt.event_label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(evt.date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate">{evt.project_title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-[10px] text-blue-500">{evt.reference_number}</code>
                        <span className="text-[10px] text-slate-400">{evt.department}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${
                      modeColors[evt.procurement_mode] || 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {modeLabels[evt.procurement_mode] || evt.procurement_mode}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
