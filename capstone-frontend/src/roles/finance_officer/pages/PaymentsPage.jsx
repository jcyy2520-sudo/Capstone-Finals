import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Badge from '../../../shared/components/Badge';
import Table from '../../../shared/components/Table';

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | paid | validated | pending

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data.data || res.data || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const pendingCount = invoices.filter((i) => i.status === 'pending' || i.status === 'validated').length;
  const paidCount = invoices.filter((i) => i.status === 'paid').length;

  const statusMap = {
    pending: 'pending',
    validated: 'pending_approval',
    paid: 'approved',
    rejected: 'rejected',
  };

  const columns = [
    { header: 'Invoice #', accessorKey: 'invoice_reference' },
    {
      header: 'Vendor',
      accessorKey: 'vendor',
      cell: ({ row }) => row.original.vendor?.business_name || row.original.vendor_id,
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }) => `₱${Number(row.original.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge status={statusMap[row.original.status] || 'pending'}>
          {row.original.status?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'created_at',
      cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">Finance Officer</p>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-slate-600 mt-1">
          Track disbursements, released payments, and items awaiting release authority.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-emerald-600">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-700">
            ₱{totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-blue-600">Paid Invoices</p>
          <p className="text-2xl font-bold text-blue-700">{paidCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-amber-600">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {['all', 'pending', 'validated', 'paid', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading payment data…</p>
      ) : (
        <Table columns={columns} data={filtered} />
      )}
    </div>
  );
}