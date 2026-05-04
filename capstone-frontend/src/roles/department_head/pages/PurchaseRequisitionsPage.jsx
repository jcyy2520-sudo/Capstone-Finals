import { useEffect, useState } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';

const STATUS_STYLES = {
  pending_dh_endorsement: 'bg-amber-100 text-amber-800',
  pending_budget_certification: 'bg-blue-100 text-blue-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  returned: 'bg-rose-100 text-rose-700',
};

const STATUS_LABELS = {
  pending_dh_endorsement: 'Awaiting Endorsement',
  pending_budget_certification: 'Endorsed',
  accepted: 'Accepted',
  returned: 'Returned',
};

export default function DepartmentHeadPurchaseRequisitionsPage() {
  const [purchaseRequisitions, setPurchaseRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_dh_endorsement');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPurchaseRequisitions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchPurchaseRequisitions = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const response = await api.get('/purchase-requisitions', { params });
      setPurchaseRequisitions(response.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load purchase requisitions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (purchaseRequisitionId, action) => {
    const loadingKey = `${action}-${purchaseRequisitionId}`;
    setActionLoading(loadingKey);

    try {
      if (action === 'return') {
        const remarks = window.prompt('Enter return remarks (min 10 characters):');
        if (!remarks || remarks.trim().length < 10) {
          if (remarks !== null) toast.error('Remarks must be at least 10 characters.');
          return;
        }
        await api.post(`/purchase-requisitions/${purchaseRequisitionId}/return`, { remarks });
        toast.success('Purchase requisition returned to the requester.');
      } else {
        await api.post(`/purchase-requisitions/${purchaseRequisitionId}/endorse`);
        toast.success('Purchase requisition endorsed for budget certification.');
      }

      fetchPurchaseRequisitions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">PR Endorsements</h1>
        <p className="text-sm text-gray-500 mt-1">Endorse or return purchase requisitions from your department before budget certification.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'pending_dh_endorsement', label: 'Awaiting Endorsement' },
          { value: 'pending_budget_certification', label: 'Endorsed' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'returned', label: 'Returned' },
          { value: '', label: 'All Visible' },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              filter === item.value ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading purchase requisitions...</div>
        ) : purchaseRequisitions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No purchase requisitions found for this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">PR Reference</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Department</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Purpose</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">Total (PHP)</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Status</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchaseRequisitions.map((purchaseRequisition) => (
                  <tr key={purchaseRequisition.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-900">{purchaseRequisition.pr_reference}</td>
                    <td className="px-3 py-2.5 text-gray-600">{purchaseRequisition.department?.name || 'Department not set'}</td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-md truncate">{purchaseRequisition.purpose}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-800">
                      {Number.parseFloat(purchaseRequisition.total_value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[purchaseRequisition.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[purchaseRequisition.status] || purchaseRequisition.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {purchaseRequisition.status === 'pending_dh_endorsement' ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            disabled={actionLoading === `endorse-${purchaseRequisition.id}`}
                            onClick={() => handleAction(purchaseRequisition.id, 'endorse')}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Endorse
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === `return-${purchaseRequisition.id}`}
                            onClick={() => handleAction(purchaseRequisition.id, 'return')}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                          >
                            Return
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
      </div>
    </div>
  );
}