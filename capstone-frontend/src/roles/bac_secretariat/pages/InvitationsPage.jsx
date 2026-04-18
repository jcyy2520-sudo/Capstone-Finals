import toast from '../../../utils/toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import DocumentVersionHistory from '../../../shared/components/DocumentVersionHistory';
import { FileDown, Plus, Filter, Search, FileText, CheckCircle, Clock, AlertCircle, Info, Lock, ChevronDown, ChevronUp } from 'lucide-react';

export default function InvitationsPage() {
  const navigate = useNavigate();
  const currentRole = 'bac_secretariat';
  const [invitations, setInvitations] = useState([]);
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expandedInvId, setExpandedInvId] = useState(null);

  useEffect(() => {
    if (currentRole === 'bac_secretariat' || currentRole === 'system_admin') {
      api.get('/purchase-requisitions', { params: { status: 'mode_confirmed' } })
        .then(r => setPrs(r.data.data || []))
        .catch(err => console.error(err));
    }
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/invitations', { params });
      setInvitations(res.data.data || []);
    } catch (err) { toast.error('Failed to load invitations.'); console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchInvitations(); }, [filter]);

  const handleAction = async (id, action) => {
    try {
      if (action === 'download-pdf') {
        window.open(`${api.defaults.baseURL}/invitations/${id}/pdf`, '_blank');
        return;
      }
      
      if (action === 'send-rfq') {
        const vendorIdsStr = prompt('Enter a minimum of 3 Vendor IDs (comma-separated):');
        if (!vendorIdsStr) return;
        const vendor_ids = vendorIdsStr.split(',').map(v => v.trim()).filter(v => v);
        if (vendor_ids.length < 3) {
            toast.error('You must provide at least 3 vendor IDs for SVP.');
            return;
        }
        await api.post(`/invitations/${id}/${action}`, { vendor_ids });
      } else {
        await api.post(`/invitations/${id}/${action}`);
      }
      toast.success('Action completed successfully.');
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Action failed.');
    }
  };

  const normalize = (value) => String(value || '').toLowerCase();

  const statusBadge = (status) => {
    const normalized = normalize(status);
    const config = {
      draft: { color: 'bg-gray-100 text-gray-600', icon: Clock, label: 'Draft' },
      pending_chairperson_approval: { color: 'bg-orange-100 text-orange-700', icon: AlertCircle, label: 'For Chair Approval' },
      pending_hope_approval: { color: 'bg-amber-100 text-amber-700', icon: AlertCircle, label: 'For HOPE Approval' },
      approved: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Approved' },
      posted: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Posted' },
      sent: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Sent (RFQ)' },
      recorded: { color: 'bg-emerald-100 text-emerald-700', icon: FileText, label: 'Recorded' },
      closed: { color: 'bg-slate-100 text-slate-700', icon: Lock, label: 'Closed' },
    };
    
    const { color, icon: Icon, label } = config[normalized] || { color: 'bg-gray-100 text-gray-600', icon: Info, label: status };
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center w-fit ${color}`}>
        <Icon className="w-3 h-3 mr-1" /> {label}
      </span>
    );
  };

  const getActions = (inv) => {
    const actions = [];
    const status = normalize(inv.status);
    const mode = normalize(inv.procurement_mode);
    
    // Everyone can download PDF if not draft
    if (status !== 'draft') {
        actions.push({ label: 'PDF', action: 'download-pdf', color: 'gray', icon: FileDown });
    }

    if (status === 'draft') {
        actions.push({ label: 'Submit', action: 'submit', color: 'blue' });
    }
    
    if (status === 'approved') {
        if (['competitive_bidding', 'limited_source_bidding'].includes(mode)) {
            actions.push({ label: 'Post', action: 'post', color: 'green' });
        } else {
            actions.push({ label: 'Record', action: 'post', color: 'green' });
        }
    }

    if (status === 'sent' && mode === 'small_value_procurement') {
        // Additional RFQ actions could go here
    }

    return actions;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Procurement Invitations</h1>
          <p className="text-gray-500 mt-1 flex items-center">
            <Info className="w-4 h-4 mr-2 text-blue-500" /> Manage ITB, RFQ, and Alternative Mode advertisements per RA 12009.
          </p>
        </div>
        <div className="flex gap-3">
            <select 
                className="bg-white border rounded-xl px-4 py-2 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                    const pr = prs.find(p => p.id === parseInt(e.target.value));
                    if (pr) {
                        navigate('/secretariat/invitations/create', { state: { pr } });
                    }
                }}
                value=""
            >
                <option value="">+ Create New from PR...</option>
                {prs.map(p => (
                    <option key={p.id} value={p.id}>{p.pr_reference} - {p.app_entry?.project_title}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit mb-6 shadow-inner">
        {[
          { value: '', label: 'All Projects' },
          { value: 'draft', label: 'Drafts' },
          { value: 'pending_chairperson_approval', label: 'Chair Review' },
          { value: 'pending_hope_approval', label: 'HOPE Review' },
          { value: 'approved', label: 'Approved' },
          { value: 'posted', label: 'Released' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === f.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{f.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border shadow-xl shadow-gray-200/50 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
             <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
             <p className="text-gray-500 font-medium">Synchronizing with Blockchain...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Reference & Title</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4 text-right">ABC (₱)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invitations.map((inv) => (
                  <React.Fragment key={inv.id}>
                  <tr className={`group hover:bg-blue-50/30 transition-all ${expandedInvId === inv.id ? 'bg-blue-50/20' : ''}`}>
                    <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 font-mono text-xs">{inv.reference_number}</div>
                        <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{inv.project_title}</div>
                        {inv.overrides_count > 0 && (
                            <span className="inline-flex mt-1 items-center text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 rounded">
                                <AlertCircle className="w-2.5 h-2.5 mr-1" /> CUSTOMIZED
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">
                            {(inv.procurement_mode || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase">{inv.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-bold text-gray-900">
                      {(parseFloat(inv.abc) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">{statusBadge(inv.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {getActions(inv).map(a => (
                          <button key={a.action}
                            onClick={() => handleAction(inv.id, a.action)}
                            title={a.label}
                            className={`p-2 rounded-xl transition-all shadow-sm flex items-center justify-center hover:scale-110 active:scale-90 ${
                              a.color === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                              a.color === 'green' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                              'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {a.icon ? <a.icon className="w-4 h-4" /> : <span className="text-[10px] font-bold px-1">{a.label}</span>}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setExpandedInvId(expandedInvId === inv.id ? null : inv.id)} className="p-1 text-gray-400 hover:text-blue-600 transition" title="Document History">
                        {expandedInvId === inv.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                  {expandedInvId === inv.id && (
                    <tr><td colSpan="6" className="px-6 py-4 bg-gray-50/50">
                      <DocumentVersionHistory entityType="App\\Models\\Invitation" entityId={inv.id} />
                    </td></tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
