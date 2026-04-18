import { useState, useEffect } from 'react';
import { DollarSign, FileCheck, Clock, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';

const STATUS_STYLES = {
  submitted: 'bg-amber-100 text-amber-700',
  validated: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ReportsPage() {
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [invRes, conRes] = await Promise.allSettled([
          api.get('/invoices', { signal: controller.signal }),
          api.get('/contracts', { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          if (invRes.status === 'fulfilled') setInvoices(invRes.value.data?.data || invRes.value.data || []);
          if (conRes.status === 'fulfilled') setContracts(conRes.value.data?.data || conRes.value.data || []);
        }
      } catch (err) {
        if (err?.name === 'CanceledError') return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const allInvoices = Array.isArray(invoices) ? invoices : [];
  const allContracts = Array.isArray(contracts) ? contracts : [];
  const paidInvoices = allInvoices.filter(i => i.status === 'paid');
  const pendingInvoices = allInvoices.filter(i => i.status === 'submitted' || i.status === 'validated');
  const rejectedInvoices = allInvoices.filter(i => i.status === 'rejected');

  const totalPaid = paidInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalPending = pendingInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Finance Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Invoice processing, disbursement tracking, and contract payment status.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading finance reports...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Total Disbursed" value={totalPaid > 0 ? `PHP ${totalPaid.toLocaleString('en-PH')}` : 'PHP 0'} />
            <StatCard icon={Clock} label="Pending Amount" value={totalPending > 0 ? `PHP ${totalPending.toLocaleString('en-PH')}` : 'PHP 0'} tone={totalPending > 0 ? 'amber' : undefined} />
            <StatCard icon={FileCheck} label="Invoices Processed" value={paidInvoices.length} />
            <StatCard icon={AlertTriangle} label="Rejected Claims" value={rejectedInvoices.length} tone={rejectedInvoices.length > 0 ? 'red' : undefined} />
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Invoice Register ({allInvoices.length})</h2>
            </div>
            {allInvoices.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No invoices found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Invoice #</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Vendor</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Amount</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Status</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allInvoices.slice(0, 15).map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-900 text-xs font-medium">{inv.invoice_number || `INV-${inv.id}`}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{inv.vendor?.name || inv.vendor_name || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-700 text-xs">{inv.amount ? `PHP ${Number(inv.amount).toLocaleString('en-PH')}` : '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_STYLES[inv.status] || 'bg-gray-100 text-gray-700'}`}>
                            {(inv.status || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs">{inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-PH') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Contracts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Active Contracts ({allContracts.length})</h2>
            </div>
            {allContracts.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No contracts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Contract #</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Vendor</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Amount</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allContracts.slice(0, 10).map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-900 text-xs font-medium">{c.contract_number || `CON-${c.id}`}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{c.vendor?.name || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-700 text-xs">{c.contract_amount ? `PHP ${Number(c.contract_amount).toLocaleString('en-PH')}` : '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                            c.status === 'active' ? 'bg-green-100 text-green-700' :
                            c.status === 'suspended' ? 'bg-red-100 text-red-700' :
                            c.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>{(c.status || '').replace(/_/g, ' ')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
        <Icon size={16} className="text-gray-400" />
      </div>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}