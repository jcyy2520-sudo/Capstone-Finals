import toast from '../../../utils/toast';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import DocumentVersionHistory from '../../../shared/components/DocumentVersionHistory';
function ContractsPage({
  currentRole = 'bac_secretariat',
  title = 'Contract Management',
  description = 'Convert Acknowledged NOAs to Contracts, track project lifecycles, and monitor active operational progress.',
}) {
  const [data, setData] = useState({ pending_awards: [], contracts: [] });
  const [loading, setLoading] = useState(true);
  // Form states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [activeAward, setActiveAward] = useState(null);
  const [durationDays, setDurationDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [actionModal, setActionModal] = useState({ type: null, contractId: null, contractReference: '', reason: '' });

  useEffect(() => {
    fetchData();
   
   
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contracts');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/contracts/generate/${activeAward.id}`, {
        duration_days: parseInt(durationDays, 10)
      });
      toast.success('Contract mapped and Notice to Proceed dynamically issued.');
      setShowGenerateModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate contract.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeActionModal = () => {
    setActionModal({ type: null, contractId: null, contractReference: '', reason: '' });
  };

  const openActionModal = (type, contract) => {
    setActionModal({
      type,
      contractId: contract.id,
      contractReference: contract.contract_reference,
      reason: '',
    });
  };

  const submitContractAction = async () => {
    const trimmedReason = actionModal.reason.trim();
    const minLength = actionModal.type === 'terminate' ? 20 : 15;

    if (trimmedReason.length < minLength) {
      toast.error(`Reason must be at least ${minLength} characters.`);
      return;
    }

    const endpoint = actionModal.type === 'terminate' ? 'terminate' : 'suspend';
    const successMessage = actionModal.type === 'terminate'
      ? 'Contract legally terminated. Record anchored to blockchain.'
      : 'Contract formally suspended.';

    setSubmitting(true);
    try {
      await api.put(`/contracts/${actionModal.contractId}/${endpoint}`, { reason: trimmedReason });
      toast.success(successMessage);
      closeActionModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${endpoint} contract.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Pending Contract Fulfillment (Queue) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 col-span-1 overflow-hidden h-fit">
          <div className="bg-purple-50 px-3 py-2.5 border-b border-purple-100 flex justify-between items-center">
            <h3 className="font-semibold text-purple-800">Pending Execution</h3>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
             {data.pending_awards.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No pending awards awaiting contract.</p>
             ) : (
                data.pending_awards.map(award => (
                  <div key={award.id} className="p-4 border rounded-lg bg-white shadow-sm border-gray-200 hover:border-purple-300">
                    <p className="font-bold text-gray-800 text-sm">{award.noa_reference}</p>
                    <p className="text-xs text-gray-600 mt-1 truncate">Vendor: {award.vendor?.business_name}</p>
                    <p className="text-xs text-gray-600 mt-1">Contract Amt: ₱{Number(award.contract_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs rounded font-semibold bg-blue-100 text-blue-800">ACKNOWLEDGED NOA</span>
                    
                    <div className="mt-3 text-right">
                       {(currentRole === 'hope' || currentRole === 'system_admin') && (
                         <button onClick={() => {setActiveAward(award); setDurationDays(30); setShowGenerateModal(true);}} className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700">
                            Build Contract & NTP
                         </button>
                       )}
                    </div>
                  </div>
                ))
             )}
          </div>
        </div>

        {/* Active tracking matrix */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 col-span-1 lg:col-span-2 overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">Active Contracts Matrix</h3>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
             {data.contracts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No mapped contracts tracked in the matrix.</p>
             ) : (
                data.contracts.map(contract => (
                  <div key={contract.id} className={`p-4 border border-gray-200 rounded-lg hover:shadow-sm ${contract.status==='suspended'?'opacity-75':''}`}>
                     <div className="flex justify-between border-b pb-2 mb-2">
                        <div>
                          <span className="font-bold text-gray-800 block text-lg">{contract.contract_reference}</span>
                          <span className="text-xs text-blue-600 font-medium">NTP Reference: {contract.award?.ntp_reference || `NTP-${contract.contract_reference}`}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded h-fit font-bold ${
                            contract.status === 'active' ? 'bg-green-100 text-green-800' : 
                            contract.status === 'suspended' ? 'bg-orange-100 text-orange-800' : 
                            contract.status === 'terminated' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                           {contract.status.toUpperCase()}
                        </span>
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-gray-500 text-xs uppercase">Project Timespan</p>
                          <p className="font-medium text-gray-800">{new Date(contract.ntp_date).toLocaleDateString()} to {new Date(contract.end_date).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-600 mt-0.5">Duration: {contract.duration_days} days</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase">Vendor Information</p>
                          <p className="font-medium text-gray-800 truncate">{contract.vendor?.business_name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">Cost: ₱{Number(contract.contract_amount).toLocaleString()}</p>
                        </div>
                     </div>
                     
                     <div className="mt-4 pt-3 border-t">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-600">Implementation Progress</span>
                          <span className="font-bold text-gray-800">{Number(contract.computed_progress).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${contract.computed_progress > 100 || contract.days_remaining === 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${contract.computed_progress}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-gray-500">
                          {contract.status === 'active' ? (
                             <span>{contract.days_remaining} Days Remaining</span>
                          ) : (
                             <span className="italic">Timer frozen ({contract.status})</span>
                          )}
                        </div>
                     </div>

                     {/* Document Version History */}
                     <div className="mt-3">
                       <DocumentVersionHistory entityType="App\\Models\\Contract" entityId={contract.id} />
                     </div>

                     {/* Handlers */}
                     <div className="mt-4 flex gap-2 justify-end">
                        {contract.status === 'active' && (currentRole === 'hope' || currentRole === 'bac_secretariat' || currentRole === 'system_admin') && (
                        <button onClick={() => openActionModal('suspend', contract)} className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold hover:bg-orange-200">Suspend Target</button>
                        )}
                        {contract.status === 'active' && (currentRole === 'hope' || currentRole === 'system_admin') && (
                        <button onClick={() => openActionModal('terminate', contract)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200">Legal Terminate</button>
                        )}
                     </div>
                  </div>
                ))
             )}
          </div>
        </div>

      </div>

      {/* Generate Contract Modal */}
      {showGenerateModal && activeAward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="text-lg font-semibold text-gray-800">Generate Operational Record</h3>
               <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
             </div>
             
             <form onSubmit={handleGenerateContract} className="p-6 space-y-4">
                <div className="text-sm text-gray-600">
                  Initializing the execution architecture natively dispatches the <strong>Notice to Proceed (NTP)</strong>. We need to lock in the calendar constraints.
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Project Duration (Calendar Days)</label>
                   <input 
                     type="number" 
                     min="1" max="1825" required
                     value={durationDays} 
                     onChange={e => setDurationDays(e.target.value)} 
                     className="w-full px-3 py-2 border rounded border-gray-300 focus:ring-purple-500 focus:border-purple-500 text-sm"
                   />
                   <p className="text-xs text-gray-500 mt-1">This integer computes the termination end-date mathematically offset from today's NTP timestamp.</p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                   <button type="button" onClick={() => setShowGenerateModal(false)} className="px-4 py-2 border rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                   <button type="submit" disabled={submitting} className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex gap-2 items-center">
                      {submitting ? 'Generating...' : 'Sign Contract & NTP'}
                   </button>
                </div>
             </form>

           </div>
        </div>
      )}

      {actionModal.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className={`px-6 py-4 border-b flex justify-between items-center ${actionModal.type === 'terminate' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
              <div>
                <h3 className={`text-lg font-semibold ${actionModal.type === 'terminate' ? 'text-red-800' : 'text-orange-800'}`}>
                  {actionModal.type === 'terminate' ? 'Terminate Contract' : 'Suspend Contract'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{actionModal.contractReference}</p>
              </div>
              <button onClick={closeActionModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {actionModal.type === 'terminate'
                  ? 'Termination is permanent. Enter the legal grounds before proceeding.'
                  : 'Provide the formal suspension reason before proceeding.'}
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {actionModal.type === 'terminate' ? 'Legal Grounds' : 'Suspension Reason'}
                </label>
                <textarea
                  rows={4}
                  value={actionModal.reason}
                  onChange={(e) => setActionModal((current) => ({ ...current, reason: e.target.value }))}
                  placeholder={actionModal.type === 'terminate' ? 'State the legal basis for termination...' : 'State the suspension reason...'}
                  className="w-full px-3 py-2 border rounded border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum {actionModal.type === 'terminate' ? 20 : 15} characters.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
              <button type="button" onClick={closeActionModal} className="px-4 py-2 border rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={submitContractAction}
                disabled={submitting}
                className={`px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-50 ${actionModal.type === 'terminate' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {submitting ? 'Submitting...' : actionModal.type === 'terminate' ? 'Confirm Termination' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractsPage;
