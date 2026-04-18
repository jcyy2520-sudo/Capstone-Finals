import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';
import { Receipt, CheckCircle, XCircle, DollarSign, AlertTriangle } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleValidate = async (invoiceId) => {
    if (!window.confirm('Run three-way match and validate this invoice?')) return;
    setActionLoading(invoiceId);
    try {
      const res = await api.put(`/invoices/${invoiceId}/validate`);
      toast.success(res.data.message || 'Invoice validated');
      fetchInvoices();
    } catch (err) {
      const msg = err.response?.data?.message || 'Validation failed';
      const matchResults = err.response?.data?.match_results;
      if (matchResults) {
        const failures = Object.entries(matchResults).filter(([, v]) => !v).map(([k]) => k.replace(/_/g, ' '));
        toast.error(`${msg}: ${failures.join(', ')}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (invoiceId) => {
    const remarks = window.prompt('Rejection reason (min 10 characters):');
    if (!remarks || remarks.length < 10) { toast.error('Rejection reason must be at least 10 characters'); return; }
    setActionLoading(invoiceId);
    try {
      await api.put(`/invoices/${invoiceId}/reject`, { remarks });
      toast.success('Invoice rejected');
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    if (!window.confirm('Mark this invoice as paid?')) return;
    setActionLoading(invoiceId);
    try {
      await api.put(`/invoices/${invoiceId}/pay`);
      toast.success('Invoice marked as paid');
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      submitted: 'bg-amber-100 text-amber-800',
      validated: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;
  }

  const pendingCount = invoices.filter(i => i.status === 'submitted').length;
  const validatedCount = invoices.filter(i => i.status === 'validated').length;
  const paidCount = invoices.filter(i => i.status === 'paid').length;
  const rejectedCount = invoices.filter(i => i.status === 'rejected').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Invoice Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Validate invoices with three-way match (Contract × IAR × Invoice) before payment certification.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pending Validation</p>
          <p className="text-2xl font-bold text-amber-600">{String(pendingCount).padStart(2, '0')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Validated</p>
          <p className="text-2xl font-bold text-blue-600">{String(validatedCount).padStart(2, '0')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-green-600">{String(paidCount).padStart(2, '0')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{String(rejectedCount).padStart(2, '0')}</p>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Invoice Register</h2>
        </div>
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Invoice #</th>
                  <th className="px-6 py-3 text-left">Vendor</th>
                  <th className="px-6 py-3 text-left">Contract</th>
                  <th className="px-6 py-3 text-left">IAR</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono font-medium text-gray-900">{inv.invoice_number}</td>
                    <td className="px-6 py-3 text-gray-700">{inv.vendor?.business_name || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{inv.contract?.contract_reference || `CON-${String(inv.contract_id).padStart(5, '0')}`}</td>
                    <td className="px-6 py-3 text-gray-600">IAR-{String(inv.iar_id).padStart(4, '0')}</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900">₱{Number(inv.amount).toLocaleString()}</td>
                    <td className="px-6 py-3">{getStatusBadge(inv.status)}</td>
                    <td className="px-6 py-3 text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status === 'submitted' && (
                          <>
                            <button onClick={() => handleValidate(inv.id)} disabled={actionLoading === inv.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition" title="Three-way match & validate">
                              <CheckCircle className="w-3.5 h-3.5" /> Validate
                            </button>
                            <button onClick={() => handleReject(inv.id)} disabled={actionLoading === inv.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {inv.status === 'validated' && (
                          <button onClick={() => handleMarkPaid(inv.id)} disabled={actionLoading === inv.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition">
                            <DollarSign className="w-3.5 h-3.5" /> Mark Paid
                          </button>
                        )}
                        {inv.remarks && (
                          <span className="text-xs text-gray-400" title={inv.remarks}>
                            <AlertTriangle className="w-3.5 h-3.5 inline text-amber-500" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900 mb-1">No invoices yet</p>
            <p className="text-sm">Invoices submitted by vendors will appear here for validation.</p>
          </div>
        )}
      </div>
    </div>
  );
}