import toast from '../../../utils/toast';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import DocumentVersionHistory from '../../../shared/components/DocumentVersionHistory';
function AwardsPage() {
  const currentRole = 'bac_secretariat';
  const [data, setData] = useState({ bac_resolutions: [], awards: [] });
  const [loading, setLoading] = useState(true);
  // Form states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [activeRes, setActiveRes] = useState(null);
  const [perfSecPercent, setPerfSecPercent] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
   
   
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/awards');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveResolution = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/awards/resolutions/${activeRes.id}/approve`, {
        performance_security_percentage: parseFloat(perfSecPercent)
      });
      toast.success('BAC Resolution Approved. DRAFT NOA Generated.');
      setShowApproveModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueNOA = async (awardId) => {
    try {
      if (!window.confirm("Digitally actuate Notice of Award? This issues the NOA to the Vendor.")) return;
      await api.put(`/awards/${awardId}/issue-noa`);
      toast.success("Notice of Award Issued!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue NOA.');
    }
  };

  const handleVendorAcknowledge = async (awardId) => {
    try {
      await api.put(`/awards/${awardId}/acknowledge`);
      toast.success("Simulated vendor acknowledgment registered.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to acknowledge NOA.');
    }
  };

  const handleCancelAward = async (awardId) => {
    const grounds = window.prompt("Enter mandatory legal cancellation grounds (min 20 characters):");
    if (!grounds || grounds.length < 20) {
        toast.error("Grounds missing or too short.");
        return;
    }
    try {
      await api.post(`/awards/${awardId}/cancel`, { cancellation_grounds: grounds });
      toast.success("Award cancelled. System notified BAC to resort ranks.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel award.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Award Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Review BAC Award Recommendations and manage the Notice of Award cycle.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Pending Recommendations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 px-3 py-2.5 border-b border-orange-100 flex justify-between items-center">
            <h3 className="font-semibold text-orange-800">Pending Resolutions for HOPE</h3>
            <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">{data.bac_resolutions.filter(r=>r.status==='signed').length}</span>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
             {data.bac_resolutions.filter(r => r.status === 'signed' || r.status === 'approved_by_hope').length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No pending award recommendations found.</p>
             ) : (
                data.bac_resolutions.filter(r => r.type === 'award_recommendation').map(res => (
                  <div key={res.id} className={`p-4 border rounded-lg ${res.status === 'approved_by_hope' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                       <div>
                         <p className="font-bold text-gray-800">{res.resolution_reference}</p>
                         <p className="text-sm text-gray-600 mt-1">{res.subject}</p>
                         <p className="text-xs text-gray-500 mt-1">Invitation Reference: {res.invitation?.pr_id}</p>
                         <span className={`inline-block mt-2 px-2 py-1 text-xs rounded font-semibold ${res.status === 'signed' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                            {res.status.replace(/_/g, ' ')}
                         </span>
                       </div>
                       <div>
                         {res.status === 'signed' && (
                           <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">Awaiting HOPE Approval</span>
                         )}
                       </div>
                    </div>
                  </div>
                ))
             )}
          </div>
        </div>

        {/* Notice of Awards Tracker */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 px-3 py-2.5 border-b border-blue-100">
            <h3 className="font-semibold text-blue-800">Active Notice of Awards</h3>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
             {data.awards.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No active awards tracked.</p>
             ) : (
                data.awards.map(award => (
                  <div key={award.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                     <div className="flex justify-between border-b pb-2 mb-2">
                        <span className="font-bold text-gray-800">{award.noa_reference}</span>
                        <span className={`px-2 py-1 text-xs rounded font-bold ${
                            award.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' : 
                            award.status === 'ISSUED' ? 'bg-yellow-100 text-yellow-800' : 
                            award.status === 'ACKNOWLEDGED' ? 'bg-blue-100 text-blue-800' : 
                            award.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                           {award.status}
                        </span>
                     </div>
                     <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Vendor ID:</strong> {award.vendor_id} | {award.vendor?.business_name}</p>
                        <p><strong>Contract Amt:</strong> ₱{Number(award.contract_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        <p><strong>Perf. Security required:</strong> ₱{Number(award.performance_security_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        {award.status === 'ACKNOWLEDGED' && award.performance_security_deadline && (
                           <p className="text-red-700 font-medium">Security Required By: {new Date(award.performance_security_deadline).toLocaleDateString()}</p>
                        )}
                        {award.cancellation_grounds && (
                           <p className="text-red-600 italic">" {award.cancellation_grounds} "</p>
                        )}
                     </div>

                     {/* Document Version History */}
                     <div className="mt-3">
                       <DocumentVersionHistory entityType="App\\Models\\Award" entityId={award.id} />
                     </div>

                     {/* Action Handlers — Secretariat tracking view */}
                     <div className="mt-3 pt-2 border-t flex flex-wrap gap-2 justify-end">
                        {award.status === 'ISSUED' && award.noa_acknowledgment_deadline && (
                           <span className="text-xs text-amber-700 font-medium">Ack Deadline: {new Date(award.noa_acknowledgment_deadline).toLocaleDateString()}</span>
                        )}
                     </div>
                  </div>
                ))
             )}
          </div>
        </div>

      </div>

      {/* Approve Resolution Modal */}
      {showApproveModal && activeRes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="text-lg font-semibold text-gray-800">HOPE Approval</h3>
               <button onClick={() => setShowApproveModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
             </div>
             
             <form onSubmit={handleApproveResolution} className="p-6 space-y-4">
                <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm mb-4">
                  You are generating the Draft Notice of Award for `{activeRes.resolution_reference}`. 
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Performance Security Rate (%)</label>
                   <select 
                     value={perfSecPercent} 
                     onChange={e => setPerfSecPercent(e.target.value)} 
                     className="w-full px-3 py-2 border rounded border-gray-300 focus:ring-blue-500 text-sm"
                   >
                     <option value={2}>2% (Cash/Manager's Check)</option>
                     <option value={5}>5% (Bank Draft/Guarantee)</option>
                     <option value={10}>10% (Surety Bond)</option>
                   </select>
                   <p className="text-xs text-gray-500 mt-1">This multiplier computes the financial guarantee mathematically bound to the winning 'Calculated Price'.</p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                   <button type="button" onClick={() => setShowApproveModal(false)} className="px-4 py-2 border rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                   <button type="submit" disabled={submitting} className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex gap-2 items-center">
                      {submitting ? 'Approving...' : <><span>Approve Resolution & Draft NOA</span></>}
                   </button>
                </div>
             </form>

           </div>
        </div>
      )}
    </div>
  );
}

export default AwardsPage;
