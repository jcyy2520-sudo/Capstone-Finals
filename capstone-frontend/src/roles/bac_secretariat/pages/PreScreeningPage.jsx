import { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';

const isTinValid = (value) => /^\d{3}-\d{3}-\d{3}-\d{3}$/.test(value || '');
const isPhilgepsValid = (value) => /^\d{7}$/.test(value || '');
const isMobileValid = (value) => /^09\d{2}-\d{3}-\d{4}$/.test(value || '');
const isEmailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeStatus = (value) => String(value || '').toLowerCase();

export default function PreScreeningPage() {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [summary, setSummary] = useState({
    totalBidders: 0,
    readyBidders: 0,
    needsReview: 0,
    postedInvitations: 0,
  });
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [biddersRes, invitationsRes] = await Promise.all([
        api.get('/bidders'),
        api.get('/invitations'),
      ]);

      const bidderPayload = biddersRes.data || {};
      const bidderRows = toArray(bidderPayload);
      const invitations = toArray(invitationsRes.data);

      const scored = bidderRows.map((vendor) => {
        const checks = {
          tin: isTinValid(vendor.tin),
          philgeps: isPhilgepsValid(vendor.philgeps_number),
          mobile: isMobileValid(vendor.contact_mobile),
          email: isEmailValid(vendor.contact_email),
          categories: Array.isArray(vendor.procurement_categories) && vendor.procurement_categories.length > 0,
        };

        const passedChecks = Object.values(checks).filter(Boolean).length;
        const failed = Object.entries(checks)
          .filter(([, passed]) => !passed)
          .map(([name]) => name.toUpperCase());

        return {
          ...vendor,
          passedChecks,
          checks,
          failed,
          readiness: failed.length === 0 ? 'Ready' : 'Needs Review',
        };
      });

      const postedInvitations = invitations.filter((item) => normalizeStatus(item.status) === 'posted').length;
      const readyBidders = scored.filter((item) => item.readiness === 'Ready').length;

      setVendors(scored);
      setSummary({
        totalBidders: bidderPayload.total || scored.length,
        readyBidders,
        needsReview: Math.max((bidderPayload.total || scored.length) - readyBidders, 0),
        postedInvitations,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load pre-screening data.');
      setVendors([]);
      setSummary({ totalBidders: 0, readyBidders: 0, needsReview: 0, postedInvitations: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredVendors = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return vendors;

    return vendors.filter((vendor) => {
      return (
        String(vendor.business_name || '').toLowerCase().includes(key) ||
        String(vendor.contact_person || '').toLowerCase().includes(key) ||
        String(vendor.contact_email || '').toLowerCase().includes(key)
      );
    });
  }, [vendors, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Pre-screening</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quick readiness check before bid invitation and opening activities.</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="px-2.5 py-1.5 rounded-md border border-gray-300 text-[13px] text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Total Bidders</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{summary.totalBidders}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Ready Profiles</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{summary.readyBidders}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Needs Review</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{summary.needsReview}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Posted Invitations</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{summary.postedInvitations}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-800">Bidder Pre-screening Queue</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bidder..."
            className="w-64 max-w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading pre-screening data...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No bidder records found for the current filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">Business</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">TIN</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">PhilGEPS</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">Contact</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">Readiness</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-900">{vendor.business_name}</p>
                      <p className="text-xs text-gray-500">{vendor.contact_email}</p>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-700">{vendor.tin}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-700">{vendor.philgeps_number}</td>
                    <td className="px-3 py-2.5 text-gray-700">
                      <p>{vendor.contact_person}</p>
                      <p className="text-xs text-gray-500">{vendor.contact_mobile}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          vendor.readiness === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {vendor.readiness}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {vendor.failed.length === 0 ? 'No issues detected' : vendor.failed.join(', ')}
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
