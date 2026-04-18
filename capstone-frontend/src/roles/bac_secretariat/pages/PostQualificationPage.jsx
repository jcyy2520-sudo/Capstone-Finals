import toast from '../../../utils/toast';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
function PostQualificationPage() {
  const currentRole = 'bac_secretariat';
  const [data, setData] = useState({ bid_openings: [], post_qualifications: {}, bac_resolutions: {} });
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalResult, setEvalResult] = useState('pass');
  const [failReason, setFailReason] = useState('');
  const [activePqToEvaluate, setActivePqToEvaluate] = useState(null);

  useEffect(() => {
    fetchData();
   
   
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/post-qualifications');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiate = async (openingId) => {
    try {
      await api.post(`/post-qualifications/${openingId}/initiate`);
      toast.success("Post-Qualification Initiated for Lowest Calculated Bidder.");
      fetchData();
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to initiate.");
    }
  };

  const handleSimulateVendorSubmit = async (pqId) => {
    try {
      await api.post(`/post-qualifications/${pqId}/vendor-submit`);
      toast.success("Vendor documents simulated successfully.");
      fetchData();
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to simulate.");
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/post-qualifications/${activePqToEvaluate.id}/evaluate`, {
        result: evalResult,
        failure_reason: evalResult === 'fail' ? failReason : null,
      });
      toast.success(`Evaluation saved as ${evalResult}.`);
      setShowEvalModal(false);
      fetchData();
    } catch(err) {
      toast.error(err.response?.data?.message || "Evaluation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeResolution = async (resolutionId) => {
    try {
      await api.post(`/post-qualifications/resolution/${resolutionId}/finalize`);
      toast.success("BAC Resolution finalized and signed!");
      fetchData();
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to finalize resolution.");
    }
  };

  const activePqs = selectedOpening ? (data.post_qualifications[selectedOpening.id] || []) : [];
  
  const relatedResolutions = selectedOpening
    ? (data.bac_resolutions[selectedOpening.invitation_id] || []).filter(r => ['lcrb_declaration', 'award_recommendation'].includes(r.type))
    : [];

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Post-Qualification & Recommendation</h1>
        <p className="text-gray-500 text-sm mt-1">Verify documentation for the LCB and draft the BAC Resolution for Award.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sidebar List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 col-span-1 overflow-hidden h-fit">
          <div className="bg-gray-50 px-3 py-2.5 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700">Ready Sessions</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {loading ? <p className="p-4 text-gray-500">Loading...</p> : data.bid_openings.length === 0 ? <p className="p-4 text-gray-500 text-sm">No evaluated sessions pending post-qualification.</p> :
              data.bid_openings.map(o => (
                <div 
                  key={o.id} 
                  onClick={() => setSelectedOpening(o)}
                  className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selectedOpening?.id === o.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                >
                  <p className="font-medium text-gray-800 text-sm">{o.session_reference}</p>
                  <p className="text-xs text-gray-500 mt-1">Status: {o.status.replace(/_/g, ' ')}</p>
                </div>
              ))
            }
          </div>
        </div>

        {/* Main Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 col-span-1 md:col-span-2 p-6 flex flex-col gap-4">
          {!selectedOpening ? (
            <div className="text-center text-gray-500 py-12">Select a session on the left.</div>
          ) : (
            <>
              {/* Header Box */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                   <h2 className="text-base font-semibold text-gray-800">{selectedOpening.session_reference}</h2>
                   <p className="text-sm text-gray-600">Current Phase Status: <span className="font-semibold text-blue-700">{selectedOpening.status.replace(/_/g, ' ')}</span></p>
                </div>
                <div>
                   {(currentRole === 'bac_secretariat' || currentRole === 'system_admin') && selectedOpening.status === 'EVALUATION_APPROVED' && (
                       <button onClick={() => handleInitiate(selectedOpening.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                          Initiate Post-Qualification
                       </button>
                   )}
                </div>
              </div>

              {/* Display PQ Records */}
              {activePqs.length > 0 && (
                 <div>
                   <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">Post-Qualification Tracker</h4>
                   <div className="space-y-4">
                     {activePqs.map(pq => (
                       <div key={pq.id} className={`p-4 rounded-lg border ${pq.result === 'failed' ? 'border-red-200 bg-red-50' : pq.result === 'passed' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                         <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-gray-800">Rank {pq.rank} - Vendor ID {pq.vendor_id}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Docs Submitted: {pq.documents_submitted_at ? new Date(pq.documents_submitted_at).toLocaleString() : 'Pending'}
                              </p>
                              <p className="text-sm mt-2 font-semibold">
                                Result: {pq.result ? pq.result.toUpperCase() : 'PENDING'}
                                {pq.result === 'failed' && <span className="block font-normal text-red-600">Reason: {pq.failure_reason}</span>}
                              </p>
                            </div>
                            
                            {/* Action Buttons for active PQ */}
                            {(pq.result === null || pq.result === 'pending') && (
                               <div className="space-y-2 flex flex-col items-end">
                                 {!pq.documents_submitted_at && (currentRole === 'system_admin' || currentRole === 'vendor') && (
                                    <button onClick={() => handleSimulateVendorSubmit(pq.id)} className="px-3 py-1 bg-yellow-500 text-white rounded text-xs font-medium hover:bg-yellow-600">
                                      Simulate Vendor Post-Qual Submit
                                    </button>
                                 )}
                                 {pq.documents_submitted_at && (currentRole === 'system_admin' || currentRole === 'twg_member' || currentRole === 'bac_member') && (
                                    <button onClick={() => { setActivePqToEvaluate(pq); setShowEvalModal(true); }} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700">
                                      Evaluate Documents
                                    </button>
                                 )}
                               </div>
                            )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              )}

              {/* BAC Resolution Section */}
              {relatedResolutions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                   <h4 className="font-semibold text-gray-700 mb-3">BAC Recommendations</h4>
                   {relatedResolutions.map(res => (
                     <div key={res.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{res.resolution_reference}</p>
                          <p className="text-sm text-gray-600">{res.subject}</p>
                          <p className={`text-xs mt-1 font-semibold ${res.status === 'signed' ? 'text-green-600' : 'text-orange-600'}`}>Status: {res.status}</p>
                        </div>
                        <div>
                          {res.status === 'draft' && (currentRole === 'bac_chairperson' || currentRole === 'system_admin') && (
                             <button onClick={() => handleFinalizeResolution(res.id)} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
                                Finalize & Sign (Aggregate)
                             </button>
                          )}
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Evaluate PQ Modal */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="text-lg font-semibold text-gray-800">Evaluate PQ Documents</h3>
               <button onClick={() => setShowEvalModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
             </div>
             <form onSubmit={handleEvaluate} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                  <select value={evalResult} onChange={(e) => setEvalResult(e.target.value)} className="w-full px-3 py-2 border rounded border-gray-300 text-sm">
                    <option value="pass">Pass (Declare LCRB)</option>
                    <option value="fail">Fail (Disqualify Rank)</option>
                  </select>
               </div>
               {evalResult === 'fail' && (
                 <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Failure Reason (Required for Fail)</label>
                    <textarea required value={failReason} onChange={e => setFailReason(e.target.value)} className="w-full px-3 py-2 border rounded border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm"></textarea>
                    <p className="text-xs text-gray-500 mt-1">If failed, the system automatically redirects back to the initiation phase to pull rank {activePqToEvaluate.rank + 1}.</p>
                 </div>
               )}
               <div className="mt-6 flex justify-end space-x-3">
                 <button type="button" onClick={() => setShowEvalModal(false)} className="px-4 py-2 border rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                 <button type="submit" disabled={submitting} className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Submit Decision'}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}

export default PostQualificationPage;
