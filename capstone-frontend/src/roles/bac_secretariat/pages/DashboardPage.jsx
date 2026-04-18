import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api, { invalidateCache } from '../../../services/api';
import toast from '../../../utils/toast';

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalize = (value) => String(value || '').toLowerCase();

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingPrs: 0,
    pendingAppEntries: 0,
    activeInvitations: 0,
    ongoingBidOpenings: 0,
    postQualificationQueue: 0,
    registeredBidders: 0,
  });
  const [recentInvitations, setRecentInvitations] = useState([]);
  const [recentOpenings, setRecentOpenings] = useState([]);

  const abortRef = useRef(null);

  const fetchDashboard = useCallback(async (forceRefresh = false) => {
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (forceRefresh) {
      invalidateCache('/purchase-requisitions');
      invalidateCache('/app-entries');
      invalidateCache('/invitations');
      invalidateCache('/bid-openings');
      invalidateCache('/post-qualifications');
      invalidateCache('/bidders');
    }

    setLoading(true);
    try {
      const signal = controller.signal;
      const responses = await Promise.allSettled([
        api.get('/purchase-requisitions', { signal }),
        api.get('/app-entries', { signal }),
        api.get('/invitations', { signal }),
        api.get('/bid-openings', { signal }),
        api.get('/post-qualifications', { signal }),
        api.get('/bidders', { signal }),
      ]);

      const [prsRes, appRes, invitationsRes, openingsRes, postQualRes, biddersRes] = responses.map((item) => {
        return item.status === 'fulfilled' ? item.value.data : null;
      });

      const prs = toArray(prsRes);
      const appEntries = toArray(appRes);
      const invitations = toArray(invitationsRes);
      const openings = toArray(openingsRes);
      const postQualOpenings = Array.isArray(postQualRes?.bid_openings) ? postQualRes.bid_openings : [];

      const biddersTotal = Number(biddersRes?.total || toArray(biddersRes).length || 0);

      const pendingPrs = prs.filter((pr) => {
        const status = normalize(pr.status);
        return status === 'submitted' || status === 'pending_secretariat_review';
      }).length;

      const pendingAppEntries = appEntries.filter((entry) => normalize(entry.status) === 'submitted').length;

      const activeInvitations = invitations.filter((inv) => {
        const status = normalize(inv.status);
        return status === 'approved' || status === 'posted' || status === 'pending_chairperson_approval';
      }).length;

      const ongoingBidOpenings = openings.filter((opening) => normalize(opening.status) === 'in_progress').length;

      const postQualificationQueue = postQualOpenings.filter((opening) => {
        const status = normalize(opening.status);
        return status === 'evaluation_approved' || status === 'post_qualification_ongoing' || status === 'post_qualification_failed';
      }).length;

      setStats({
        pendingPrs,
        pendingAppEntries,
        activeInvitations,
        ongoingBidOpenings,
        postQualificationQueue,
        registeredBidders: biddersTotal,
      });

      setRecentInvitations(invitations.slice(0, 5));
      setRecentOpenings(openings.slice(0, 5));
    } catch (err) {
      if (err?.name === 'CanceledError') return;
      toast.error(err.response?.data?.message || 'Failed to load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [fetchDashboard]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">BAC Secretariat operations snapshot</p>
        </div>
        <button
          type="button"
          onClick={() => fetchDashboard(true)}
          className="px-2.5 py-1.5 rounded-md border border-gray-300 text-[13px] text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Pending PR Review</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{loading ? '...' : stats.pendingPrs}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Pending APP Consolidation</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{loading ? '...' : stats.pendingAppEntries}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Active Invitations</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{loading ? '...' : stats.activeInvitations}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Ongoing Bid Openings</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{loading ? '...' : stats.ongoingBidOpenings}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Post-Qualification Queue</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{loading ? '...' : stats.postQualificationQueue}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Registered Bidders</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{loading ? '...' : stats.registeredBidders}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Invitations</h2>
          </div>
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading invitations...</div>
          ) : recentInvitations.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No invitations found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentInvitations.map((inv) => (
                <div key={inv.id} className="px-3 py-2.5">
                  <p className="font-medium text-gray-900">{inv.reference_number}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{inv.project_title}</p>
                  <p className="text-xs text-gray-500 mt-1">Status: {String(inv.status || '').replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Bid Opening Sessions</h2>
          </div>
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading sessions...</div>
          ) : recentOpenings.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No bid opening sessions found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOpenings.map((opening) => (
                <div key={opening.id} className="px-3 py-2.5">
                  <p className="font-medium text-gray-900">{opening.session_reference}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Status: {String(opening.status || '').replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500 mt-1">Date: {opening.session_date ? new Date(opening.session_date).toLocaleString() : 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
