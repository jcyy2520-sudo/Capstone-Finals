import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';
import { RefreshCw, Plus, CheckCircle, Clock, FileText, Users, Info } from 'lucide-react';

export default function PreProcurementConferencePage() {
  const [conferences, setConferences] = useState([]);
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConductModal, setShowConductModal] = useState(false);
  const [selectedConference, setSelectedConference] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    purchase_requisition_id: '',
    conference_date: '',
    venue: '',
    agenda: '',
  });

  const [conductForm, setConductForm] = useState({
    attendees: [{ user_id: '', role: '', present: true }],
    abc_validated: false,
    specs_validated: false,
    bidding_docs_validated: false,
    minutes: '',
    remarks: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [confRes, prRes] = await Promise.all([
        api.get('/pre-procurement-conferences'),
        api.get('/purchase-requisitions', { params: { status: 'pending_mode_confirmation' } }),
      ]);
      setConferences(confRes.data.data || []);
      const prList = prRes.data.data || [];
      const modeConfirmed = await api.get('/purchase-requisitions', { params: { status: 'mode_confirmed' } });
      setPrs([...prList, ...(modeConfirmed.data.data || [])]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!createForm.purchase_requisition_id || !createForm.conference_date || !createForm.venue || !createForm.agenda) {
      return toast.error('All fields are required.');
    }
    setSubmitting(true);
    try {
      await api.post('/pre-procurement-conferences', createForm);
      toast.success('Conference scheduled successfully.');
      setShowCreateModal(false);
      setCreateForm({ purchase_requisition_id: '', conference_date: '', venue: '', agenda: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule conference.');
    }
    setSubmitting(false);
  };

  const handleConduct = async () => {
    if (!conductForm.minutes || conductForm.minutes.length < 50) {
      return toast.error('Minutes must be at least 50 characters.');
    }
    setSubmitting(true);
    try {
      await api.post(`/pre-procurement-conferences/${selectedConference.id}/conduct`, conductForm);
      toast.success('Conference conducted. Pending chairperson approval.');
      setShowConductModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to conduct conference.');
    }
    setSubmitting(false);
  };

  const addAttendee = () => {
    setConductForm(prev => ({
      ...prev,
      attendees: [...prev.attendees, { user_id: '', role: '', present: true }],
    }));
  };

  const updateAttendee = (index, field, value) => {
    setConductForm(prev => ({
      ...prev,
      attendees: prev.attendees.map((a, i) => i === index ? { ...a, [field]: value } : a),
    }));
  };

  const statusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-600',
      scheduled: 'bg-blue-100 text-blue-700',
      conducted: 'bg-orange-100 text-orange-700',
      approved: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pre-Procurement Conferences</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center">
            <Info className="w-4 h-4 mr-2 text-blue-500" /> RA 9184 IRR Rule V - Validate ABC, specs, and bidding docs before advertisement.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" /> Schedule Conference
          </button>
          <button onClick={fetchData} className="p-2.5 bg-white border rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-all">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          </div>
        ) : conferences.length === 0 ? (
          <div className="p-20 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No conferences scheduled yet</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">PR Reference</th>
                <th className="px-6 py-4">Conference Date</th>
                <th className="px-6 py-4">Venue</th>
                <th className="px-6 py-4">Validations</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conferences.map(conf => (
                <tr key={conf.id} className="hover:bg-blue-50/20 transition-all">
                  <td className="px-6 py-4 font-mono text-sm font-bold">{conf.purchase_requisition?.pr_reference || `PR #${conf.purchase_requisition_id}`}</td>
                  <td className="px-6 py-4 text-sm">{new Date(conf.conference_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{conf.venue}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold ${conf.abc_validated ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>ABC</span>
                      <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold ${conf.specs_validated ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>SPECS</span>
                      <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold ${conf.bidding_docs_validated ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>DOCS</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{statusBadge(conf.status)}</td>
                  <td className="px-6 py-4 text-center">
                    {conf.status === 'scheduled' && (
                      <button onClick={() => { setSelectedConference(conf); setShowConductModal(true); }}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Conduct
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-8 py-6 border-b bg-blue-50/50">
              <h3 className="text-xl font-black text-blue-900">Schedule Pre-Procurement Conference</h3>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Purchase Requisition</label>
                <select value={createForm.purchase_requisition_id} onChange={e => setCreateForm(prev => ({ ...prev, purchase_requisition_id: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2 text-sm">
                  <option value="">Select PR...</option>
                  {prs.map(pr => <option key={pr.id} value={pr.id}>{pr.pr_reference} - {pr.app_entry?.project_title || pr.purpose}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Conference Date</label>
                <input type="datetime-local" value={createForm.conference_date} onChange={e => setCreateForm(prev => ({ ...prev, conference_date: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Venue</label>
                <input type="text" value={createForm.venue} onChange={e => setCreateForm(prev => ({ ...prev, venue: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2 text-sm" placeholder="e.g., BAC Conference Room A" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Agenda</label>
                <textarea value={createForm.agenda} onChange={e => setCreateForm(prev => ({ ...prev, agenda: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2 text-sm" rows={3} placeholder="Detailed agenda for the conference..." />
              </div>
            </div>
            <div className="px-8 py-6 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-6 py-2 text-sm text-gray-500 hover:text-gray-900">Cancel</button>
              <button disabled={submitting} onClick={handleCreate} className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Scheduling...' : 'Schedule Conference'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conduct Modal */}
      {showConductModal && selectedConference && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-8 py-6 border-b bg-emerald-50/50">
              <h3 className="text-xl font-black text-emerald-900">Conduct Conference</h3>
              <p className="text-xs text-emerald-600 mt-1">Record attendees, validations, and minutes</p>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Attendees */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-600 uppercase">Attendees</label>
                  <button onClick={addAttendee} className="text-xs text-blue-600 font-bold hover:underline">+ Add Attendee</button>
                </div>
                {conductForm.attendees.map((att, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="number" placeholder="User ID" value={att.user_id} onChange={e => updateAttendee(i, 'user_id', e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm" />
                    <input type="text" placeholder="Role (e.g., BAC Secretariat)" value={att.role} onChange={e => updateAttendee(i, 'role', e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm" />
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={att.present} onChange={e => updateAttendee(i, 'present', e.target.checked)} />
                      Present
                    </label>
                  </div>
                ))}
              </div>

              {/* Validations */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'abc_validated', label: 'ABC Validated' },
                  { key: 'specs_validated', label: 'Technical Specs Validated' },
                  { key: 'bidding_docs_validated', label: 'Bidding Docs Validated' },
                ].map(v => (
                  <label key={v.key} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${conductForm[v.key] ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <input type="checkbox" checked={conductForm[v.key]} onChange={e => setConductForm(prev => ({ ...prev, [v.key]: e.target.checked }))} />
                    <span className="text-xs font-bold">{v.label}</span>
                  </label>
                ))}
              </div>

              {/* Minutes */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Conference Minutes</label>
                <textarea value={conductForm.minutes} onChange={e => setConductForm(prev => ({ ...prev, minutes: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2 text-sm" rows={6} placeholder="Detailed minutes of the conference proceedings..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Remarks (Optional)</label>
                <input type="text" value={conductForm.remarks} onChange={e => setConductForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2 text-sm" />
              </div>
            </div>
            <div className="px-8 py-6 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowConductModal(false)} className="px-6 py-2 text-sm text-gray-500">Cancel</button>
              <button disabled={submitting} onClick={handleConduct} className="px-6 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Saving...' : 'Record Conference'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
