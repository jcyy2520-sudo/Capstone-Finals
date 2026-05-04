import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, Loader2, Plus } from 'lucide-react';
import api from '../../../services/api';
import toast from '../../../utils/toast';

const statusClasses = {
  pending: 'bg-amber-100 text-amber-700',
  inspected: 'bg-blue-100 text-blue-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

export default function InspectionAcceptanceCommitteeInspectionsPage() {
  const [contracts, setContracts] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedContract, setSelectedContract] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [defects, setDefects] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inspectionResponse, contractResponse] = await Promise.all([
        api.get('/inspections'),
        api.get('/contracts'),
      ]);

      setInspections(inspectionResponse.data?.data || inspectionResponse.data || []);
      setContracts(contractResponse.data?.contracts || contractResponse.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load inspection records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableContracts = useMemo(
    () => contracts.filter((contract) => ['active', 'completed'].includes(contract.status)),
    [contracts],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedContract || !inspectionDate || !remarks.trim()) {
      toast.error('Contract, inspection date, and remarks are required.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/contracts/${selectedContract}/inspections`, {
        inspection_date: inspectionDate,
        remarks,
        defects: defects || null,
      });

      toast.success('Inspection report created.');
      setSelectedContract('');
      setInspectionDate('');
      setRemarks('');
      setDefects('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create inspection report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (inspectionId, action) => {
    const loadingKey = `${action}-${inspectionId}`;
    setActionLoading(loadingKey);

    try {
      if (action === 'reject') {
        const rejectionRemarks = window.prompt('Enter rejection remarks (min 10 characters):');
        if (!rejectionRemarks || rejectionRemarks.trim().length < 10) {
          if (rejectionRemarks !== null) toast.error('Remarks must be at least 10 characters.');
          return;
        }

        await api.put(`/inspections/${inspectionId}/reject`, { remarks: rejectionRemarks });
        toast.success('Inspection report rejected.');
      } else {
        await api.put(`/inspections/${inspectionId}/accept`);
        toast.success('Inspection report accepted.');
      }

      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Inspection action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Inspection and Acceptance Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Create IARs for delivered contracts and finalize committee acceptance decisions.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm min-w-[240px]">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-700">Pending</p>
            <p className="mt-1 text-xl font-semibold text-amber-900">{inspections.filter((inspection) => inspection.status === 'pending').length}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs uppercase tracking-wide text-blue-700">Inspected</p>
            <p className="mt-1 text-xl font-semibold text-blue-900">{inspections.filter((inspection) => inspection.status === 'inspected').length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px,minmax(0,1fr)]">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Create Inspection Report</h2>
              <p className="text-sm text-gray-500">Start an IAR for a delivered contract.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract</label>
              <select
                value={selectedContract}
                onChange={(event) => setSelectedContract(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Select delivered contract</option>
                {availableContracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.contract_reference} - {contract.vendor?.business_name || 'Vendor not set'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date</label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(event) => setInspectionDate(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Remarks</label>
              <textarea
                rows={4}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Summarize the inspection findings and delivery condition."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Defects or Variance</label>
              <textarea
                rows={3}
                value={defects}
                onChange={(event) => setDefects(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Leave blank if the delivery matches contract requirements."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
              Create IAR
            </button>
          </form>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading inspection records...</div>
          ) : inspections.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No inspection reports available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Contract</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Inspection Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Remarks</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{inspection.contract?.contract_reference || 'Contract reference unavailable'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{inspection.contract?.vendor?.business_name || 'Vendor not set'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{inspection.inspection_date || 'Not scheduled'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-lg">
                        <div className="line-clamp-3">{inspection.remarks || 'No remarks provided.'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses[inspection.status] || 'bg-gray-100 text-gray-600'}`}>
                          {inspection.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inspection.status === 'inspected' ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={actionLoading === `accept-${inspection.id}`}
                              onClick={() => handleDecision(inspection.id, 'accept')}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === `reject-${inspection.id}`}
                              onClick={() => handleDecision(inspection.id, 'reject')}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}