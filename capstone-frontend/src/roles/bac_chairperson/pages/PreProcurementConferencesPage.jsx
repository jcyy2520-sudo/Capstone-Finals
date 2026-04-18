import toast from '../../../utils/toast';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Users, RefreshCw, CheckCircle2, Eye, Info, FileText, Calendar } from 'lucide-react';

export default function PreProcurementConferencesPage() {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConference, setSelectedConference] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchConferences(); }, []);

  const fetchConferences = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pre-procurement-conferences');
      setConferences(res.data.data || res.data || []);
    } catch (err) { toast.error('Failed to load conferences.'); console.error(err); }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this pre-procurement conference? This will allow invitation creation.')) return;
    setSubmitting(true);
    try {
      await api.post(`/pre-procurement-conferences/${id}/approve`);
      toast.success('Conference approved. Invitation creation is now unlocked.');
      setSelectedConference(null);
      fetchConferences();
    } catch (err) { toast.error(err.response?.data?.message || 'Approval failed.'); }
    finally { setSubmitting(false); }
  };

  const statusBadge = (status) => {
    const config = {
      scheduled: { cls: 'bg-blue-100 text-blue-700', label: 'Scheduled' },
      conducted: { cls: 'bg-amber-100 text-amber-700', label: 'Conducted - Pending Approval' },
      approved: { cls: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    };
    const c = config[status] || { cls: 'bg-gray-100 text-gray-600', label: status };
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.cls}`}>{c.label}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pre-Procurement Conferences</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center italic">
            <Info className="w-4 h-4 mr-2 text-blue-500" /> Review and approve conducted conferences to unlock invitation creation.
          </p>
        </div>
        <button onClick={fetchConferences} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-all shadow-sm">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading conferences...</p>
          </div>
        ) : conferences.length === 0 ? (
          <div className="p-20 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No Pre-Procurement Conferences Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">PR Reference</th>
                  <th className="px-8 py-5">Conference Date</th>
                  <th className="px-8 py-5">Venue</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Validations</th>
                  <th className="px-8 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {conferences.map(conf => (
                  <tr key={conf.id} className="hover:bg-blue-50/20 transition-all">
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-900 font-mono text-sm">{conf.purchase_requisition?.pr_reference || 'N/A'}</p>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {conf.conference_date ? new Date(conf.conference_date).toLocaleDateString() : 'TBD'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-700">{conf.venue || 'TBD'}</td>
                    <td className="px-8 py-5">{statusBadge(conf.status)}</td>
                    <td className="px-8 py-5">
                      {conf.status !== 'scheduled' && (
                        <div className="flex gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${conf.abc_validated ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>ABC</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${conf.specs_validated ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>SPECS</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${conf.bidding_docs_validated ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>DOCS</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center">
                      {conf.status === 'conducted' && (
                        <button onClick={() => handleApprove(conf.id)} disabled={submitting}
                          className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 mx-auto disabled:opacity-50">
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                      )}
                      {conf.status === 'approved' && (
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
